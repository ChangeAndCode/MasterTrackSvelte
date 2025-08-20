# Sistema de Roles y Permisos - MasterTrack Checklist

## Descripción General

El sistema de roles permite que cada empleado vea y edite únicamente su área de responsabilidad, mientras mantiene visibilidad completa del progreso general del proceso.

## Roles Disponibles

### 1. **Vendedor** 🔴
- **Responsabilidad**: Generar Orden de Compra
- **Puede editar**: Solo el paso "GENERAR ORDEN DE COMPRA"
- **Color**: Rojo (#FF6B6B)

### 2. **Coordinador de Servicios** 🟢
- **Responsabilidad**: Coordinación de Servicios
- **Puede editar**: Solo el paso "COORDINACION DE SERVICIOS"
- **Color**: Verde (#4ECDC4)

### 3. **Programador** 🔵
- **Responsabilidad**: Programación de dispositivos
- **Puede editar**: Solo el paso "PROGRAMADORES"
- **Color**: Azul (#45B7D1)

### 4. **Almacén** 🟢
- **Responsabilidad**: Gestión de inventario
- **Puede editar**: Solo el paso "ALMACÉN"
- **Color**: Verde claro (#96CEB4)

### 5. **Calidad** 🟡
- **Responsabilidad**: Control de calidad
- **Puede editar**: Solo los pasos "CALIDAD" (hay dos en el proceso)
- **Color**: Amarillo (#FFEAA7)

### 6. **Técnico Instalador** 🟣
- **Responsabilidad**: Instalación física
- **Puede editar**: Solo el paso "TÉCNICO INSTALADOR"
- **Color**: Púrpura (#DDA0DD)

### 7. **Soporte Técnico** 🟠
- **Responsabilidad**: Soporte post-instalación
- **Puede editar**: Solo el paso "SOPORTE TÉCNICO"
- **Color**: Naranja (#F8B500)

### 8. **Salida de Material** 🟢
- **Responsabilidad**: Gestión de salida de materiales
- **Puede editar**: Solo el paso "SALIDA DE MATERIAL (INSTALACION DE STOCK)"
- **Color**: Verde claro (#A8E6CF)

### 9. **Facturación** 🔴
- **Responsabilidad**: Proceso de facturación
- **Puede editar**: Solo el paso "FACTURACIÓN"
- **Color**: Rojo claro (#FF8A80)

### 10. **Administrador** 🟣
- **Responsabilidad**: Supervisión completa
- **Puede editar**: Todos los pasos
- **Color**: Púrpura (#6C5CE7)

## Características del Sistema

### Visibilidad
- **Todos los roles**: Pueden ver el progreso completo del proceso
- **Timeline**: Siempre visible para todos
- **Estadísticas**: Personalizadas según el rol

### Edición
- **Campos editables**: Solo los pasos asignados al rol
- **Campos de solo lectura**: Se muestran con fondo gris
- **Indicadores visuales**: Badges que muestran "Solo lectura"

### Estadísticas Personalizadas
- **Mi Progreso**: Muestra el progreso específico del rol actual
- **Mis Pendientes**: Solo los pasos pendientes del rol
- **Próximo Paso**: Indica el siguiente paso a completar

## Flujo de Trabajo

1. **Vendedor** inicia el proceso → Genera orden de compra
2. **Coordinador** valida → Coordina servicios
3. **Programador** configura → Programa dispositivos
4. **Almacén** prepara → Verifica materiales
5. **Calidad** revisa → Primera verificación
6. **Técnico** instala → Instalación física
7. **Soporte** prueba → Pruebas técnicas
8. **Calidad** aprueba → Segunda verificación
9. **Salida de Material** registra → Documenta salida
10. **Facturación** factura → Cierra proceso

## Beneficios

- **Seguridad**: Cada empleado solo puede modificar su área
- **Transparencia**: Todos ven el progreso completo
- **Eficiencia**: Enfoque en tareas específicas
- **Trazabilidad**: Registro claro de responsabilidades
- **Colaboración**: Visión compartida del proceso

## Uso en el Mockup

1. **Seleccionar rol**: Usar el dropdown "Cambiar Rol"
2. **Ver cambios**: Los campos editables se resaltan
3. **Completar tareas**: Solo los pasos asignados son editables
4. **Monitorear progreso**: Ver estadísticas personalizadas
5. **Colaborar**: Ver el trabajo de otros departamentos
