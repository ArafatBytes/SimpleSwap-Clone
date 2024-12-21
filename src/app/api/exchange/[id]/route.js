import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Exchange from "@/lib/models/Exchange";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Connect to the database
    await connectDB();

    // Find the exchange by ID
    const exchange = await Exchange.findOne({ id: id });

    if (!exchange) {
      return NextResponse.json(
        { error: "Exchange not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(exchange);
  } catch (error) {
    console.error("Error fetching exchange:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
