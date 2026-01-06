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
      datosCte: true,
      checklist: true,
      comodato: true,
      garantia: true,
      cortesia: false,
      demo: true,
      precioRenta: true,
      folio: "FOL-001",
      numProgServ: "SERV-001",
    },
  },
  {
    id: 2,
    aspecto: "COORDINACION DE SERVICIOS",
    firmaResponsable: "Maria Garcia",
    fecha: "2024-01-16",
    completado: true,
    calidad: {
      validado: true,
      valido: true,
    },
  },
  {
    id: 3,
    aspecto: "PROGRAMADORES",
    firmaResponsable: "Carlos Lopez",
    fecha: "2024-01-17",
    completado: true,
    calidad: {
      ids: true,
      valido: true,
    },
  },
  {
    id: 4,
    aspecto: "ALMACEN",
    firmaResponsable: "Ana Rodriguez",
    fecha: "2024-01-18",
    completado: true,
    calidad: {
      matCompleto: true,
      numVale: "VALE-001",
      hojaSalida: true,
    },
  },
  {
    id: 5,
    aspecto: "CALIDAD",
    firmaResponsable: "Luis Martinez",
    fecha: "2024-01-19",
    completado: true,
    calidad: {
      observaciones: "Material verificado y aprobado",
    },
  },
  {
    id: 6,
    aspecto: "TECNICO INSTALADOR",
    firmaResponsable: "Roberto Silva",
    fecha: "2024-01-20",
    completado: false,
    calidad: {},
  },
  {
    id: 7,
    aspecto: "SOPORTE TECNICO",
    firmaResponsable: "",
    fecha: "",
    completado: false,
    calidad: {
      procesada: false,
      pruebas: false,
      notificacionCliente: false,
    },
  },
  {
    id: 8,
    aspecto: "CALIDAD",
    firmaResponsable: "",
    fecha: "",
    completado: false,
    calidad: {
      observaciones: "",
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
