<script>
  import { onMount, onDestroy } from "svelte";
  import { loginDotNet } from "../api/api.js";
  import Register from "./Register.svelte";

  let username = "";
  let password = "";
  let loading = false;
  let error = "";

  // vista local: 'login' | 'register' según el hash
  let view = location.hash === "#/register" ? "register" : "login";
  const onHash = () => (view = location.hash === "#/register" ? "register" : "login");

  onMount(() => window.addEventListener("hashchange", onHash));
  onDestroy(() => window.removeEventListener("hashchange", onHash));

  async function onSubmit(e) {
    e.preventDefault();
    error = "";
    loading = true;
    try {
      await loginDotNet(username, password); // setAuth ocurre dentro
      // no hace falta redirigir: App.svelte verá $auth.isAuthenticated y pintará Checklist
      // si quieres, puedes limpiar el hash:
      if (location.hash) location.hash = "";
    } catch (err) {
      error = err?.message || "No se pudo iniciar sesión";
    } finally {
      loading = false;
    }
  }
</script>

{#if view === "register"}
  <!-- pantalla de registro -->
  <Register />
{:else}
  <!-- pantalla de login -->
  <div class="auth-container">
    <div class="auth-card login-card">
      <div class="auth-header">
        <div class="logo-icon">
          <span class="logo-m">M</span>
          <div class="antenna"></div>
        </div>
        <h1>Iniciar sesión</h1>
        <p class="auth-subtitle">Accede a tu cuenta de MasterTrack</p>
      </div>

      <form on:submit|preventDefault={onSubmit} class="login-form">
        <div class="form-group">
          <label for="username">Usuario</label>
          <input 
            id="username"
            type="text" 
            bind:value={username} 
            required 
            placeholder="Ingresa tu usuario"
          />
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <input 
            id="password"
            type="password" 
            bind:value={password} 
            required 
            placeholder="Ingresa tu contraseña"
          />
        </div>

        {#if error}
          <div class="message error-message">
            <span class="message-icon">⚠️</span>
            <span>{error}</span>
          </div>
        {/if}

        <button type="submit" class="btn-submit" disabled={loading}>
          {#if loading}
            <span class="btn-loading">⏳</span>
            <span>Entrando...</span>
          {:else}
            <span>Entrar</span>
          {/if}
        </button>

        <div class="auth-footer">
          <p>¿No tienes cuenta? <a href="#/register" class="auth-link">Crear cuenta nueva</a></p>
        </div>
      </form>
    </div>
  </div>
{/if}
