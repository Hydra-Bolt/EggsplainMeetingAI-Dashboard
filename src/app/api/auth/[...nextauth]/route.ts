import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { cookies } from "next/headers";
import { findUserByEmail, createUser, createUserToken } from "@/lib/eggsplain-admin-api";
import { getRegistrationConfig, validateEmailForRegistration } from "@/lib/registration";

// Check if Google OAuth is enabled
const isGoogleAuthEnabled = () => {
  // Check if explicitly disabled via flag
  const enableGoogleAuth = process.env.ENABLE_GOOGLE_AUTH;
  if (enableGoogleAuth === "false" || enableGoogleAuth === "0") {
    return false;
  }

  // If flag is set to true, or flag is not set (default), check if config is present
  const hasConfig = !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.NEXTAUTH_URL
  );

  // If flag is explicitly "true", require config to be present
  if (enableGoogleAuth === "true" || enableGoogleAuth === "1") {
    return hasConfig;
  }

  // Default: enable if config is present (backward compatible)
  return hasConfig;
};

export const authOptions: NextAuthOptions = {
  providers: [
    ...(isGoogleAuthEnabled()
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // This callback is called after successful OAuth but before session creation
      if (account?.provider === "google" && user.email) {
        try {
          // Step 1: Find or create user in eggsplain Admin API
          let eggsplainUser;
          const findResult = await findUserByEmail(user.email);
          let isNewUser = false;

          if (findResult.success && findResult.data) {
            eggsplainUser = findResult.data;
          } else if (findResult.error?.code === "NOT_FOUND") {
            // Check registration restrictions
            const config = getRegistrationConfig();
            const validationError = validateEmailForRegistration(user.email, false, config);

            if (validationError) {
              console.error(`[NextAuth] Registration blocked for ${user.email}: ${validationError}`);
              return false; // Prevent sign-in
            }

            // Create new user
            const createResult = await createUser({
              email: user.email,
              name: user.name || user.email.split("@")[0],
            });

            if (!createResult.success || !createResult.data) {
              console.error(`[NextAuth] Failed to create user for ${user.email}:`, createResult.error);
              return false;
            }

            eggsplainUser = createResult.data;
            isNewUser = true;
          } else {
            console.error(`[NextAuth] Error finding user for ${user.email}:`, findResult.error);
            return false;
          }

          // Step 2: Create API token for the user
          const tokenResult = await createUserToken(eggsplainUser.id);

          if (!tokenResult.success || !tokenResult.data) {
            console.error(`[NextAuth] Failed to create token for ${user.email}:`, tokenResult.error);
            return false;
          }

          const apiToken = tokenResult.data.token;

          // Step 3: Set cookie (same as existing auth flow)
          const cookieStore = await cookies();
          cookieStore.set("eggsplain-token", apiToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: "/",
          });

          // Store eggsplain user info in the user object for the JWT callback
          (user as any).eggsplainUser = eggsplainUser;
          (user as any).eggsplainToken = apiToken;
          (user as any).isNewUser = isNewUser;

          return true;
        } catch (error) {
          console.error(`[NextAuth] Unexpected error during sign-in for ${user.email}:`, error);
          return false;
        }
      }

      return false; // Deny sign-in for other providers
    },
    async jwt({ token, user }) {
      // Persist the eggsplain user data to the token
      if (user && (user as any).eggsplainUser) {
        token.eggsplainUser = (user as any).eggsplainUser;
        token.eggsplainToken = (user as any).eggsplainToken;
        token.isNewUser = (user as any).isNewUser;
      }
      return token;
    },
    async session({ session, token }) {
      // Add eggsplain user data to the session
      if (token.eggsplainUser) {
        (session as any).eggsplainUser = token.eggsplainUser;
        (session as any).eggsplainToken = token.eggsplainToken;
        (session as any).isNewUser = token.isNewUser;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after successful sign-in
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return `${baseUrl}/`;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.ADMIN_API_KEY,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

