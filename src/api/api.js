// src/api/api.js
import { getToken, setAuth } from "../stores/auth.js";

const BASE_URL = "/api"; // pasa por el proxy de Vite para evitar CORS:contentReference[oaicite:1]{index=1}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const msg = data?.message || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return data;
}

// --- ENDPOINTS ---
export async function login(username, password) {
  const data = await request("/Auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  // La API devuelve { token, user: {...} } según tu Postman.
  setAuth(data.token, data.user ?? null);
  return data;
}

export function searchCustomers(q, take = 10) {
  return request(`/Customers/search?q=${encodeURIComponent(q)}&take=${take}`);
}
export function getInstallers(take = 100) {
  return request(`/Installers/installers?take=${take}`);
}
export function searchInstallers(q, take = 10) {
  return request(`/Installers/search?q=${encodeURIComponent(q)}&take=${take}`);
}
