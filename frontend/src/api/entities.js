export const BACKEND_URL = import.meta.env.VITE_API_URL ?? "";
const BASE_URL = BACKEND_URL + "/api";

// Fetches a public (no-auth) endpoint, retrying on network failures so Railway
// free-tier wake-up timeouts don't permanently block the request.
async function publicGet(endpoint) {
  const retryDelays = [0, 3000, 5000, 8000];
  let lastError;
  for (const delay of retryDelays) {
    if (delay > 0) await new Promise(r => setTimeout(r, delay));
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        mode: "cors",
        credentials: "omit",
      });
      if (!response.ok) throw new Error("Failed to fetch data"); // HTTP error — don't retry
      return await response.json();
    } catch (err) {
      if (err.message === "Failed to fetch data") throw err; // HTTP error — stop
      lastError = err; // network error — retry after delay
    }
  }
  throw lastError;
}

export async function apiGet(endpoint) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: "include",
  });
  if (!response.ok) {
    const err = new Error(response.status === 401 ? "Unauthorized" : "Failed to fetch data");
    err.status = response.status;
    throw err;
  }
  return await response.json();
}

export async function apiPost(endpoint, data, isFormData = false) {
  const options = {
    method: "POST",
    credentials: "include",
    body: isFormData ? data : JSON.stringify(data),
    headers: isFormData ? undefined : { "Content-Type": "application/json" },
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  if (!response.ok) {
    const err = new Error(response.status === 401 ? "Unauthorized" : await response.text());
    err.status = response.status;
    throw err;
  }
  return await response.json();
}

export async function apiPut(endpoint, data) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = new Error(response.status === 401 ? "Unauthorized" : "Failed to update data");
    err.status = response.status;
    throw err;
  }
  return await response.json();
}

export async function apiDelete(endpoint) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    const err = new Error(response.status === 401 ? "Unauthorized" : "Failed to delete data");
    err.status = response.status;
    throw err;
  }
  return await response.json();
}

export const api = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
};


export const TelegramChannel = {
  getAll: () => publicGet("/channels"),
  get: (id) => publicGet(`/channels/${id}`),
  getById: (id) => publicGet(`/channels/${id}`),
  create: (data) => api.post("/channels", data),
  update: (id, data) => api.put(`/channels/${id}`, data),
  delete: (id) => api.delete(`/channels/${id}`),
  approve: (id) => api.post(`/channels/${id}/approve`, {}),
  reject: (id) => api.post(`/channels/${id}/reject`, {}),
  filter: (params) =>
    publicGet(`/channels?${new URLSearchParams(params).toString()}`),
};


export const AdRequest = {
  getAll: () => apiGet("/ad-requests"),
  get: (id) => apiGet(`/ad-requests/${id}`),
  getByAdvertiser: (id) => apiGet(`/ad-requests?advertiser_id=${id}`),
  getByChannel: (id) => apiGet(`/ad-requests?channel_id=${id}`),

  create: (formData) => apiPost("/ad-requests", formData, true),

  update: (id, data) => api.put(`/ad-requests/${id}`, data),
  delete: (id) => api.delete(`/ad-requests/${id}`),
  filter: (params) =>
    apiGet(`/ad-requests?${new URLSearchParams(params).toString()}`),

  approve: (id) => api.post(`/ad-requests/${id}/approve`, {}),
  reject: (id, reason = "Rejected by admin") =>
    api.post(`/ad-requests/${id}/reject`, { reason }),
  list: () => apiGet("/ad-requests"),
};


export const User = {
  login: async (credentials) => {
    const data = await api.post("/auth/login", credentials);
    localStorage.setItem("user", JSON.stringify(data));
    return data;
  },
  register: (data) => api.post("/auth/register", data),
  logout: async () => {
    localStorage.removeItem("user");
    return api.post("/auth/logout", {});
  },
  me: async () => {
    const cached = localStorage.getItem("user");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id) return parsed;
      } catch (_) {}
      localStorage.removeItem("user");
    }
    const data = await api.get("/auth/profile");
    localStorage.setItem("user", JSON.stringify(data));
    return data;
  },
  getProfile: async () => {
    const cached = localStorage.getItem("user");
    if (cached) return JSON.parse(cached);
    const data = await api.get("/auth/profile");
    localStorage.setItem("user", JSON.stringify(data));
    return data;
  },
  list: () => api.get("/auth/users"),
  getById: (id) => api.get(`/auth/users/${id}`),
  updateProfile: async (data) => {
    const updated = await api.put("/auth/profile", data);
    localStorage.setItem("user", JSON.stringify(updated));
    return updated;
  },
  verifyEmail: (token) => api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`),
  resendVerification: (email) => api.post("/auth/resend-verification", { email }),
};
