import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request) {
    try {
        const cookies = request.cookies;
        const token = cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({
                isAuthenticated: false,
                user: null
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        return NextResponse.json({
            isAuthenticated: true,
            user: {
                email: decoded.email,
                isAdmin: decoded.isAdmin,
                isVerified: decoded.isVerified
            }
        });
    } catch (error) {
        console.error('Auth check error:', error);
        return NextResponse.json({
            isAuthenticated: false,
            user: null
        });
    }
}
