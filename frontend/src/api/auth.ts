// src/api/auth.ts
import { api } from "./client";
import type { User } from "../types";

export async function login(username: string, password: string): Promise<User> {
  // Step 1: get tokens
  const tokenRes = await api.post("/api/token/", { username, password });
  localStorage.setItem("access", tokenRes.data.access);
  localStorage.setItem("refresh", tokenRes.data.refresh);

  // Step 2: get user profile (role, etc.)
  const meRes = await api.get("/api/users/me/");
  const user: User = meRes.data;
  localStorage.setItem("user", JSON.stringify(user));
  return user;
}

export function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user");
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(localStorage.getItem("access"));
}

export async function fetchMe(): Promise<User> {
  const res = await api.get("/api/users/me/");
  localStorage.setItem("user", JSON.stringify(res.data));
  return res.data;
}
export async function signup(data: {
  username:     string;
  email:        string;
  password:     string;
  role:         string;
  phone_number: string;
}) {
  const res = await api.post("/api/users/signup/", data);

  localStorage.setItem("access",  res.data.access);
  localStorage.setItem("refresh", res.data.refresh);
  localStorage.setItem("user", JSON.stringify({
    username: res.data.username,
    role:     res.data.role,
  }));

  return res.data;
}