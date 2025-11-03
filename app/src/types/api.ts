// API Types for Backend Communication

// User & Authentication Types
export interface User {
  username: string;
  full_name: string;
  role: "Administrator" | "Supervisor" | "Analyst";
  email: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Analysis Data Types
export interface AnalysisData {
  [key: string]: any;
  Model_Code?: string;
  WBC?: number;
  RBC?: number;
  HGB?: number;
  HCT?: number;
  MCV?: number;
  MCH?: number;
  MCHC?: number;
  PLT?: number;
  LYMPH?: number;
  MONO?: number;
  NEUT?: number;
  EOS?: number;
  BASO?: number;
  RDW_SD?: number;
  RDW_CV?: number;
  PDW?: number;
  MPV?: number;
  P_LCR?: number;
  PCT?: number;
  Grade?: string;
  zscore_WBC?: number;
  zscore_RBC?: number;
  zscore_HGB?: number;
  zscore_HCT?: number;
  zscore_MCV?: number;
  zscore_MCH?: number;
  zscore_MCHC?: number;
  zscore_PLT?: number;
}

export interface ModelData {
  model_code: string;
  count: number;
  avg_grade?: string;
  data: AnalysisData[];
}

export interface AnalysisResult {
  model_code: string;
  total_records: number;
  grade_distribution: {
    Excellent: number;
    Good: number;
    Satisfactory: number;
    Unsatisfactory: number;
  };
  parameters: string[];
  data: AnalysisData[];
}

// Activity Log Types
export interface ActivityLog {
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details?: string;
}

// Statistics Types
export interface Statistics {
  total_users: number;
  total_analyses: number;
  total_files_processed: number;
  grade_summary: {
    Excellent: number;
    Good: number;
    Satisfactory: number;
    Unsatisfactory: number;
  };
  recent_activities: ActivityLog[];
}

// File Upload Types
export interface UploadResponse {
  message: string;
  filename: string;
  models_processed: string[];
  total_records: number;
}

// Grade Thresholds
export interface GradeThresholds {
  excellent: number;
  good: number;
  satisfactory: number;
  unsatisfactory: number;
}

// API Error Response
export interface APIError {
  detail: string;
}
