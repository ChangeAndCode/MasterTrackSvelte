// src/api/checklistApi.js
import { request } from "./api.js";
const BASE = (import.meta.env.VITE_MTAPI_BASE || "").replace(/\/$/, "");

// ---- Clients
export function searchClients(q = "", take = 10) {
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  qs.set("take", String(take));
  return request(BASE, `/api/clients/search?${qs.toString()}`);
}

// ---- Checklists
export function getChecklists() {
  return request(BASE, "/api/checklists");
}

export function createChecklist({ clientId, date }) {
  // Folio simple por ahora (puedes cambiarlo si backend lo genera)
  const body = {
    folio: `FOLIO-${Date.now()}`,
    clientId,
    date,
  };
  return request(BASE, "/api/checklists", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getChecklist(id) {
  return request(BASE, `/api/checklists/${id}`);
}

export function updateChecklistStep(
  id,
  stepKey,
  payload /* {status?, data?} */
) {
  return request(
    BASE,
    `/api/checklists/${id}/steps/${encodeURIComponent(stepKey)}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
}

export function toggleChecklistStep(id, stepKey, done) {
  // Si no usas PATCH /toggle, actualizamos el estado con PUT
  return request(
    BASE,
    `/api/checklists/${id}/steps/${encodeURIComponent(stepKey)}`,
    {
      method: "PUT",
      body: JSON.stringify({ status: done ? "done" : "pending" }),
    }
  );
}

export async function getClientDocumentInfo(clientId) {
  if (!clientId) throw new Error("clientId requerido");
  return request(
    BASE,
    `/api/checklists/${encodeURIComponent(clientId)}/document-info`,
    { method: "GET" }
  );
}

export async function getClientChecklists(clientId) {
  return request(
    BASE,
    `/api/checklists/by-client/${encodeURIComponent(clientId)}`,
    { method: "GET" }
  );
}

export async function getChecklistDetail(id) {
  return request(BASE, `/api/checklists/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}