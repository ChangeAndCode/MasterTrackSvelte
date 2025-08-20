# MasterTrack - Checklist de Control

Aplicación web en Svelte para digitalizar el proceso de control de instalación de GPS y dispositivos de rastreo vehicular.

## Características

- **Diseño fiel al formulario original**: Replica exactamente la estructura del checklist de control en papel
- **Paleta de colores MasterTrack**: Utiliza los colores oficiales de la empresa
- **Interfaz responsiva**: Funciona en dispositivos móviles y de escritorio
- **Estructura simple**: Código minimalista y fácil de mantener

## Instalación

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

## Estructura del Proyecto

```
src/
├── components/
│   ├── Header.svelte          # Header principal con logo y navegación
│   ├── Checklist.svelte       # Componente principal del checklist
│   ├── ChecklistHeader.svelte # Header del formulario con datos del cliente
│   └── ChecklistTable.svelte  # Tabla con todos los pasos del proceso
├── App.svelte                 # Componente raíz
├── app.css                    # Estilos globales
└── main.js                    # Punto de entrada
```

## Flujo de Procesos

La aplicación digitaliza los siguientes pasos del proceso de instalación:

1. **GENERAR ORDEN DE COMPRA**
2. **COORDINACION DE SERVICIOS**
3. **PROGRAMADORES**
4. **ALMACÉN**
5. **CALIDAD** (Primera verificación)
6. **TÉCNICO INSTALADOR**
7. **SOPORTE TÉCNICO**
8. **CALIDAD** (Segunda verificación)
9. **SALIDA DE MATERIAL**
10. **FACTURACIÓN**

## Tecnologías

- **Svelte 4**: Framework principal
- **Vite**: Herramienta de construcción
- **CSS Variables**: Para la paleta de colores
- **Responsive Design**: CSS Grid y Flexbox

## Próximos Pasos

- Integración con backend
- Autenticación de usuarios
- Persistencia de datos
- Exportación a PDF
- Notificaciones en tiempo real
