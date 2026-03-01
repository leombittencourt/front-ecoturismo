// src/services/http.ts

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const API_KEY = import.meta.env.VITE_API_KEY || "";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type ServiceResultEnvelope<T = unknown> = {
  Success?: boolean;
  success?: boolean;
  ErrorMessage?: string | null;
  errorMessage?: string | null;
  Data?: T;
  data?: T;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isServiceResultEnvelope(value: unknown): value is ServiceResultEnvelope {
  if (!isObject(value)) return false;
  return hasOwn(value, "Success") || hasOwn(value, "success");
}

function getServiceResultErrorMessage(value: ServiceResultEnvelope): string | undefined {
  const message = value.ErrorMessage ?? value.errorMessage;
  return typeof message === "string" && message.trim() ? message.trim() : undefined;
}

function extractErrorMessage(details: unknown, fallback: string): string {
  if (typeof details === "string" && details.trim()) return details.trim();

  if (isServiceResultEnvelope(details)) {
    return getServiceResultErrorMessage(details) ?? fallback;
  }

  if (!isObject(details)) return fallback;

  const errorsObj = details.errors;
  if (isObject(errorsObj)) {
    const generalErrors = errorsObj.generalErrors;
    if (Array.isArray(generalErrors)) {
      const messages = generalErrors
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
      if (messages.length > 0) return messages.join("\n");
    }
  }

  const message = details.message;
  if (typeof message === "string" && message.trim()) return message.trim();

  const title = details.title;
  if (typeof title === "string" && title.trim()) return title.trim();

  if (isObject(errorsObj)) {
    for (const value of Object.values(errorsObj)) {
      if (Array.isArray(value)) {
        const first = value.find((item) => typeof item === "string" && item.trim());
        if (typeof first === "string") return first.trim();
      }
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }

  return fallback;
}

function unwrapServiceResultOrReturn<T>(status: number, payload: unknown): T {
  if (!isServiceResultEnvelope(payload)) return payload as T;

  const success = payload.Success ?? payload.success ?? false;
  if (!success) {
    throw new HttpError(
      status,
      getServiceResultErrorMessage(payload) ?? "Erro de validação de negócio.",
      payload
    );
  }

  if (hasOwn(payload as Record<string, unknown>, "Data")) return payload.Data as T;
  if (hasOwn(payload as Record<string, unknown>, "data")) return payload.data as T;
  // Some endpoints return a "success" flag with business fields at root level
  // (without wrapping them inside Data/data). In this case, return the payload.
  return payload as T;
}

function getAccessToken(): string | null {
  // ajuste depois quando integrarmos auth real
  return localStorage.getItem("accessToken");
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: HeadersInit = {
    ...(init?.headers ?? {}),
  };

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (API_KEY) headers["X-API-Key"] = API_KEY;

  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : isFormData
          ? body
          : JSON.stringify(body),
    ...init,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    const details = isJson ? await res.json().catch(() => undefined) : await res.text().catch(() => undefined);
    throw new HttpError(
      res.status,
      extractErrorMessage(details, `HTTP ${res.status} - ${res.statusText}`),
      details
    );
  }

  if (res.status === 204) return undefined as T;
  if (isJson) {
    const payload = (await res.json()) as unknown;
    return unwrapServiceResultOrReturn<T>(res.status, payload);
  }

  // fallback (caso algum endpoint retorne texto)
  return (await res.text()) as unknown as T;
}

export const http = {
  get: <T>(path: string, init?: RequestInit) => request<T>("GET", path, undefined, init),
  post: <T>(path: string, body?: unknown, init?: RequestInit) => request<T>("POST", path, body, init),
  put: <T>(path: string, body?: unknown, init?: RequestInit) => request<T>("PUT", path, body, init),
  patch: <T>(path: string, body?: unknown, init?: RequestInit) => request<T>("PATCH", path, body, init),
  del: <T>(path: string, init?: RequestInit) => request<T>("DELETE", path, undefined, init),
};
