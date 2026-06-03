const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";


export async function apiGet(endpoint) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch data");
  return response.json();
}


export async function apiPost(endpoint, data) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}


export async function apiPostForm(endpoint, formData) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    credentials: "include",
    body: formData, 
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}


export async function apiPut(endpoint, data) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update data");
  return response.json();
}


export async function apiDelete(endpoint) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to delete data");
  return response.json();
}


export const api = {
  get: apiGet,
  post: apiPost,
  postForm: apiPostForm, 
  put: apiPut,
  delete: apiDelete,
};
