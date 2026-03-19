export type LogCategory = "SECURITY" | "AUTOMATION" | "SYSTEM" | "DATA" | "GENERAL";
export type LogSeverity = "Low" | "Medium" | "High" | "Critical";
export type LogStatus = "Success" | "Failed" | "Warning" | "Info";

export interface AuditLog {
  id: string;
  category: LogCategory;
  event: string;
  user: string;
  user_name?: string; // Optional DB field
  target: string;
  timestamp: string;
  created_at?: string; // Optional DB field
  status: LogStatus;
  severity: LogSeverity;
  metadata?: Record<string, any>;
}
