<script>
  import { createEventDispatcher } from "svelte";
  import { auth } from "../stores/auth.js";
  import { getRoleColorByName, normalizeRoleKey, roles } from "../stores/roleStore.js";

  // ===== Props del padre =====
  export let checklistData = [];           // Estructura visual que se renderiza siempre
  export let editableStepKeys = [];        // StepKeys reales desde backend (p.ej. ["ALMACEN","TECNICO"])
  export let checklistId = null;           // null => sin orden seleccionada
  export let folio = null;
  export let steps = [];                   // [{ stepKey, status, data }] (aun no mapeado a campos visuales)
  export let stats = { totalSteps: 0, done: 0, myPending: 0 };
  export let loadingDetail = false;        // Para bloquear inputs durante carga
  export let selectedClient = null;       // Cliente seleccionado del buscador
  export let savingSteps = [];            // IDs de pasos que se están guardando actualmente

  const dispatch = createEventDispatcher();

  // ===== Estado del modal de evidencias =====
  let showEvidenciasModal = false;
  let evidenciasData = [];

  function openEvidenciasModal(evidencias) {
    // Si es un array, usarlo directamente
    // Si es un string (URL única), convertirlo a array
    // Si es un objeto, intentar extraer el array de evidencias
    if (Array.isArray(evidencias)) {
      evidenciasData = evidencias;
    } else if (typeof evidencias === 'string' && evidencias.trim() !== '') {
      // Si es una URL única, convertirla a array
      evidenciasData = [{ url: evidencias, label: 'Evidencia' }];
    } else if (evidencias && typeof evidencias === 'object') {
      // Si es un objeto, intentar extraer el array
      evidenciasData = evidencias.evidencias || evidencias.urls || [evidencias];
    } else {
      evidenciasData = [];
    }
    showEvidenciasModal = true;
  }

  function closeEvidenciasModal() {
    showEvidenciasModal = false;
    evidenciasData = [];
  }

  // ===== Estado del modal de tareas de soporte =====
  let showTareaModal = false;
  let currentTarea = null;
  let tareaForm = {
    comentarios: "",
    procesada: false,
    pruebas: false,
    pruebasRealizadas: "",
    notificacionCliente: {
      email: false,
      whatsapp: false,
      llamada: false,
      enPersona: false
    }
  };

  function openTareaModal(tarea = null) {
    if (tarea) {
      // Editar tarea existente
      currentTarea = tarea;
      tareaForm = {
        comentarios: tarea.comentarios || "",
        procesada: tarea.procesada || false,
        pruebas: tarea.pruebas || false,
        pruebasRealizadas: tarea.pruebasRealizadas || "",
        notificacionCliente: {
          email: tarea.notificacionCliente?.email || false,
          whatsapp: tarea.notificacionCliente?.whatsapp || false,
          llamada: tarea.notificacionCliente?.llamada || false,
          enPersona: tarea.notificacionCliente?.enPersona || false
        }
      };
    } else {
      // Nueva tarea
      currentTarea = null;
      tareaForm = {
        comentarios: "",
        procesada: false,
        pruebas: false,
        pruebasRealizadas: "",
        notificacionCliente: {
          email: false,
          whatsapp: false,
          llamada: false,
          enPersona: false
        }
      };
    }
    showTareaModal = true;
  }

  function closeTareaModal() {
    showTareaModal = false;
    currentTarea = null;
    tareaForm = {
      comentarios: "",
      procesada: false,
      pruebas: false,
      pruebasRealizadas: "",
      notificacionCliente: {
        email: false,
        whatsapp: false,
        llamada: false,
        enPersona: false
      }
    };
  }

  function saveTarea(item) {
    if (!tareaForm.comentarios.trim()) {
      alert("Por favor ingrese los comentarios de la tarea");
      return;
    }

    const tarea = {
      id: currentTarea?.id || Date.now(),
      comentarios: tareaForm.comentarios.trim(),
      procesada: tareaForm.procesada,
      pruebas: tareaForm.pruebas,
      pruebasRealizadas: tareaForm.pruebas ? tareaForm.pruebasRealizadas.trim() : "",
      notificacionCliente: { ...tareaForm.notificacionCliente },
      fechaCreacion: currentTarea?.fechaCreacion || new Date().toISOString(),
      fechaActualizacion: new Date().toISOString()
    };

    if (!item.calidad.tareas) {
      item.calidad.tareas = [];
    }

    if (currentTarea) {
      // Actualizar tarea existente
      const index = item.calidad.tareas.findIndex(t => t.id === currentTarea.id);
      if (index >= 0) {
        item.calidad.tareas[index] = tarea;
      }
    } else {
      // Agregar nueva tarea
      item.calidad.tareas.push(tarea);
    }

    // Forzar reactividad
    item.calidad = { ...item.calidad };
    // Actualizar el estado local, pero no guardar automáticamente
    // El guardado se hará cuando se presione el botón "Guardar Soporte"
    handleUpdate(item.id, "calidad.tareas", item.calidad.tareas);
    
    closeTareaModal();
  }

  // ===== Usuario/rol actual =====
  $: me = $auth?.me || null;
  $: roleName = me?.role || "";           // "Administrador", "Almacen", ...
  $: roleKey = normalizeRoleKey(roleName); // ADMIN, ALMACEN, ...
  $: isAdmin = roleKey === "ADMIN";
  $: roleColor = getRoleColorByName(roleName);

  // ===== Derivados de stats/steps para mostrarlos y evitar warnings =====
  $: serverTotal = stats?.totalSteps ?? 0;
  $: serverDone = stats?.done ?? 0;
  $: serverMyPending = stats?.myPending ?? 0;
  $: hasServerStats = serverTotal || serverDone || serverMyPending;
  $: stepsCount = Array.isArray(steps) ? steps.length : 0;

  // ===== Eventos hacia el padre =====
  function handleUpdate(id, field, value) {
    dispatch("update", { id, field, value });
  }
  function handleToggle(id) {
    dispatch("toggle", { id });
  }
  function handleSaveStep(id) {
    dispatch("saveStep", { id });
  }

  // ===== Mapa de "texto visual" -> StepKey real del backend =====
  function aspectoToStepKey(item) {
    switch (item.aspecto) {
      case "GENERAR ORDEN DE COMPRA": return "GENERAR_OC";
      case "COORDINACION DE SERVICIOS": return "COORDINACION";
      case "PROGRAMADORES": return "PROGRAMADORES";
      case "ALMACEN": return "ALMACEN";
      case "CALIDAD":
        // Dos filas de CALIDAD: id 5 -> CALIDAD_1, id 8 -> CALIDAD_2 (segun semilla local)
        return item.id === 5 ? "CALIDAD_1" : "CALIDAD_2";
      case "TECNICO INSTALADOR": return "TECNICO";
      case "SOPORTE TECNICO": return "SOPORTE";
      case "SALIDA DE MATERIAL (INSTALACION DE STOCK)": return "SALIDA_MATERIAL";
      case "FACTURACION": return "FACTURACION";
      default: return null;
    }
  }

  // ===== Permiso real por fila =====
  const canEditItem = (item) => {
    if (isAdmin) return true;
    const k = aspectoToStepKey(item);
    const step = steps.find((s) => s.stepKey === k);
    if (step?.status === "done") return false;
    
    // Verificar primero en editableStepKeys del backend
    if (k && editableStepKeys.includes(k)) return true;
    
    // Si no está en editableStepKeys, verificar permisos del rol como respaldo
    // Esto es útil cuando el backend aún no ha actualizado los permisos
    if (k && me?.role) {
      const roleKey = normalizeRoleKey(me.role);
      const role = roles[roleKey];
      if (role && role.permissions && role.permissions.includes(item.aspecto)) {
        return true;
      }
    }
    
    return false;
  };

  // ===== Campos de "Calidad" por aspecto (layout actual) =====
  function getCalidadFields(aspecto) {
    switch (aspecto) {
      case "GENERAR ORDEN DE COMPRA":
        // Campos organizados en dos columnas según la imagen
        return [
          // Columna izquierda
          { key: "datosCte", label: "DATOS CTE", type: "clientData", column: "left" }, // Campo especial para mostrar datos del cliente
          { key: "comodato", label: "COMODATO", type: "checkbox", column: "left" },
          { key: "cortesia", label: "CORTESIA", type: "checkbox", column: "left" },
          { key: "precioRenta", label: "PRECIO RENTA", type: "currency", column: "left" }, // Campo de moneda
          // Columna derecha
          { key: "checklist", label: "CHECKLIST", type: "checkbox", column: "right" },
          { key: "seguimiento", label: "SEGUIMIENTO", type: "checkbox", column: "right" },
          { key: "garantia", label: "GARANTIA", type: "checkbox", column: "right" },
          { key: "demo", label: "DEMO", type: "checkbox", column: "right" },
          { key: "folio", label: "FOLIO", type: "text", column: "right" }
        ];
      case "COORDINACION DE SERVICIOS":
        return [
          { key: "estadoValidacion", label: "ESTADO", type: "select", options: [
            { value: "", label: "Seleccione..." },
            { value: "validado", label: "VALIDADO" },
            { value: "rechazado", label: "RECHAZADO" }
          ]},
          { key: "numProgServ", label: "# DE PROG. SERV", type: "text" },
          { key: "motivoRechazo", label: "MOTIVO DE RECHAZO", type: "textarea" }
        ];
      case "PROGRAMADORES":
        return [
          { key: "ids", label: "ID'S", type: "textarea", placeholder: "Ingrese los IDs de los dispositivos (uno por línea)" },
          { key: "estadoValidacion", label: "ESTADO", type: "select", options: [
            { value: "", label: "Seleccione..." },
            { value: "valido", label: "VÁLIDO" },
            { value: "invalido", label: "INVÁLIDO" }
          ]},
          { key: "comentarios", label: "COMENTARIOS", type: "textarea" }
        ];
      case "ALMACEN":
        return [
          { key: "matCompleto", label: "MAT. COMPLETO", type: "select", options: [
            { value: "", label: "Seleccione..." },
            { value: "completo", label: "COMPLETO" },
            { value: "incompleto", label: "INCOMPLETO" }
          ]},
          { key: "numVale", label: "# DE VALE", type: "text" },
          { key: "hojaSalida", label: "# HOJA SALIDA", type: "text" }
        ];
      case "CALIDAD":
        // Para CALIDAD_1 (id 5) y CALIDAD_2 (id 8) - ambos tienen los mismos campos
        return [
          { key: "estadoValidacion", label: "ESTADO", type: "select", options: [
            { value: "", label: "Seleccione..." },
            { value: "valido", label: "VÁLIDO" },
            { value: "invalido", label: "INVÁLIDO" }
          ]},
          { key: "comentarios", label: "COMENTARIOS", type: "textarea" },
          { key: "observaciones", label: "OBSERVACIONES", type: "textarea" }
        ];
      case "TECNICO INSTALADOR":
        return [
          { key: "comentarios", label: "COMENTARIOS DEL INSTALADOR", type: "readonly" },
          { key: "evidencias", label: "EVIDENCIAS", type: "evidencias" }
        ];
      case "SOPORTE TECNICO":
        // Esta sección maneja tareas, no campos directos
        return [];
      case "SALIDA DE MATERIAL (INSTALACION DE STOCK)":
        return [{ key: "hojaSalida", label: "# HOJA SALIDA", type: "text" }];
      case "FACTURACION":
        // Esta sección maneja campos especiales, no se usan aquí
        return [];
      default:
        return [];
    }
  }
</script>

<div class="checklist-table-container">
  {#if !checklistId}
    <div class="badge">Sin orden seleccionada — modo solo visual</div>
  {:else}
    <div class="badge">Folio activo: <strong>{folio ?? "Sin folio"}</strong></div>
    {#if hasServerStats}
      <div class="badge secondary">
        Progreso servidor: {serverDone}/{serverTotal} | Pendientes asignados: {serverMyPending}
      </div>
    {/if}
    <div class="badge muted">Pasos recibidos: {stepsCount}</div>
  {/if}

  <table class="checklist-table">
    <thead>
      <tr>
        <th>ESTADO</th>
        <th>ASPECTO</th>
        <th>FIRMA RESPONSABLE</th>
        <th>FECHA</th>
        <th>CALIDAD</th>
      </tr>
    </thead>
    <tbody>
      {#each checklistData as item}
        {@const isEditable = canEditItem(item)}

        <tr class="table-row {item.completado ? 'completed' : ''} {!isEditable ? 'readonly' : ''}">
          <td class="status-cell">
            {#if isEditable}
              <button
                class="status-btn {item.completado ? 'completed' : ''}"
                on:click={() => handleToggle(item.id)}
                title={item.completado ? 'Marcar como pendiente' : 'Marcar como completado'}
                disabled={loadingDetail}>
                {#if item.completado} &check; {:else} &times; {/if}
              </button>
            {:else}
              <div class="status-indicator {item.completado ? 'completed' : ''}">
                {#if item.completado} &check; {:else} &times; {/if}
              </div>
            {/if}
          </td>

          <td class="aspecto-cell">
            <strong>{item.aspecto}</strong>
            {#if item.completado}
              <div class="completion-badge">Completado</div>
            {/if}
            {#if !isEditable}
              <div class="role-badge" style="background-color:{roleColor}">Solo lectura</div>
            {/if}
          </td>

          <td class="signature-cell">
            {#if item.aspecto === "SALIDA DE MATERIAL (INSTALACION DE STOCK)" || item.aspecto === "FACTURACION"}
              <!-- Ocultar columna de firma para SALIDA DE MATERIAL y FACTURACION, se muestra en la columna CALIDAD -->
              <div class="readonly-field" style="opacity: 0; height: 0; padding: 0; border: none;"></div>
            {:else if isEditable}
              <input
                type="text"
                value={item.firmaResponsable}
                on:input={(e) => handleUpdate(item.id, "firmaResponsable", e.target.value)}
                placeholder="Firma responsable"
                class={item.firmaResponsable ? 'filled' : ''}
                disabled={loadingDetail} />
            {:else}
              <div class="readonly-field {item.firmaResponsable ? 'filled' : ''}">
                {item.firmaResponsable || 'No asignado'}
              </div>
            {/if}
          </td>

          <td class="date-cell">
            {#if item.aspecto === "SALIDA DE MATERIAL (INSTALACION DE STOCK)" || item.aspecto === "FACTURACION"}
              <!-- Ocultar columna de fecha para SALIDA DE MATERIAL y FACTURACION, se muestra en la columna CALIDAD -->
              <div class="readonly-field" style="opacity: 0; height: 0; padding: 0; border: none;"></div>
            {:else if isEditable}
              <input
                type="date"
                value={item.fecha}
                on:input={(e) => handleUpdate(item.id, "fecha", e.target.value)}
                class={item.fecha ? 'filled' : ''}
                disabled={loadingDetail} />
            {:else}
              <div class="readonly-field {item.fecha ? 'filled' : ''}">
                {item.fecha ? new Date(item.fecha).toLocaleDateString('es-ES') : 'No asignada'}
              </div>
            {/if}
          </td>

          <td class="calidad-cell">
            {#if item.aspecto === "GENERAR ORDEN DE COMPRA"}
              <!-- Layout de dos columnas para GENERAR ORDEN DE COMPRA -->
              <div class="calidad-fields two-columns">
                <div class="calidad-column">
                  {#each getCalidadFields(item.aspecto).filter(f => f.column === "left") as field, idx}
                    {@const controlId = `cal-${item.id}-${field.key}-${idx}`}
                    <div class="calidad-field">
                      <label for={controlId}>{field.label}</label>
                      {#if field.type === 'clientData'}
                        <!-- Campo de solo lectura con datos del cliente -->
                        <div class="readonly-field client-data-field">
                          {#if selectedClient}
                            <div class="client-info">
                              <div><strong>{selectedClient.name || 'Sin nombre'}</strong></div>
                              {#if selectedClient.email}
                                <div class="client-detail">Email: {selectedClient.email}</div>
                              {/if}
                              {#if selectedClient.phone}
                                <div class="client-detail">Tel: {selectedClient.phone}</div>
                              {/if}
                              {#if selectedClient.address}
                                <div class="client-detail">Dirección: {selectedClient.address}</div>
                              {/if}
                            </div>
                          {:else}
                            <div class="client-info">No hay cliente seleccionado</div>
                          {/if}
                        </div>
                      {:else if field.type === 'currency'}
                        <!-- Campo de moneda editable -->
                        {#if isEditable}
                          <div class="currency-input-wrapper">
                            <span class="currency-symbol">$</span>
                            <input
                              id={controlId}
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.calidad[field.key] || ''}
                              on:input={(e) => {
                                const value = e.target.value;
                                handleUpdate(item.id, `calidad.${field.key}`, value);
                              }}
                              placeholder="0.00"
                              class="currency-input {item.calidad[field.key] ? 'filled' : ''}"
                              disabled={loadingDetail} />
                          </div>
                        {:else}
                          <div class="readonly-field {item.calidad[field.key] ? 'filled' : ''}">
                            ${item.calidad[field.key] ? parseFloat(item.calidad[field.key]).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                          </div>
                        {/if}
                      {:else if field.type === 'checkbox'}
                        {#if isEditable}
                          <input
                            id={controlId}
                            type="checkbox"
                            checked={item.calidad[field.key]}
                            on:change={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.checked)}
                            class="calidad-checkbox"
                            disabled={loadingDetail} />
                        {:else}
                          <input
                            id={controlId}
                            type="checkbox"
                            checked={item.calidad[field.key]}
                            disabled
                            class="calidad-checkbox readonly" />
                        {/if}
                      {:else if field.type === 'text'}
                        {#if isEditable}
                          <input
                            id={controlId}
                            type="text"
                            value={item.calidad[field.key] || ''}
                            on:input={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.value)}
                            placeholder={field.label}
                            class={item.calidad[field.key] ? 'filled' : ''}
                            disabled={loadingDetail} />
                        {:else}
                          <div class="readonly-field {item.calidad[field.key] ? 'filled' : ''}">
                            {item.calidad[field.key] || 'No especificado'}
                          </div>
                        {/if}
                      {/if}
                    </div>
                  {/each}
                </div>
                <div class="calidad-column">
                  {#each getCalidadFields(item.aspecto).filter(f => f.column === "right") as field, idx}
                    {@const controlId = `cal-${item.id}-${field.key}-${idx}`}
                    <div class="calidad-field">
                      {#if isEditable}
                        <label for={controlId}>{field.label}</label>
                        {#if field.type === 'checkbox'}
                          <input
                            id={controlId}
                            type="checkbox"
                            checked={item.calidad[field.key]}
                            on:change={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.checked)}
                            class="calidad-checkbox"
                            disabled={loadingDetail} />
                        {:else if field.type === 'text'}
                          <input
                            id={controlId}
                            type="text"
                            value={item.calidad[field.key] || ''}
                            on:input={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.value)}
                            placeholder={field.label}
                            class={item.calidad[field.key] ? 'filled' : ''}
                            disabled={loadingDetail} />
                        {/if}
                      {:else}
                        {#if field.type === 'checkbox'}
                          <label for={controlId}>{field.label}</label>
                          <input
                            id={controlId}
                            type="checkbox"
                            checked={item.calidad[field.key]}
                            disabled
                            class="calidad-checkbox readonly" />
                        {:else}
                          <div class="calidad-label">{field.label}</div>
                          <div class="readonly-field {item.calidad[field.key] ? 'filled' : ''}">
                            {item.calidad[field.key] || 'No especificado'}
                          </div>
                        {/if}
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
              
              {#if isEditable}
                <div class="save-button-container">
                  <button
                    type="button"
                    class="save-step-btn"
                    on:click={() => handleSaveStep(item.id)}
                    disabled={loadingDetail || !checklistId}
                    title="Guardar orden de compra">
                    {#if loadingDetail}
                      <span>Guardando...</span>
                    {:else}
                      <span>💾 Guardar Orden de Compra</span>
                    {/if}
                  </button>
                </div>
              {/if}
            {:else if item.aspecto === "PROGRAMADORES"}
              <!-- Layout especial para PROGRAMADORES -->
              <div class="calidad-fields">
                {#each getCalidadFields(item.aspecto) as field, idx}
                  {@const controlId = `cal-${item.id}-${field.key}-${idx}`}
                  {@const showField = field.key !== "comentarios" || item.calidad.estadoValidacion === "invalido"}
                  
                  {#if showField}
                    <div class="calidad-field">
                      {#if isEditable}
                        <label for={controlId}>{field.label}</label>

                        {#if field.type === 'select'}
                          <select
                            id={controlId}
                            value={item.calidad[field.key] || ''}
                            on:change={(e) => {
                              const value = e.target.value;
                              handleUpdate(item.id, `calidad.${field.key}`, value);
                              // Si cambia de invalido a otro estado, limpiar comentarios
                              if (field.key === "estadoValidacion" && value !== "invalido") {
                                handleUpdate(item.id, "calidad.comentarios", "");
                              }
                            }}
                            class="calidad-select {item.calidad[field.key] ? 'filled' : ''}"
                            disabled={loadingDetail}>
                            {#each field.options || [] as option}
                              <option value={option.value}>{option.label}</option>
                            {/each}
                          </select>
                        {:else if field.type === 'textarea'}
                          <textarea
                            id={controlId}
                            value={item.calidad[field.key] || ''}
                            on:input={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.value)}
                            placeholder={field.placeholder || field.label}
                            rows={field.key === "ids" ? "4" : "3"}
                            class="calidad-textarea {item.calidad[field.key] ? 'filled' : ''}"
                            disabled={loadingDetail}></textarea>
                        {:else if field.type === 'text'}
                          <input
                            id={controlId}
                            type="text"
                            value={item.calidad[field.key] || ''}
                            on:input={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.value)}
                            placeholder={field.placeholder || field.label}
                            class={item.calidad[field.key] ? 'filled' : ''}
                            disabled={loadingDetail} />
                        {:else if field.type === 'checkbox'}
                          <input
                            id={controlId}
                            type="checkbox"
                            checked={item.calidad[field.key]}
                            on:change={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.checked)}
                            class="calidad-checkbox"
                            disabled={loadingDetail} />
                        {/if}
                      {:else}
                        {#if field.type === 'select'}
                          <div class="readonly-field {item.calidad[field.key] ? 'filled' : ''}">
                            {field.options?.find(o => o.value === item.calidad[field.key])?.label || item.calidad[field.key] || 'No especificado'}
                          </div>
                        {:else if field.type === 'textarea'}
                          <div class="readonly-field {item.calidad[field.key] ? 'filled' : ''}">
                            {item.calidad[field.key] ? item.calidad[field.key].split('\n').map(line => line.trim()).filter(line => line).join(', ') : 'No especificado'}
                          </div>
                        {:else if field.type === 'checkbox'}
                          <label for={controlId}>{field.label}</label>
                          <input
                            id={controlId}
                            type="checkbox"
                            checked={item.calidad[field.key]}
                            disabled
                            class="calidad-checkbox readonly" />
                        {:else}
                          <div class="readonly-field {item.calidad[field.key] ? 'filled' : ''}">
                            {item.calidad[field.key] || 'No especificado'}
                          </div>
                        {/if}
                      {/if}
                    </div>
                  {/if}
                {/each}
              </div>
              
              {#if isEditable}
                <div class="save-button-container">
                  <button
                    type="button"
                    class="save-step-btn"
                    on:click={() => handleSaveStep(item.id)}
                    disabled={loadingDetail || !checklistId}
                    title="Guardar programación">
                    {#if loadingDetail}
                      <span>Guardando...</span>
                    {:else}
                      <span>💾 Guardar Programación</span>
                    {/if}
                  </button>
                </div>
              {/if}
            {:else if item.aspecto === "ALMACEN"}
              <!-- Layout especial para ALMACEN -->
              <div class="calidad-fields">
                {#each getCalidadFields(item.aspecto) as field, idx}
                  {@const controlId = `cal-${item.id}-${field.key}-${idx}`}
                  <div class="calidad-field">
                    {#if isEditable}
                      <label for={controlId}>{field.label}</label>

                      {#if field.type === 'select'}
                        <select
                          id={controlId}
                          value={item.calidad[field.key] || ''}
                          on:change={(e) => {
                            const value = e.target.value;
                            handleUpdate(item.id, `calidad.${field.key}`, value);
                          }}
                          class="calidad-select {item.calidad[field.key] ? 'filled' : ''}"
                          disabled={loadingDetail}>
                          {#each field.options || [] as option}
                            <option value={option.value}>{option.label}</option>
                          {/each}
                        </select>
                      {:else if field.type === 'text'}
                        <input
                          id={controlId}
                          type="text"
                          value={item.calidad[field.key] || ''}
                          on:input={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.value)}
                          placeholder={field.label}
                          class={item.calidad[field.key] ? 'filled' : ''}
                          disabled={loadingDetail} />
                      {:else if field.type === 'textarea'}
                        <textarea
                          id={controlId}
                          value={item.calidad[field.key] || ''}
                          on:input={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.value)}
                          placeholder={field.label}
                          rows="3"
                          class="calidad-textarea {item.calidad[field.key] ? 'filled' : ''}"
                          disabled={loadingDetail}></textarea>
                      {:else if field.type === 'checkbox'}
                        <input
                          id={controlId}
                          type="checkbox"
                          checked={item.calidad[field.key]}
                          on:change={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.checked)}
                          class="calidad-checkbox"
                          disabled={loadingDetail} />
                      {/if}
                    {:else}
                      {#if field.type === 'select'}
                        <div class="readonly-field {item.calidad[field.key] ? 'filled' : ''}">
                          {field.options?.find(o => o.value === item.calidad[field.key])?.label || item.calidad[field.key] || 'No especificado'}
                        </div>
                      {:else if field.type === 'textarea'}
                        <div class="readonly-field {item.calidad[field.key] ? 'filled' : ''}">
                          {item.calidad[field.key] || 'No especificado'}
                        </div>
                      {:else if field.type === 'checkbox'}
                        <label for={controlId}>{field.label}</label>
                        <input
                          id={controlId}
                          type="checkbox"
                          checked={item.calidad[field.key]}
                          disabled
                          class="calidad-checkbox readonly" />
                      {:else}
                        <div class="readonly-field {item.calidad[field.key] ? 'filled' : ''}">
                          {item.calidad[field.key] || 'No especificado'}
                        </div>
                      {/if}
                    {/if}
                  </div>
                {/each}
              </div>
              
              {#if isEditable}
                <div class="save-button-container">
                  <button
                    type="button"
                    class="save-step-btn"
                    on:click={() => handleSaveStep(item.id)}
                    disabled={loadingDetail || !checklistId}
                    title="Guardar almacén">
                    {#if loadingDetail}
                      <span>Guardando...</span>
                    {:else}
                      <span>💾 Guardar Almacén</span>
                    {/if}
                  </button>
                </div>
              {/if}
            {:else if item.aspecto === "COORDINACION DE SERVICIOS"}
              <!-- Layout especial para COORDINACION DE SERVICIOS -->
              <div class="calidad-fields">
                {#each getCalidadFields(item.aspecto) as field, idx}
                  {@const controlId = `cal-${item.id}-${field.key}-${idx}`}
                  {@const showField = field.key !== "motivoRechazo" || item.calidad.estadoValidacion === "rechazado"}
                  
                  {#if showField}
                    <div class="calidad-field">
                      {#if isEditable}
                        <label for={controlId}>{field.label}</label>

                        {#if field.type === 'select'}
                          <select
                            id={controlId}
                            value={item.calidad[field.key] || ''}
                            on:change={(e) => {
                              const value = e.target.value;
                              handleUpdate(item.id, `calidad.${field.key}`, value);
                              // Si cambia de rechazado a otro estado, limpiar motivo
                              if (field.key === "estadoValidacion" && value !== "rechazado") {
                                handleUpdate(item.id, "calidad.motivoRechazo", "");
                              }
                            }}
                            class="calidad-select {item.calidad[field.key] ? 'filled' : ''}"
                            disabled={loadingDetail}>
                            {#each field.options || [] as option}
                              <option value={option.value}>{option.label}</option>
                            {/each}
                          </select>
                        {:else if field.type === 'text'}
                          <input
                            id={controlId}
                            type="text"
                            value={item.calidad[field.key] || ''}
                            on:input={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.value)}
                            placeholder={field.label}
                            class={item.calidad[field.key] ? 'filled' : ''}
                            disabled={loadingDetail} />
                        {:else if field.type === 'textarea'}
                          <textarea
                            id={controlId}
                            value={item.calidad[field.key] || ''}
                            on:input={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.value)}
                            placeholder={field.label}
                            rows="3"
                            class="calidad-textarea {item.calidad[field.key] ? 'filled' : ''}"
                            disabled={loadingDetail}></textarea>
                        {:else if field.type === 'checkbox'}
                          <input
                            id={controlId}
                            type="checkbox"
                            checked={item.calidad[field.key]}
                            on:change={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.checked)}
                            class="calidad-checkbox"
                            disabled={loadingDetail} />
                        {/if}
                      {:else}
                        {#if field.type === 'select'}
                          <div class="readonly-field {item.calidad[field.key] ? 'filled' : ''}">
                            {field.options?.find(o => o.value === item.calidad[field.key])?.label || item.calidad[field.key] || 'No especificado'}
                          </div>
                        {:else if field.type === 'textarea'}
                          <div class="readonly-field {item.calidad[field.key] ? 'filled' : ''}">
                            {item.calidad[field.key] || 'No especificado'}
                          </div>
                        {:else if field.type === 'checkbox'}
                          <label for={controlId}>{field.label}</label>
                          <input
                            id={controlId}
                            type="checkbox"
                            checked={item.calidad[field.key]}
                            disabled
                            class="calidad-checkbox readonly" />
                        {:else}
                          <div class="readonly-field {item.calidad[field.key] ? 'filled' : ''}">
                            {item.calidad[field.key] || 'No especificado'}
                          </div>
                        {/if}
                      {/if}
                    </div>
                  {/if}
                {/each}
              </div>
              
              {#if isEditable}
                <div class="save-button-container">
                  <button
                    type="button"
                    class="save-step-btn"
                    on:click={() => handleSaveStep(item.id)}
                    disabled={loadingDetail || !checklistId}
                    title="Guardar coordinación de servicios">
                    {#if loadingDetail}
                      <span>Guardando...</span>
                    {:else}
                      <span>💾 Guardar Coordinación</span>
                    {/if}
                  </button>
                </div>
              {/if}
            {:else if item.aspecto === "CALIDAD" && item.id === 5}
              <!-- Layout especial para CALIDAD (primera instancia - id 5) -->
              <div class="calidad-fields">
                {#each getCalidadFields(item.aspecto) as field, idx}
                  {@const controlId = `cal-${item.id}-${field.key}-${idx}`}
                  {@const showField = field.key !== "comentarios" || item.calidad.estadoValidacion === "invalido"}
                  
                  {#if showField}
                    <div class="calidad-field">
                      {#if isEditable}
                        <label for={controlId}>{field.label}</label>

                        {#if field.type === 'select'}
                          <select
                            id={controlId}
                            value={item.calidad[field.key] || ''}
                            on:change={(e) => {
                              const value = e.target.value;
                              handleUpdate(item.id, `calidad.${field.key}`, value);
                              // Si cambia de inválido a otro estado, limpiar comentarios
                              if (field.key === "estadoValidacion" && value !== "invalido") {
                                handleUpdate(item.id, "calidad.comentarios", "");
                              }
                            }}
                            class="calidad-select {item.calidad[field.key] ? 'filled' : ''}"
                            disabled={loadingDetail}>
                            {#each field.options || [] as option}
                              <option value={option.value}>{option.label}</option>
                            {/each}
                          </select>
                        {:else if field.type === 'textarea'}
                          <textarea
                            id={controlId}
                            value={item.calidad[field.key] || ''}
                            on:input={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.value)}
                            placeholder={field.label}
                            rows={field.key === "observaciones" ? "4" : "3"}
                            class="calidad-textarea {item.calidad[field.key] ? 'filled' : ''}"
                            disabled={loadingDetail}></textarea>
                        {:else if field.type === 'text'}
                          <input
                            id={controlId}
                            type="text"
                            value={item.calidad[field.key] || ''}
                            on:input={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.value)}
                            placeholder={field.label}
                            class={item.calidad[field.key] ? 'filled' : ''}
                            disabled={loadingDetail} />
                        {:else if field.type === 'checkbox'}
                          <input
                            id={controlId}
                            type="checkbox"
                            checked={item.calidad[field.key]}
                            on:change={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.checked)}
                            class="calidad-checkbox"
                            disabled={loadingDetail} />
                        {/if}
                      {:else}
                        {#if field.type === 'select'}
                          <div class="readonly-field {item.calidad[field.key] ? 'filled' : ''}">
                            {field.options?.find(o => o.value === item.calidad[field.key])?.label || item.calidad[field.key] || 'No especificado'}
                          </div>
                        {:else if field.type === 'textarea'}
                          <div class="readonly-field {item.calidad[field.key] ? 'filled' : ''}">
                            {item.calidad[field.key] || 'No especificado'}
                          </div>
                        {:else if field.type === 'checkbox'}
                          <label for={controlId}>{field.label}</label>
                          <input
                            id={controlId}
                            type="checkbox"
                            checked={item.calidad[field.key]}
                            disabled
                            class="calidad-checkbox readonly" />
                        {:else}
                          <div class="readonly-field {item.calidad[field.key] ? 'filled' : ''}">
                            {item.calidad[field.key] || 'No especificado'}
                          </div>
                        {/if}
                      {/if}
                    </div>
                  {/if}
                {/each}
              </div>
              
              {#if isEditable}
                <div class="save-button-container">
                  <button
                    type="button"
                    class="save-step-btn"
                    on:click={() => handleSaveStep(item.id)}
                    disabled={loadingDetail || !checklistId}
                    title="Guardar calidad">
                    {#if loadingDetail}
                      <span>Guardando...</span>
                    {:else}
                      <span>💾 Guardar Calidad</span>
                    {/if}
                  </button>
                </div>
              {/if}
            {:else if item.aspecto === "CALIDAD" && item.id === 8}
              <!-- Layout especial para CALIDAD (segunda instancia - id 8) -->
              <div class="calidad-fields">
                {#each getCalidadFields(item.aspecto) as field, idx}
                  {@const controlId = `cal-${item.id}-${field.key}-${idx}`}
                  {@const showField = field.key !== "comentarios" || item.calidad.estadoValidacion === "invalido"}
                  
                  {#if showField}
                    <div class="calidad-field">
                      {#if isEditable}
                        <label for={controlId}>{field.label}</label>

                        {#if field.type === 'select'}
                          <select
                            id={controlId}
                            value={item.calidad[field.key] || ''}
                            on:change={(e) => {
                              const value = e.target.value;
                              handleUpdate(item.id, `calidad.${field.key}`, value);
                              // Si cambia de inválido a otro estado, limpiar comentarios
                              if (field.key === "estadoValidacion" && value !== "invalido") {
                                handleUpdate(item.id, "calidad.comentarios", "");
                              }
                            }}
                            class="calidad-select {item.calidad[field.key] ? 'filled' : ''}"
                            disabled={loadingDetail}>
                            {#each field.options || [] as option}
                              <option value={option.value}>{option.label}</option>
                            {/each}
                          </select>
                        {:else if field.type === 'textarea'}
                          <textarea
                            id={controlId}
                            value={item.calidad[field.key] || ''}
                            on:input={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.value)}
                            placeholder={field.label}
                            rows={field.key === "observaciones" ? "4" : "3"}
                            class="calidad-textarea {item.calidad[field.key] ? 'filled' : ''}"
                            disabled={loadingDetail}></textarea>
                        {:else if field.type === 'text'}
                          <input
                            id={controlId}
                            type="text"
                            value={item.calidad[field.key] || ''}
                            on:input={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.value)}
                            placeholder={field.label}
                            class={item.calidad[field.key] ? 'filled' : ''}
                            disabled={loadingDetail} />
                        {:else if field.type === 'checkbox'}
                          <input
                            id={controlId}
                            type="checkbox"
                            checked={item.calidad[field.key]}
                            on:change={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.checked)}
                            class="calidad-checkbox"
                            disabled={loadingDetail} />
                        {/if}
                      {:else}
                        {#if field.type === 'select'}
                          <div class="readonly-field {item.calidad[field.key] ? 'filled' : ''}">
                            {field.options?.find(o => o.value === item.calidad[field.key])?.label || item.calidad[field.key] || 'No especificado'}
                          </div>
                        {:else if field.type === 'textarea'}
                          <div class="readonly-field {item.calidad[field.key] ? 'filled' : ''}">
                            {item.calidad[field.key] || 'No especificado'}
                          </div>
                        {:else if field.type === 'checkbox'}
                          <label for={controlId}>{field.label}</label>
                          <input
                            id={controlId}
                            type="checkbox"
                            checked={item.calidad[field.key]}
                            disabled
                            class="calidad-checkbox readonly" />
                        {:else}
                          <div class="readonly-field {item.calidad[field.key] ? 'filled' : ''}">
                            {item.calidad[field.key] || 'No especificado'}
                          </div>
                        {/if}
                      {/if}
                    </div>
                  {/if}
                {/each}
              </div>
              
              {#if isEditable}
                <div class="save-button-container">
                  <button
                    type="button"
                    class="save-step-btn"
                    on:click={() => handleSaveStep(item.id)}
                    disabled={loadingDetail || !checklistId}
                    title="Guardar calidad">
                    {#if loadingDetail}
                      <span>Guardando...</span>
                    {:else}
                      <span>💾 Guardar Calidad</span>
                    {/if}
                  </button>
                </div>
              {/if}
            {:else if item.aspecto === "SOPORTE TECNICO"}
              <!-- Layout especial para SOPORTE TECNICO -->
              <div class="soporte-tareas-container">
                <!-- Campos de fecha y técnico -->
                <div class="soporte-fields">
                  <div class="calidad-field">
                    <label for="soporte-fecha">Fecha</label>
                    {#if isEditable}
                      <input
                        id="soporte-fecha"
                        type="date"
                        value={item.fecha || ""}
                        on:change={(e) => handleUpdate(item.id, "fecha", e.target.value)}
                        class="calidad-input"
                        disabled={loadingDetail} />
                    {:else}
                      <div class="readonly-field {item.fecha ? 'filled' : ''}">
                        {item.fecha || 'No especificado'}
                      </div>
                    {/if}
                  </div>
                  <div class="calidad-field">
                    <label for="soporte-firma">Nombre del Técnico</label>
                    <div class="readonly-field {item.firmaResponsable ? 'filled' : ''}">
                      {item.firmaResponsable || 'No asignado'}
                    </div>
                  </div>
                </div>

                <div class="tareas-header">
                  <h3>Historial de Tareas de Soporte</h3>
                  {#if isEditable}
                    <button
                      type="button"
                      class="add-tarea-btn"
                      on:click={() => openTareaModal()}
                      disabled={loadingDetail}>
                      ➕ Agregar Tarea
                    </button>
                  {/if}
                </div>
                
                {#if item.calidad.tareas && item.calidad.tareas.length > 0}
                  <div class="tareas-list">
                    {#each item.calidad.tareas as tarea, idx}
                      <div class="tarea-item">
                        <div class="tarea-header">
                          <span class="tarea-number">Tarea #{idx + 1}</span>
                          <span class="tarea-date">{tarea.fechaCreacion ? new Date(tarea.fechaCreacion).toLocaleDateString('es-ES') : 'Sin fecha'}</span>
                          {#if isEditable}
                            <button
                              type="button"
                              class="edit-tarea-btn"
                              on:click={() => openTareaModal(tarea)}
                              disabled={loadingDetail}>
                              ✏️ Editar
                            </button>
                          {/if}
                        </div>
                        <div class="tarea-content">
                          <div class="tarea-field">
                            <strong>Comentarios:</strong>
                            <p>{tarea.comentarios || 'Sin comentarios'}</p>
                          </div>
                          <div class="tarea-status">
                            <span class="status-badge {tarea.procesada ? 'procesada' : 'pendiente'}">
                              {tarea.procesada ? '✓ PROCESADA' : '○ PENDIENTE'}
                            </span>
                            {#if tarea.pruebas}
                              <span class="status-badge pruebas">✓ PRUEBAS</span>
                              {#if tarea.pruebasRealizadas}
                                <div class="tarea-field">
                                  <strong>Pruebas realizadas:</strong>
                                  <p>{tarea.pruebasRealizadas}</p>
                                </div>
                              {/if}
                            {/if}
                          </div>
                          {#if tarea.notificacionCliente && (tarea.notificacionCliente.email || tarea.notificacionCliente.whatsapp || tarea.notificacionCliente.llamada || tarea.notificacionCliente.enPersona)}
                            <div class="tarea-field">
                              <strong>Notificación al cliente:</strong>
                              <div class="notificacion-badges">
                                {#if tarea.notificacionCliente.email}
                                  <span class="notif-badge">📧 Email</span>
                                {/if}
                                {#if tarea.notificacionCliente.whatsapp}
                                  <span class="notif-badge">💬 WhatsApp</span>
                                {/if}
                                {#if tarea.notificacionCliente.llamada}
                                  <span class="notif-badge">📞 Llamada</span>
                                {/if}
                                {#if tarea.notificacionCliente.enPersona}
                                  <span class="notif-badge">👤 En persona</span>
                                {/if}
                              </div>
                            </div>
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <div class="no-tareas">
                    <p>No hay tareas de soporte registradas</p>
                    {#if isEditable}
                      <p>Haz clic en "Agregar Tarea" para crear la primera</p>
                    {/if}
                  </div>
                {/if}
              </div>
              
              {#if isEditable}
                <div class="save-button-container">
                  <button
                    type="button"
                    class="save-step-btn"
                    on:click={() => handleSaveStep(item.id)}
                    disabled={loadingDetail || !checklistId}
                    title="Guardar soporte técnico">
                    {#if loadingDetail}
                      <span>Guardando...</span>
                    {:else}
                      <span>💾 Guardar Soporte</span>
                    {/if}
                  </button>
                </div>
              {/if}
            {:else if item.aspecto === "TECNICO INSTALADOR"}
              <!-- Layout especial para TECNICO INSTALADOR -->
              <div class="calidad-fields">
                {#each getCalidadFields(item.aspecto) as field, idx}
                  {@const controlId = `cal-${item.id}-${field.key}-${idx}`}
                  <div class="calidad-field">
                    {#if field.type === 'readonly'}
                      <!-- Campo de solo lectura para comentarios -->
                      <label for={controlId}>{field.label}</label>
                      <div class="readonly-field {item.calidad[field.key] ? 'filled' : ''}">
                        {item.calidad[field.key] || 'Sin comentarios'}
                      </div>
                    {:else if field.type === 'evidencias'}
                      <!-- Botón de evidencias -->
                      <label for={controlId}>{field.label}</label>
                      <button
                        type="button"
                        class="evidencias-btn"
                        on:click={() => openEvidenciasModal(item.calidad[field.key])}
                        disabled={!item.calidad[field.key] || (Array.isArray(item.calidad[field.key]) && item.calidad[field.key].length === 0) || (typeof item.calidad[field.key] === 'string' && item.calidad[field.key].trim() === '')}>
                        📷 Ver Evidencias ({Array.isArray(item.calidad[field.key]) ? item.calidad[field.key].length : (item.calidad[field.key] ? 1 : 0)})
                      </button>
                    {:else}
                      {#if isEditable}
                        <label for={controlId}>{field.label}</label>
                        {#if field.type === 'textarea'}
                          <textarea
                            id={controlId}
                            value={item.calidad[field.key] || ''}
                            on:input={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.value)}
                            placeholder={field.label}
                            rows="3"
                            class="calidad-textarea {item.calidad[field.key] ? 'filled' : ''}"
                            disabled={loadingDetail}></textarea>
                        {:else if field.type === 'text'}
                          <input
                            id={controlId}
                            type="text"
                            value={item.calidad[field.key] || ''}
                            on:input={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.value)}
                            placeholder={field.label}
                            class={item.calidad[field.key] ? 'filled' : ''}
                            disabled={loadingDetail} />
                        {/if}
                      {:else}
                        <div class="readonly-field {item.calidad[field.key] ? 'filled' : ''}">
                          {item.calidad[field.key] || 'No especificado'}
                        </div>
                      {/if}
                    {/if}
                  </div>
                {/each}
              </div>
              
              {#if isEditable}
                <div class="save-button-container">
                  <button
                    type="button"
                    class="save-step-btn"
                    on:click={() => handleSaveStep(item.id)}
                    disabled={loadingDetail || !checklistId}
                    title="Guardar técnico instalador">
                    {#if loadingDetail}
                      <span>Guardando...</span>
                    {:else}
                      <span>💾 Guardar Instalación</span>
                    {/if}
                  </button>
                </div>
              {/if}
            {:else if item.aspecto === "SALIDA DE MATERIAL (INSTALACION DE STOCK)"}
              <!-- Layout especial para SALIDA DE MATERIAL -->
              <div class="calidad-fields">
                <div class="calidad-field">
                  <label for="salida-fecha">Fecha</label>
                  {#if isEditable}
                    <input
                      id="salida-fecha"
                      type="date"
                      value={item.fecha || ""}
                      on:change={(e) => handleUpdate(item.id, "fecha", e.target.value)}
                      class={item.fecha ? 'filled' : ''}
                      disabled={loadingDetail} />
                  {:else}
                    <div class="readonly-field {item.fecha ? 'filled' : ''}">
                      {item.fecha || 'No especificado'}
                    </div>
                  {/if}
                </div>
                <div class="calidad-field">
                  <label for="salida-firma">Nombre de la persona que dio salida</label>
                  <div class="readonly-field {item.firmaResponsable ? 'filled' : ''}">
                    {item.firmaResponsable || 'No asignado'}
                  </div>
                </div>
                <div class="calidad-field">
                  <label for="salida-hoja"># HOJA SALIDA</label>
                  {#if isEditable}
                    <input
                      id="salida-hoja"
                      type="text"
                      value={item.calidad.hojaSalida || ''}
                      on:input={(e) => handleUpdate(item.id, "calidad.hojaSalida", e.target.value)}
                      placeholder="# HOJA SALIDA"
                      class={item.calidad.hojaSalida ? 'filled' : ''}
                      disabled={loadingDetail} />
                  {:else}
                    <div class="readonly-field {item.calidad.hojaSalida ? 'filled' : ''}">
                      {item.calidad.hojaSalida || 'No especificado'}
                    </div>
                  {/if}
                </div>
              </div>
              
              {#if isEditable}
                <div class="save-button-container">
                  <button
                    type="button"
                    class="save-step-btn"
                    on:click={() => handleSaveStep(item.id)}
                    disabled={loadingDetail || !checklistId || savingSteps.includes(item.id)}
                    title="Guardar salida de material">
                    {#if loadingDetail || savingSteps.includes(item.id)}
                      <span>Guardando...</span>
                    {:else}
                      <span>💾 Guardar Salida</span>
                    {/if}
                  </button>
                </div>
              {/if}
            {:else if item.aspecto === "FACTURACION"}
              <!-- Layout especial para FACTURACION -->
              <div class="calidad-fields facturacion-fields">
                <!-- Estado de pago -->
                <div class="calidad-field">
                  <label for="facturacion-estado">Estado de Pago *</label>
                  {#if isEditable}
                    <select
                      id="facturacion-estado"
                      value={item.calidad.estadoPago || ''}
                      on:change={(e) => {
                        const value = e.target.value;
                        handleUpdate(item.id, "calidad.estadoPago", value);
                        // Limpiar campos según el estado
                        if (value !== "pagado") {
                          handleUpdate(item.id, "calidad.folioFactura", "");
                          handleUpdate(item.id, "calidad.fechaPago", "");
                        }
                        if (value !== "pagos_parciales") {
                          handleUpdate(item.id, "calidad.fechasPagosParciales", []);
                        }
                      }}
                      class="calidad-select {item.calidad.estadoPago ? 'filled' : ''}"
                      disabled={loadingDetail}>
                      <option value="">Seleccione...</option>
                      <option value="pendiente">PENDIENTE</option>
                      <option value="pagos_parciales">PAGOS PARCIALES</option>
                      <option value="pagado">PAGADO</option>
                    </select>
                  {:else}
                    <div class="readonly-field {item.calidad.estadoPago ? 'filled' : ''}">
                      {item.calidad.estadoPago === "pagado" ? "PAGADO" : 
                       item.calidad.estadoPago === "pagos_parciales" ? "PAGOS PARCIALES" : 
                       item.calidad.estadoPago === "pendiente" ? "PENDIENTE" : 
                       'No especificado'}
                    </div>
                  {/if}
                </div>

                <!-- Fecha de pago (solo si está PAGADO) -->
                {#if item.calidad.estadoPago === "pagado"}
                  <div class="calidad-field">
                    <label for="facturacion-fecha-pago">Fecha de Pago *</label>
                    {#if isEditable}
                      <input
                        id="facturacion-fecha-pago"
                        type="date"
                        value={item.calidad.fechaPago || ""}
                        on:change={(e) => handleUpdate(item.id, "calidad.fechaPago", e.target.value)}
                        class={item.calidad.fechaPago ? 'filled' : ''}
                        disabled={loadingDetail} />
                    {:else}
                      <div class="readonly-field {item.calidad.fechaPago ? 'filled' : ''}">
                        {item.calidad.fechaPago || 'No especificado'}
                      </div>
                    {/if}
                  </div>

                  <!-- Folio de factura (solo si está PAGADO) -->
                  <div class="calidad-field">
                    <label for="facturacion-folio">Folio de Factura *</label>
                    {#if isEditable}
                      <input
                        id="facturacion-folio"
                        type="text"
                        value={item.calidad.folioFactura || ''}
                        on:input={(e) => handleUpdate(item.id, "calidad.folioFactura", e.target.value)}
                        placeholder="Folio de factura"
                        class={item.calidad.folioFactura ? 'filled' : ''}
                        disabled={loadingDetail} />
                    {:else}
                      <div class="readonly-field {item.calidad.folioFactura ? 'filled' : ''}">
                        {item.calidad.folioFactura || 'No especificado'}
                      </div>
                    {/if}
                  </div>
                {/if}

                <!-- Pagos parciales (solo si está PAGOS PARCIALES) -->
                {#if item.calidad.estadoPago === "pagos_parciales"}
                  <div class="calidad-field pagos-parciales-field">
                    <label>Pagos Parciales</label>
                    {#if isEditable}
                      <div class="pagos-parciales-container">
                        {#each (item.calidad.fechasPagosParciales || []) as pago, idx}
                          <div class="pago-parcial-item">
                            <div class="pago-parcial-fields">
                              <div class="pago-fecha-field">
                                <label>Fecha</label>
                                <input
                                  type="date"
                                  value={typeof pago === 'object' ? (pago.fecha || '') : (pago || '')}
                                  on:change={(e) => {
                                    const nuevosPagos = [...(item.calidad.fechasPagosParciales || [])];
                                    const pagoActual = typeof nuevosPagos[idx] === 'object' ? nuevosPagos[idx] : { fecha: nuevosPagos[idx] || '', monto: '' };
                                    nuevosPagos[idx] = { ...pagoActual, fecha: e.target.value };
                                    handleUpdate(item.id, "calidad.fechasPagosParciales", nuevosPagos);
                                  }}
                                  class="filled"
                                  disabled={loadingDetail} />
                              </div>
                              <div class="pago-monto-field">
                                <label>Monto</label>
                                <div class="currency-input-wrapper">
                                  <span class="currency-symbol">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={typeof pago === 'object' ? (pago.monto || '') : ''}
                                    on:input={(e) => {
                                      const nuevosPagos = [...(item.calidad.fechasPagosParciales || [])];
                                      const pagoActual = typeof nuevosPagos[idx] === 'object' ? nuevosPagos[idx] : { fecha: nuevosPagos[idx] || '', monto: '' };
                                      nuevosPagos[idx] = { ...pagoActual, monto: e.target.value };
                                      handleUpdate(item.id, "calidad.fechasPagosParciales", nuevosPagos);
                                    }}
                                    placeholder="0.00"
                                    class="currency-input filled"
                                    disabled={loadingDetail} />
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              class="remove-fecha-btn"
                              on:click={() => {
                                const nuevosPagos = (item.calidad.fechasPagosParciales || []).filter((_, i) => i !== idx);
                                handleUpdate(item.id, "calidad.fechasPagosParciales", nuevosPagos);
                              }}
                              disabled={loadingDetail}>
                              ✕
                            </button>
                          </div>
                        {/each}
                        <button
                          type="button"
                          class="add-fecha-btn"
                          on:click={() => {
                            const nuevosPagos = [...(item.calidad.fechasPagosParciales || []), { fecha: '', monto: '' }];
                            handleUpdate(item.id, "calidad.fechasPagosParciales", nuevosPagos);
                          }}
                          disabled={loadingDetail}>
                          ➕ Agregar Pago Parcial
                        </button>
                      </div>
                    {:else}
                      <div class="readonly-field">
                        {#if item.calidad.fechasPagosParciales && item.calidad.fechasPagosParciales.length > 0}
                          {#each item.calidad.fechasPagosParciales as pago}
                            <div class="pago-item">
                              <strong>Fecha:</strong> {typeof pago === 'object' ? (pago.fecha || 'Sin fecha') : (pago || 'Sin fecha')} | 
                              <strong>Monto:</strong> ${typeof pago === 'object' && pago.monto ? parseFloat(pago.monto).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                            </div>
                          {/each}
                        {:else}
                          No hay pagos parciales registrados
                        {/if}
                      </div>
                    {/if}
                  </div>
                {/if}

                <!-- Montos: Subtotal, IVA, Total -->
                <div class="montos-section">
                  <h4>Monto de la Factura</h4>
                  <div class="montos-grid">
                    <div class="calidad-field">
                      <label for="facturacion-subtotal">Subtotal</label>
                      {#if isEditable}
                        <div class="currency-input-wrapper">
                          <span class="currency-symbol">$</span>
                          <input
                            id="facturacion-subtotal"
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.calidad.subtotal || ''}
                            on:input={(e) => {
                              const value = e.target.value;
                              handleUpdate(item.id, "calidad.subtotal", value);
                              // Calcular IVA automáticamente (16% en México)
                              const subtotal = parseFloat(value) || 0;
                              const iva = (subtotal * 0.16);
                              handleUpdate(item.id, "calidad.iva", iva.toFixed(2));
                              // Calcular total
                              const total = subtotal + iva;
                              handleUpdate(item.id, "calidad.total", total.toFixed(2));
                            }}
                            placeholder="0.00"
                            class="currency-input {item.calidad.subtotal ? 'filled' : ''}"
                            disabled={loadingDetail} />
                        </div>
                      {:else}
                        <div class="readonly-field {item.calidad.subtotal ? 'filled' : ''}">
                          ${item.calidad.subtotal ? parseFloat(item.calidad.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                        </div>
                      {/if}
                    </div>

                    <div class="calidad-field">
                      <label for="facturacion-iva">IVA (16%)</label>
                      <div class="readonly-field {item.calidad.iva ? 'filled' : ''}">
                        ${item.calidad.iva ? parseFloat(item.calidad.iva).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                      </div>
                    </div>

                    <div class="calidad-field">
                      <label for="facturacion-total">Total</label>
                      <div class="readonly-field total-field {item.calidad.total ? 'filled' : ''}">
                        ${item.calidad.total ? parseFloat(item.calidad.total).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {#if isEditable}
                <div class="save-button-container">
                  <button
                    type="button"
                    class="save-step-btn"
                    on:click={() => handleSaveStep(item.id)}
                    disabled={loadingDetail || !checklistId || savingSteps.includes(item.id)}
                    title="Guardar facturación">
                    {#if loadingDetail || savingSteps.includes(item.id)}
                      <span>Guardando...</span>
                    {:else}
                      <span>💾 Guardar Facturación</span>
                    {/if}
                  </button>
                </div>
              {/if}
            {:else}
              <!-- Layout normal para otras secciones -->
              <div class="calidad-fields">
                {#each getCalidadFields(item.aspecto) as field, idx}
                  {@const controlId = `cal-${item.id}-${field.key}-${idx}`}
                  <div class="calidad-field">
                    {#if isEditable}
                      <label for={controlId}>{field.label}</label>

                      {#if field.type === 'checkbox'}
                        <input
                          id={controlId}
                          type="checkbox"
                          checked={item.calidad[field.key]}
                          on:change={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.checked)}
                          class="calidad-checkbox"
                          disabled={loadingDetail} />
                      {:else if field.type === 'text'}
                        <input
                          id={controlId}
                          type="text"
                          value={item.calidad[field.key] || ''}
                          on:input={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.value)}
                          placeholder={field.label}
                          class={item.calidad[field.key] ? 'filled' : ''}
                          disabled={loadingDetail} />
                      {:else if field.type === 'textarea'}
                        <textarea
                          id={controlId}
                          value={item.calidad[field.key] || ''}
                          on:input={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.value)}
                          placeholder={field.label}
                          rows="2"
                          class={item.calidad[field.key] ? 'filled' : ''}
                          disabled={loadingDetail}></textarea>
                      {/if}
                    {:else}
                      {#if field.type === 'checkbox'}
                        <label for={controlId}>{field.label}</label>
                        <input
                          id={controlId}
                          type="checkbox"
                          checked={item.calidad[field.key]}
                          disabled
                          class="calidad-checkbox readonly" />
                      {:else}
                        <div class="calidad-label">{field.label}</div>
                        <div class="readonly-field {item.calidad[field.key] ? 'filled' : ''}">
                          {item.calidad[field.key] || 'No especificado'}
                        </div>
                      {/if}
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<!-- Modal de Evidencias -->
{#if showEvidenciasModal}
  <div class="modal-overlay" on:click={closeEvidenciasModal} on:keydown={(e) => e.key === 'Escape' && closeEvidenciasModal()}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Evidencias de Instalación</h2>
        <button class="modal-close" on:click={closeEvidenciasModal}>&times;</button>
      </div>
      <div class="modal-body">
        {#if evidenciasData.length === 0}
          <p class="no-evidencias">No hay evidencias disponibles</p>
        {:else}
          <div class="evidencias-grid">
            {#each evidenciasData as evidencia, idx}
              {@const isUrl = typeof evidencia === 'string' && (evidencia.startsWith('http') || evidencia.startsWith('/'))}
              {@const url = isUrl ? evidencia : (evidencia.url || evidencia)}
              {@const label = evidencia.label || evidencia.tipo || `Evidencia ${idx + 1}`}
              <div class="evidencia-item">
                <div class="evidencia-label">{label}</div>
                <img 
                  src={url} 
                  alt={label}
                  class="evidencia-image"
                  on:error={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'block';
                  }} />
                <div class="evidencia-error" style="display: none;">
                  <p>No se pudo cargar la imagen</p>
                  <a href={url} target="_blank" rel="noopener noreferrer">Abrir enlace</a>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Modal de Tarea de Soporte -->
{#if showTareaModal}
  <div class="modal-overlay" on:click={closeTareaModal} on:keydown={(e) => e.key === 'Escape' && closeTareaModal()}>
    <div class="modal-content tarea-modal" on:click|stopPropagation>
      <div class="modal-header">
        <h2>{currentTarea ? 'Editar Tarea' : 'Nueva Tarea de Soporte'}</h2>
        <button class="modal-close" on:click={closeTareaModal}>&times;</button>
      </div>
      <div class="modal-body">
        <div class="tarea-form">
          <div class="form-group">
            <label for="tarea-comentarios">Comentarios *</label>
            <textarea
              id="tarea-comentarios"
              bind:value={tareaForm.comentarios}
              placeholder="Describe el soporte realizado..."
              rows="4"
              class="tarea-textarea"
              required></textarea>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                bind:checked={tareaForm.procesada}
                class="tarea-checkbox" />
              <span>PROCESADA</span>
            </label>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                bind:checked={tareaForm.pruebas}
                class="tarea-checkbox" />
              <span>PRUEBAS</span>
            </label>
          </div>

          {#if tareaForm.pruebas}
            <div class="form-group">
              <label for="tarea-pruebas">Pruebas realizadas</label>
              <textarea
                id="tarea-pruebas"
                bind:value={tareaForm.pruebasRealizadas}
                placeholder="Describe las pruebas realizadas..."
                rows="3"
                class="tarea-textarea"></textarea>
            </div>
          {/if}

          <div class="form-group">
            <label class="section-label">NOTIFICACIÓN AL CLIENTE</label>
            <div class="notificacion-options">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  bind:checked={tareaForm.notificacionCliente.email}
                  class="tarea-checkbox" />
                <span>📧 Email</span>
              </label>
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  bind:checked={tareaForm.notificacionCliente.whatsapp}
                  class="tarea-checkbox" />
                <span>💬 WhatsApp</span>
              </label>
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  bind:checked={tareaForm.notificacionCliente.llamada}
                  class="tarea-checkbox" />
                <span>📞 Llamada</span>
              </label>
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  bind:checked={tareaForm.notificacionCliente.enPersona}
                  class="tarea-checkbox" />
                <span>👤 En persona</span>
              </label>
            </div>
          </div>

          <div class="modal-actions">
            <button
              type="button"
              class="btn-cancel"
              on:click={closeTareaModal}>
              Cancelar
            </button>
            <button
              type="button"
              class="btn-save"
              on:click={() => {
                const item = checklistData.find(it => it.aspecto === "SOPORTE TECNICO");
                if (item) saveTarea(item);
              }}>
              {currentTarea ? 'Actualizar' : 'Crear'} Tarea
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .checklist-table-container {
    overflow-x: visible;
    margin: 20px 0;
    width: 100%;
  }

  .badge {
    margin: 8px 8px 12px 0;
    display: inline-block;
    padding: 4px 10px;
    border-radius: 999px;
    background: #e8f0ff;
    color: #2b4ea2;
    font-size: 12px;
    font-weight: 600;
  }
  .badge.secondary { background: #fff7e6; color: #a05a00; }
  .badge.muted { background: #f3f3f3; color: #555; }

  .checklist-table {
    width: 100%;
    min-width: 1400px;
    border-collapse: collapse;
    background-color: var(--white);
    border: 2px solid var(--primary-blue);
    border-radius: 8px;
  }

  .checklist-table th {
    background-color: var(--primary-blue);
    color: var(--white);
    padding: 15px 10px;
    text-align: left;
    font-weight: bold;
    font-size: 14px;
  }

  .checklist-table td {
    padding: 15px 10px;
    border-bottom: 1px solid var(--border-grey);
    vertical-align: top;
  }

  .table-row { transition: all 0.3s ease; }
  .table-row:hover { background-color: #f8f9fa; }
  .table-row.completed { background-color: #e8f5e8; }
  .table-row.readonly { opacity: 0.7; }
  .table-row.readonly:hover { background-color: #f0f0f0; }

  .status-cell { width: 8%; text-align: center; }
  .status-btn {
    width: 30px; height: 30px;
    border: 2px solid var(--border-grey);
    border-radius: 50%;
    background: var(--white);
    color: var(--border-grey);
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex; align-items: center; justify-content: center;
  }
  .status-btn:hover { border-color: var(--accent-yellow); color: var(--accent-yellow); }
  .status-btn.completed { background-color: var(--accent-yellow); border-color: var(--accent-yellow); color: var(--white); }
  .status-btn:disabled { opacity:.6; cursor:not-allowed; }

  .status-indicator {
    width: 30px; height: 30px;
    border: 2px solid var(--border-grey);
    border-radius: 50%;
    background: var(--white);
    color: var(--border-grey);
    font-size: 16px;
    display: flex; align-items: center; justify-content: center;
  }
  .status-indicator.completed { background-color: var(--accent-yellow); border-color: var(--accent-yellow); color: var(--white); }

  .aspecto-cell { width: 22%; font-weight: 500; color: var(--primary-blue); position: relative; }
  .completion-badge {
    position: absolute; top: -5px; right: -5px;
    background-color: var(--accent-yellow); color: var(--white);
    font-size: 10px; padding: 2px 6px; border-radius: 10px; font-weight: bold;
  }
  .role-badge {
    position: absolute; bottom: -5px; right: -5px;
    color: var(--white); font-size: 8px; padding: 2px 4px; border-radius: 8px; font-weight: bold;
  }

  .signature-cell, .date-cell { width: 12%; }
  .calidad-cell { width: 46%; }

  .calidad-fields { display: flex; flex-direction: column; gap: 8px; }
  .calidad-fields.two-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    align-items: start;
  }
  .calidad-column {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .calidad-field { display: grid; grid-template-columns: 140px 1fr; gap: 8px; align-items: center; }
  .calidad-label { font-size: 12px; font-weight: 600; color: var(--primary-blue); }
  .calidad-field label { font-size: 12px; font-weight: 600; color: var(--primary-blue); }

  .calidad-field input[type="text"], .calidad-field textarea, .calidad-field select {
    padding: 4px 8px; border: 1px solid var(--border-grey); border-radius: 4px; font-size: 12px; transition: all 0.3s ease;
  }
  .calidad-field input[type="text"].filled, .calidad-field textarea.filled, .calidad-field select.filled { 
    border-color: var(--accent-yellow); 
    background-color: #fffbf0; 
  }
  .calidad-checkbox { width: 16px; height: 16px; accent-color: var(--accent-yellow); }
  .calidad-field input:focus, .calidad-field textarea:focus, .calidad-field select:focus { 
    outline: none; 
    border-color: var(--primary-blue); 
  }
  .calidad-select {
    width: 100%;
    background-color: var(--white);
    cursor: pointer;
  }
  .calidad-textarea {
    width: 100%;
    resize: vertical;
    font-family: inherit;
  }

  .signature-cell input, .date-cell input {
    width: 100%; padding: 8px; border: 1px solid var(--border-grey); border-radius: 4px; font-size: 12px; transition: all 0.3s ease;
  }
  .signature-cell input.filled, .date-cell input.filled { border-color: var(--accent-yellow); background-color: #fffbf0; }
  .signature-cell input:focus, .date-cell input:focus { outline: none; border-color: var(--primary-blue); }

  .readonly-field {
    padding: 8px; border: 1px solid var(--border-grey); border-radius: 4px; font-size: 12px; background-color: #f8f9fa; color: var(--light-grey); min-height: 20px; display: flex; align-items: center;
  }
  .readonly-field.filled { border-color: var(--accent-yellow); background-color: #fffbf0; color: var(--primary-blue); }
  
  .client-data-field {
    min-height: auto;
    padding: 12px;
    background-color: #f0f7ff;
    border-color: var(--primary-blue);
  }
  .client-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
  }
  .client-info strong {
    color: var(--primary-blue);
    font-size: 13px;
  }
  .client-detail {
    color: var(--light-grey);
    font-size: 11px;
  }
  
  .currency-input-wrapper {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .currency-symbol {
    color: var(--primary-blue);
    font-weight: 600;
    font-size: 14px;
  }
  .currency-input {
    flex: 1;
    padding: 4px 8px;
    border: 1px solid var(--border-grey);
    border-radius: 4px;
    font-size: 12px;
    transition: all 0.3s ease;
    text-align: right;
  }
  .currency-input.filled {
    border-color: var(--accent-yellow);
    background-color: #fffbf0;
  }
  .currency-input:focus {
    outline: none;
    border-color: var(--primary-blue);
  }

  .save-button-container {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 2px solid var(--border-grey);
  }
  .save-step-btn {
    width: 100%;
    padding: 10px 16px;
    background: linear-gradient(135deg, var(--primary-blue) 0%, #004080 100%);
    color: var(--white);
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .save-step-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #004080 0%, var(--primary-blue) 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 51, 102, 0.3);
  }
  .save-step-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .evidencias-btn {
    padding: 8px 16px;
    background: linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%);
    color: var(--white);
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .evidencias-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #45B7D1 0%, #4ECDC4 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(69, 183, 209, 0.3);
  }
  .evidencias-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Modal de Evidencias */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
  }
  .modal-content {
    background: var(--white);
    border-radius: 12px;
    max-width: 90vw;
    max-height: 90vh;
    width: 100%;
    max-width: 1200px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 2px solid var(--border-grey);
  }
  .modal-header h2 {
    color: var(--primary-blue);
    margin: 0;
    font-size: 20px;
  }
  .modal-close {
    background: none;
    border: none;
    font-size: 28px;
    color: var(--light-grey);
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s ease;
  }
  .modal-close:hover {
    background: #f0f0f0;
    color: var(--primary-blue);
  }
  .modal-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  }
  .no-evidencias {
    text-align: center;
    color: var(--light-grey);
    padding: 40px;
    font-size: 16px;
  }
  .evidencias-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }
  .evidencia-item {
    border: 2px solid var(--border-grey);
    border-radius: 8px;
    overflow: hidden;
    background: #f8f9fa;
  }
  .evidencia-label {
    padding: 10px;
    background: var(--primary-blue);
    color: var(--white);
    font-weight: 600;
    font-size: 14px;
    text-align: center;
  }
  .evidencia-image {
    width: 100%;
    height: 250px;
    object-fit: cover;
    display: block;
  }
  .evidencia-error {
    padding: 20px;
    text-align: center;
    color: var(--light-grey);
  }
  .evidencia-error a {
    color: var(--primary-blue);
    text-decoration: none;
    margin-top: 10px;
    display: inline-block;
  }
  .evidencia-error a:hover {
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    .checklist-table { font-size: 12px; }
    .checklist-table th, .checklist-table td { padding: 8px 5px; }
    .calidad-field { grid-template-columns: 1fr; }
    .calidad-fields.two-columns {
      grid-template-columns: 1fr;
      gap: 8px;
    }
    .status-btn, .status-indicator { width: 25px; height: 25px; font-size: 14px; }
    .evidencias-grid {
      grid-template-columns: 1fr;
    }
    .modal-content {
      max-width: 95vw;
      max-height: 95vh;
    }
  }

  /* Estilos para SOPORTE TECNICO - Tareas */
  .soporte-tareas-container {
    padding: 10px 0;
  }
  .soporte-fields {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid var(--border-grey);
  }
  @media (max-width: 768px) {
    .soporte-fields {
      grid-template-columns: 1fr;
    }
  }
  .tareas-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }
  .tareas-header h3 {
    color: var(--primary-blue);
    font-size: 16px;
    margin: 0;
  }
  .add-tarea-btn {
    padding: 8px 16px;
    background: linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%);
    color: var(--white);
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .add-tarea-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #45B7D1 0%, #4ECDC4 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(69, 183, 209, 0.3);
  }
  .add-tarea-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .tareas-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .tarea-item {
    border: 2px solid var(--border-grey);
    border-radius: 8px;
    padding: 15px;
    background: #f8f9fa;
  }
  .tarea-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border-grey);
  }
  .tarea-number {
    font-weight: 700;
    color: var(--primary-blue);
    font-size: 14px;
  }
  .tarea-date {
    color: var(--light-grey);
    font-size: 12px;
  }
  .edit-tarea-btn {
    padding: 4px 8px;
    background: var(--primary-blue);
    color: var(--white);
    border: none;
    border-radius: 4px;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .edit-tarea-btn:hover:not(:disabled) {
    background: #004080;
  }
  .edit-tarea-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .tarea-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .tarea-field {
    margin-bottom: 8px;
  }
  .tarea-field strong {
    color: var(--primary-blue);
    font-size: 12px;
    display: block;
    margin-bottom: 4px;
  }
  .tarea-field p {
    margin: 0;
    color: var(--light-grey);
    font-size: 13px;
    line-height: 1.5;
  }
  .tarea-status {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .status-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
  }
  .status-badge.procesada {
    background: #51cf66;
    color: var(--white);
  }
  .status-badge.pendiente {
    background: #ffd43b;
    color: var(--primary-blue);
  }
  .status-badge.pruebas {
    background: #4ECDC4;
    color: var(--white);
  }
  .notificacion-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
  }
  .notif-badge {
    padding: 3px 8px;
    background: #e8f0ff;
    color: var(--primary-blue);
    border-radius: 8px;
    font-size: 11px;
    font-weight: 500;
  }
  .no-tareas {
    text-align: center;
    padding: 30px;
    color: var(--light-grey);
  }
  .no-tareas p {
    margin: 5px 0;
  }

  /* Modal de Tarea */
  .tarea-modal {
    max-width: 600px;
  }
  .tarea-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .form-group label {
    color: var(--primary-blue);
    font-weight: 600;
    font-size: 14px;
  }
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-weight: 500;
  }
  .tarea-checkbox {
    width: 18px;
    height: 18px;
    accent-color: var(--primary-blue);
    cursor: pointer;
  }
  .tarea-textarea {
    width: 100%;
    padding: 10px;
    border: 2px solid var(--border-grey);
    border-radius: 6px;
    font-size: 13px;
    font-family: inherit;
    resize: vertical;
    transition: all 0.3s ease;
  }
  .tarea-textarea:focus {
    outline: none;
    border-color: var(--primary-blue);
  }
  .section-label {
    color: var(--primary-blue);
    font-weight: 700;
    font-size: 15px;
    margin-bottom: 10px;
  }
  .notificacion-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 10px;
    padding-top: 20px;
    border-top: 2px solid var(--border-grey);
  }
  .btn-cancel {
    padding: 10px 20px;
    background: var(--white);
    color: var(--primary-blue);
    border: 2px solid var(--primary-blue);
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .btn-cancel:hover {
    background: #f0f7ff;
  }
  .btn-save {
    padding: 10px 20px;
    background: linear-gradient(135deg, var(--primary-blue) 0%, #004080 100%);
    color: var(--white);
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .btn-save:hover {
    background: linear-gradient(135deg, #004080 0%, var(--primary-blue) 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 51, 102, 0.3);
  }

  @media (max-width: 768px) {
    .notificacion-options {
      grid-template-columns: 1fr;
    }
    .tarea-modal {
      max-width: 95vw;
    }
  }

  /* Estilos para FACTURACION */
  .facturacion-fields {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .pagos-parciales-field {
    margin-top: 10px;
  }
  .pagos-parciales-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .pago-parcial-item {
    display: flex;
    gap: 10px;
    align-items: flex-end;
    padding: 12px;
    border: 2px solid var(--border-grey);
    border-radius: 8px;
    background: #f8f9fa;
  }
  .pago-parcial-fields {
    display: flex;
    gap: 15px;
    flex: 1;
  }
  .pago-fecha-field,
  .pago-monto-field {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .pago-fecha-field label,
  .pago-monto-field label {
    font-size: 12px;
    font-weight: 600;
    color: var(--primary-blue);
  }
  .pago-parcial-item input[type="date"] {
    padding: 8px;
    border: 2px solid var(--border-grey);
    border-radius: 6px;
    font-size: 13px;
  }
  .remove-fecha-btn {
    padding: 6px 12px;
    background: #ff6b6b;
    color: var(--white);
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .remove-fecha-btn:hover:not(:disabled) {
    background: #ff5252;
  }
  .remove-fecha-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .add-fecha-btn {
    padding: 8px 16px;
    background: linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%);
    color: var(--white);
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    align-self: flex-start;
  }
  .add-fecha-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #45B7D1 0%, #4ECDC4 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(69, 183, 209, 0.3);
  }
  .add-fecha-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .montos-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 2px solid var(--border-grey);
  }
  .montos-section h4 {
    color: var(--primary-blue);
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 15px;
  }
  .montos-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
  }
  .total-field {
    background: #e8f0ff;
    border-color: var(--primary-blue);
    font-weight: 700;
    font-size: 15px;
    color: var(--primary-blue);
  }
  .fecha-item {
    padding: 4px 0;
    color: var(--light-grey);
    font-size: 13px;
  }

  @media (max-width: 768px) {
    .montos-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
