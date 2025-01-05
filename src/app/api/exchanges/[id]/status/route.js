import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Exchange from "@/lib/models/Exchange";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = params;

    console.log("Looking up exchange with ID:", id);

    // Fetch status directly from SimpleSwap API
    const apiKey = process.env.NEXT_PUBLIC_SIMPLESWAP_API_KEY;
    const response = await fetch(
      `https://api.simpleswap.io/get_exchange?api_key=${apiKey}&id=${id}`
    );

    if (!response.ok) {
      console.error("SimpleSwap API error:", response.status);
      throw new Error("Failed to fetch exchange status from SimpleSwap");
    }

    const data = await response.json();
    console.log("SimpleSwap status response:", {
      id,
      status: data.status,
    });

    // Find and update the exchange in our database
    const exchange = await Exchange.findOne({
      $or: [{ completedExchangeId: id }, { id: id }],
    });

    if (exchange) {
      exchange.status = data.status;
      await exchange.save();
    }

    return NextResponse.json({ status: data.status });
  } catch (error) {
    console.error("Error fetching exchange status:", error);
    return NextResponse.json(
      { error: { message: "Failed to fetch exchange status" } },
      { status: 500 }
    );
  }
}
