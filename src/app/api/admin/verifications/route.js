import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Verification from '@/lib/models/Verification';
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

        // Get all verifications with pagination
        const searchParams = new URL(request.url).searchParams;
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const skip = (page - 1) * limit;

        // Build query to get only Unverified and Rejected verifications
        const query = {
            verificationStatus: { $in: ['Unverified', 'Rejected'] }
        };

        // Get total count for pagination
        const total = await Verification.countDocuments(query);

        // Get verifications with pagination
        const verifications = await Verification.find(query)
            .sort({ updatedAt: -1 }) // Sort by most recently updated
            .skip(skip)
            .limit(limit);

        return NextResponse.json({
            success: true,
            data: {
                verifications,
                pagination: {
                    total,
                    pages: Math.ceil(total / limit),
                    currentPage: page,
                    perPage: limit
                }
            }
        });
    } catch (error) {
        console.error('Admin verifications fetch error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch verifications' },
            { status: 500 }
        );
    }
}

// Update verification status
export async function PUT(request) {
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

        const { id, status } = await request.json();

        if (!id || !status) {
            return NextResponse.json({
                success: false,
                message: 'Verification ID and status are required'
            }, { status: 400 });
        }

        const verification = await Verification.findByIdAndUpdate(
            id,
            { 
                verificationStatus: status,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!verification) {
            return NextResponse.json({
                success: false,
                message: 'Verification not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: verification
        });
    } catch (error) {
        console.error('Admin verification update error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update verification' },
            { status: 500 }
        );
    }
}
