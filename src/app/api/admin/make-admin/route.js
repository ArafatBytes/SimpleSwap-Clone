import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

// Super admin middleware - only the first admin can make other admins
const isSuperAdmin = async (request) => {
    try {
        const cookies = request.cookies;
        const token = cookies.get('token')?.value;
        
        if (!token) {
            return false;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user is admin
        await dbConnect();
        const user = await User.findById(decoded.userId);
        
        // Only the first admin (super admin) can make other admins
        return user && user.isAdmin && user.email === process.env.SUPER_ADMIN_EMAIL;
    } catch (error) {
        console.error('Super admin verification failed:', error);
        return false;
    }
};

export async function POST(request) {
    try {
        // Check if user is super admin
        const superAdminCheck = await isSuperAdmin(request);
        if (!superAdminCheck) {
            return NextResponse.json({ 
                success: false, 
                message: 'Unauthorized - Super admin access required' 
            }, { status: 401 });
        }

        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({
                success: false,
                message: 'Email is required'
            }, { status: 400 });
        }

        await dbConnect();

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found'
            }, { status: 404 });
        }

        // Make user an admin
        user.isAdmin = true;
        await user.save();

        return NextResponse.json({
            success: true,
            message: 'User has been made an admin successfully'
        });
    } catch (error) {
        console.error('Make admin error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to make user an admin' },
            { status: 500 }
        );
    }
}
