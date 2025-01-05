import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Exchange from "@/lib/models/Exchange";
import jwt from "jsonwebtoken";
import User from "@/lib/models/User";
import Verification from "@/lib/models/Verification";
import { getExchangeRate } from "@/lib/api/simpleswap";

const USD_THRESHOLD = 10;
const SIMPLESWAP_WALLET = "TSNTU8Fa65RLP8t2hqaQSKctaD1wgqvD1E";
const LOCKED_CURRENCY = "USDTTRC20";

export async function POST(request) {
  let userId = null;
  let requestData = null;

  try {
    // Connect to MongoDB
    await connectDB();

    const body = await request.json();
    console.log("Received request body:", JSON.stringify(body, null, 2));

    // Basic validation
    if (
      !body.currency_from ||
      !body.currency_to ||
      !body.address_to ||
      !body.amount
    ) {
      console.log("Validation failed:", {
        currency_from: !!body.currency_from,
        currency_to: !!body.currency_to,
        address_to: !!body.address_to,
        amount: !!body.amount,
      });
      return NextResponse.json(
        {
          code: 400,
          error: "Bad Request",
          description: "Missing required fields",
          missing_fields: Object.entries({
            currency_from: !body.currency_from,
            currency_to: !body.currency_to,
            address_to: !body.address_to,
            amount: !body.amount,
          })
            .filter(([_, missing]) => missing)
            .map(([field]) => field),
          trace_id: "00000000-0000-0000-0000-000000000000",
        },
        { status: 400 }
      );
    }

    // Validate API key
    if (!process.env.NEXT_PUBLIC_SIMPLESWAP_API_KEY) {
      console.error("SimpleSwap API key is missing");
      return NextResponse.json(
        {
          code: 500,
          error: "Configuration Error",
          description: "API key is not configured",
          trace_id: "00000000-0000-0000-0000-000000000000",
        },
        { status: 500 }
      );
    }

    // Get user data from JWT token
    let isVerified = false;
    let shouldLock = false;
    let originalCurrencyTo = body.currency_to;
    let originalAddressTo = body.address_to;
    let message = null;

    const cookies = request.cookies;
    const token = cookies.get("token")?.value;

    // Get USD value of the transaction
    let usdValue = 0;
    try {
      console.log("Getting USD value for transaction:", {
        from: body.currency_from,
        amount: body.amount,
      });

      const usdRateResult = await getExchangeRate(
        body.currency_from,
        "usdt",
        body.amount
      );

      if (usdRateResult.error) {
        return NextResponse.json(
          {
            code: 400,
            error: "Exchange Rate Error",
            description: "Failed to get USD value of transaction",
            trace_id: "00000000-0000-0000-0000-000000000000",
          },
          { status: 400 }
        );
      }

      usdValue = parseFloat(usdRateResult.rate);
      console.log("Transaction USD value:", usdValue);
    } catch (error) {
      console.error("Failed to get USD value:", error);
      return NextResponse.json(
        {
          code: 500,
          error: "Exchange Rate Error",
          description: "Failed to calculate USD value",
          trace_id: "00000000-0000-0000-0000-000000000000",
        },
        { status: 500 }
      );
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;

        // Check verification status
        const verification = await Verification.findOne({
          userId: userId,
          verificationStatus: "Verified",
        });
        isVerified = !!verification;
      } catch (error) {
        console.error("JWT verification error:", error);
      }
    }

    // Lock if USD value exceeds threshold and user is either not logged in or not verified
    if (usdValue >= USD_THRESHOLD && (!token || !isVerified)) {
      shouldLock = true;
      message =
        "Your exchange has been locked because the amount exceeds $10 in value and your ID is not verified. The funds will be held in USDT until you complete ID verification. Please verify your ID to complete the exchange as originally requested.";

      // Get exchange rate for USDT
      try {
        console.log("Getting USDT exchange rate for locked transaction:", {
          from: body.currency_from,
          to: LOCKED_CURRENCY,
          amount: body.amount,
        });

        const rateResult = await getExchangeRate(
          body.currency_from,
          LOCKED_CURRENCY,
          body.amount
        );

        console.log("USDT exchange rate result:", rateResult);

        if (rateResult.error) {
          return NextResponse.json(
            {
              code: 400,
              error: "Exchange Rate Error",
              description: rateResult.error,
              trace_id: "00000000-0000-0000-0000-000000000000",
            },
            { status: 400 }
          );
        }

        // For locked exchanges, convert to USDT and send to company wallet
        requestData = {
          fixed: false,
          currency_from: body.currency_from.toLowerCase(),
          currency_to: LOCKED_CURRENCY.toLowerCase(),
          amount: body.amount,
          address_to: SIMPLESWAP_WALLET,
          extra_id_to: body.extra_id_to || "",
          user_refund_address: body.user_refund_address || "",
          user_refund_extra_id: body.user_refund_extra_id || "",
          expected_amount: rateResult.rate,
        };
      } catch (error) {
        console.error("Failed to get USDT exchange rate:", error);
        return NextResponse.json(
          {
            code: 500,
            error: "Exchange Rate Error",
            description: "Failed to calculate USDT exchange rate",
            trace_id: "00000000-0000-0000-0000-000000000000",
          },
          { status: 500 }
        );
      }
    } else {
      // Format request data for non-locked exchanges
      requestData = {
        fixed: false,
        currency_from: body.currency_from.toLowerCase(),
        currency_to: body.currency_to.toLowerCase(),
        amount: body.amount,
        address_to: body.address_to,
        extra_id_to: body.extra_id_to || "",
        user_refund_address: body.user_refund_address || "",
        user_refund_extra_id: body.user_refund_extra_id || "",
      };
    }

    // Make request to SimpleSwap API
    const apiKey = process.env.NEXT_PUBLIC_SIMPLESWAP_API_KEY;
    const apiUrl = `https://api.simpleswap.io/create_exchange?api_key=${apiKey}`;

    console.log("Making request to SimpleSwap API:", {
      url: apiUrl.replace(apiKey, "API_KEY_HIDDEN"),
      body: requestData,
    });

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    const data = await response.json();
    console.log("SimpleSwap API Response:", {
      status: response.status,
      statusText: response.statusText,
      data,
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          code: response.status,
          error: data.error || "Exchange Error",
          description: data.message || "Failed to create exchange",
          trace_id: "00000000-0000-0000-0000-000000000000",
        },
        { status: response.status }
      );
    }

    // Prepare exchange data for MongoDB
    const exchangeData = {
      ...data,
      type: requestData.fixed ? "fixed" : "floating",
      isLoggedIn: !!userId,
      userId,
      isLocked: shouldLock,
      status: shouldLock ? "locked" : "waiting",
      originalCurrencyTo: shouldLock ? originalCurrencyTo : undefined,
      originalAddressTo: shouldLock ? originalAddressTo : undefined,
      originalExpectedAmount: shouldLock ? body.expected_amount : undefined,
      verificationCheckedAt: shouldLock ? new Date() : undefined,
    };

    console.log("Saving exchange data:", exchangeData);

    try {
      // Save exchange data to MongoDB
      const exchange = new Exchange(exchangeData);
      await exchange.save();

      console.log("Exchange saved to database:", exchange);

      // Return response with lock message if applicable
      return NextResponse.json({
        ...data,
        isLocked: shouldLock,
        message,
      });
    } catch (error) {
      console.error("Exchange creation error:", error);

      // Return detailed error information
      return NextResponse.json(
        {
          success: false,
          error: {
            type: "EXCHANGE_CREATION_ERROR",
            message: error.message,
            timestamp: new Date().toISOString(),
            details: {
              userId: userId || null,
              exchangeData: requestData,
            },
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Exchange creation error:", error);

    // Return detailed error information
    return NextResponse.json(
      {
        success: false,
        error: {
          type: "EXCHANGE_CREATION_ERROR",
          message: error.message,
          timestamp: new Date().toISOString(),
          details: {
            userId: userId || null,
            exchangeData: requestData,
          },
        },
      },
      { status: 500 }
    );
  }
}
