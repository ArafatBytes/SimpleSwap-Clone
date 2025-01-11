import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Exchange from "@/lib/models/Exchange";
import Verification from "@/lib/models/Verification";
import { getExchangeRate } from "@/lib/api/simpleswap";

export async function GET(request) {
  try {
    // Verify cron secret to ensure this is called by the cron job
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Find all locked exchanges
    const lockedExchanges = await Exchange.find({
      isLocked: true,
      status: "locked",
    });

    const results = [];

    for (const exchange of lockedExchanges) {
      try {
        // Check if user is now verified
        const verification = await Verification.findOne({
          userId: exchange.userId,
          verificationStatus: "Verified",
        });

        if (verification) {
          // Only update verification check timestamp
          exchange.verificationCheckedAt = new Date();
          await exchange.save();

          results.push({
            exchangeId: exchange.id,
            status: "verified",
            message: "User is now verified",
          });
        } else {
          // Update verification check timestamp
          exchange.verificationCheckedAt = new Date();
          await exchange.save();

          results.push({
            exchangeId: exchange.id,
            status: "still_locked",
            message: "User not yet verified",
          });
        }
      } catch (error) {
        console.error(`Error processing exchange ${exchange.id}:`, error);
        results.push({
          exchangeId: exchange.id,
          status: "error",
          message: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Verification check completed",
      results,
    });
  } catch (error) {
    console.error("Verification check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
