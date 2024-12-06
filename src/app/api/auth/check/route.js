import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import Verification from '@/lib/models/Verification';

export async function GET() {
  try {
    console.log('Auth check started');
    const cookieStore = cookies();
    const token = cookieStore.get('token');

    console.log('Token found:', !!token);

    if (!token) {
      console.log('No token found, returning unauthenticated');
      return NextResponse.json({ isAuthenticated: false });
    }

    console.log('Verifying token...');
    const decoded = verify(token.value, process.env.JWT_SECRET);
    console.log('Token verified, userId:', decoded.userId);
    
    await connectDB();
    console.log('DB connected');
    
    // Fetch user data
    const user = await User.findById(decoded.userId)
      .select('email isVerified referralCode referralCount referralEarnings');
      
    if (!user) {
      console.log('User not found in database');
      return NextResponse.json({ isAuthenticated: false });
    }

    // Fetch verification status from Verification model
    const verificationDoc = await Verification.findOne({ 
      userId: decoded.userId,
      verificationStatus: 'Verified'
    }).sort({ updatedAt: -1 });

    console.log('Verification document found:', {
      hasVerificationDoc: !!verificationDoc,
      status: verificationDoc?.verificationStatus
    });

    // Generate referral code if it doesn't exist
    if (!user.referralCode) {
      console.log('Generating referral code for user');
      user.referralCode = await generateUniqueReferralCode();
      await user.save();
    }

    // User is verified if either the User model says so OR they have a verified document
    const isUserVerified = user.isVerified === true || (verificationDoc?.verificationStatus === 'Verified');

    // If verified in Verification model but not in User model, update User model
    if (!user.isVerified && verificationDoc?.verificationStatus === 'Verified') {
      await User.findByIdAndUpdate(decoded.userId, { isVerified: true });
      console.log('Updated user isVerified status to true');
    }

    console.log('Sending auth response with user data:', {
      email: user.email,
      isVerified: isUserVerified,
      verificationStatus: verificationDoc?.verificationStatus,
      referralCode: user.referralCode
    });

    return NextResponse.json({
      isAuthenticated: true,
      user: {
        email: user.email,
        isVerified: isUserVerified,
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
