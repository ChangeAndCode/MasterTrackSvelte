// src/api/api.js
import { clearAuth, setAuth } from "../stores/auth.js";

// En desarrollo, usa el proxy de Vite para evitar CORS
// En producción, usa la URL del backend configurada
const isDev = import.meta.env.DEV;
const MT_BASE = isDev 
  ? "/mt-api"  // Proxy de Vite en desarrollo
  : (import.meta.env.VITE_MTAPI_BASE || "").replace(/\/$/, "");
const CRM_BASE = "/api"; // proxy actual al CRM

// ---- GENÉRICO: usa cookie HttpOnly, siempre con credenciales
export async function request(base, endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const res = await fetch(`${base}${endpoint}`, {
    credentials: "include",
    ...options,
    headers,
  });

  const ct = res.headers.get("content-type") || "";
  const raw = await res.text();
  const isJson = ct.includes("application/json");
  let data = raw;
  if (isJson && raw) {
    try {
      data = JSON.parse(raw);
    } catch {}
  }

  if (!res.ok) {
    // 401 => sesión expirada: limpia auth. 403: no cerrar sesión.
    if (res.status === 401) clearAuth();
    throw new Error(
      (typeof data === "string" ? data : data?.message) || `HTTP ${res.status}`
    );
  }
  return data;
}

export function getMe() {
  return request(MT_BASE, "/api/users/me");
}

// ---- AUTH (.NET con cookie HttpOnly)
export async function registerUser({ username, email, password, role }) {
  try {
    const res = await fetch(`${MT_BASE}/api/users/register`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, role }),
    });
    const ct = res.headers.get("content-type") || "";
    const data = ct.includes("application/json") ? await res.json() : await res.text();
    if (!res.ok) throw new Error(typeof data === "string" ? data : data?.message || `HTTP ${res.status}`);
    return data; // { message, id, username, email, role }
  } catch (err) {
    // Mejorar mensaje de error para problemas de red/CORS
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error(`Error de conexión: No se pudo conectar al servidor. Verifica que el backend esté corriendo en ${isDev ? "http://localhost:5078" : import.meta.env.VITE_MTAPI_BASE}`);
    }
    throw err;
  }
}

export async function loginDotNet(username, password) {
  await request(MT_BASE, "/api/users/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  const me = await getMe();
  setAuth(me);
  return { me };
}

export async function logoutDotNet() {
  try {
    await request(MT_BASE, "/api/users/logout", { method: "POST" });
  } finally {
    clearAuth();
  }
}

// ---- CRM proxy helpers
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
