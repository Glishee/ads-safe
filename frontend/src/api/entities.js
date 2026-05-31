const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";


export async function apiGet(endpoint) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch data");
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
  if (!response.ok) throw new Error(await response.text());
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
  if (!response.ok) throw new Error("Failed to update data");
  return await response.json();
}

export async function apiDelete(endpoint) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to delete data");
  return await response.json();
}

export const api = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
};


export const TelegramChannel = {
  getAll: () => api.get("/channels"),
  getById: (id) => api.get(`/channels/${id}`),
  create: (data) => api.post("/channels", data),
  update: (id, data) => api.put(`/channels/${id}`, data),
  delete: (id) => api.delete(`/channels/${id}`),
  approve: (id) => api.post(`/channels/${id}/approve`, {}),
  reject: (id) => api.post(`/channels/${id}/reject`, {}),
  filter: (params) =>
    api.get(`/channels?${new URLSearchParams(params).toString()}`),
};


export const AdRequest = {
  getAll: () => api.get("/ad-requests"),
  get: (id) => api.get(`/ad-requests/${id}`),
  getByAdvertiser: (id) => api.get(`/ad-requests?advertiser_id=${id}`),
  getByChannel: (id) => api.get(`/ad-requests?channel_id=${id}`),

  
  create: (formData) => apiPost("/ad-requests", formData, true),

  update: (id, data) => api.put(`/ad-requests/${id}`, data),
  delete: (id) => api.delete(`/ad-requests/${id}`),
  filter: (params) =>
    api.get(`/ad-requests?${new URLSearchParams(params).toString()}`),

  
  approve: (id) => api.post(`/ad-requests/${id}/approve`, {}),
  reject: (id, reason = "Rejected by admin") =>
    api.post(`/ad-requests/${id}/reject`, { reason }),
  list: () => api.get("/ad-requests"),
};


export const User = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (data) => api.post("/auth/register", data),
  logout: () => api.post("/auth/logout", {}),
  me: () => api.get("/auth/profile"),
  getProfile: () => api.get("/auth/profile"),
};
