<script>
  import { createEventDispatcher } from 'svelte';
  import { searchCustomers } from "../api/api.js";

  const dispatch = createEventDispatcher();

  let query = "";
  let results = [];
  let loading = false;

    // --- Acción: cerrar cuando se hace click fuera ---
  function clickOutside(node) {
    const onMouseDown = (e) => {
      if (!node.contains(e.target)) {
        results = [];        // oculta el dropdown
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return {
      destroy() {
        document.removeEventListener('mousedown', onMouseDown);
      }
    };
  }

  // Buscar clientes al presionar el botón
  async function buscarClientes() {
    if (!query || query.length < 1) {
      results = [];
      return;
    }

    loading = true;
    try {
      results = await searchCustomers(query, 10);
    } catch (err) {
      console.error("Error al buscar clientes:", err);
      results = [];
    } finally {
      loading = false;
    }
  }

  // Seleccionar cliente del dropdown
  function selectClient(c) {
    query = c.razonSocial;
    results = [];
    dispatch("update", { field: "cliente", value: c.razonSocial, id: c.id });
  }

  // Fecha por defecto = hoy
  let fecha = new Date().toISOString().split("T")[0];
</script>

<div class="checklist-header">
  <div class="header-top">
    <div class="logo-section">
      <div class="logo-icon">
        <span class="logo-m">M</span>
        <div class="antenna"></div>
      </div>
      <div class="logo-text">
        <h1>MASTERTRACK</h1>
      </div>
    </div>

    <div class="title-section">
      <h2>CHECKLIST DE CONTROL</h2>
    </div>

    <div class="document-info">
      <p>REG-OPN-001 REV 00</p>
      <p>PÁGINA 1 DE 1</p>
    </div>
  </div>

  <div class="client-info">
    <div class="info-field">
      <label>CLIENTE:</label>

      <div class="input-wrap" use:clickOutside>
        <input
          class="inputClient"
          type="text"
          bind:value={query}
          placeholder="Nombre del cliente"
          autocomplete="off"
          on:keydown={(e) => { if (e.key === 'Escape') results = []; }} 
        />

        {#if loading}
          <div class="suggestions suggestions--loading">Cargando...</div>
        {/if}

        {#if results.length > 0}
          <ul class="suggestions">
            {#each results as c}
              <li on:mousedown|preventDefault={() => selectClient(c)}>
                {c.razonSocial} ({c.id})
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <button
        class="searchButton"
        type="button"
        on:click|preventDefault={buscarClientes}
      >
        Buscar
      </button>
    </div>

    <div class="info-field">
      <label>FECHA:</label>
      <input
        type="date"
        bind:value={fecha}
        on:input={(e) => dispatch("update", { field: "fecha", value: e.target.value })}
      />
    </div>
  </div>
</div>

<style>
  .checklist-header {
    background-color: var(--white);
    border: 2px solid var(--primary-blue);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    overflow: visible;
  }

  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .logo-section {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .logo-icon {
    position: relative;
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, var(--primary-blue) 50%, var(--secondary-red) 50%);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo-m {
    color: var(--white);
    font-size: 20px;
    font-weight: bold;
  }

  .antenna {
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 3px;
    height: 10px;
    background-color: var(--secondary-red);
    border-radius: 2px;
  }

  .logo-text h1 {
    font-size: 16px;
    font-weight: bold;
    color: var(--primary-blue);
  }

  .title-section h2 {
    color: var(--primary-blue);
    font-size: 24px;
    font-weight: bold;
    text-align: center;
  }

  .document-info {
    text-align: right;
  }

  .document-info p {
    color: var(--primary-blue);
    font-size: 12px;
    margin: 2px 0;
  }

  .client-info {
    display: flex;
    gap: 30px;
    align-items: flex-start;
  }

  .info-field {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .info-field label {
    color: var(--primary-blue);
    font-weight: bold;
    font-size: 14px;
    min-width: 80px;
  }

  .info-field input {
    padding: 8px 12px;
    border: 1px solid var(--border-grey);
    border-radius: 4px;
    font-size: 14px;
    min-width: 200px;
  }

  .info-field input:focus {
    outline: none;
    border-color: var(--primary-blue);
  }

  .inputClient{
    background: var(--white); 
  }

  .input-wrap {
  position: relative;
  width: 280px;              /* ajusta al tamaño que quieras del input */
  }

  .searchButton{
    background: var(--white);
    color: var(--primary-blue);
    border: 2px solid var(--primary-blue);
    border-radius: 6px;
    padding: 6px 12px;
    font-weight: 600;
  }

  .suggestions {
  position: absolute;
  top: calc(100% + 6px);     /* justo debajo del input */
  left: 0;
  right: 0;                  /* ancho = ancho del input */
  background: var(--white);
  border: 1px solid var(--border-grey);
  border-radius: 6px;
  list-style: none;
  padding: 6px 0;
  margin: 0;
  max-height: 240px;
  overflow-y: auto;
  z-index: 5000;             /* por encima de tarjetas vecinas */
  box-shadow: 0 8px 24px rgba(0,0,0,.08);
}
.suggestions--loading {
  padding: 8px 12px;
  font-size: 14px;
  color: var(--light-grey);
}
  .suggestions li {
    padding: 8px 12px;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .suggestions li:hover {
    background: #f3f7fd;
  }

  .info-field button:hover {
    border-color: var(--accent-yellow) ;
  }

  @media (max-width: 768px) {
    .header-top {
      flex-direction: column;
      gap: 15px;
      text-align: center;
    }

    .client-info {
      flex-direction: column;
      gap: 15px;
      align-items: stretch;
    }

    .info-field {
      flex-direction: column;
      align-items: stretch;
      gap: 5px;
    }

    .info-field input {
      min-width: auto;
    }

    .input-wrap { width: 100%; }
  }
</style>