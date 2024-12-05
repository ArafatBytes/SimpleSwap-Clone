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

        // Update exchange status
        exchange.status = 'finished';
        exchange.isLocked = false;
        await exchange.save();

        return NextResponse.json({
            success: true,
            message: 'Exchange marked as completed successfully'
        });
    } catch (error) {
        console.error('Complete locked exchange error:', error);
        return NextResponse.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
}
