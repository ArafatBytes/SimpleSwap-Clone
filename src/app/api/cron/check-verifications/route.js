import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Exchange from '@/lib/models/Exchange';
import Verification from '@/lib/models/Verification';
import { getExchangeRate } from '@/lib/api/simpleswap';

export async function GET(request) {
    try {
        // Verify cron secret to ensure this is called by the cron job
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Find all locked exchanges
        const lockedExchanges = await Exchange.find({
            isLocked: true,
            status: 'locked'
        });

        const results = [];

        for (const exchange of lockedExchanges) {
            try {
                // Check if user is now verified
                const verification = await Verification.findOne({
                    userId: exchange.userId,
                    verificationStatus: 'Verified'
                });

                if (verification) {
                    // Get current exchange rate for original currency
                    const rate = await getExchangeRate(
                        'USDT',
                        exchange.originalCurrencyTo,
                        exchange.expected_amount
                    );

                    // Create new exchange to original currency and address
                    const apiKey = process.env.NEXT_PUBLIC_SIMPLESWAP_API_KEY;
                    const apiUrl = `https://api.simpleswap.io/create_exchange?api_key=${apiKey}`;
                    
                    console.log('Auto completing locked exchange:', {
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

                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestData)
                    });

                    const data = await response.json();
                    console.log('SimpleSwap API Response:', {
                        status: response.status,
                        statusText: response.statusText,
                        data
                    });

                    if (!response.ok) {
                        console.error('SimpleSwap API error:', data);
                        results.push({
                            exchangeId: exchange.id,
                            status: 'error',
                            message: data.error || 'Failed to create exchange with SimpleSwap'
                        });
                        continue;
                    }

                    // Update exchange status
                    exchange.status = 'exchanging';
                    exchange.isLocked = false;
                    exchange.unlockedExchangeId = data.id;
                    exchange.verificationCheckedAt = new Date();
                    exchange.unlockedAt = new Date();
                    exchange.unlockedBy = 'auto';
                    await exchange.save();

                    results.push({
                        exchangeId: exchange.id,
                        status: 'unlocked',
                        message: 'Exchange unlocked and proceeding with original request',
                        data: data
                    });
                } else {
                    // Update verification check timestamp
                    exchange.verificationCheckedAt = new Date();
                    await exchange.save();

                    results.push({
                        exchangeId: exchange.id,
                        status: 'still_locked',
                        message: 'User not yet verified'
                    });
                }
            } catch (error) {
                console.error(`Error processing exchange ${exchange.id}:`, error);
                results.push({
                    exchangeId: exchange.id,
                    status: 'error',
                    message: error.message
                });
            }
        }

        return NextResponse.json({
            success: true,
            processed: results.length,
            results
        });
    } catch (error) {
        console.error('Verification check error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
