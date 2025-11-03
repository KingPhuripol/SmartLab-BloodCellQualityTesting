export interface User {
  id: string;
  username: string;
  email: string;
  role: "Administrator" | "Supervisor" | "Analyst";
  firstName: string;
  lastName: string;
  createdAt: Date;
  lastLogin?: Date;
}

// ============================================
// Universal CSV Processing & PT:EQA Types
// ============================================

// Re-export types from universal processor and PT:EQA analysis
export type {
  StandardBloodTestRecord,
  UniversalProcessedData,
} from "@/lib/universal-csv-processor";

export type {
  PTEQAConfig,
  PTEQAResult,
  PTEQASummary,
  PTTrend,
} from "@/lib/pt-eqa-analysis";

// ============================================
// Lab Testing Types
// ============================================

export interface LabTest {
  id: string;
  sampleId: string;
  patientId?: string;
  testDate: Date;
  analysisDate: Date;
  analyst: string;
  laboratory: string;
  parameters: TestParameter[];
  overallGrade: Grade;
  overallScore: number;
  qualityFlags: QualityFlag[];
  status: "pending" | "completed" | "reviewed" | "archived";
  comments?: string;
}

export interface TestParameter {
  name: string;
  value: number;
  unit: string;
  referenceRange: {
    min: number;
    max: number;
  };
  zScore: number;
  grade: Grade;
  isOutOfRange: boolean;
  severity?: "low" | "high" | "critical";
}

export type Grade =
  | "Excellent"
  | "Good"
  | "Satisfactory"
  | "Unsatisfactory"
  | "Serious";

export interface QualityFlag {
  type: "warning" | "critical" | "info";
  message: string;
  parameter?: string;
  recommendedAction?: string;
}

export interface CSVData {
  fileName: string;
  uploadDate: Date;
  processedDate?: Date;
  recordCount: number;
  status: "uploading" | "processing" | "completed" | "error";
  errors?: string[];
  tests: LabTest[];
}

export interface DashboardStats {
  totalTests: number;
  totalTestsChange: number;
  qualityAlerts: number;
  qualityAlertsChange: number;
  activeLabs: number;
  activeLabsChange: number;
  averageScore: number;
  averageScoreChange: number;
}

export interface QualityDistribution {
  excellent: number;
  good: number;
  satisfactory: number;
  unsatisfactory: number;
  serious: number;
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  description: string;
  type: "upload" | "analysis" | "login" | "alert" | "report" | "system";
  metadata?: Record<string, any>;
}

export interface Report {
  id: string;
  title: string;
  type: "daily" | "weekly" | "monthly" | "custom";
  generatedDate: Date;
  generatedBy: string;
  period: {
    start: Date;
    end: Date;
  };
  statistics: DashboardStats;
  qualityDistribution: QualityDistribution;
  topConcerns: QualityFlag[];
  filePath?: string;
  status: "generating" | "completed" | "error";
}
