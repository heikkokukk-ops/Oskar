// Browser-side fetch helper: throws an Error carrying the API's Estonian message.

const NETWORK_ERROR = "Serveriga ei õnnestunud ühendust luua. Kontrolli internetiühendust ja proovi uuesti.";

export async function api<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: json !== undefined ? { "Content-Type": "application/json", ...rest.headers } : rest.headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new Error(NETWORK_ERROR);
  }

  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? "Midagi läks valesti. Proovi uuesti.");
  }
  return data as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Midagi läks valesti. Proovi uuesti.";
}

const timeFormat = new Intl.DateTimeFormat("et-EE", { hour: "2-digit", minute: "2-digit" });
const dateTimeFormat = new Intl.DateTimeFormat("et-EE", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toDateString() === new Date().toDateString()
    ? `Täna ${timeFormat.format(date)}`
    : dateTimeFormat.format(date);
}
