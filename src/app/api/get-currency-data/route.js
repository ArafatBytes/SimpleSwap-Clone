import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_SIMPLESWAP_API_KEY;
    const response = await fetch(
      `https://api.simpleswap.io/get_currency?api_key=${apiKey}&symbol=${symbol}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch currency data");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in get-currency-data:", error);
    return NextResponse.json(
      { error: "Failed to fetch currency data" },
      { status: 500 }
    );
  }
}
