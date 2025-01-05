import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Exchange from "@/lib/models/Exchange";
import jwt from "jsonwebtoken";

export async function GET(request) {
  try {
    // Get user ID from token
    const cookies = request.cookies;
    const token = cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized - No session",
        },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      await connectDB();

      // Get all exchanges for the user, sorted by creation date
      const exchanges = await Exchange.find({ userId }).sort({ createdAt: -1 });

      return NextResponse.json({
        success: true,
        data: {
          exchanges,
        },
      });
    } catch (error) {
      console.error("Token verification error:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("User exchanges fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch exchanges" },
      { status: 500 }
    );
  }
}
