import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

export async function trackActivity(data: {
  actionType: string;
  inputData?: string;
  inputCount?: number;
}): Promise<void> {
  await apiClient.post("/track", data);
}
