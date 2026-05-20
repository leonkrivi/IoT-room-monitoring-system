const BASE_URL: string =
  import.meta.env.API_BASE_URL || "http://localhost:3000"; // fallback for dev mode
type ApiResponse<T> = Promise<T>;

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): ApiResponse<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      (data as { error?: string }).error ?? res.statusText,
    );
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const api = {
  auth: {
    login: (password: string) =>
      request<{ message: string }>("POST", "/auth/login", { password }),

    logout: () => request<{ message: string }>("POST", "/auth/logout"),

    changePassword: (newPassword: string) =>
      request<{ message: string }>("POST", "/auth/change-password", {
        newPassword,
      }),
  },
};
