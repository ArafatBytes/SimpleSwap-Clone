import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json({ isAuthenticated: false });
    }

    const decoded = verify(token.value, process.env.JWT_SECRET);
    
    await connectDB();
    
    // Fetch user data including referral information
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return NextResponse.json({ isAuthenticated: false });
    }

    // Generate referral code if it doesn't exist (shouldn't happen, but just in case)
    if (!user.referralCode) {
      user.referralCode = await generateUniqueReferralCode();
      await user.save();
    }

    return NextResponse.json({
      isAuthenticated: true,
      user: {
        email: user.email,
        referralCode: user.referralCode,
        referralCount: user.referralCount || 0,
        referralEarnings: user.referralEarnings || 0
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ isAuthenticated: false });
  }
}

// Helper function to generate unique referral code
async function generateUniqueReferralCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const codeLength = 8;
  let isUnique = false;
  let referralCode;

  while (!isUnique) {
    referralCode = '';
    for (let i = 0; i < codeLength; i++) {
      referralCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if code already exists
    const existingUser = await User.findOne({ referralCode });
    if (!existingUser) {
      isUnique = true;
    }
  }

  return referralCode;
}
