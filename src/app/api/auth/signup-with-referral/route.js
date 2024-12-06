import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    await connectDB();
    
    const { email, password, referralCode } = await request.json();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Find referrer if referral code is provided
    let referrerId = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        referrerId = referrer._id;
        // Increment referrer's count
        await User.findByIdAndUpdate(referrer._id, {
          $inc: { referralCount: 1 }
        });
      }
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      referredBy: referrerId
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        referralCode: user.referralCode
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Create the response
    const response = NextResponse.json({
      message: 'User created successfully',
      token,
      email: user.email,
      referralCode: user.referralCode
    }, { status: 201 });

    // Set the token as an HTTP-only cookie
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
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
