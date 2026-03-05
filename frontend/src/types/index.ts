// src/types/index.ts

export type UserRole = "CITIZEN" | "OFFICER" | "ADMIN";

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
}

export type ComplaintStatus =
  | "SUBMITTED"
  | "AI_PROCESSED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "REJECTED";

export type ComplaintPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ComplaintListItem {
  id: number;
  title: string;
  description: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  category?: string;
  department_name?: string;
  urgency_score?: number;
  sla_days?: number;
  sentiment?: string;
  channel?: string;
  created_at: string;
  updated_at: string;
}

export interface StatusHistory {
  id: number;
  from_status: ComplaintStatus;
  to_status: ComplaintStatus;
  note?: string;
  actor_username?: string;
  created_at: string;
}

export interface ComplaintDetail extends ComplaintListItem {
  predicted_resolution_days?: number;
  history: StatusHistory[];
}

export interface CreateComplaintPayload {
  title: string;
  description: string;
  channel?: "TEXT" | "VOICE";
}

export interface StatusUpdatePayload {
  status: ComplaintStatus;
  note?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  time: string;
  provider?: string;
}

export interface AnalyticsData {
  total_complaints: number;
  resolved_today: number;
  pending_count: number;
  high_priority_count: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  by_department: Record<string, number>;
  by_category: Record<string, number>;
  resolution_rate: number;
  avg_resolution_hours?: number;
  sla_compliance?: number;
}

// Officer-friendly transitions — AI_PROCESSED step is automatic so
// officers must be able to advance from SUBMITTED directly.
export const ALLOWED_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  SUBMITTED:    ["AI_PROCESSED", "ASSIGNED",    "IN_PROGRESS", "REJECTED", "CLOSED", "RESOLVED"],
  AI_PROCESSED: ["ASSIGNED",    "IN_PROGRESS",  "REJECTED", "CLOSED", "RESOLVED"],
  ASSIGNED:     ["IN_PROGRESS", "RESOLVED",     "REJECTED", "CLOSED"],
  IN_PROGRESS:  ["RESOLVED",    "REJECTED", "CLOSED"],
  RESOLVED:     ["CLOSED"],
  CLOSED:       [],
  REJECTED:     [],
};

export const STATUS_ORDER: ComplaintStatus[] = [
  "SUBMITTED", "AI_PROCESSED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED",
];

export const PRIORITY_COLORS: Record<ComplaintPriority, string> = {
  LOW:      "#3B82F6",
  MEDIUM:   "#F59E0B",
  HIGH:     "#F97316",
  CRITICAL: "#EF4444",
};

export const STATUS_COLORS: Record<string, string> = {
  SUBMITTED:    "#3B82F6",
  AI_PROCESSED: "#8B5CF6",
  ASSIGNED:     "#F59E0B",
  IN_PROGRESS:  "#06B6D4",
  RESOLVED:     "#10B981",
  CLOSED:       "#6B7280",
  REJECTED:     "#EF4444",
};