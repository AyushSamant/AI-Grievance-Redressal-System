// src/components/Badge.tsx
import type { ComplaintStatus, ComplaintPriority } from "../types";

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  SUBMITTED:    { bg: "#EFF6FF", color: "#1D4ED8", label: "Submitted" },
  AI_PROCESSED: { bg: "#F5F3FF", color: "#6D28D9", label: "AI Processed" },
  ASSIGNED:     { bg: "#FFFBEB", color: "#B45309", label: "Assigned" },
  IN_PROGRESS:  { bg: "#ECFDF5", color: "#065F46", label: "In Progress" },
  RESOLVED:     { bg: "#ECFDF5", color: "#059669", label: "Resolved" },
  CLOSED:       { bg: "#F3F4F6", color: "#4B5563", label: "Closed" },
  REJECTED:     { bg: "#FEF2F2", color: "#DC2626", label: "Rejected" },
};

const PRIORITY_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
  LOW:      { bg: "#EFF6FF", color: "#1D4ED8", dot: "#3B82F6" },
  MEDIUM:   { bg: "#FFFBEB", color: "#B45309", dot: "#F59E0B" },
  HIGH:     { bg: "#FFF7ED", color: "#C2410C", dot: "#F97316" },
  CRITICAL: { bg: "#FEF2F2", color: "#DC2626", dot: "#EF4444" },
};

export function StatusBadge({ status }: { status: ComplaintStatus | string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.SUBMITTED;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 10px", borderRadius: 100,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
      background: s.bg, color: s.color,
      border: `1px solid ${s.color}22`,
    }}>
      {s.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: ComplaintPriority | string }) {
  const p = PRIORITY_STYLE[priority] ?? PRIORITY_STYLE.MEDIUM;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "2px 10px", borderRadius: 100,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
      background: p.bg, color: p.color,
      border: `1px solid ${p.color}22`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.dot, flexShrink: 0 }} />
      {priority}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    ADMIN:   { bg: "#FEF3C7", color: "#92400E" },
    OFFICER: { bg: "#EDE9FE", color: "#5B21B6" },
    CITIZEN: { bg: "#ECFDF5", color: "#065F46" },
  };
  const s = styles[role] ?? styles.CITIZEN;
  return (
    <span style={{
      padding: "2px 10px", borderRadius: 100,
      fontSize: 10, fontWeight: 800, letterSpacing: "0.08em",
      textTransform: "uppercase" as const,
      background: s.bg, color: s.color,
    }}>
      {role}
    </span>
  );
}