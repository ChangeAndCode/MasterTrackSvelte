<script>
  // Datos del header
  const navItems = ['Inicio', 'Soluciones', 'Plataforma MasterTrack', 'Nosotros', 'Contacto'];
</script>

<header class="header">
  <div class="container">
    <div class="header-content">
      <!-- Logo -->
      <div class="logo">
        <div class="logo-icon">
          <span class="logo-m">M</span>
          <div class="antenna"></div>
        </div>
        <div class="logo-text">
          <h1>MASTERTRACK</h1>
          <p>El Sistema de Localización Vehicular más Innovador</p>
        </div>
      </div>

      <!-- Navegación -->
      <nav class="nav">
        {#each navItems as item}
          <a href="https://www.google.com/" class="nav-link">{item}</a>
        {/each}
      </nav>

      <!-- Acciones -->
      <div class="header-actions">
        <div class="search-bar">
          <input type="text" placeholder="Buscar..." />
          <span class="search-icon">🔍</span>
        </div>
        <a href="https://www.google.com/" class="btn btn-primary">Portal para CLIENTES</a>
      </div>
    </div>
  </div>
</header>

<style>
  .header {
    background-color: var(--white);
    border-bottom: 1px solid var(--border-grey);
    padding: 15px 0;
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .logo-icon {
    position: relative;
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, var(--primary-blue) 50%, var(--secondary-red) 50%);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo-m {
    color: var(--white);
    font-size: 24px;
    font-weight: bold;
  }

  .antenna {
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 12px;
    background-color: var(--secondary-red);
    border-radius: 2px;
  }

  .logo-text h1 {
    font-size: 20px;
    font-weight: bold;
    color: var(--primary-blue);
    margin-bottom: 2px;
  }

  .logo-text p {
    font-size: 12px;
    color: var(--primary-blue);
    opacity: 0.8;
  }

  .nav {
    display: flex;
    gap: 30px;
  }

  .nav-link {
    color: var(--primary-blue);
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
  }

  .nav-link:hover {
    color: var(--accent-yellow);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .search-bar {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-bar input {
    background-color: var(--primary-blue);
    color: var(--white);
    border: none;
    border-radius: 20px;
    padding: 8px 40px 8px 15px;
    width: 200px;
    font-size: 14px;
  }

  .search-bar input::placeholder {
    color: var(--white);
    opacity: 0.8;
  }

  .search-icon {
    position: absolute;
    right: 15px;
    color: var(--white);
    font-size: 14px;
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 15px;
    }

    .nav {
      gap: 15px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .header-actions {
      flex-direction: column;
      gap: 10px;
    }

    .search-bar input {
      width: 150px;
    }
  }
</style>
