<script>
  import { auth, clearAuth } from "./stores/auth.js";
  import Login from "./components/Login.svelte";

  // importa tus componentes existentes:
  import Header from "./components/Header.svelte";
  import Checklist from "./components/Checklist.svelte";
</script>

{#if $auth.isAuthenticated}
  <Header />
  <button on:click={clearAuth} style="position:fixed; top:12px; right:12px;">Cerrar sesión</button>
  <Checklist />
{:else}
  <Login />
{/if}
