// src/api/api.js
import { getToken, setAuth } from "../stores/auth.js";

const MT_BASE = (import.meta.env.VITE_MTAPI_BASE || "").replace(/\/$/, "");
const CRM_BASE = "/api"; // tu proxy actual al CRM (lo dejas tal cual)

// ---- GENÉRICO (con token si existe)
async function request(base, endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(`${base}${endpoint}`, { ...options, headers });

  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok)
    throw new Error(
      typeof data === "string" ? data : data?.message || `HTTP ${res.status}`
    );
  return data;
}

// ---- .NET AUTH
export async function loginDotNet(username, password) {
  // /api/users/login devuelve el JWT como string (no JSON)
  const token = await request(MT_BASE, "/api/users/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  // guarda token y trae perfil
  try {
    const me = await request(MT_BASE, "/api/users/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    setAuth(token, me);
  } catch {
    setAuth(token, null);
  }
  return token;
}

// (si ya usas el CRM, dejas estos helpers)
export function searchCustomers(q, take = 10) {
  return request(
    CRM_BASE,
    `/Customers/search?q=${encodeURIComponent(q)}&take=${take}`
  );
}
export function getInstallers(take = 100) {
  return request(CRM_BASE, `/Installers/installers?take=${take}`);
}
export function searchInstallers(q, take = 10) {
  return request(
    CRM_BASE,
    `/Installers/search?q=${encodeURIComponent(q)}&take=${take}`
  );
}
