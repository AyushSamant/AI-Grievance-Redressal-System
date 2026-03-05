// src/api/chatbot.ts
import { api } from "./client";

export interface ChatResponse {
  answer: string;
  provider?: string;
  sources?: string[];
}

export async function askChatbot(question: string): Promise<ChatResponse> {
  const res = await api.post("/api/chatbot/ask/", { question });
  return res.data;
}