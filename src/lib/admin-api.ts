import type {
  EggsplainUser,
  EggsplainUserWithTokens,
  CreateUserRequest,
  UpdateUserRequest,
  CreateTokenResponse,
} from "@/types/eggsplain";

class AdminAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: string
  ) {
    super(message);
    this.name = "AdminAPIError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    let message = `API Error: ${response.status}`;
    try {
      const json = JSON.parse(text);
      message = json.error || json.detail || json.message || message;
    } catch {
      message = text || message;
    }
    throw new AdminAPIError(message, response.status, text);
  }
  return response.json();
}

export const adminAPI = {
  // ==========================================
  // Users
  // ==========================================

  async getUsers(skip = 0, limit = 100): Promise<EggsplainUser[]> {
    const response = await fetch(`/api/admin/users?skip=${skip}&limit=${limit}`);
    const data = await handleResponse<EggsplainUser[] | { users: EggsplainUser[] }>(response);
    // Handle both array and object responses
    return Array.isArray(data) ? data : data.users || [];
  },

  async getUser(userId: string): Promise<EggsplainUserWithTokens> {
    const response = await fetch(`/api/admin/users/${userId}`);
    return handleResponse<EggsplainUserWithTokens>(response);
  },

  async getUserByEmail(email: string): Promise<EggsplainUser> {
    const response = await fetch(`/api/admin/users/email/${encodeURIComponent(email)}`);
    return handleResponse<EggsplainUser>(response);
  },

  async createUser(data: CreateUserRequest): Promise<EggsplainUser> {
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<EggsplainUser>(response);
  },

  async updateUser(userId: string, data: UpdateUserRequest): Promise<EggsplainUser> {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<EggsplainUser>(response);
  },

  // ==========================================
  // Tokens
  // ==========================================

  async createToken(userId: string): Promise<CreateTokenResponse> {
    const response = await fetch(`/api/admin/users/${userId}/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<CreateTokenResponse>(response);
  },

  async revokeToken(tokenId: string): Promise<void> {
    const response = await fetch(`/api/admin/tokens/${tokenId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const text = await response.text();
      throw new AdminAPIError("Failed to revoke token", response.status, text);
    }
  },

  // ==========================================
  // Health Check
  // ==========================================

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch("/api/admin/users?limit=1");
      if (response.ok) {
        return { success: true };
      }
      return { success: false, error: `HTTP ${response.status}` };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
};

export { AdminAPIError };
