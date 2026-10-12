import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

/* ==========================================
   REQUEST: attach the token for every call
   ==========================================
   Always read from sessionStorage (where the
   login pages save it). This also overrides any
   old "Bearer null" header that pages still
   set manually. */
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ==========================================
   RESPONSE: handle expired / invalid token
   ==========================================
   Login requests are skipped so that "Invalid
   password" errors still show on the login form. */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const isAuthRequest = url.includes("/api/auth/");

    if (status === 401 && !isAuthRequest) {
      let role = null;

      try {
        role = JSON.parse(sessionStorage.getItem("user") || "{}").role;
      } catch {
        role = null;
      }

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      const loginPage =
        role === "STUDENT"
          ? "/student-login"
          : role === "ADMIN"
          ? "/admin-login"
          : "/staff-login";

      window.location.replace(loginPage);
    }

    return Promise.reject(error);
  }
);

export default api;