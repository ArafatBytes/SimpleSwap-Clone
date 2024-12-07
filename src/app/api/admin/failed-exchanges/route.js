import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
    try {
        // Get the user ID from the token
        const userId = await verifyAuth(request);
        if (!userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized - No session' }, { status: 401 });
        }

        const db = await connectToDatabase();
        const users = db.collection('users');
        
        // Find the user and check admin status
        const user = await users.findOne({ _id: new ObjectId(userId) });
        if (!user?.isAdmin) {
            return NextResponse.json({ success: false, message: 'Unauthorized - Not admin' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const failedExchanges = db.collection('failedExchanges');

        const [exchanges, total] = await Promise.all([
            failedExchanges.find({})
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            failedExchanges.countDocuments({})
        ]);

        return NextResponse.json({
            success: true,
            data: {
                exchanges,
                pagination: {
                    page,
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        console.error('Failed to fetch failed exchanges:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        // Get the user ID from the token
        const userId = await verifyAuth(request);
        if (!userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized - No session' }, { status: 401 });
        }

        const db = await connectToDatabase();
        const users = db.collection('users');
        
        // Find the user and check admin status
        const user = await users.findOne({ _id: new ObjectId(userId) });
        if (!user?.isAdmin) {
            return NextResponse.json({ success: false, message: 'Unauthorized - Not admin' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'Exchange ID is required' }, { status: 400 });
        }

        const failedExchanges = db.collection('failedExchanges');

        const result = await failedExchanges.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json({ success: false, message: 'Exchange not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete failed exchange:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
