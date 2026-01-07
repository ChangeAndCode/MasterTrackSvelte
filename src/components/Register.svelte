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
      // Vuelve a la vista de login en el mismo SPA (uso de hash)
      setTimeout(() => {
        if (location.hash) location.hash = "";
      }, 900);
    } catch (err) {
      error = err?.message || "No se pudo registrar";
    } finally {
      loading = false;
    }
  }
</script>

<div class="auth-container">
  <div class="auth-card register-card">
    <div class="auth-header">
      <div class="logo-icon">
        <span class="logo-m">M</span>
        <div class="antenna"></div>
      </div>
      <h1>Crear cuenta</h1>
      <p class="auth-subtitle">Únete a MasterTrack y comienza a gestionar</p>
    </div>

    <form on:submit|preventDefault={onSubmit} class="register-form">
      <div class="form-group">
        <label for="username">Usuario</label>
        <input 
          id="username"
          type="text" 
          bind:value={username} 
          required 
          maxlength="100"
          placeholder="Ingresa tu nombre de usuario"
        />
      </div>

      <div class="form-group">
        <label for="email">Correo electrónico</label>
        <input 
          id="email"
          type="email" 
          bind:value={email} 
          required 
          maxlength="200"
          placeholder="tu@correo.com"
        />
      </div>

      <div class="form-group">
        <label for="password">Contraseña</label>
        <input 
          id="password"
          type="password" 
          bind:value={password} 
          required 
          minlength="6"
          placeholder="Mínimo 6 caracteres"
        />
      </div>

      <div class="form-group">
        <label for="role">Rol</label>
        <select id="role" bind:value={role} required>
          <option value="" disabled selected>Selecciona un rol…</option>
          {#each ROLE_OPTIONS as r}
            <option value={r}>{ROLE_LABELS[r] ?? r}</option>
          {/each}
        </select>
      </div>

      {#if error}
        <div class="message error-message">
          <span class="message-icon">⚠️</span>
          <span>{error}</span>
        </div>
      {/if}

      {#if success}
        <div class="message success-message">
          <span class="message-icon">✅</span>
          <span>{success}</span>
        </div>
      {/if}

      <button type="submit" class="btn-submit" disabled={loading}>
        {#if loading}
          <span class="btn-loading">⏳</span>
          <span>Creando cuenta...</span>
        {:else}
          <span>Crear cuenta</span>
        {/if}
      </button>

      <div class="auth-footer">
        <p>¿Ya tienes cuenta? <a href="#" class="auth-link" on:click|preventDefault={() => location.hash = ""}>Iniciar sesión</a></p>
      </div>
    </form>
  </div>
</div>
