import { writable } from "svelte/store";

// Definir roles y sus permisos
export const roles = {
  VENDEDOR: {
    name: "Vendedor",
    permissions: ["GENERAR ORDEN DE COMPRA"],
    color: "#FF6B6B",
  },
  COORDINADOR: {
    name: "Coordinador de Servicios",
    permissions: ["COORDINACION DE SERVICIOS"],
    color: "#4ECDC4",
  },
  PROGRAMADOR: {
    name: "Programador",
    permissions: ["PROGRAMADORES"],
    color: "#45B7D1",
  },
  ALMACEN: {
    name: "Almacén",
    permissions: ["ALMACÉN"],
    color: "#96CEB4",
  },
  CALIDAD: {
    name: "Calidad",
    permissions: ["CALIDAD"],
    color: "#FFEAA7",
  },
  TECNICO: {
    name: "Técnico Instalador",
    permissions: ["TÉCNICO INSTALADOR"],
    color: "#DDA0DD",
  },
  SOPORTE: {
    name: "Soporte Técnico",
    permissions: ["SOPORTE TÉCNICO"],
    color: "#F8B500",
  },
  SALIDA_MATERIAL: {
    name: "Salida de Material",
    permissions: ["SALIDA DE MATERIAL (INSTALACION DE STOCK)"],
    color: "#A8E6CF",
  },
  FACTURACION: {
    name: "Facturación",
    permissions: ["FACTURACIÓN"],
    color: "#FF8A80",
  },
  ADMIN: {
    name: "Administrador",
    permissions: [
      "GENERAR ORDEN DE COMPRA",
      "COORDINACION DE SERVICIOS",
      "PROGRAMADORES",
      "ALMACÉN",
      "CALIDAD",
      "TÉCNICO INSTALADOR",
      "SOPORTE TÉCNICO",
      "SALIDA DE MATERIAL (INSTALACION DE STOCK)",
      "FACTURACIÓN",
    ],
    color: "#6C5CE7",
  },
};
const ALIAS = {
  Administrador: "ADMIN",
  Admin: "ADMIN",

  Almacen: "ALMACEN",
  Almacén: "ALMACEN",

  Calidad: "CALIDAD",

  Programador: "PROGRAMADOR",

  Coordinador: "COORDINADOR",
  "Coordinador de Servicios": "COORDINADOR",

  Vendedor: "VENDEDOR",

  "Tecnico Instalador": "TECNICO",
  "Técnico Instalador": "TECNICO",
  Tecnico: "TECNICO",
  Técnico: "TECNICO",

  "Soporte Tecnico": "SOPORTE",
  "Soporte Técnico": "SOPORTE",
  Soporte: "SOPORTE",

  Facturacion: "FACTURACION",
  Facturación: "FACTURACION",

  "Salida de Material": "SALIDA_MATERIAL",
  "Salida de Material (INSTALACION DE STOCK)": "SALIDA_MATERIAL",
  "SALIDA DE MATERIAL (INSTALACION DE STOCK)": "SALIDA_MATERIAL",
};

// Quita acentos, pasa a mayúsculas y reemplaza espacios por "_"
function toKey(str = "") {
  return str
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // sin acentos
    .toUpperCase().replace(/\s+/g, "_");
}

// Normaliza cualquier nombre de rol (del backend) a tu clave interna
export function normalizeRoleKey(roleName = "") {
  if (ALIAS[roleName]) return ALIAS[roleName];
  const key = toKey(roleName);
  return roles[key] ? key : roleName; // si no existe, devuelve el original
}

// ===== API “por nombre” (recomendada cuando viene de backend) =====
export function getRoleColorByName(roleName) {
  const key = normalizeRoleKey(roleName);
  return roles[key]?.color || '#666666';
}

export function getRoleLabelByName(roleName) {
  const key = normalizeRoleKey(roleName);
  return roles[key]?.name || roleName || 'Desconocido';
}

// Lo que ya tenías (por clave interna) puede quedarse:
export function getRoleColor(roleKey) {
  return roles[roleKey]?.color || '#666666';
}
export function getRoleName(roleKey) {
  return roles[roleKey]?.name || 'Desconocido';
}