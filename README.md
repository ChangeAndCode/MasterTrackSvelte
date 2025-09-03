# MasterTrack - Checklist de Control

Aplicación web en Svelte para digitalizar el proceso de control de instalación de GPS y dispositivos de rastreo vehicular.

## 🚀 Demo en Vivo

**URL del Demo:** [https://master-track-svelte.vercel.app](https://master-track-svelte.vercel.app)

## Características

- **Sistema de Roles**: Cada empleado ve y edita solo su área de responsabilidad
- **Diseño fiel al formulario original**: Replica exactamente la estructura del checklist de control en papel
- **Paleta de colores MasterTrack**: Utiliza los colores oficiales de la empresa
- **Interfaz responsiva**: Funciona en dispositivos móviles y de escritorio
- **Timeline completa**: Todos ven el progreso general del proceso
- **Estadísticas personalizadas**: Métricas específicas por rol
- **Estructura simple**: Código minimalista y fácil de mantener

## Sistema de Roles

### Roles Disponibles:
- **Vendedor**: Solo edita "GENERAR ORDEN DE COMPRA"
- **Coordinador**: Solo edita "COORDINACION DE SERVICIOS"
- **Programador**: Solo edita "PROGRAMADORES"
- **Almacén**: Solo edita "ALMACÉN"
- **Calidad**: Solo edita "CALIDAD"
- **Técnico**: Solo edita "TÉCNICO INSTALADOR"
- **Soporte**: Solo edita "SOPORTE TÉCNICO"
- **Facturación**: Solo edita "FACTURACIÓN"
- **Administrador**: Edita todos los pasos

### Características del Sistema:
- **Visibilidad completa**: Todos ven el progreso general
- **Edición restringida**: Solo campos asignados al rol
- **Indicadores visuales**: Campos de solo lectura claramente marcados
- **Estadísticas personalizadas**: Métricas específicas por departamento

## Instalación Local

1. Instalar dependencias:
```bash
npm install
```

2. Ejecutar en modo desarrollo:
```bash
npm run dev
```

3. Construir para producción:
```bash
npm run build
```

## Despliegue en Vercel

### Opción 1: Despliegue Automático (Recomendado)

1. Conectar el repositorio a Vercel
2. Configuración automática detectada
3. Despliegue automático en cada push

### Opción 2: Despliegue Manual

1. Instalar Vercel CLI:
```bash
npm i -g vercel
```

2. Desplegar:
```bash
vercel
```

## Estructura del Proyecto

```
src/
├── components/
│   ├── Header.svelte          # Header principal con logo y navegación
│   ├── Checklist.svelte       # Componente principal del checklist
│   ├── ChecklistHeader.svelte # Header del formulario con datos del cliente
│   ├── ChecklistTable.svelte  # Tabla con todos los pasos del proceso
│   ├── ProcessStats.svelte    # Estadísticas del proceso
│   └── RoleSelector.svelte    # Selector de roles de usuario
├── stores/
│   └── roleStore.js           # Store para manejo de roles y permisos
├── data/
│   └── sampleData.js          # Datos de ejemplo para demostración
├── App.svelte                 # Componente raíz
├── app.css                    # Estilos globales
└── main.js                    # Punto de entrada
```

## Flujo de Procesos

La aplicación digitaliza los siguientes pasos del proceso de instalación:

1. **GENERAR ORDEN DE COMPRA** (Vendedor)
2. **COORDINACION DE SERVICIOS** (Coordinador)
3. **PROGRAMADORES** (Programador)
4. **ALMACÉN** (Almacén)
5. **CALIDAD** (Calidad - Primera verificación)
6. **TÉCNICO INSTALADOR** (Técnico)
7. **SOPORTE TÉCNICO** (Soporte)
8. **CALIDAD** (Calidad - Segunda verificación)
9. **SALIDA DE MATERIAL** (Almacén)
10. **FACTURACIÓN** (Facturación)

## Tecnologías

- **Svelte 4**: Framework principal
- **Vite**: Herramienta de construcción
- **CSS Variables**: Para la paleta de colores
- **Responsive Design**: CSS Grid y Flexbox
- **Svelte Stores**: Para manejo de estado y roles

## Próximos Pasos

- Integración con backend
- Autenticación de usuarios
- Persistencia de datos
- Exportación a PDF
- Notificaciones en tiempo real
- API para sincronización con sistemas existentes

## Feedback del Cliente

Este es un MVP (Minimum Viable Product) para demostrar el flujo y funcionalidad. 
Se solicita feedback sobre:

- [ ] Diseño y usabilidad
- [ ] Flujo de procesos
- [ ] Sistema de roles
- [ ] Funcionalidades adicionales necesarias
- [ ] Integración con sistemas existentes

## Contacto

Para consultas sobre el desarrollo o funcionalidades adicionales, contactar al equipo de desarrollo.
