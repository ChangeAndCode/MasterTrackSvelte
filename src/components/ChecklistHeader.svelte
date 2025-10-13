<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { searchClients } from '../api/checklistApi.js';

  const dispatch = createEventDispatcher();

  let query = '';
  let take = 20;

  let loading = false;
  let results = [];
  let open = false;
  let focusedIndex = -1;
  let errorMsg = '';
  let selectedClient = null;

  let debounceId;

  function triggerSearch() {
    clearTimeout(debounceId);

    if (!query || query.trim().length < 1) {
      results = [];
      open = false;
      errorMsg = '';
      return;
    }

    debounceId = setTimeout(async () => {
      loading = true;
      errorMsg = '';
      try {
        const list = await searchClients(query.trim(), take);
        results = Array.isArray(list) ? list : [];
        open = results.length > 0;
        focusedIndex = results.length ? 0 : -1;
      } catch (err) {
        console.error(err);
        errorMsg = 'No se pudo buscar clientes. Verifica tu sesión.';
        results = [];
        open = false;
      } finally {
        loading = false;
      }
    }, 300);
  }

  function onPick(item) {
    open = false;
    focusedIndex = -1;
    selectedClient = item;
    query = item.name || '';
    dispatch('selectClient', item);
  }

  function onKeydown(e) {
    if (!open || !results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusedIndex = (focusedIndex + 1) % results.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusedIndex = (focusedIndex - 1 + results.length) % results.length;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && results[focusedIndex]) onPick(results[focusedIndex]);
    } else if (e.key === 'Escape') {
      open = false;
    }
  }

  function formatDate(v) {
    if (!v) return '';
    const d = new Date(v);
    if (isNaN(d)) return '';
    return d.toLocaleDateString();
  }

  // Cerrar dropdown al hacer click fuera
  let rootEl;
  function onWindowClick(e) {
    if (!rootEl) return;
    if (!rootEl.contains(e.target)) open = false;
  }

  onMount(() => {
    window.addEventListener('click', onWindowClick);
    return () => window.removeEventListener('click', onWindowClick);
  });
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
</style>
