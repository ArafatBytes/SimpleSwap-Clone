import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({
        message: 'Logged out successfully'
    });

    // Clear the token cookie
    response.cookies.set({
        name: 'token',
        value: '',
        httpOnly: true,
        expires: new Date(0), // Set expiry to past date to delete the cookie
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    });

    return response;
}
