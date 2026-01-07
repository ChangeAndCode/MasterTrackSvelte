<script>  import { createEventDispatcher, onMount } from "svelte";
  import {
    searchClients,
    getClientDocumentInfo,
    getClientChecklists,
    createChecklist,
  } from "../api/checklistApi.js";
  import { auth } from "../stores/auth.js";
  import { normalizeRoleKey } from "../stores/roleStore.js";

  const dispatch = createEventDispatcher();

  let query = "";
  let take = 20;

  let loading = false;
  let results = [];
  let open = false;
  let focusedIndex = -1;
  let errorMsg = "";
  let selectedClient = null;

  // dropdown de cambio de orden
  let showOrderMenu = false;
  let docInfoEl; // contenedor para click-outside

  // datos para document-info y paginacion de ordenes
  let docInfo = null; // { hasChecklist, code, totalPages } | null
  let clientChecklists = []; // lista de ordenes del cliente
  let activeChecklist = null; // orden activa/seleccionada
  let createError = "";
  let creating = false;

  // indices calculados
  $: totalOrders = clientChecklists?.length ?? 0;
  $: currentIndex =
    activeChecklist && totalOrders
      ? clientChecklists.findIndex((c) => c.id === activeChecklist.id)
      : -1;
  $: dispatch(
    "selectChecklist",
    activeChecklist
      ? { id: activeChecklist.id, folio: activeChecklist.folio, clientId: selectedClient?.id }
      : null
  );
  $: me = $auth?.me || null;
  $: roleName = me?.role || "";
  $: roleKey = normalizeRoleKey(roleName);
  $: canCreateChecklist = roleKey === "VENDEDOR" || roleKey === "ADMIN";

  let debounceId;

  function triggerSearch() {
    clearTimeout(debounceId);
    if (!query || query.trim().length < 2) {
      results = [];
      open = false;
      errorMsg = "";
      return;
    }
    debounceId = setTimeout(async () => {
      loading = true;
      errorMsg = "";
      try {
        const list = await searchClients(query.trim(), take);
        results = Array.isArray(list) ? list : [];
        open = results.length > 0;
        focusedIndex = results.length ? 0 : -1;
      } catch (err) {
        console.error(err);
        errorMsg = "No se pudo buscar clientes. Verifica tu sesion.";
        results = [];
        open = false;
      } finally {
        loading = false;
      }
    }, 300);
  }

  async function onPick(item) {
    open = false;
    focusedIndex = -1;
    selectedClient = item;
    query = item.name || "";
    dispatch("selectClient", item);

    // Cargar document-info
    try {
      docInfo = await getClientDocumentInfo(item.id);
    } catch (e) {
      console.error(e);
      docInfo = null;
    }

    // Cargar lista de ordenes del cliente y definir la activa
    try {
      clientChecklists = await getClientChecklists(item.id);
      activeChecklist = clientChecklists?.[0] ?? null; // mas antigua primero
    } catch (e) {
      console.error(e);
      clientChecklists = [];
      activeChecklist = null;
    }
  }

  function onKeydown(e) {
    if (!open || !results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusedIndex = (focusedIndex + 1) % results.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusedIndex = (focusedIndex - 1 + results.length) % results.length;
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && results[focusedIndex]) onPick(results[focusedIndex]);
    } else if (e.key === "Escape") {
      open = false;
    }
  }

  function formatDate(v) {
    if (!v) return "";
    const d = new Date(v);
    if (isNaN(d)) return "";
    return d.toLocaleDateString();
  }

  // cerrar dropdown al hacer click fuera
  let rootEl;
  function onWindowClick(e) {
    if (!rootEl) return;
    const clickedInsideSearch = rootEl.contains(e.target);
    const clickedInsideOrders = docInfoEl && docInfoEl.contains(e.target);
    if (!clickedInsideSearch) open = false;
    if (!clickedInsideOrders) showOrderMenu = false;
  }

  onMount(() => {
    window.addEventListener("click", onWindowClick);
    return () => window.removeEventListener("click", onWindowClick);
  });

  function selectOrderByIndex(i) {
    if (!clientChecklists || i < 0 || i >= clientChecklists.length) return;
    activeChecklist = clientChecklists[i];
    showOrderMenu = false;
  }

  async function onCreateChecklist() {
    if (!selectedClient?.id || !canCreateChecklist || creating) return;
    createError = "";
    creating = true;
    try {
      const payload = { clientId: selectedClient.id, date: new Date().toISOString() };
      const created = await createChecklist(payload);
      clientChecklists = [created, ...(clientChecklists || [])];
      activeChecklist = created;
    } catch (e) {
      createError = e?.message || "No se pudo crear el checklist";
    } finally {
      creating = false;
    }
  }
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

    <!-- DOCUMENT-INFO DINAMICO -->
    <div class="document-info order-switch" bind:this={docInfoEl}>
      {#if totalOrders > 0 && currentIndex >= 0}
        <p>{activeChecklist?.folio ?? (docInfo?.code || 'REG-OPN-001')}</p>
        <p>PAGINA {currentIndex + 1} DE {totalOrders}</p>
        {#if totalOrders > 1}
          <button
            type="button"
            class="order-btn"
            on:click={() => (showOrderMenu = !showOrderMenu)}
            aria-haspopup="listbox"
            aria-expanded={showOrderMenu}
          >
            cambiar
          </button>
          {#if showOrderMenu}
            <div class="order-menu" role="listbox">
              {#each clientChecklists as o, i}
                <div
                  role="option"
                  class="order-item {i === currentIndex ? 'active' : ''}"
                  on:click={() => selectOrderByIndex(i)}
                >
                  <span class="order-index">{i + 1}</span>
                  <span class="order-folio">{o.folio}</span>
                  <span class="order-date">{formatDate(o.createdAt)}</span>
                </div>
              {/each}
            </div>
          {/if}
        {/if}
      {:else}
        <p>sin checklist u ordenes de compra</p>
        <p>sin paginas</p>
      {/if}
    </div>
  </div>

  <div class="chk-header" bind:this={rootEl}>
    <div class="field" style="position: relative;">
      <label>Buscar cliente por nombre</label>
      <input
        type="text"
        placeholder="Ej. ACME"
        bind:value={query}
        on:input={triggerSearch}
        on:keydown={onKeydown}
        autocomplete="off"
      />

      {#if loading}
        <div class="loading">Buscando…</div>
      {/if}

      {#if errorMsg}
        <div class="error">{errorMsg}</div>
      {/if}

      {#if open && results.length}
        <div class="dropdown">
          {#each results as item, i}
            <div class="row" class:active={i === focusedIndex} on:click={() => onPick(item)}>
              <div>{item.name}</div>
              <div class="muted">{formatDate(item.registeredAt)}</div>
            </div>
          {/each}
        </div>
      {/if}

      {#if selectedClient}
        <div class="selected-info">
          Registrado: <strong>{formatDate(selectedClient.registeredAt)}</strong>
        </div>
      {/if}

      {#if canCreateChecklist && selectedClient}
        <div class="create-cta">
          <button type="button" class="order-btn primary" on:click={onCreateChecklist} disabled={creating}>
            {#if creating}Creando…{:else}Crear checklist{/if}
          </button>
          {#if createError}<div class="error">{createError}</div>{/if}
        </div>
      {/if}
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

  .logo-section { display: flex; align-items: center; gap: 15px; }
  .logo-icon { position: relative; width: 40px; height: 40px; background: linear-gradient(135deg, var(--primary-blue) 50%, var(--secondary-red) 50%); border-radius: 6px; display: flex; align-items: center; justify-content: center; }
  .logo-m { color: var(--white); font-size: 20px; font-weight: bold; }
  .antenna { position: absolute; top: -6px; left: 50%; transform: translateX(-50%); width: 3px; height: 10px; background-color: var(--secondary-red); border-radius: 2px; }
  .logo-text h1 { font-size: 16px; font-weight: bold; color: var(--primary-blue); }
  .title-section h2 { color: var(--primary-blue); font-size: 24px; font-weight: bold; text-align: center; }
  .document-info { text-align: right; }
  .document-info p { color: var(--primary-blue); font-size: 12px; margin: 2px 0; }

  @media (max-width: 768px) {
    .header-top { flex-direction: column; gap: 15px; text-align: center; }
    .document-info { text-align: center; }
  }

  .dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0; right: 0;
    background: var(--white);
    border: 1px solid var(--border-grey);
    border-radius: 6px;
    margin: 0;
    padding: 6px 0;
    max-height: 240px;
    overflow-y: auto;
    z-index: 5000;
    box-shadow: 0 8px 24px rgba(0,0,0,.08);
  }
  .row { padding: 8px 12px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row:hover, .row.active { background: #f3f7fd; }
  .muted { color: var(--light-grey); font-size: 12px; }
  .loading { font-size: 14px; color: var(--light-grey); margin-top: 4px; }
  .error { color: #b91c1c; font-size: 14px; margin-top: 4px; }
  .selected-info { margin-top: 8px; font-size: 14px; color: var(--primary-blue); }

  .order-switch { position: relative; text-align: right; }
  .order-btn { margin-top: 6px; padding: 4px 8px; border: 1px solid var(--primary-blue); background: var(--white); color: var(--primary-blue); border-radius: 6px; font-size: 12px; cursor: pointer; }
  .order-btn:hover { background: #f3f7fd; }
  .order-btn.primary { background: var(--primary-blue); color: var(--white); }
  .order-btn.primary:disabled { opacity: .7; cursor: not-allowed; }
  .order-menu { position: absolute; right: 0; top: calc(100% + 6px); background: var(--white); border: 1px solid var(--border-grey); border-radius: 6px; min-width: 240px; box-shadow: 0 8px 24px rgba(0,0,0,.08); z-index: 6000; max-height: 260px; overflow: auto; }
  .order-item { display: grid; grid-template-columns: 28px 1fr auto; gap: 8px; align-items: center; padding: 8px 12px; cursor: pointer; }
  .order-item:hover, .order-item.active { background: #f3f7fd; }
  .order-index { font-weight: 700; color: var(--primary-blue); }
  .order-folio { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .order-date { font-size: 11px; color: var(--light-grey); }
  .create-cta { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }

  .order-item:hover, .order-item.active { background: #f3f7fd; }
  .order-index { font-weight: 700; color: var(--primary-blue); }
  .order-folio { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .order-date { font-size: 11px; color: var(--light-grey); }

</style>
