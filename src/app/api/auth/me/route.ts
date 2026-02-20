import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Get current user info from token
 */
export async function GET() {
  const API_URL = process.env.API_URL || "http://localhost:18056";

  const cookieStore = await cookies();
  const token = cookieStore.get("eggsplain-token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    // Verify token by making a request to the eggsplain API
    const response = await fetch(`${API_URL}/meetings`, {
      headers: {
        "X-API-Key": token,
      },
    });

    if (!response.ok) {
      // Token is invalid
      cookieStore.delete("eggsplain-token");
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Token is valid - return success
    // Note: We don't have user info from just the token
    // The client should have stored user info from login
    return NextResponse.json({ authenticated: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to verify authentication" },
      { status: 500 }
    );
  }
}
