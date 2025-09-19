<script>
  import { login } from "../api/api.js";
  import { auth } from "../stores/auth.js";

  let username = "";
  let password = "";
  let loading = false;
  let error = "";

  async function onSubmit(e) {
    e.preventDefault();
    error = "";
    loading = true;
    try {
      await login(username, password); // setAuth ocurre dentro
      // listo: auth store ya tiene el token + user
    } catch (err) {
      error = err.message || "No se pudo iniciar sesión";
    } finally {
      loading = false;
    }
  }
</script>

<form class="login" on:submit={onSubmit}>
  <h2>Iniciar sesión</h2>

  <label>Usuario</label>
  <input
    type="text"
    bind:value={username}
    placeholder="usuario"
    autocomplete="username"
    required
  />

  <label>Contraseña</label>
  <input
    type="password"
    bind:value={password}
    placeholder="contraseña"
    autocomplete="current-password"
    required
  />

  {#if error}<p class="error">{error}</p>{/if}

  <button type="submit" disabled={loading}>
    {#if loading}Entrando...{/if}
    {#if !loading}Entrar{/if}
  </button>
</form>

<style>
  .login { max-width: 360px; margin: 40px auto; display: grid; gap: 10px; }
  .error { color: #b00020; margin: 0; }
  button[disabled] { opacity: .7; cursor: not-allowed; }
</style>
