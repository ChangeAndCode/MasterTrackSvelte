import { writable } from 'svelte/store';

// Definir roles y sus permisos
export const roles = {
  VENDEDOR: {
    name: 'Vendedor',
    permissions: ['GENERAR ORDEN DE COMPRA'],
    color: '#FF6B6B'
  },
  COORDINADOR: {
    name: 'Coordinador de Servicios',
    permissions: ['COORDINACION DE SERVICIOS'],
    color: '#4ECDC4'
  },
  PROGRAMADOR: {
    name: 'Programador',
    permissions: ['PROGRAMADORES'],
    color: '#45B7D1'
  },
  ALMACEN: {
    name: 'Almacén',
    permissions: ['ALMACÉN'],
    color: '#96CEB4'
  },
  CALIDAD: {
    name: 'Calidad',
    permissions: ['CALIDAD'],
    color: '#FFEAA7'
  },
  TECNICO: {
    name: 'Técnico Instalador',
    permissions: ['TÉCNICO INSTALADOR'],
    color: '#DDA0DD'
  },
  SOPORTE: {
    name: 'Soporte Técnico',
    permissions: ['SOPORTE TÉCNICO'],
    color: '#F8B500'
  },
  SALIDA_MATERIAL: {
    name: 'Salida de Material',
    permissions: ['SALIDA DE MATERIAL (INSTALACION DE STOCK)'],
    color: '#A8E6CF'
  },
  FACTURACION: {
    name: 'Facturación',
    permissions: ['FACTURACIÓN'],
    color: '#FF8A80'
  },
  ADMIN: {
    name: 'Administrador',
    permissions: ['GENERAR ORDEN DE COMPRA', 'COORDINACION DE SERVICIOS', 'PROGRAMADORES', 'ALMACÉN', 'CALIDAD', 'TÉCNICO INSTALADOR', 'SOPORTE TÉCNICO', 'SALIDA DE MATERIAL (INSTALACION DE STOCK)', 'FACTURACIÓN'],
    color: '#6C5CE7'
  }
};

// Store para el rol actual
export const currentRole = writable('VENDEDOR');

// Store para el usuario actual
export const currentUser = writable({
  name: 'Usuario Demo',
  role: 'VENDEDOR',
  department: 'Ventas'
});

// Función para verificar si un usuario puede editar un paso
export function canEditStep(stepAspect, userRole) {
  const role = roles[userRole];
  return role && role.permissions.includes(stepAspect);
}

// Función para obtener el color del rol
export function getRoleColor(role) {
  return roles[role]?.color || '#666666';
}

// Función para obtener el nombre del rol
export function getRoleName(role) {
  return roles[role]?.name || 'Desconocido';
}
