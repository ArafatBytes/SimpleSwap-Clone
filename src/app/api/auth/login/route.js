import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import Verification from '@/lib/models/Verification';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    await connectDB();
    
    const { email, password } = await request.json();

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Get verification status
    const verification = await Verification.findOne({ userId: user._id });
    const isVerified = verification?.verificationStatus === 'Verified';

    // Generate JWT token with isAdmin field
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        isAdmin: user.isAdmin,
        isVerified: isVerified // Include verification status in token
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Create response with token in cookie
    const response = NextResponse.json({
      message: 'Login successful',
      user: { 
        email: user.email,
        isAdmin: user.isAdmin,
        isVerified: isVerified // Include verification status in response
      }
    });

    // Set token as HTTP-only cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
