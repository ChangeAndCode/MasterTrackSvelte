<script>
  import { currentRole, currentUser, roles, getRoleColor, getRoleName } from '../stores/roleStore.js';

  function changeRole(newRole) {
    $currentRole = newRole;
    $currentUser = {
      ...$currentUser,
      role: newRole,
      department: getRoleName(newRole)
    };
  }
</script>

<div class="role-selector">
  <div class="current-user">
    <div class="user-info">
      <div class="user-avatar" style="background-color: {getRoleColor($currentRole)}">
        {$currentUser.name.charAt(0)}
      </div>
      <div class="user-details">
        <div class="user-name">{$currentUser.name}</div>
        <div class="user-role" style="color: {getRoleColor($currentRole)}">
          {$currentUser.department}
        </div>
      </div>
    </div>
  </div>

  <div class="role-dropdown">
    <button class="role-toggle" on:click={() => document.getElementById('role-menu').classList.toggle('show')}>
      Cambiar Rol
      <span class="arrow">▼</span>
    </button>
    
    <div id="role-menu" class="role-menu">
      {#each Object.entries(roles) as [roleKey, roleData]}
        <button 
          class="role-option {roleKey === $currentRole ? 'active' : ''}"
          on:click={() => {
            changeRole(roleKey);
            document.getElementById('role-menu').classList.remove('show');
          }}
        >
          <div class="role-color" style="background-color: {roleData.color}"></div>
          <span>{roleData.name}</span>
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .role-selector {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 15px;
    background: linear-gradient(135deg, var(--white) 0%, #f8f9fa 100%);
    border: 2px solid var(--border-grey);
    border-radius: 12px;
    margin-bottom: 20px;
  }

  .current-user {
    display: flex;
    align-items: center;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 18px;
  }

  .user-details {
    display: flex;
    flex-direction: column;
  }

  .user-name {
    font-weight: 600;
    color: var(--primary-blue);
    font-size: 14px;
  }

  .user-role {
    font-size: 12px;
    font-weight: 500;
  }

  .role-dropdown {
    position: relative;
  }

  .role-toggle {
    background: var(--primary-blue);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
  }

  .role-toggle:hover {
    background: #004080;
  }

  .arrow {
    font-size: 10px;
    transition: transform 0.3s ease;
  }

  .role-menu {
    position: absolute;
    top: 100%;
    right: 0;
    background: white;
    border: 1px solid var(--border-grey);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    min-width: 200px;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.3s ease;
  }

  .role-menu.show {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .role-option {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 15px;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.3s ease;
    font-size: 12px;
  }

  .role-option:hover {
    background-color: #f8f9fa;
  }

  .role-option.active {
    background-color: #e3f2fd;
    font-weight: 600;
  }

  .role-color {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    .role-selector {
      flex-direction: column;
      gap: 15px;
    }

    .role-menu {
      right: auto;
      left: 0;
      min-width: 180px;
    }
  }
</style>
