// src/stores/auth.js
import { writable } from "svelte/store";

const savedToken = localStorage.getItem("mt_token");
const savedMe = JSON.parse(localStorage.getItem("mt_me") || "null");

export const auth = writable({
  isAuthenticated: !!savedToken,
  token: savedToken || null,
  me: savedMe || null,
});

export function setAuth(token, me) {
  if (token) localStorage.setItem("mt_token", token);
  else localStorage.removeItem("mt_token");

  if (me) localStorage.setItem("mt_me", JSON.stringify(me));
  else localStorage.removeItem("mt_me");

  auth.set({ isAuthenticated: !!token, token: token || null, me: me || null });
}

export function clearAuth() {
  localStorage.removeItem("mt_token");
  localStorage.removeItem("mt_me");
  auth.set({ isAuthenticated: false, token: null, me: null });
}
