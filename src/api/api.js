// src/api/api.js
import { setAuth } from "../stores/auth.js";

const MT_BASE = (import.meta.env.VITE_MTAPI_BASE || "").replace(/\/$/, "");
const CRM_BASE = "/api"; // tu proxy actual al CRM (lo dejas tal cual)

// ---- GENÉRICO (con token si existe)
export async function request(base, endpoint, options = {}) {
  const token = localStorage.getItem("mt_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(`${base}${endpoint}`, { ...options, headers });
  const ct = res.headers.get("content-type") || "";
  const raw = await res.text();
  const isJson = ct.includes("application/json");
  let data = raw;
  if (isJson && raw) {
    try {
      data = JSON.parse(raw);
    } catch {}
  }
  if (!res.ok)
    throw new Error(
      (typeof data === "string" ? data : data?.message) || `HTTP ${res.status}`
    );
  return data;
}

export function getMe() {
  return request(MT_BASE, "/api/users/me");
}
// ---- .NET AUTH

export async function registerUser({ username, email, password, role }) {
  const MT_BASE = (import.meta.env.VITE_MTAPI_BASE || "").replace(/\/$/, "");
  const res = await fetch(`${MT_BASE}/api/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password, role })
  });
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) throw new Error(typeof data === "string" ? data : data?.message || `HTTP ${res.status}`);
  return data; // { message, id, username, email, role }
}

export async function loginDotNet(username, password) {
  const data = await request(MT_BASE, "/api/users/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  const token = data && typeof data === "object" ? data.token : data;
  if (!token) throw new Error("Respuesta de login sin token");

  localStorage.setItem("mt_token", token);

  // fallback al 'user' del login por si /me falla
  let me = null;
  try {
    me = await request(MT_BASE, "/api/users/me");
  } catch {
    const u = data?.user;
    if (u) {
      me = { username: u.username, email: u.email, role: u.role };
    }
  }

  // guarda también en localStorage para persistencia
  if (me) localStorage.setItem("mt_me", JSON.stringify(me));

  // actualiza el store
  try {
    setAuth(token, me);
  } catch {}

  return { token, me };
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
