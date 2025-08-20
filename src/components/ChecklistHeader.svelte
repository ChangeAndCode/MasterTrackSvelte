<script>
  import { createEventDispatcher } from 'svelte';
  
  export let clientData;
  const dispatch = createEventDispatcher();

  function handleInput(field, value) {
    dispatch('update', { field, value });
  }
</script>

<div class="checklist-header">
  <div class="header-top">
    <div class="logo-section">
      <div class="logo-icon">
        <span class="logo-m">M</span>
        <div class="antenna"></div>
      </div>
      <div class="logo-text">
        <h1>MASTERTRACK</h1>
      </div>
    </div>
    
    <div class="title-section">
      <h2>CHECKLIST DE CONTROL</h2>
    </div>
    
    <div class="document-info">
      <p>REG-OPN-001 REV 00</p>
      <p>PÁGINA 1 DE 1</p>
    </div>
  </div>

  <div class="client-info">
    <div class="info-field">
      <label>CLIENTE:</label>
      <input 
        type="text" 
        value={clientData.cliente}
        on:input={(e) => handleInput('cliente', e.target.value)}
        placeholder="Nombre del cliente"
      />
    </div>
    
    <div class="info-field">
      <label>FECHA:</label>
      <input 
        type="date" 
        value={clientData.fecha}
        on:input={(e) => handleInput('fecha', e.target.value)}
      />
    </div>
  </div>
</div>

<style>
  .checklist-header {
    background-color: var(--white);
    border: 2px solid var(--primary-blue);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .logo-section {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .logo-icon {
    position: relative;
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, var(--primary-blue) 50%, var(--secondary-red) 50%);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo-m {
    color: var(--white);
    font-size: 20px;
    font-weight: bold;
  }

  .antenna {
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 3px;
    height: 10px;
    background-color: var(--secondary-red);
    border-radius: 2px;
  }

  .logo-text h1 {
    font-size: 16px;
    font-weight: bold;
    color: var(--primary-blue);
  }

  .title-section h2 {
    color: var(--primary-blue);
    font-size: 24px;
    font-weight: bold;
    text-align: center;
  }

  .document-info {
    text-align: right;
  }

  .document-info p {
    color: var(--primary-blue);
    font-size: 12px;
    margin: 2px 0;
  }

  .client-info {
    display: flex;
    gap: 30px;
    align-items: center;
  }

  .info-field {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .info-field label {
    color: var(--primary-blue);
    font-weight: bold;
    font-size: 14px;
    min-width: 80px;
  }

  .info-field input {
    padding: 8px 12px;
    border: 1px solid var(--border-grey);
    border-radius: 4px;
    font-size: 14px;
    min-width: 200px;
  }

  .info-field input:focus {
    outline: none;
    border-color: var(--primary-blue);
  }

  @media (max-width: 768px) {
    .header-top {
      flex-direction: column;
      gap: 15px;
      text-align: center;
    }

    .client-info {
      flex-direction: column;
      gap: 15px;
      align-items: stretch;
    }

    .info-field {
      flex-direction: column;
      align-items: stretch;
      gap: 5px;
    }

    .info-field input {
      min-width: auto;
    }
  }
</style>
