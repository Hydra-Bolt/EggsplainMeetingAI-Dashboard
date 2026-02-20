import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../[...nextauth]/route";

/**
 * OAuth callback endpoint - syncs user info after Google OAuth
 * Called by the frontend after successful OAuth to get user info
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(session as any).eggsplainUser) {
      return NextResponse.json(
        { error: "Not authenticated via OAuth" },
        { status: 401 }
      );
    }

    const eggsplainUser = (session as any).eggsplainUser;
    const token = (session as any).eggsplainToken;

    // Return user info in the same format as the login endpoint
    return NextResponse.json({
      user: {
        id: eggsplainUser.id,
        email: eggsplainUser.email,
        name: eggsplainUser.name,
        max_concurrent_bots: eggsplainUser.max_concurrent_bots,
        created_at: eggsplainUser.created_at,
      },
      token,
      isNewUser: (session as any).isNewUser || false,
    });
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.json(
      { error: "Failed to sync OAuth session" },
      { status: 500 }
    );
  }
}

