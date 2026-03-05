// src/api/complaints.ts
import { api } from "./client";
import type {
  ComplaintListItem,
  ComplaintDetail,
  CreateComplaintPayload,
  StatusUpdatePayload,
} from "../types";

// Handles both plain [] and paginated {"results":[...]} responses
function extractList(data: unknown): ComplaintListItem[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && "results" in (data as Record<string, unknown>)) {
    return (data as { results: ComplaintListItem[] }).results;
  }
  return [];
}

export async function getComplaints(): Promise<ComplaintListItem[]> {
  const res = await api.get("/api/complaints/");
  return extractList(res.data);
}

export async function getComplaint(id: number): Promise<ComplaintDetail> {
  const res = await api.get(`/api/complaints/${id}/`);
  return res.data;
}

export async function createComplaint(payload: CreateComplaintPayload): Promise<ComplaintDetail> {
  // ONLY send title, description, channel — AI sets everything else
  const res = await api.post("/api/complaints/", {
    title: payload.title,
    description: payload.description,
    channel: payload.channel ?? "TEXT",
  });
  return res.data;
}

export async function updateStatus(
  id: number,
  payload: StatusUpdatePayload
): Promise<ComplaintDetail> {
  const res = await api.post(`/api/complaints/${id}/status/`, payload);
  return res.data;
}

export async function getAnalytics() {
  const res = await api.get("/api/analytics/overview/");
  return res.data;
}

export async function assignDepartment(
  id: number,
  departmentName: string
): Promise<ComplaintDetail> {
  // POST to /assign/ — NOT PATCH.
  // PATCH is silently ignored because department_name is read_only in
  // the DRF serializer (it reads from the FK assigned_department).
  // The /assign/ view action resolves the FK and saves properly so the
  // change reflects immediately in officer and citizen portals.
  const res = await api.post(`/api/complaints/${id}/assign/`, {
    department_name: departmentName,
  });
  return res.data;
}

// Fetch all available departments from backend
export async function getDepartments(): Promise<{ id: number; name: string }[]> {
  try {
    const res = await api.get("/api/departments/");
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (data?.results) return data.results;
    return [];
  } catch {
    // Fallback list if endpoint not available
    return [
      { id:1,  name: "Water Supply & Sanitation"      },
      { id:2,  name: "Electricity & Power"            },
      { id:3,  name: "Health & Medical Services"      },
      { id:4,  name: "Infrastructure & Roads"         },
      { id:5,  name: "Public Safety & Police"         },
      { id:6,  name: "Agriculture & Farming"          },
      { id:7,  name: "Education"                      },
      { id:8,  name: "Revenue & Taxation"             },
      { id:9,  name: "Transport & Traffic"            },
      { id:10, name: "Housing & Urban Development"    },
      { id:11, name: "Environment & Waste Management" },
    ];
  }
}