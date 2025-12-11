import { NextResponse } from "next/server";

interface HealthStatus {
  status: "ok" | "degraded" | "error";
  checks: {
    smtp: { configured: boolean; error?: string };
    adminApi: { configured: boolean; reachable: boolean; error?: string };
    vexaApi: { configured: boolean; reachable: boolean; error?: string };
  };
  missingConfig: string[];
}

/**
 * Health check endpoint - validates server configuration
 */
export async function GET() {
  const status: HealthStatus = {
    status: "ok",
    checks: {
      smtp: { configured: false },
      adminApi: { configured: false, reachable: false },
      vexaApi: { configured: false, reachable: false },
    },
    missingConfig: [],
  };

  // Check SMTP configuration
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    status.checks.smtp.configured = true;
  } else {
    status.checks.smtp.error = "SMTP not configured";
    if (!smtpHost) status.missingConfig.push("SMTP_HOST");
    if (!smtpUser) status.missingConfig.push("SMTP_USER");
    if (!smtpPass) status.missingConfig.push("SMTP_PASS");
  }

  // Check Admin API configuration
  const adminApiKey = process.env.VEXA_ADMIN_API_KEY;
  const adminApiUrl = process.env.VEXA_ADMIN_API_URL || process.env.VEXA_API_URL;

  if (adminApiKey && adminApiKey !== "your_admin_api_key_here") {
    status.checks.adminApi.configured = true;

    // Test Admin API reachability
    if (adminApiUrl) {
      try {
        const response = await fetch(`${adminApiUrl}/admin/users?limit=1`, {
          headers: { "X-Admin-API-Key": adminApiKey },
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok || response.status === 401) {
          // 401 means API is reachable but key might be wrong
          status.checks.adminApi.reachable = response.ok;
          if (response.status === 401) {
            status.checks.adminApi.error = "Invalid admin API key";
          }
        } else {
          status.checks.adminApi.error = `API returned ${response.status}`;
        }
      } catch (error) {
        status.checks.adminApi.error = `Cannot reach API: ${(error as Error).message}`;
      }
    }
  } else {
    status.checks.adminApi.error = "Admin API key not configured";
    status.missingConfig.push("VEXA_ADMIN_API_KEY");
  }

  // Check Vexa API configuration
  const vexaApiUrl = process.env.VEXA_API_URL;

  if (vexaApiUrl) {
    status.checks.vexaApi.configured = true;

    // Test Vexa API reachability
    try {
      const response = await fetch(`${vexaApiUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      });

      status.checks.vexaApi.reachable = response.ok;
      if (!response.ok) {
        status.checks.vexaApi.error = `API returned ${response.status}`;
      }
    } catch (error) {
      // Try root endpoint as fallback
      try {
        const response = await fetch(vexaApiUrl, {
          signal: AbortSignal.timeout(5000),
        });
        status.checks.vexaApi.reachable = response.ok || response.status < 500;
      } catch {
        status.checks.vexaApi.error = `Cannot reach API: ${(error as Error).message}`;
      }
    }
  } else {
    status.checks.vexaApi.error = "Vexa API URL not configured";
    status.missingConfig.push("VEXA_API_URL");
  }

  // Determine overall status
  const hasSmtp = status.checks.smtp.configured;
  const hasAdminApi = status.checks.adminApi.configured && status.checks.adminApi.reachable;
  const hasVexaApi = status.checks.vexaApi.configured;

  if (!hasSmtp || !hasAdminApi) {
    status.status = "error";
  } else if (!hasVexaApi || !status.checks.vexaApi.reachable) {
    status.status = "degraded";
  }

  return NextResponse.json(status);
}
