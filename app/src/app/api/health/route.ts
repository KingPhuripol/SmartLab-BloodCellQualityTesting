import { NextResponse } from "next/server";

/**
 * Health check endpoint for Railway deployment
 * Returns 200 OK if the application is running
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "SmartLab Blood Cell Quality Testing",
      version: "1.0.0",
    },
    { status: 200 }
  );
}
