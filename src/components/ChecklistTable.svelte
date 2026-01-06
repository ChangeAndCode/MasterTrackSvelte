<script>
  import { createEventDispatcher } from "svelte";
  import { auth } from "../stores/auth.js";
  import { getRoleColorByName, normalizeRoleKey } from "../stores/roleStore.js";

  // ===== Props del padre =====
  export let checklistData = [];           // Estructura visual que se renderiza siempre
  export let editableStepKeys = [];        // StepKeys reales desde backend (p.ej. ["ALMACEN","TECNICO"])
  export let checklistId = null;           // null => sin orden seleccionada
  export let folio = null;
  export let steps = [];                   // [{ stepKey, status, data }] (aun no mapeado a campos visuales)
  export let stats = { totalSteps: 0, done: 0, myPending: 0 };
  export let loadingDetail = false;        // Para bloquear inputs durante carga

  const dispatch = createEventDispatcher();

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
      case "SALIDA DE MATERIAL (INSTALACION DE STOCK)": return null; // sin stepKey definido
      case "FACTURACION": return "FACTURACION";
      default: return null;
    }
  }

  // ===== Permiso real por fila =====
  const canEditItem = (item) => {
    if (isAdmin) return true;
    const k = aspectoToStepKey(item);
    return !!k && editableStepKeys.includes(k);
  };

  // ===== Campos de "Calidad" por aspecto (layout actual) =====
  function getCalidadFields(aspecto) {
    switch (aspecto) {
      case "GENERAR ORDEN DE COMPRA":
        return [
          { key: "datosCte", label: "DATOS CTE", type: "checkbox" },
          { key: "checklist", label: "CHECKLIST", type: "checkbox" },
          { key: "comodato", label: "COMODATO", type: "checkbox" },
          { key: "garantia", label: "GARANTIA", type: "checkbox" },
          { key: "cortesia", label: "CORTESIA", type: "checkbox" },
          { key: "demo", label: "DEMO", type: "checkbox" },
          { key: "precioRenta", label: "PRECIO RENTA", type: "checkbox" },
          { key: "folio", label: "FOLIO", type: "text" },
          { key: "numProgServ", label: "# DE PROG. SERV", type: "text" }
        ];
      case "COORDINACION DE SERVICIOS":
        return [
          { key: "validado", label: "VALIDADO", type: "checkbox" },
          { key: "valido", label: "VALIDO", type: "checkbox" }
        ];
      case "PROGRAMADORES":
        return [
          { key: "ids", label: "ID'S", type: "checkbox" },
          { key: "valido", label: "VALIDO", type: "checkbox" }
        ];
      case "ALMACEN":
        return [
          { key: "matCompleto", label: "MAT. COMPLETO", type: "checkbox" },
          { key: "numVale", label: "# DE VALE", type: "text" },
          { key: "hojaSalida", label: "# HOJA SALIDA", type: "checkbox" }
        ];
      case "CALIDAD":
        return [{ key: "observaciones", label: "OBSERVACIONES", type: "textarea" }];
      case "TECNICO INSTALADOR":
        return [];
      case "SOPORTE TECNICO":
        return [
          { key: "procesada", label: "PROCESADA", type: "checkbox" },
          { key: "pruebas", label: "PRUEBAS", type: "checkbox" },
          { key: "notificacionCliente", label: "NOTIFICACION AL CLIENTE", type: "checkbox" }
        ];
      case "SALIDA DE MATERIAL (INSTALACION DE STOCK)":
        return [{ key: "hojaSalida", label: "# HOJA SALIDA", type: "text" }];
      case "FACTURACION":
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
            {#if isEditable}
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
            {#if isEditable}
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
                    <div class="calidad-label">{field.label}</div>
                    <div class="readonly-field {item.calidad[field.key] ? 'filled' : ''}">
                      {#if field.type === 'checkbox'}
                        {item.calidad[field.key] ? 'Si' : 'No'}
                      {:else}
                        {item.calidad[field.key] || 'No especificado'}
                      {/if}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .checklist-table-container {
    overflow-x: auto;
    margin: 20px 0;
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
    border-collapse: collapse;
    background-color: var(--white);
    border: 2px solid var(--primary-blue);
    border-radius: 8px;
    overflow: hidden;
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
  .calidad-field { display: grid; grid-template-columns: 140px 1fr; gap: 8px; align-items: center; }
  .calidad-label { font-size: 12px; font-weight: 600; color: var(--primary-blue); }
  .calidad-field label { font-size: 12px; font-weight: 600; color: var(--primary-blue); }

  .calidad-field input[type="text"], .calidad-field textarea {
    padding: 4px 8px; border: 1px solid var(--border-grey); border-radius: 4px; font-size: 12px; transition: all 0.3s ease;
  }
  .calidad-field input[type="text"].filled, .calidad-field textarea.filled { border-color: var(--accent-yellow); background-color: #fffbf0; }
  .calidad-checkbox { width: 16px; height: 16px; accent-color: var(--accent-yellow); }
  .calidad-field input:focus, .calidad-field textarea:focus { outline: none; border-color: var(--primary-blue); }

  .signature-cell input, .date-cell input {
    width: 100%; padding: 8px; border: 1px solid var(--border-grey); border-radius: 4px; font-size: 12px; transition: all 0.3s ease;
  }
  .signature-cell input.filled, .date-cell input.filled { border-color: var(--accent-yellow); background-color: #fffbf0; }
  .signature-cell input:focus, .date-cell input:focus { outline: none; border-color: var(--primary-blue); }

  .readonly-field {
    padding: 8px; border: 1px solid var(--border-grey); border-radius: 4px; font-size: 12px; background-color: #f8f9fa; color: var(--light-grey); min-height: 20px; display: flex; align-items: center;
  }
  .readonly-field.filled { border-color: var(--accent-yellow); background-color: #fffbf0; color: var(--primary-blue); }

  @media (max-width: 768px) {
    .checklist-table { font-size: 12px; }
    .checklist-table th, .checklist-table td { padding: 8px 5px; }
    .calidad-field { grid-template-columns: 1fr; }
    .status-btn, .status-indicator { width: 25px; height: 25px; font-size: 14px; }
  }
</style>
