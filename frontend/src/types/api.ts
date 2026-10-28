export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface ValidationErrorDetail {
  field: string;
  rejectedValue: string;
  reason: string;
}

export interface ProblemDetail {
  type?: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  timestamp?: string;
  invalidParams?: ValidationErrorDetail[];
}

export interface SystemStatus {
  application: string;
  version: string;
  status: string;
  serverTimeUtc: string;
  activeProfiles: string[];
  database: {
    connected: boolean;
    product?: string;
    version?: string;
    error?: string;
  };
}
