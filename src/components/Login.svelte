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
  <form on:submit|preventDefault={onSubmit} class="login">
    <h1>Iniciar sesión</h1>

    <label>
      usuario
      <input type="text" bind:value={username} required />
    </label>

    <label>
      Contraseña
      <input type="password" bind:value={password} required />
    </label>

    {#if error}<p class="error">{error}</p>{/if}

    <a href="#/register">Crear cuenta nueva</a>

    <button type="submit" disabled={loading}>
      {#if loading}Entrando...{/if}
      {#if !loading}Entrar{/if}
    </button>
  </form>
{/if}

<style>
  .login { max-width: 360px; margin: 40px auto; display: grid; gap: 10px;}
  .error { color: #b00020; margin: 0; }
  button[disabled] { opacity: .7; cursor: not-allowed; }
</style>
