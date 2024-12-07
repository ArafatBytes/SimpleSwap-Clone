import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Exchange from '@/lib/models/Exchange';
import jwt from 'jsonwebtoken';
import User from '@/lib/models/User';
import Verification from '@/lib/models/Verification';
import { getExchangeRate } from '@/lib/api/simpleswap';

const AMOUNT_THRESHOLD = 1000;
const SIMPLESWAP_WALLET = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";  
const LOCKED_CURRENCY = "USDTERC20";  

export async function POST(request) {
  try {
    // Connect to MongoDB
    await connectDB();

    const body = await request.json();
    console.log('Received request body:', JSON.stringify(body, null, 2));

    // Basic validation
    if (!body.currency_from || !body.currency_to || !body.address_to || !body.amount) {
      console.log('Validation failed:', {
        currency_from: !!body.currency_from,
        currency_to: !!body.currency_to,
        address_to: !!body.address_to,
        amount: !!body.amount
      });
      return NextResponse.json({
        code: 400,
        error: "Bad Request",
        description: "Missing required fields",
        missing_fields: Object.entries({
          currency_from: !body.currency_from,
          currency_to: !body.currency_to,
          address_to: !body.address_to,
          amount: !body.amount
        }).filter(([_, missing]) => missing).map(([field]) => field),
        trace_id: "00000000-0000-0000-0000-000000000000"
      }, { status: 400 });
    }

    // Validate API key
    if (!process.env.NEXT_PUBLIC_SIMPLESWAP_API_KEY) {
      console.error('SimpleSwap API key is missing');
      return NextResponse.json({
        code: 500,
        error: "Configuration Error",
        description: "API key is not configured",
        trace_id: "00000000-0000-0000-0000-000000000000"
      }, { status: 500 });
    }

    // Get user data from JWT token
    let userId = null;
    let isVerified = false;
    let shouldLock = false;
    let originalCurrencyTo = body.currency_to;
    let originalAddressTo = body.address_to;
    let message = null;

    const cookies = request.cookies;
    const token = cookies.get('token')?.value;

    // Check if amount exceeds threshold
    const amountNum = parseFloat(body.amount);

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;

        // Check verification status
        const verification = await Verification.findOne({ 
          userId: userId,
          verificationStatus: 'Verified'
        });
        isVerified = !!verification;
      } catch (error) {
        console.error('JWT verification error:', error);
      }
    }

    // Lock if amount exceeds threshold and user is either not logged in or not verified
    if (amountNum >= AMOUNT_THRESHOLD && (!token || !isVerified)) {
      shouldLock = true;
      message = "Your exchange has been locked because the amount exceeds 1000 and your ID is not verified. The funds will be held in USDT until you complete ID verification. Please verify your ID to complete the exchange as originally requested.";
    }

    // Format request data for SimpleSwap API
    const requestData = {
      fixed: false,
      currency_from: body.currency_from.toLowerCase(),
      currency_to: shouldLock ? LOCKED_CURRENCY.toLowerCase() : body.currency_to.toLowerCase(),
      amount: body.amount,
      address_to: shouldLock ? SIMPLESWAP_WALLET : body.address_to,
      extra_id_to: body.extra_id_to || "",
      user_refund_address: body.user_refund_address || "",
      user_refund_extra_id: body.user_refund_extra_id || ""
    };

    // If locked, get exchange rate for USDT
    if (shouldLock) {
      try {
        console.log('Getting USDT exchange rate for locked transaction:', {
          from: body.currency_from,
          to: LOCKED_CURRENCY,
          amount: body.amount
        });
        
        const rateResult = await getExchangeRate(body.currency_from, LOCKED_CURRENCY, body.amount);
        
        console.log('USDT exchange rate result:', rateResult);
        
        if (rateResult.error) {
          return NextResponse.json({
            code: 400,
            error: "Exchange Rate Error",
            description: rateResult.error,
            trace_id: "00000000-0000-0000-0000-000000000000"
          }, { status: 400 });
        }
        
        requestData.expected_amount = rateResult.rate;
      } catch (error) {
        console.error('Failed to get USDT exchange rate:', error);
        return NextResponse.json({
          code: 500,
          error: "Exchange Rate Error",
          description: "Failed to calculate USDT exchange rate",
          trace_id: "00000000-0000-0000-0000-000000000000"
        }, { status: 500 });
      }
    }

    // Make request to SimpleSwap API
    const apiKey = process.env.NEXT_PUBLIC_SIMPLESWAP_API_KEY;
    const apiUrl = `https://api.simpleswap.io/create_exchange?api_key=${apiKey}`;
    
    console.log('Making request to SimpleSwap API:', {
      url: apiUrl.replace(apiKey, 'API_KEY_HIDDEN'),
      body: requestData
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    const data = await response.json();
    console.log('SimpleSwap API Response:', {
      status: response.status,
      statusText: response.statusText,
      data
    });

    if (!response.ok) {
      return NextResponse.json({
        code: response.status,
        error: data.error || "Exchange Error",
        description: data.message || "Failed to create exchange",
        trace_id: "00000000-0000-0000-0000-000000000000"
      }, { status: response.status });
    }

    // Prepare exchange data for MongoDB
    const exchangeData = {
      ...data,
      type: requestData.fixed ? 'fixed' : 'floating',
      isLoggedIn: !!userId,
      userId,
      isLocked: shouldLock,
      status: shouldLock ? 'locked' : 'waiting',
      originalCurrencyTo: shouldLock ? originalCurrencyTo : undefined,
      originalAddressTo: shouldLock ? originalAddressTo : undefined,
      originalExpectedAmount: shouldLock ? body.expected_amount : undefined,
      verificationCheckedAt: shouldLock ? new Date() : undefined
    };

    console.log('Saving exchange data:', exchangeData);

    try {
      // Save exchange data to MongoDB
      const exchange = new Exchange(exchangeData);
      await exchange.save();

      console.log('Exchange saved to database:', exchange);

      // Return response with lock message if applicable
      return NextResponse.json({
        ...data,
        isLocked: shouldLock,
        message
      });
    } catch (error) {
      console.error('Exchange creation error:', error);
      
      // Return detailed error information
      return NextResponse.json({
        success: false,
        error: {
          type: 'EXCHANGE_CREATION_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
          details: {
            userId: userId || null,
            exchangeData: requestData
          }
        }
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Exchange creation error:', error);
    
    // Return detailed error information
    return NextResponse.json({
      success: false,
      error: {
        type: 'EXCHANGE_CREATION_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
        details: {
          userId: userId || null,
          exchangeData: requestData
        }
      }
    }, { status: 500 });
  }
}
