// Datos de ejemplo para demostrar la funcionalidad del checklist
export const sampleClientData = {
  cliente: "Transportes Ejemplo S.A.",
  fecha: new Date().toISOString().split("T")[0],
};

export const sampleChecklistData = [
  {
    id: 1,
    aspecto: "GENERAR ORDEN DE COMPRA",
    firmaResponsable: "Juan Perez",
    fecha: "2024-01-15",
    completado: true,
    calidad: {
      datosCte: null, // No se guarda, solo se muestra del cliente
      checklist: true,
      comodato: true,
      garantia: true,
      cortesia: false,
      demo: true,
      precioRenta: "15000.00", // Campo de moneda
      seguimiento: true,
      folio: "FOL-001",
    },
  },
  {
    id: 2,
    aspecto: "COORDINACION DE SERVICIOS",
    firmaResponsable: "Maria Garcia",
    fecha: "2024-01-16",
    completado: true,
    calidad: {
      estadoValidacion: "validado",
      numProgServ: "PROG-001",
      motivoRechazo: "",
    },
  },
  {
    id: 3,
    aspecto: "PROGRAMADORES",
    firmaResponsable: "Carlos Lopez",
    fecha: "2024-01-17",
    completado: true,
    calidad: {
      ids: "ID001\nID002\nID003",
      estadoValidacion: "valido",
      comentarios: "",
    },
  },
  {
    id: 4,
    aspecto: "ALMACEN",
    firmaResponsable: "Ana Rodriguez",
    fecha: "2024-01-18",
    completado: true,
    calidad: {
      matCompleto: "completo",
      numVale: "VALE-001",
      hojaSalida: "HOJA-001",
    },
  },
  {
    id: 5,
    aspecto: "CALIDAD",
    firmaResponsable: "Luis Martinez",
    fecha: "2024-01-19",
    completado: true,
    calidad: {
      estadoValidacion: "valido",
      comentarios: "",
      observaciones: "Material verificado y aprobado",
    },
  },
  {
    id: 6,
    aspecto: "TECNICO INSTALADOR",
    firmaResponsable: "Roberto Silva",
    fecha: "2024-01-20",
    completado: false,
    calidad: {
      comentarios: "La batería cuenta con solo la tapa protectora del polo positivo.",
      evidencias: [
        { url: "https://via.placeholder.com/400x300?text=Interior", label: "Interior" },
        { url: "https://via.placeholder.com/400x300?text=Bateria", label: "Batería" },
        { url: "https://via.placeholder.com/400x300?text=Instalacion", label: "Instalación GPS" }
      ],
    },
  },
  {
    id: 7,
    aspecto: "SOPORTE TECNICO",
    firmaResponsable: "",
    fecha: "",
    completado: false,
    calidad: {
      tareas: [],
    },
  },
  {
    id: 8,
    aspecto: "CALIDAD",
    firmaResponsable: "",
    fecha: "",
    completado: false,
    calidad: {
      estadoValidacion: "", // "valido" | "invalido" | ""
      comentarios: "", // Comentarios si está inválido
      observaciones: "", // Observaciones siempre visibles
    },
  },
  {
    id: 9,
    aspecto: "SALIDA DE MATERIAL (INSTALACION DE STOCK)",
    firmaResponsable: "",
    fecha: "",
    completado: false,
    calidad: {
      hojaSalida: "",
    },
  },
  {
    id: 10,
    aspecto: "FACTURACION",
    firmaResponsable: "",
    fecha: "",
    completado: false,
    calidad: {},
  },
];

export const sampleComments =
  "Instalacion programada para la proxima semana. Cliente solicita instalacion en horario matutino.";
