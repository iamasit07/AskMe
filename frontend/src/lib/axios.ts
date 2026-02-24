import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

export const refreshAuth = async (): Promise<boolean> => {
  if (isRefreshing) {
    return new Promise((resolve) => {
      failedQueue.push({
        resolve: () => resolve(true),
        reject: () => resolve(false),
      });
    });
  }

  isRefreshing = true;

  try {
    await api.post("/api/auth/refresh");
    processQueue(null);
    return true;
  } catch {
    processQueue(new Error("Refresh failed"));
    return false;
  } finally {
    isRefreshing = false;
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      if (originalRequest.url?.includes("/api/auth/login") || originalRequest.url?.includes("/api/auth/refresh")) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      const refreshed = await refreshAuth();

      if (refreshed) {
        return api(originalRequest);
      }

      if (window.location.pathname !== "/login" && window.location.pathname !== "/signup") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default api;
