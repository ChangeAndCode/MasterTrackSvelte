<script>
  import { registerUser } from "../api/api.js";
  import { ROLE_OPTIONS, ROLE_LABELS } from "../data/roles.js";

  let username = "";
  let email = "";
  let password = "";
  let role = ""; // requerido
  let loading = false;
  let error = "";
  let success = "";

  async function onSubmit(e) {
    e.preventDefault();
    error = ""; success = "";
    if (!role) { error = "Selecciona un rol"; return; }
    loading = true;
    try {
      const r = await registerUser({ username, email, password, role });
      success = "Usuario registrado. Ahora puedes iniciar sesión.";
      // Limpia y redirige al login si quieres:
      setTimeout(() => window.location.assign("/login"), 900);
    } catch (err) {
      error = err?.message || "No se pudo registrar";
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit|preventDefault={onSubmit} class="register">
  <h1>Crear cuenta</h1>

  <label>Usuario
    <input type="text" bind:value={username} required maxlength="100" />
  </label>

  <label>Correo
    <input type="email" bind:value={email} required maxlength="200" />
  </label>

  <label>Contraseña
    <input type="password" bind:value={password} required minlength="6" />
  </label>

  <label>Rol
    <select bind:value={role} required>
      <option value="" disabled selected>Selecciona un rol…</option>
      {#each ROLE_OPTIONS as r}
        <option value={r}>{ROLE_LABELS[r] ?? r}</option>
      {/each}
    </select>
  </label>

  {#if error}<p class="error">{error}</p>{/if}
  {#if success}<p class="ok">{success}</p>{/if}

  <button type="submit" disabled={loading}>
    {#if loading}Creando…{/if}{#if !loading}Crear cuenta{/if}
  </button>
</form>

<style>
  .register{max-width:420px;margin:4rem auto;padding:1.25rem;border:1px solid #eee;border-radius:12px;display:grid;gap:.75rem}
  label{display:grid;gap:.35rem}
  input,select{padding:.6rem .7rem;border:1px solid #ccc;border-radius:8px}
  .error{color:#b00020;margin:.25rem 0}
  .ok{color:#177245;margin:.25rem 0}
  button[disabled]{opacity:.7;cursor:not-allowed}
</style>
