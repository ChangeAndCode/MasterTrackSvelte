// src/stores/auth.js
import { writable, get } from "svelte/store";

const saved = JSON.parse(localStorage.getItem("auth") || "null");

export const auth = writable(
  saved ?? { token: null, user: null, isAuthenticated: false }
);

auth.subscribe((val) => {
  localStorage.setItem("auth", JSON.stringify(val));
});

export function setAuth(token, user) {
  auth.set({ token, user, isAuthenticated: !!token });
}

export function clearAuth() {
  auth.set({ token: null, user: null, isAuthenticated: false });
}

export function getToken() {
  const a = get(auth);
  return a?.token || null;
}
