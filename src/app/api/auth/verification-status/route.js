import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import Verification from '@/lib/models/Verification';

export async function GET() {
  try {
    console.log('Verification status check started');
    const cookieStore = cookies();
    const token = cookieStore.get('token');

    if (!token) {
      console.log('Verification status: No token found');
      return NextResponse.json({ error: 'Unauthorized', details: 'No token found' }, { status: 401 });
    }

    console.log('Verifying token for verification status check...');
    const decoded = verify(token.value, process.env.JWT_SECRET);
    console.log('Token verified, fetching user:', decoded.userId);
    
    await connectDB();
    console.log('DB connected for verification check');
    
    // Fetch user data
    const user = await User.findById(decoded.userId)
      .select('email isVerified');

    if (!user) {
      console.log('Verification status: User not found in database');
      return NextResponse.json({ error: 'User not found', details: 'No user found for token' }, { status: 404 });
    }

    // Fetch verification status from Verification model
    const verificationDoc = await Verification.findOne({ 
      userId: decoded.userId,
      verificationStatus: 'Verified'
    }).sort({ updatedAt: -1 });

    console.log('Verification check results:', {
      userModel: {
        email: user.email,
        isVerified: user.isVerified
      },
      verificationModel: {
        found: !!verificationDoc,
        status: verificationDoc?.verificationStatus
      }
    });

    // User is verified if either the User model says so OR they have a verified document
    const isUserVerified = user.isVerified === true || (verificationDoc?.verificationStatus === 'Verified');

    // If verified in Verification model but not in User model, update User model
    if (!user.isVerified && verificationDoc?.verificationStatus === 'Verified') {
      await User.findByIdAndUpdate(decoded.userId, { isVerified: true });
      console.log('Updated user isVerified status to true');
    }

    return NextResponse.json({
      isVerified: isUserVerified
    });
  } catch (error) {
    console.error('Verification status check error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
