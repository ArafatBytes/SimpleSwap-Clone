import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import User from "./models/User";

export async function verifyAuth(request) {
  try {
    // Get the token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    console.error("Auth verification error:", error);
    return null;
  }
}

export async function verifyAdmin(request) {
  try {
    // Get the token from cookies
    const cookies = request.cookies;
    const token = cookies.get("token")?.value;

    if (!token) {
      return { isAdmin: false, userId: null };
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Find the user and check if they are an admin
    const user = await User.findById(userId);
    if (!user) {
      return { isAdmin: false, userId: null };
    }

    return {
      isAdmin: user.isAdmin === true,
      userId: user._id,
    };
  } catch (error) {
    console.error("Admin verification error:", error);
    return { isAdmin: false, userId: null };
  }
}
