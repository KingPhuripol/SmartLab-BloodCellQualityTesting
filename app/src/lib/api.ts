// API Client for Backend Communication

import type {
  User,
  LoginRequest,
  LoginResponse,
  AnalysisResult,
  UploadResponse,
  ActivityLog,
  Statistics,
  APIError,
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
};

// Helper function to handle API errors
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error: APIError = await response.json().catch(() => ({
      detail: "An unexpected error occurred",
    }));
    throw new Error(error.detail);
  }
  return response.json();
};

// Authentication APIs
export const authAPI = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    return handleResponse<LoginResponse>(response);
  },

  async logout(): Promise<void> {
    const token = getAuthToken();
    if (!token) return;

    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
    }
  },

  async getCurrentUser(): Promise<User> {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse<User>(response);
  },
};

// Analysis APIs
export const analysisAPI = {
  async uploadFile(file: File): Promise<UploadResponse> {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/analysis/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    return handleResponse<UploadResponse>(response);
  },

  async getModels(): Promise<string[]> {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(`${API_BASE_URL}/api/analysis/models`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse<string[]>(response);
  },

  async getModelResults(modelCode: string): Promise<AnalysisResult> {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(
      `${API_BASE_URL}/api/analysis/results/${modelCode}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return handleResponse<AnalysisResult>(response);
  },

  async downloadReport(
    modelCode: string,
    format: "csv" | "excel"
  ): Promise<Blob> {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(
      `${API_BASE_URL}/api/analysis/export/${modelCode}?format=${format}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to download report");
    }

    return response.blob();
  },
};

// Admin APIs
export const adminAPI = {
  async getActivityLogs(): Promise<ActivityLog[]> {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(`${API_BASE_URL}/api/admin/activity-logs`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse<ActivityLog[]>(response);
  },

  async getStatistics(): Promise<Statistics> {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(`${API_BASE_URL}/api/admin/statistics`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse<Statistics>(response);
  },
};
