<script>
  import { auth } from "./stores/auth.js";
  import { logoutDotNet } from "./api/api.js";
  import Login from "./components/Login.svelte";

  import Header from "./components/Header.svelte";
  import Checklist from "./components/Checklist.svelte";
</script>

{#if $auth.isAuthenticated}
  <Header />
  <button class="logout-btn" on:click={logoutDotNet}>Cerrar sesión</button>
  <Checklist />
{:else}
  <Login />
{/if}

<style>
  .logout-btn {
    position: fixed;
    top: 12px;
    right: 12px;
    padding: 10px 20px;
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
    color: var(--white);
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
    z-index: 1000;
  }
  
  .logout-btn:hover {
    background: linear-gradient(135deg, #ee5a6f 0%, #ff6b6b 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
  }
  
  .logout-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(255, 107, 107, 0.3);
  }
</style>
