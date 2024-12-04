import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
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

export async function GET(request) {
    try {
        // Check if user is admin
        const adminCheck = await isAdmin(request);
        if (!adminCheck) {
            return NextResponse.json({ 
                success: false, 
                message: 'Unauthorized - Admin access required' 
            }, { status: 401 });
        }

        await dbConnect();

        // Get all exchanges with pagination
        const searchParams = new URL(request.url).searchParams;
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const status = searchParams.get('status');
        const skip = (page - 1) * limit;

        // Build query based on filters
        const query = {};
        if (status) {
            query.status = status;
        }

        // Get total count for pagination
        const total = await Exchange.countDocuments(query);

        // Get exchanges with pagination
        const exchanges = await Exchange.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return NextResponse.json({
            success: true,
            data: {
                exchanges,
                pagination: {
                    total,
                    pages: Math.ceil(total / limit),
                    currentPage: page,
                    perPage: limit
                }
            }
        });
    } catch (error) {
        console.error('Admin exchanges fetch error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch exchanges' },
            { status: 500 }
        );
    }
}
