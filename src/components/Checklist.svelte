<script>
  import ChecklistTable from "./ChecklistTable.svelte";
  import ChecklistHeader from "./ChecklistHeader.svelte";
  import ProcessStats from "./ProcessStats.svelte";
  import RoleSelector from "./RoleSelector.svelte";
  import { auth } from "../stores/auth.js";
  import { normalizeRoleKey, roles } from "../stores/roleStore.js";
  import {
    sampleClientData,
    sampleChecklistData,
    sampleComments,
  } from "../data/sampleData.js";
  import {
    getChecklistDetail,
    updateChecklistStep,
  } from "../api/checklistApi.js";

  let currentChecklist = null;   // { id, folio, clientId, client } | null
  let selectedClient = null;      // Cliente seleccionado del buscador
  let detail = null;             // respuesta de GET /api/checklists/{id}
  let loadingDetail = false;
  let savingSteps = new Set();   // IDs de pasos que se están guardando actualmente
  let savingStepsArray = [];     // Array reactivo para pasar a ChecklistTable

  // Datos del checklist basados en el formulario
  let clientData = {
    cliente: "",
    fecha: new Date().toISOString().split("T")[0],
  };

  // Estados del checklist (plantilla base)
  let checklistData = [
    {
      id: 1,
      aspecto: "GENERAR ORDEN DE COMPRA",
      firmaResponsable: "",
      fecha: "",
      completado: false,
      calidad: {
        datosCte: null, // No se guarda, solo se muestra del cliente
        checklist: false,
        comodato: false,
        garantia: false,
        cortesia: false,
        demo: false,
        precioRenta: "", // Campo de moneda (string)
        seguimiento: false,
        folio: "",
      },
    },
    {
      id: 2,
      aspecto: "COORDINACION DE SERVICIOS",
      firmaResponsable: "",
      fecha: "",
      completado: false,
      calidad: {
        estadoValidacion: "", // "validado" | "rechazado" | ""
        numProgServ: "",
        motivoRechazo: "",
      },
    },
    {
      id: 3,
      aspecto: "PROGRAMADORES",
      firmaResponsable: "",
      fecha: "",
      completado: false,
      calidad: {
        ids: "", // IDs de dispositivos (texto, uno por línea)
        estadoValidacion: "", // "valido" | "invalido" | ""
        comentarios: "", // Comentarios si está inválido
      },
    },
    {
      id: 4,
      aspecto: "ALMACEN",
      firmaResponsable: "",
      fecha: "",
      completado: false,
      calidad: {
        matCompleto: "", // "completo" | "incompleto" | ""
        numVale: "",
        hojaSalida: "",
      },
    },
    {
      id: 5,
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
      id: 6,
      aspecto: "TECNICO INSTALADOR",
      firmaResponsable: "",
      fecha: "",
      completado: false,
      calidad: {
        comentarios: "", // Comentarios desde app móvil (readonly)
        evidencias: [], // Array de URLs de fotos de evidencias
      },
    },
    {
      id: 7,
      aspecto: "SOPORTE TECNICO",
      firmaResponsable: "",
      fecha: "",
      completado: false,
      calidad: {
        tareas: [], // Array de tareas de soporte
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
      calidad: {
        estadoPago: "", // "pagado" | "pagos_parciales" | "pendiente"
        fechaPago: "", // Fecha si está pagado completamente
        fechasPagosParciales: [], // Array de objetos {fecha, monto} si hay pagos parciales
        folioFactura: "", // Solo si está pagado
        subtotal: "", // Monto subtotal
        iva: "", // Monto IVA
        total: "", // Monto total
      },
    },
  ];

  let progress = 0;

  // Calcular progreso
  $: progress = Math.round(
    (checklistData.filter((item) => item.completado).length /
      checklistData.length) *
      100
  );
  $: checklistId = currentChecklist?.id ?? null;
  $: folio = currentChecklist?.folio ?? null;
  $: steps = detail?.steps ?? []; // [{ stepKey, status, data }]
  $: editableStepKeys = detail?.editableStepKeys ?? [];
  $: stats = detail?.stats ?? { totalSteps: 0, done: 0, myPending: 0 };

  // Mapea el texto visible al stepKey esperado por el backend
  function aspectoToStepKey(item) {
    switch (item.aspecto) {
      case "GENERAR ORDEN DE COMPRA":
        return "GENERAR_OC";
      case "COORDINACION DE SERVICIOS":
        return "COORDINACION";
      case "PROGRAMADORES":
        return "PROGRAMADORES";
      case "ALMACEN":
        return "ALMACEN";
      case "CALIDAD":
        return item.id === 5 ? "CALIDAD_1" : "CALIDAD_2";
      case "TECNICO INSTALADOR":
        return "TECNICO";
      case "SOPORTE TECNICO":
        return "SOPORTE";
      case "SALIDA DE MATERIAL (INSTALACION DE STOCK)":
        return "SALIDA_MATERIAL";
      case "FACTURACION":
        return "FACTURACION";
      default:
        return null;
    }
  }

  const canEditStep = (item) => {
    const stepKey = aspectoToStepKey(item);
    // Verificar primero en editableStepKeys del backend
    if (stepKey && editableStepKeys.includes(stepKey)) return true;
    
    // Si no está en editableStepKeys, verificar permisos del rol como respaldo
    // Esto es útil cuando el backend aún no ha actualizado los permisos
    if (stepKey && $auth?.me?.role) {
      const roleKey = normalizeRoleKey($auth.me.role);
      const role = roles[roleKey];
      if (role && role.permissions && role.permissions.includes(item.aspecto)) {
        return true;
      }
    }
    
    return false;
  };

  async function persistStep(item, { warn = false } = {}) {
    if (!checklistId) return;
    const stepKey = aspectoToStepKey(item);
    if (!stepKey) return;
    if (!editableStepKeys.includes(stepKey)) return; // no intentes guardar pasos fuera del rol

    // Prevenir guardados duplicados
    if (savingSteps.has(item.id)) {
      console.log(`Paso ${item.id} ya se está guardando, omitiendo...`);
      return;
    }
    
    // Actualizar array reactivo
    savingStepsArray = Array.from(savingSteps);

    // Validaciones mínimas para GENERAR_OC que exige backend
    if (stepKey === "GENERAR_OC") {
      const firma = (item.firmaResponsable || "").trim();
      const fecha = item.fecha || "";
      const folio = (item.calidad?.folio || "").trim();
      if (!firma || !fecha || !folio) {
        if (warn) {
          console.warn("Faltan firma, fecha o folio para generar orden de compra.", {
            firma,
            fecha,
            folio,
          });
        }
        return; // no alert, evita bloqueo ni spam
      }
    }

    // Verificar si el paso está completo antes de guardar
    checkStepCompletion(item);

    // Excluir datosCte del payload ya que es solo para mostrar (viene del cliente seleccionado)
    const calidadData = { ...(item.calidad || {}) };
    delete calidadData.datosCte;
    
    const payload = {
      status: item.completado ? "done" : "in_progress",
      data: {
        firmaResponsable: item.firmaResponsable,
        fecha: item.fecha,
        ...calidadData,
      },
    };
    
    // Marcar como guardando
    savingSteps.add(item.id);
    savingStepsArray = Array.from(savingSteps);
    
    try {
      await updateChecklistStep(checklistId, stepKey, payload);
      // Recargar detalles del backend para sincronizar
      detail = await getChecklistDetail(checklistId);
      
      // Actualizar el estado local basado en la respuesta del backend
      if (detail?.steps) {
        const step = detail.steps.find((s) => s.stepKey === stepKey);
        if (step) {
          const updatedItem = checklistData.find((it) => it.id === item.id);
          if (updatedItem) {
            updatedItem.completado = step.status === "done";
            // Forzar reactividad
            checklistData = [...checklistData];
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert(err?.message || "No se pudo guardar el paso");
      // Remover del set de guardando inmediatamente en caso de error
      savingSteps.delete(item.id);
      savingStepsArray = Array.from(savingSteps);
    }
    // Nota: No removemos de savingSteps aquí en el finally para que el botón
    // permanezca bloqueado hasta después del alert de éxito en handleSaveStep
  }

  // Actualizar datos del cliente
  function updateClientData(field, value) {
    clientData[field] = value;
  }

  // Actualizar checklist
  async function updateChecklistItem(event) {
    const { id, field, value } = event.detail || {};
    const item = checklistData.find((it) => it.id === id);
    if (item) {
      if (field.includes(".")) {
        const [parent, child] = field.split(".");
        item[parent][child] = value;
      } else {
        item[field] = value;
      }

      // Si es COORDINACION DE SERVICIOS, PROGRAMADORES, ALMACEN, CALIDAD, TECNICO INSTALADOR, SOPORTE TECNICO o SALIDA DE MATERIAL y se actualiza la fecha, asegurar que tenga firma
      if ((item.aspecto === "COORDINACION DE SERVICIOS" || item.aspecto === "PROGRAMADORES" || item.aspecto === "ALMACEN" || (item.aspecto === "CALIDAD" && (item.id === 5 || item.id === 8)) || item.aspecto === "TECNICO INSTALADOR" || item.aspecto === "SOPORTE TECNICO" || item.aspecto === "SALIDA DE MATERIAL (INSTALACION DE STOCK)") && field === "fecha" && !item.firmaResponsable && $auth?.me?.username) {
        item.firmaResponsable = $auth.me.username;
      }

      checkStepCompletion(item);
      // fuerza reactividad para progress/tabla
      checklistData = [...checklistData];
      
      // NO guardar automáticamente para ALMACEN, CALIDAD (id 5 y id 8), TECNICO INSTALADOR, SOPORTE TECNICO, SALIDA DE MATERIAL y FACTURACION
      // Estos solo se guardan cuando se presiona el botón de guardar
      const shouldAutoSave = canEditStep(item) && 
                             item.aspecto !== "ALMACEN" && 
                             !(item.aspecto === "CALIDAD" && (item.id === 5 || item.id === 8)) &&
                             item.aspecto !== "TECNICO INSTALADOR" &&
                             item.aspecto !== "SOPORTE TECNICO" &&
                             item.aspecto !== "SALIDA DE MATERIAL (INSTALACION DE STOCK)" &&
                             item.aspecto !== "FACTURACION";
      
      if (shouldAutoSave) {
        await persistStep(item, { warn: false });
      }
    }
  }

  // Verificar si un paso está completado
  function checkStepCompletion(item) {
    const hasSignature = item.firmaResponsable.trim() !== "";
    const hasDate = item.fecha !== "";
    
    // Validar campos de calidad según el tipo de paso
    let hasCalidadData = false;
    const calidad = item.calidad || {};
    
    if (item.aspecto === "GENERAR ORDEN DE COMPRA") {
      // Requiere folio y al menos algunos campos de calidad
      hasCalidadData = (calidad.folio || "").trim() !== "";
    } else if (item.aspecto === "COORDINACION DE SERVICIOS") {
      // Requiere estado de validación y número de programación
      hasCalidadData = (calidad.estadoValidacion || "").trim() !== "" && 
                       (calidad.numProgServ || "").trim() !== "";
      // Si está rechazado, también requiere motivo
      if (calidad.estadoValidacion === "rechazado") {
        hasCalidadData = hasCalidadData && (calidad.motivoRechazo || "").trim() !== "";
      }
    } else if (item.aspecto === "PROGRAMADORES") {
      // Requiere IDs y estado
      hasCalidadData = (calidad.ids || "").trim() !== "" && 
                       (calidad.estadoValidacion || "").trim() !== "";
      // Si está inválido, también requiere comentarios
      if (calidad.estadoValidacion === "invalido") {
        hasCalidadData = hasCalidadData && (calidad.comentarios || "").trim() !== "";
      }
    } else if (item.aspecto === "ALMACEN") {
      // Requiere estado de material completo, número de vale y hoja de salida
      hasCalidadData = (calidad.matCompleto || "").trim() !== "" && 
                       (calidad.numVale || "").trim() !== "" &&
                       (calidad.hojaSalida || "").trim() !== "";
    } else if (item.aspecto === "TECNICO INSTALADOR") {
      // Requiere fecha de instalación (los comentarios y evidencias vienen de la app móvil)
      hasCalidadData = true; // Solo requiere fecha y firma, los demás datos vienen de la app móvil
    } else if (item.aspecto === "SOPORTE TECNICO") {
      // Requiere al menos una tarea de soporte
      hasCalidadData = Array.isArray(calidad.tareas) && calidad.tareas.length > 0;
    } else if (item.aspecto === "CALIDAD" && (item.id === 5 || item.id === 8)) {
      // Requiere estado de validación y observaciones (para ambas instancias de CALIDAD)
      hasCalidadData = (calidad.estadoValidacion || "").trim() !== "" && 
                       (calidad.observaciones || "").trim() !== "";
      // Si está inválido, también requiere comentarios
      if (calidad.estadoValidacion === "invalido") {
        hasCalidadData = hasCalidadData && (calidad.comentarios || "").trim() !== "";
      }
    } else if (item.aspecto === "SALIDA DE MATERIAL (INSTALACION DE STOCK)") {
      // Requiere fecha, firma y número de hoja de salida
      hasCalidadData = (item.fecha || "").trim() !== "" && 
                       (item.firmaResponsable || "").trim() !== "" &&
                       (calidad.hojaSalida || "").trim() !== "";
    } else if (item.aspecto === "FACTURACION") {
      // Requiere estado de pago y montos (IVA se calcula automáticamente)
      hasCalidadData = (calidad.estadoPago || "").trim() !== "" &&
                       (calidad.subtotal || "").trim() !== "" &&
                       parseFloat(calidad.subtotal || 0) > 0;
      // Si está pagado, requiere fecha de pago y folio
      if (calidad.estadoPago === "pagado") {
        hasCalidadData = hasCalidadData && 
                         (calidad.fechaPago || "").trim() !== "" &&
                         (calidad.folioFactura || "").trim() !== "";
      }
      // Si está en pagos parciales, requiere al menos un pago con fecha y monto
      if (calidad.estadoPago === "pagos_parciales") {
        hasCalidadData = hasCalidadData && 
                         Array.isArray(calidad.fechasPagosParciales) &&
                         calidad.fechasPagosParciales.length > 0 &&
                         calidad.fechasPagosParciales.some(p => {
                           if (typeof p === 'object') {
                             return (p.fecha && p.fecha.trim() !== '') && (p.monto && parseFloat(p.monto) > 0);
                           }
                           return p && p.trim() !== "";
                         });
      }
    } else {
      // Para otros pasos, verificar que haya algún dato en calidad
      hasCalidadData = Object.values(calidad).some((val) =>
        typeof val === "boolean" ? val : typeof val === "string" && val.trim() !== ""
      );
    }

    // Marcar como completado si tiene todos los campos requeridos
    item.completado = hasSignature && hasDate && hasCalidadData;
  }

  // Marcar paso como completado
  async function toggleStepCompletion(event) {
    const { id } = event.detail || {};
    const item = checklistData.find((it) => it.id === id);
    if (item) {
      item.completado = !item.completado;
      if (item.completado && !item.fecha) {
        item.fecha = new Date().toISOString().split("T")[0];
      }
      checklistData = [...checklistData];
      if (canEditStep(item)) {
        await persistStep(item, { warn: false });
      }
    }
  }

  // Guardar paso específico (desde botón de guardar)
  async function handleSaveStep(event) {
    const { id } = event.detail || {};
    const item = checklistData.find((it) => it.id === id);
    if (item && canEditStep(item)) {
      // Si es COORDINACION DE SERVICIOS, asegurar que tenga fecha y firma
      if (item.aspecto === "COORDINACION DE SERVICIOS") {
        if (!item.fecha) {
          item.fecha = new Date().toISOString().split("T")[0];
        }
        if (!item.firmaResponsable && $auth?.me?.username) {
          item.firmaResponsable = $auth.me.username;
        }
        // Validar que tenga estado de validación
        if (!item.calidad?.estadoValidacion) {
          alert("Por favor seleccione un estado (Validado o Rechazado)");
          return;
        }
        // Si está rechazado, validar que tenga motivo
        if (item.calidad.estadoValidacion === "rechazado" && !item.calidad.motivoRechazo?.trim()) {
          alert("Por favor especifique el motivo de rechazo");
          return;
        }
      }
      
      // Si es PROGRAMADORES, asegurar que tenga fecha y firma
      if (item.aspecto === "PROGRAMADORES") {
        if (!item.fecha) {
          item.fecha = new Date().toISOString().split("T")[0];
        }
        if (!item.firmaResponsable && $auth?.me?.username) {
          item.firmaResponsable = $auth.me.username;
        }
        // Validar que tenga IDs
        if (!item.calidad?.ids?.trim()) {
          alert("Por favor ingrese los IDs de los dispositivos");
          return;
        }
        // Validar que tenga estado de validación
        if (!item.calidad?.estadoValidacion) {
          alert("Por favor seleccione un estado (Válido o Inválido)");
          return;
        }
        // Si está inválido, validar que tenga comentarios
        if (item.calidad.estadoValidacion === "invalido" && !item.calidad.comentarios?.trim()) {
          alert("Por favor especifique los comentarios del motivo de invalidez");
          return;
        }
      }
      
      // Si es ALMACEN, asegurar que tenga fecha y firma
      if (item.aspecto === "ALMACEN") {
        if (!item.fecha) {
          item.fecha = new Date().toISOString().split("T")[0];
        }
        if (!item.firmaResponsable && $auth?.me?.username) {
          item.firmaResponsable = $auth.me.username;
        }
        // Validar que tenga estado de material completo
        if (!item.calidad?.matCompleto) {
          alert("Por favor seleccione el estado del material (Completo o Incompleto)");
          return;
        }
        // Validar que tenga número de vale
        if (!item.calidad?.numVale?.trim()) {
          alert("Por favor ingrese el número de vale");
          return;
        }
        // Validar que tenga número de hoja de salida
        if (!item.calidad?.hojaSalida?.trim()) {
          alert("Por favor ingrese el número de hoja de salida");
          return;
        }
      }
      
      // Si es CALIDAD (primera o segunda instancia - id 5 o id 8), asegurar que tenga fecha y firma
      if (item.aspecto === "CALIDAD" && (item.id === 5 || item.id === 8)) {
        if (!item.fecha) {
          item.fecha = new Date().toISOString().split("T")[0];
        }
        if (!item.firmaResponsable && $auth?.me?.username) {
          item.firmaResponsable = $auth.me.username;
        }
        // Validar que tenga estado de validación
        if (!item.calidad?.estadoValidacion) {
          alert("Por favor seleccione un estado (Válido o Inválido)");
          return;
        }
        // Validar que tenga observaciones
        if (!item.calidad?.observaciones?.trim()) {
          alert("Por favor ingrese las observaciones");
          return;
        }
        // Si está inválido, validar que tenga comentarios
        if (item.calidad.estadoValidacion === "invalido" && !item.calidad.comentarios?.trim()) {
          alert("Por favor especifique los comentarios del motivo de invalidez");
          return;
        }
      }
      
      // Si es TECNICO INSTALADOR, asegurar que tenga fecha y firma
      if (item.aspecto === "TECNICO INSTALADOR") {
        if (!item.fecha) {
          alert("Por favor seleccione la fecha de instalación");
          return;
        }
        if (!item.firmaResponsable && $auth?.me?.username) {
          item.firmaResponsable = $auth.me.username;
        }
        // Los comentarios y evidencias vienen de la app móvil, no se validan aquí
      }

      // Si es SOPORTE TECNICO, asegurar que tenga fecha, firma y al menos una tarea
      if (item.aspecto === "SOPORTE TECNICO") {
        if (!item.fecha) {
          alert("Por favor seleccione la fecha");
          return;
        }
        if (!item.firmaResponsable && $auth?.me?.username) {
          item.firmaResponsable = $auth.me.username;
        }
        if (!item.calidad?.tareas || item.calidad.tareas.length === 0) {
          alert("Por favor agregue al menos una tarea de soporte");
          return;
        }
      }

      // Si es SALIDA DE MATERIAL, asegurar que tenga fecha, firma y número de hoja de salida
      if (item.aspecto === "SALIDA DE MATERIAL (INSTALACION DE STOCK)") {
        if (!item.fecha) {
          alert("Por favor seleccione la fecha");
          return;
        }
        if (!item.firmaResponsable && $auth?.me?.username) {
          item.firmaResponsable = $auth.me.username;
        }
        if (!item.calidad?.hojaSalida?.trim()) {
          alert("Por favor ingrese el número de hoja de salida");
          return;
        }
      }

      // Si es FACTURACION, validar campos según el estado de pago
      if (item.aspecto === "FACTURACION") {
        if (!item.calidad?.estadoPago) {
          alert("Por favor seleccione el estado de pago");
          return;
        }
        if (!item.calidad?.subtotal || parseFloat(item.calidad.subtotal) <= 0) {
          alert("Por favor ingrese el subtotal");
          return;
        }
        // Calcular IVA automáticamente si no está calculado
        if (!item.calidad.iva || parseFloat(item.calidad.iva) === 0) {
          const subtotal = parseFloat(item.calidad.subtotal || 0);
          const iva = subtotal * 0.16;
          item.calidad.iva = iva.toFixed(2);
          const total = subtotal + iva;
          item.calidad.total = total.toFixed(2);
        }
        if (item.calidad.estadoPago === "pagado") {
          if (!item.calidad?.fechaPago?.trim()) {
            alert("Por favor seleccione la fecha de pago");
            return;
          }
          if (!item.calidad?.folioFactura?.trim()) {
            alert("Por favor ingrese el folio de factura");
            return;
          }
        }
        if (item.calidad.estadoPago === "pagos_parciales") {
          if (!item.calidad?.fechasPagosParciales || 
              !Array.isArray(item.calidad.fechasPagosParciales) ||
              item.calidad.fechasPagosParciales.length === 0 ||
              !item.calidad.fechasPagosParciales.some(p => {
                if (typeof p === 'object') {
                  return (p.fecha && p.fecha.trim() !== '') && (p.monto && parseFloat(p.monto) > 0);
                }
                return p && p.trim() !== "";
              })) {
            alert("Por favor agregue al menos un pago parcial con fecha y monto");
            return;
          }
        }
      }
      
      // Verificar completitud antes de guardar
      checkStepCompletion(item);
      // Forzar reactividad para actualizar progreso
      checklistData = [...checklistData];
      
      await persistStep(item, { warn: true });
      
      // Verificar completitud después de guardar (por si cambió algo)
      checkStepCompletion(item);
      checklistData = [...checklistData];
      
      // Mostrar confirmación visual según la sección
      const messages = {
        "GENERAR ORDEN DE COMPRA": "Orden de compra guardada exitosamente",
        "COORDINACION DE SERVICIOS": "Coordinación de servicios guardada exitosamente",
        "PROGRAMADORES": "Programación guardada exitosamente",
        "ALMACEN": "Almacén guardado exitosamente",
        "CALIDAD": "Calidad guardada exitosamente",
        "TECNICO INSTALADOR": "Instalación guardada exitosamente",
        "SOPORTE TECNICO": "Soporte técnico guardado exitosamente",
        "SALIDA DE MATERIAL (INSTALACION DE STOCK)": "Salida de material guardada exitosamente",
        "FACTURACION": "Facturación guardada exitosamente"
      };
      alert(messages[item.aspecto] || "Datos guardados exitosamente");
      
      // Remover del set de guardando después del alert para desbloquear el botón
      // Esto previene guardados duplicados al mantener el botón bloqueado durante el proceso completo
      savingSteps.delete(item.id);
      savingStepsArray = Array.from(savingSteps);
    }
  }

  // Cargar datos de ejemplo
  function loadSampleData() {
    if (confirm("¿Cargar datos de ejemplo? Esto reemplazará los datos actuales.")) {
      clientData = { ...sampleClientData };
      checklistData = JSON.parse(JSON.stringify(sampleChecklistData));
    }
  }

  // Guardar/exportar
  function saveChecklist() {
    // Si hay checklist activo, persistir cada paso en backend
    if (checklistId) {
      checklistData.forEach((it) => {
        if (canEditStep(it)) persistStep(it, { warn: true });
      });
    }

    const data = {
      clientData,
      checklistData,
      progress,
      timestamp: new Date().toISOString(),
    };

    console.log("Datos del checklist:", data);
    alert(`Checklist guardado exitosamente. Progreso: ${progress}%`);
  }

  // Limpiar formulario
  function clearForm() {
    if (confirm("¿Estás seguro de que quieres limpiar todo el formulario?")) {
      clientData = {
        cliente: "",
        fecha: new Date().toISOString().split("T")[0],
      };

      checklistData = checklistData.map((item) => ({
        ...item,
        firmaResponsable: "",
        fecha: "",
        completado: false,
        calidad: Object.keys(item.calidad).reduce((acc, key) => {
          acc[key] = typeof item.calidad[key] === "boolean" ? false : "";
          return acc;
        }, {}),
      }));

    }
  }

  async function onSelectChecklist(e) {
    currentChecklist = e.detail; // puede ser null
    // Guardar cliente seleccionado (puede venir con el checklist o estar disponible)
    if (e.detail?.client) {
      selectedClient = e.detail.client;
    }
    if (!currentChecklist?.id) {
      detail = null;
      return;
    }
    loadingDetail = true;
    try {
      detail = await getChecklistDetail(currentChecklist.id);
      if (detail?.steps) {
        checklistData = checklistData.map((item) => {
          const key = aspectoToStepKey(item);
          const step = detail.steps.find((s) => s.stepKey === key);
          if (!step) return item;
          const data = step.data || {};
          return {
            ...item,
            firmaResponsable: data.firmaResponsable ?? item.firmaResponsable ?? "",
            fecha: data.fecha ?? item.fecha ?? "",
            completado: step.status === "done" ? true : item.completado,
            calidad: { ...item.calidad, ...data },
          };
        });
      }
    } catch (err) {
      console.error(err);
      detail = null;
    } finally {
      loadingDetail = false;
    }
  }
</script>

<div class="checklist-container">
  <div class="container">
    <div class="main-title">
      <h2>PLATAFORMA AVANZADA DE SEGURIDAD Y GESTION DE FLOTAS</h2>
      <h1>
        Tenemos una <span class="highlight">solución</span> para cada
        <span class="highlight">problemática del transporte</span>
      </h1>
    </div>

    <RoleSelector />

    <ChecklistHeader 
      on:selectChecklist={onSelectChecklist}
      on:selectClient={(e) => selectedClient = e.detail}
    />

    <ProcessStats {checklistData} {clientData} />

    <div class="progress-section">
      <div class="progress-info">
        <span>Progreso del proceso: {progress}%</span>
        <span
          >{checklistData.filter((item) => item.completado).length} de {checklistData.length}
          pasos completados</span
        >
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: {progress}%"></div>
      </div>
    </div>

    <ChecklistTable
      {checklistId}
      {folio}
      {steps}
      {editableStepKeys}
      {stats}
      {loadingDetail}
      {checklistData}
      {selectedClient}
      savingSteps={savingStepsArray}
      on:update={updateChecklistItem}
      on:toggle={toggleStepCompletion}
      on:saveStep={handleSaveStep}
    />


    <div class="actions">
      <button class="btn btn-outline" on:click={loadSampleData}>
        Cargar ejemplo
      </button>
      <button class="btn btn-outline" on:click={clearForm}>
        Limpiar formulario
      </button>
      <button class="btn btn-outline" on:click={() => window.print()}>
        Imprimir checklist
      </button>
      <button class="btn btn-primary" on:click={saveChecklist}>
        Guardar checklist
      </button>
    </div>
  </div>
</div>

<style>
  .checklist-container {
    padding: 40px 0;
    background-color: var(--white);
  }

  .main-title {
    text-align: center;
    margin-bottom: 30px;
  }

  .main-title h2 {
    color: var(--light-grey);
    font-size: 18px;
    font-weight: 400;
    margin-bottom: 10px;
  }

  .main-title h1 {
    color: var(--primary-blue);
    font-size: 32px;
    font-weight: bold;
    line-height: 1.2;
  }

  .highlight {
    color: var(--accent-yellow);
  }

  .progress-section {
    margin-bottom: 30px;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid var(--border-grey);
  }

  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-weight: 500;
    color: var(--primary-blue);
  }

  .progress-bar {
    width: 100%;
    height: 20px;
    background-color: var(--border-grey);
    border-radius: 10px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-yellow), var(--primary-blue));
    transition: width 0.3s ease;
  }

  .comments-section {
    margin: 30px 0;
  }


  .actions {
    display: flex;
    gap: 20px;
    justify-content: center;
    margin-top: 40px;
    flex-wrap: wrap;
  }

  @media (max-width: 768px) {
    .main-title h1 {
      font-size: 24px;
    }

    .progress-info {
      flex-direction: column;
      gap: 5px;
    }

    .actions {
      flex-direction: column;
      align-items: center;
    }
  }
</style>
