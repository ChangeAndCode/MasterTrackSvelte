<script>
  import { auth, clearAuth } from "../stores/auth.js";
  import { getRoleColorByName, getRoleLabelByName } from "../stores/roleStore.js";

  $: me    = $auth?.me || null;
  $: name  = me?.username || me?.email || "";
  $: role  = me?.role || ""; // <- viene del backend como texto ("Administrador", "Almacen", ...)
  $: label = getRoleLabelByName(role);
  $: color = getRoleColorByName(role);
</script>

<div class="role-selector">
  <div class="current-user">
    <div class="user-info">
      <div class="user-avatar" style="background-color:{color}">
        {(name || "?").charAt(0).toUpperCase()}
      </div>
      <div class="user-details">
        <div class="user-name">{`Nombre: ${name}` || "Nombre no disponible"}</div>
        <div class="user-role" style="color:{color}">{`Cargo: ${label}` || "Cargo no disponible"}</div>
      </div>
    </div>
  </div>
</div>

<style>
  .role-selector {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 14px 16px;
    background: linear-gradient(135deg, var(--white, #fff) 0%, #f8f9fa 100%);
    border: 2px solid var(--border-grey, #e6e6e6);
    border-radius: 12px;
    margin-bottom: 20px;
  }
  .current-user { display: flex; align-items: center; }
  .user-info { display: flex; align-items: center; gap: 12px; }
  .user-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    display:flex; align-items:center; justify-content:center;
    color: white; font-weight: 700; font-size: 18px;
  }
  .user-details { display: flex; flex-direction: column; }
  .user-name { font-weight: 600; color: var(--primary-blue, #003366); font-size: 14px; }
  .user-role { font-size: 12px; font-weight: 500; }
</style>
