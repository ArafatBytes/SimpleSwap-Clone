import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function verifyAuth(request) {
  try {
    // Get the token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return null;
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}
