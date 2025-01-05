import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Exchange from "@/lib/models/Exchange";
import { verifyAdmin } from "@/lib/auth";

export async function POST(request) {
  try {
    await connectDB();

    // Verify admin status
    const adminVerification = await verifyAdmin(request);
    console.log("Admin verification result:", adminVerification);

    if (!adminVerification.isAdmin) {
      return NextResponse.json(
        {
          error: {
            message: "Unauthorized",
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("Received request body:", body);

    const { exchangeId, getCurrency } = body;

    if (!exchangeId || !getCurrency) {
      console.log("Missing required fields:", { exchangeId, getCurrency });
      return NextResponse.json(
        {
          error: {
            message: "Missing required fields",
            details: {
              exchangeId: !exchangeId,
              getCurrency: !getCurrency,
            },
          },
        },
        { status: 400 }
      );
    }

    // Find the locked exchange
    const exchange = await Exchange.findOne({ id: exchangeId, isLocked: true });
    console.log("Found exchange:", exchange);

    if (!exchange) {
      return NextResponse.json(
        {
          error: {
            message: "Exchange not found or not locked",
          },
        },
        { status: 404 }
      );
    }

    // Create new exchange with SimpleSwap API
    const apiKey = process.env.NEXT_PUBLIC_SIMPLESWAP_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: {
            message: "API key not configured",
          },
        },
        { status: 500 }
      );
    }

    // Create exchange from USDT to the original requested currency
    const requestData = {
      fixed: false,
      currency_from: "usdterc20", // Using ERC20 version of USDT
      currency_to: getCurrency.toLowerCase(),
      amount: exchange.amount_to, // Use the USDT amount from the original exchange
      address_to: exchange.originalAddressTo, // Original recipient's address
      extra_id_to: exchange.extra_id_to || "",
    };

    console.log("Creating SimpleSwap exchange with data:", requestData);

    const apiUrl = `https://api.simpleswap.io/create_exchange?api_key=${apiKey}`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    const data = await response.json();
    console.log("SimpleSwap API response:", {
      status: response.status,
      data,
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: {
            message: data.message || "Failed to create exchange",
            details: data,
          },
        },
        { status: response.status }
      );
    }

    // Update the locked exchange status
    exchange.status = "awaiting_usdt";
    exchange.completedExchangeId = data.id;
    exchange.completedAt = new Date();
    exchange.completedBy = adminVerification.userId;
    await exchange.save();

    console.log("Exchange updated successfully:", {
      id: data.id,
      address_from: data.address_from,
      amount_to: exchange.amount_to,
    });

    // Return the exchange data with the payout address where admin should send USDT
    const responseData = {
      id: data.id, // This is the SimpleSwap exchange ID for polling
      address_from: data.address_from, // Address where admin should send USDT
      originalExchange: {
        id: exchange.id,
        status: exchange.status,
        amount_to: exchange.amount_to, // USDT amount admin should send
      },
    };

    console.log("Sending response data:", responseData);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Complete locked exchange error:", error);
    return NextResponse.json(
      {
        error: {
          message: error.message,
          stack: error.stack,
        },
      },
      { status: 500 }
    );
  }
}
