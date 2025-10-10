<script>
 import { auth } from "../stores/auth.js";
  import { getRoleColorByName, getRoleLabelByName, normalizeRoleKey } from "../stores/roleStore.js";

 // Props del padre
  export let checklistData = [];     // array de pasos { aspecto, completado, calidad, ... }
  export let clientData = {};        // info de cabecera (cliente, fecha, etc.)
  export let editableStepKeys = [];  // lista de aspectos que el usuario puede editar (del backend)

// Rol actual desde auth
  $: me       = $auth?.me || null;
  $: roleName = me?.role || "";                  // "Administrador", "Almacén", ...
  $: roleKey  = normalizeRoleKey(roleName);      // ADMIN, ALMACEN, ...
  $: roleColor = getRoleColorByName(roleName);
  $: roleLabel = getRoleLabelByName(roleName);
  $: isAdmin  = roleKey === "ADMIN";

// --- Estadísticas generales ---
  $: totalSteps        = checklistData.length;
  $: completedSteps    = checklistData.filter(item => item.completado).length;
  $: pendingSteps      = totalSteps - completedSteps;
  $: progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Pasos "críticos": arbitrario = más de 2 campos en calidad
  $: criticalSteps     = checklistData.filter(item => Object.keys(item.calidad || {}).length > 2);
  $: criticalCompleted = criticalSteps.filter(item => item.completado).length;

  // Tiempo estimado (30min por paso pendiente)
  $: estimatedTime    = pendingSteps * 30;
  $: estimatedHours   = Math.floor(estimatedTime / 60);
  $: estimatedMinutes = estimatedTime % 60;

  // --- Estadísticas del usuario (rol) ---
  const canEditAspect = (aspecto) => isAdmin || editableStepKeys.includes(aspecto);

  $: userSteps            = checklistData.filter(item => canEditAspect(item.aspecto));
  $: userCompletedSteps   = userSteps.filter(item => item.completado).length;
  $: userProgressPercentage = userSteps.length > 0
      ? Math.round((userCompletedSteps / userSteps.length) * 100)
      : 0;
  $: userPendingSteps     = userSteps.length - userCompletedSteps;
</script>

<div class="stats-container">
  <div class="stats-grid">
    <!-- Progreso general -->
    <div class="stat-card">
      <div class="stat-icon">📊</div>
      <div class="stat-content">
        <h3>Progreso General</h3>
        <div class="stat-value">{progressPercentage}%</div>
        <div class="stat-detail">{completedSteps} de {totalSteps} pasos</div>
      </div>
    </div>

    <!-- Progreso del usuario -->
    <div class="stat-card user-progress" style="border-color:{roleColor}">
      <div class="stat-icon" style="background-color:{roleColor}">👤</div>
      <div class="stat-content">
        <h3>Mi Progreso ({roleLabel})</h3>
        <div class="stat-value">{userProgressPercentage}%</div>
        <div class="stat-detail">{userCompletedSteps} de {userSteps.length} pasos</div>
      </div>
    </div>

    <!-- Pendientes del usuario -->
    <div class="stat-card">
      <div class="stat-icon">⏳</div>
      <div class="stat-content">
        <h3>Mis Pendientes</h3>
        <div class="stat-value">{userPendingSteps}</div>
        <div class="stat-detail">por completar</div>
      </div>
    </div>

    <!-- Pasos críticos -->
    <div class="stat-card">
      <div class="stat-icon">⚠️</div>
      <div class="stat-content">
        <h3>Pasos Críticos</h3>
        <div class="stat-value">{criticalCompleted}/{criticalSteps.length}</div>
        <div class="stat-detail">completados</div>
      </div>
    </div>

    <!-- Tiempo estimado -->
    <div class="stat-card">
      <div class="stat-icon">⏰</div>
      <div class="stat-content">
        <h3>Tiempo Estimado</h3>
        <div class="stat-value">
          {#if estimatedHours > 0}
            {estimatedHours}h {estimatedMinutes}m
          {:else}
            {estimatedMinutes}m
          {/if}
        </div>
        <div class="stat-detail">restante</div>
      </div>
    </div>

    <!-- Próximo paso -->
    <div class="stat-card">
      <div class="stat-icon">🎯</div>
      <div class="stat-content">
        <h3>Próximo Paso</h3>
        <div class="stat-value">
          {#if userPendingSteps > 0}
            {userSteps.find(item => !item.completado)?.aspecto.split(" ").slice(0, 2).join(" ") || "N/A"}
          {:else}
            ¡Completado!
          {/if}
        </div>
        <div class="stat-detail">
          {#if userPendingSteps > 0} Pendiente {:else} Todos completados {/if}
        </div>
      </div>
    </div>
  </div>

  {#if clientData?.cliente}
    <div class="client-info-card">
      <h3>📋 Información del Cliente</h3>
      <div class="client-details">
        <div class="client-field">
          <strong>Cliente:</strong> {clientData.cliente}
        </div>
        <div class="client-field">
          <strong>Fecha:</strong> {clientData.fecha ? new Date(clientData.fecha).toLocaleDateString("es-ES") : "—"}
        </div>
        <div class="client-field">
          <strong>Estado:</strong>
          <span class="status-badge {progressPercentage === 100 ? 'completed' : progressPercentage > 50 ? 'in-progress' : 'pending'}">
            {progressPercentage === 100 ? "Completado" : progressPercentage > 50 ? "En Progreso" : "Pendiente"}
          </span>
        </div>
        <div class="client-field">
          <strong>Mi Rol:</strong>
          <span class="role-badge" style="background-color:{roleColor}">
            {roleLabel}
          </span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .stats-container {
    margin: 30px 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  .stat-card {
    background: linear-gradient(135deg, var(--white) 0%, #f8f9fa 100%);
    border: 2px solid var(--border-grey);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 15px;
    transition: all 0.3s ease;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    border-color: var(--accent-yellow);
  }

  .stat-card.user-progress {
    border-width: 3px;
  }

  .stat-icon {
    font-size: 32px;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--accent-yellow);
    border-radius: 50%;
    color: var(--white);
  }

  .stat-content h3 {
    color: var(--primary-blue);
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 5px;
  }

  .stat-value {
    color: var(--primary-blue);
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 2px;
  }

  .stat-detail {
    color: var(--light-grey);
    font-size: 12px;
  }

  .client-info-card {
    background: linear-gradient(135deg, var(--primary-blue) 0%, #004080 100%);
    color: var(--white);
    border-radius: 12px;
    padding: 20px;
  }

  .client-info-card h3 {
    margin-bottom: 15px;
    font-size: 16px;
  }

  .client-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
  }

  .client-field {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
  }

  .status-badge.pending {
    background-color: #ff6b6b;
    color: var(--white);
  }

  .status-badge.in-progress {
    background-color: var(--accent-yellow);
    color: var(--primary-blue);
  }

  .status-badge.completed {
    background-color: #51cf66;
    color: var(--white);
  }

  .role-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
    color: var(--white);
  }

  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }

    .client-details {
      grid-template-columns: 1fr;
    }

    .stat-card {
      padding: 15px;
    }

    .stat-icon {
      font-size: 24px;
      width: 40px;
      height: 40px;
    }

    .stat-value {
      font-size: 20px;
    }
  }
</style>
