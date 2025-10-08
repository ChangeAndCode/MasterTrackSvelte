<script>
  import { loginDotNet } from "../api/api.js";
  import { auth } from "../stores/auth.js";

  let email = "";
  let password = "";
  let loading = false;
  let error = "";

  async function onSubmit(e) {
    e.preventDefault();
    error = "";
    loading = true;
    try {
      await loginDotNet(email, password); // setAuth ocurre dentro
      // Redirige a donde corresponda
      window.location.assign("/");
    } catch (err) {
      error = err?.message || "No se pudo iniciar sesión";
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit|preventDefault={onSubmit} class="login">
  <h1>Iniciar sesión</h1>

  <label>
    Correo
    <input type="email" bind:value={email} required />
  </label>

  <label>
    Contraseña
    <input type="password" bind:value={password} required />
  </label>

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
