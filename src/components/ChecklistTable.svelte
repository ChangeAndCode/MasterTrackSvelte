<script>
  import { createEventDispatcher } from "svelte";
  import { auth } from "../stores/auth.js";
  import { getRoleColorByName, normalizeRoleKey } from "../stores/roleStore.js";

  // Datos que te pasa el padre (el checklist renderizable)
  export let checklistData = [];
  // Lista que viene del backend con los pasos que este usuario puede editar
  export let editableStepKeys = []; // p.ej. ["ALMACÉN", "CALIDAD", ...]

  const dispatch = createEventDispatcher();

  // Usuario/rol actual desde el store de auth
  $: me = $auth?.me || null;
  $: roleName = me?.role || "";                         // "Administrador", "Almacén", etc.
  $: roleKey = normalizeRoleKey(roleName);              // ADMIN, ALMACEN, ...
  $: isAdmin = roleKey === "ADMIN";
  $: roleColor = getRoleColorByName(roleName);

  function handleUpdate(id, field, value) {
    dispatch("update", { id, field, value });
  }

  function handleToggle(id) {
    dispatch("toggle", { id });
  }

  // función para saber si un aspecto es editable para el usuario actual
  const canEditAspect = (aspecto) => isAdmin || editableStepKeys.includes(aspecto);

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
          { key: "valido", label: "VÁLIDO", type: "checkbox" }
        ];
      case "PROGRAMADORES":
        return [
          { key: "ids", label: "ID'S", type: "checkbox" },
          { key: "valido", label: "VÁLIDO", type: "checkbox" }
        ];
      case "ALMACÉN":
        return [
          { key: "matCompleto", label: "MAT. COMPLETO", type: "checkbox" },
          { key: "numVale", label: "# DE VALE", type: "text" },
          { key: "hojaSalida", label: "# HOJA SALIDA", type: "checkbox" }
        ];
      case "CALIDAD":
        return [{ key: "observaciones", label: "OBSERVACIONES:", type: "textarea" }];
      case "TÉCNICO INSTALADOR":
        return [];
      case "SOPORTE TÉCNICO":
        return [
          { key: "procesada", label: "PROCESADA", type: "checkbox" },
          { key: "pruebas", label: "PRUEBAS", type: "checkbox" },
          { key: "notificacionCliente", label: "NOTIFICACION AL CLIENTE", type: "checkbox" }
        ];
      case "SALIDA DE MATERIAL (INSTALACION DE STOCK)":
        return [{ key: "hojaSalida", label: "# HOJA SALIDA", type: "text" }];
      case "FACTURACIÓN":
        return [];
      default:
        return [];
    }
  }
</script>

<div class="checklist-table-container">
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
        {@const isEditable = canEditAspect(item.aspecto)}

        <tr class="table-row {item.completado ? 'completed' : ''} {!isEditable ? 'readonly' : ''}">
          <td class="status-cell">
            {#if isEditable}
              <button
                class="status-btn {item.completado ? 'completed' : ''}"
                on:click={() => handleToggle(item.id)}
                title={item.completado ? 'Marcar como pendiente' : 'Marcar como completado'}>
                {#if item.completado} ✓ {:else} ○ {/if}
              </button>
            {:else}
              <div class="status-indicator {item.completado ? 'completed' : ''}">
                {#if item.completado} ✓ {:else} ○ {/if}
              </div>
            {/if}
          </td>

          <td class="aspecto-cell">
            <strong>{item.aspecto}</strong>
            {#if item.completado}
              <div class="completion-badge">Completado</div>
            {/if}
            {#if !isEditable}
              <div class="role-badge" style="background-color:{roleColor}">
                Solo lectura
              </div>
            {/if}
          </td>

          <td class="signature-cell">
            {#if isEditable}
              <input
                type="text"
                value={item.firmaResponsable}
                on:input={(e) => handleUpdate(item.id, "firmaResponsable", e.target.value)}
                placeholder="Firma responsable"
                class={item.firmaResponsable ? 'filled' : ''} />
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
                class={item.fecha ? 'filled' : ''} />
            {:else}
              <div class="readonly-field {item.fecha ? 'filled' : ''}">
                {item.fecha ? new Date(item.fecha).toLocaleDateString('es-ES') : 'No asignada'}
              </div>
            {/if}
          </td>

          <td class="calidad-cell">
            <div class="calidad-fields">
              {#each getCalidadFields(item.aspecto) as field}
                <div class="calidad-field">
                  <label>{field.label}</label>
                  {#if isEditable}
                    {#if field.type === 'checkbox'}
                      <input
                        type="checkbox"
                        checked={item.calidad[field.key]}
                        on:change={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.checked)}
                        class="calidad-checkbox" />
                    {:else if field.type === 'text'}
                      <input
                        type="text"
                        value={item.calidad[field.key] || ''}
                        on:input={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.value)}
                        placeholder={field.label}
                        class={item.calidad[field.key] ? 'filled' : ''} />
                    {:else if field.type === 'textarea'}
                      <textarea
                        value={item.calidad[field.key] || ''}
                        on:input={(e) => handleUpdate(item.id, `calidad.${field.key}`, e.target.value)}
                        placeholder={field.label}
                        rows="2"
                        class={item.calidad[field.key] ? 'filled' : ''}></textarea>
                    {/if}
                  {:else}
                    <div class="readonly-field {item.calidad[field.key] ? 'filled' : ''}">
                      {#if field.type === 'checkbox'}
                        {item.calidad[field.key] ? '✓' : '○'}
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

  .table-row {
    transition: all 0.3s ease;
  }

  .table-row:hover {
    background-color: #f8f9fa;
  }

  .table-row.completed {
    background-color: #e8f5e8;
  }

  .table-row.readonly {
    opacity: 0.7;
  }

  .table-row.readonly:hover {
    background-color: #f0f0f0;
  }

  .status-cell {
    width: 8%;
    text-align: center;
  }

  .status-btn {
    width: 30px;
    height: 30px;
    border: 2px solid var(--border-grey);
    border-radius: 50%;
    background: var(--white);
    color: var(--border-grey);
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .status-btn:hover {
    border-color: var(--accent-yellow);
    color: var(--accent-yellow);
  }

  .status-btn.completed {
    background-color: var(--accent-yellow);
    border-color: var(--accent-yellow);
    color: var(--white);
  }

  .status-indicator {
    width: 30px;
    height: 30px;
    border: 2px solid var(--border-grey);
    border-radius: 50%;
    background: var(--white);
    color: var(--border-grey);
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .status-indicator.completed {
    background-color: var(--accent-yellow);
    border-color: var(--accent-yellow);
    color: var(--white);
  }

  .aspecto-cell {
    width: 22%;
    font-weight: 500;
    color: var(--primary-blue);
    position: relative;
  }

  .completion-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background-color: var(--accent-yellow);
    color: var(--white);
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    font-weight: bold;
  }

  .role-badge {
    position: absolute;
    bottom: -5px;
    right: -5px;
    color: var(--white);
    font-size: 8px;
    padding: 2px 4px;
    border-radius: 8px;
    font-weight: bold;
  }

  .signature-cell,
  .date-cell {
    width: 12%;
  }

  .calidad-cell {
    width: 46%;
  }

  .calidad-fields {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .calidad-field {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .calidad-field label {
    font-size: 12px;
    font-weight: 500;
    color: var(--primary-blue);
    min-width: 120px;
  }

  .calidad-field input[type="text"],
  .calidad-field textarea {
    padding: 4px 8px;
    border: 1px solid var(--border-grey);
    border-radius: 4px;
    font-size: 12px;
    flex: 1;
    transition: all 0.3s ease;
  }

  .calidad-field input[type="text"].filled,
  .calidad-field textarea.filled {
    border-color: var(--accent-yellow);
    background-color: #fffbf0;
  }

  .calidad-checkbox {
    width: 16px;
    height: 16px;
    accent-color: var(--accent-yellow);
  }

  .calidad-field input:focus,
  .calidad-field textarea:focus {
    outline: none;
    border-color: var(--primary-blue);
  }

  .signature-cell input,
  .date-cell input {
    width: 100%;
    padding: 8px;
    border: 1px solid var(--border-grey);
    border-radius: 4px;
    font-size: 12px;
    transition: all 0.3s ease;
  }

  .signature-cell input.filled,
  .date-cell input.filled {
    border-color: var(--accent-yellow);
    background-color: #fffbf0;
  }

  .signature-cell input:focus,
  .date-cell input:focus {
    outline: none;
    border-color: var(--primary-blue);
  }

  .readonly-field {
    padding: 8px;
    border: 1px solid var(--border-grey);
    border-radius: 4px;
    font-size: 12px;
    background-color: #f8f9fa;
    color: var(--light-grey);
    min-height: 20px;
    display: flex;
    align-items: center;
  }

  .readonly-field.filled {
    border-color: var(--accent-yellow);
    background-color: #fffbf0;
    color: var(--primary-blue);
  }

  @media (max-width: 768px) {
    .checklist-table {
      font-size: 12px;
    }

    .checklist-table th,
    .checklist-table td {
      padding: 8px 5px;
    }

    .calidad-field {
      flex-direction: column;
      align-items: stretch;
      gap: 4px;
    }

    .calidad-field label {
      min-width: auto;
    }

    .status-btn,
    .status-indicator {
      width: 25px;
      height: 25px;
      font-size: 14px;
    }
  }
</style>
