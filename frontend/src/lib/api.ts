const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem("userId"); } catch { return null; }
}

/** Thin fetch wrapper: JSON in/out, mock-auth header, readable errors. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  };
  const uid = getStoredUserId();
  if (uid) headers["X-User-Id"] = uid;

  const res = await fetch(BASE + path, { ...init, headers });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json();
      msg = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {}
    throw new ApiError(msg, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

/** Multipart upload (can't go through api(): the browser must set the form boundary itself). */
export async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const uid = getStoredUserId();
  const res = await fetch(BASE + "/uploads", { method: "POST", body, headers: uid ? { "X-User-Id": uid } : {} });
  if (!res.ok) {
    let msg = "Upload failed";
    try { msg = (await res.json()).detail ?? msg; } catch {}
    throw new ApiError(msg, res.status);
  }
  return (await res.json()).url as string;
}
