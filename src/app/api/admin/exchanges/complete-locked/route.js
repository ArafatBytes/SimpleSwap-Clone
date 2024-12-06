import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Exchange from '@/lib/models/Exchange';
import jwt from 'jsonwebtoken';

// Admin middleware to check if user is admin
const isAdmin = async (request) => {
    try {
        const cookies = request.cookies;
        const token = cookies.get('token')?.value;
        
        if (!token) {
            return false;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.isAdmin === true;
    } catch (error) {
        console.error('Admin verification failed:', error);
        return false;
    }
};

export async function POST(request) {
    try {
        // Check if user is admin
        const adminCheck = await isAdmin(request);
        if (!adminCheck) {
            return NextResponse.json({ 
                success: false, 
                message: 'Unauthorized - Admin access required' 
            }, { status: 401 });
        }

        await connectDB();

        const { exchangeId } = await request.json();

        // Find the locked exchange
        const exchange = await Exchange.findOne({ 
            id: exchangeId,
            isLocked: true,
            status: 'locked'
        });

        if (!exchange) {
            return NextResponse.json({
                success: false,
                message: 'Exchange not found or not in locked status'
            }, { status: 404 });
        }

        // Create exchange from USDT to original currency
        const apiKey = process.env.NEXT_PUBLIC_SIMPLESWAP_API_KEY;
        const apiUrl = `https://api.simpleswap.io/create_exchange?api_key=${apiKey}`;
        
        console.log('Admin completing locked exchange:', {
            exchangeId: exchange.id,
            originalCurrency: exchange.originalCurrencyTo,
            amount: exchange.expected_amount
        });

        const requestData = {
            fixed: false,
            currency_from: 'usdterc20',
            currency_to: exchange.originalCurrencyTo.toLowerCase(),
            amount: exchange.expected_amount,
            address_to: exchange.originalAddressTo,
            extra_id_to: "",
            user_refund_address: "",
            user_refund_extra_id: ""
        };

        console.log('Making request to SimpleSwap API:', {
            url: apiUrl.replace(apiKey, 'API_KEY_HIDDEN'),
            body: requestData
        });

        try {
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
                    description: "Failed to create exchange with SimpleSwap",
                    trace_id: "00000000-0000-0000-0000-000000000000"
                }, { status: response.status });
            }

            // Update exchange status
            exchange.status = 'exchanging';  
            exchange.isLocked = false;
            exchange.unlockedExchangeId = data.id;
            exchange.unlockedAt = new Date();
            exchange.unlockedBy = 'admin';  
            await exchange.save();

            return NextResponse.json({
                success: true,
                message: 'Exchange unlocked and new exchange created successfully',
                exchangeId: data.id,
                data: data
            });
        } catch (error) {
            console.error('Failed to create exchange:', error);
            return NextResponse.json({
                success: false,
                message: 'Failed to create exchange: ' + error.message
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Complete locked exchange error:', error);
        return NextResponse.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
}
