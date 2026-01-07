// src/stores/auth.js
import { writable } from "svelte/store";

// Estado de autenticación solo en memoria (el token va en cookie HttpOnly)
export const auth = writable({
  isAuthenticated: false,
  me: null,
});

export function setAuth(me) {
  auth.set({ isAuthenticated: !!me, me: me || null });
}

export function clearAuth() {
  auth.set({ isAuthenticated: false, me: null });
}
