<script>
  import { auth } from "./stores/auth.js";
  import { logoutDotNet } from "./api/api.js";
  import Login from "./components/Login.svelte";

  import Header from "./components/Header.svelte";
  import Checklist from "./components/Checklist.svelte";
</script>

{#if $auth.isAuthenticated}
  <Header />
  <button on:click={logoutDotNet} style="position:fixed; top:12px; right:12px;">Cerrar sesión</button>
  <Checklist />
{:else}
  <Login />
{/if}
