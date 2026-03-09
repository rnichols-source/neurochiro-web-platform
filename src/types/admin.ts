export type LogCategory = "SECURITY" | "AUTOMATION" | "SYSTEM" | "DATA" | "GENERAL";
export type LogSeverity = "Low" | "Medium" | "High" | "Critical";
export type LogStatus = "Success" | "Failed" | "Warning" | "Info";

export interface AuditLog {
  id: string;
  category: LogCategory;
  event: string;
  user: string;
  target: string;
  timestamp: string;
  status: LogStatus;
  severity: LogSeverity;
  metadata?: Record<string, any>;
}
