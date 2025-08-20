<script>
  import { onMount } from 'svelte';
  import ChecklistTable from './ChecklistTable.svelte';
  import ChecklistHeader from './ChecklistHeader.svelte';
  import ProcessStats from './ProcessStats.svelte';
  import RoleSelector from './RoleSelector.svelte';
  import { sampleClientData, sampleChecklistData, sampleComments } from '../data/sampleData.js';

  // Datos del checklist basados en el formulario
  let clientData = {
    cliente: '',
    fecha: new Date().toISOString().split('T')[0]
  };

  // Estados del checklist
  let checklistData = [
    {
      id: 1,
      aspecto: 'GENERAR ORDEN DE COMPRA',
      firmaResponsable: '',
      fecha: '',
      completado: false,
      calidad: {
        datosCte: false,
        checklist: false,
        comodato: false,
        garantia: false,
        cortesia: false,
        demo: false,
        precioRenta: false,
        folio: '',
        numProgServ: ''
      }
    },
    {
      id: 2,
      aspecto: 'COORDINACION DE SERVICIOS',
      firmaResponsable: '',
      fecha: '',
      completado: false,
      calidad: {
        validado: false,
        valido: false
      }
    },
    {
      id: 3,
      aspecto: 'PROGRAMADORES',
      firmaResponsable: '',
      fecha: '',
      completado: false,
      calidad: {
        ids: false,
        valido: false
      }
    },
    {
      id: 4,
      aspecto: 'ALMACÉN',
      firmaResponsable: '',
      fecha: '',
      completado: false,
      calidad: {
        matCompleto: false,
        numVale: '',
        hojaSalida: false
      }
    },
    {
      id: 5,
      aspecto: 'CALIDAD',
      firmaResponsable: '',
      fecha: '',
      completado: false,
      calidad: {
        observaciones: ''
      }
    },
    {
      id: 6,
      aspecto: 'TÉCNICO INSTALADOR',
      firmaResponsable: '',
      fecha: '',
      completado: false,
      calidad: {}
    },
    {
      id: 7,
      aspecto: 'SOPORTE TÉCNICO',
      firmaResponsable: '',
      fecha: '',
      completado: false,
      calidad: {
        procesada: false,
        pruebas: false,
        notificacionCliente: false
      }
    },
    {
      id: 8,
      aspecto: 'CALIDAD',
      firmaResponsable: '',
      fecha: '',
      completado: false,
      calidad: {
        observaciones: ''
      }
    },
    {
      id: 9,
      aspecto: 'SALIDA DE MATERIAL (INSTALACION DE STOCK)',
      firmaResponsable: '',
      fecha: '',
      completado: false,
      calidad: {
        hojaSalida: ''
      }
    },
    {
      id: 10,
      aspecto: 'FACTURACIÓN',
      firmaResponsable: '',
      fecha: '',
      completado: false,
      calidad: {}
    }
  ];

  let comentarios = '';
  let progress = 0;

  // Calcular progreso
  $: progress = Math.round((checklistData.filter(item => item.completado).length / checklistData.length) * 100);

  // Función para actualizar datos del cliente
  function updateClientData(field, value) {
    clientData[field] = value;
  }

  // Función para actualizar checklist
  function updateChecklistItem(id, field, value) {
    const item = checklistData.find(item => item.id === id);
    if (item) {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        item[parent][child] = value;
      } else {
        item[field] = value;
      }
      
      // Verificar si el paso está completado
      checkStepCompletion(item);
    }
  }

  // Verificar si un paso está completado
  function checkStepCompletion(item) {
    const hasSignature = item.firmaResponsable.trim() !== '';
    const hasDate = item.fecha !== '';
    const hasCalidadData = Object.values(item.calidad).some(val => 
      typeof val === 'boolean' ? val : (typeof val === 'string' && val.trim() !== '')
    );
    
    item.completado = hasSignature && hasDate && hasCalidadData;
  }

  // Función para marcar paso como completado
  function toggleStepCompletion(id) {
    const item = checklistData.find(item => item.id === id);
    if (item) {
      item.completado = !item.completado;
      if (item.completado && !item.fecha) {
        item.fecha = new Date().toISOString().split('T')[0];
      }
    }
  }

  // Función para cargar datos de ejemplo
  function loadSampleData() {
    if (confirm('¿Cargar datos de ejemplo? Esto reemplazará los datos actuales.')) {
      clientData = { ...sampleClientData };
      checklistData = JSON.parse(JSON.stringify(sampleChecklistData));
      comentarios = sampleComments;
    }
  }

  // Función para guardar/exportar
  function saveChecklist() {
    const data = {
      clientData,
      checklistData,
      comentarios,
      progress,
      timestamp: new Date().toISOString()
    };
    
    // Aquí se conectaría con el backend
    console.log('Datos del checklist:', data);
    alert(`Checklist guardado exitosamente. Progreso: ${progress}%`);
  }

  // Función para limpiar formulario
  function clearForm() {
    if (confirm('¿Estás seguro de que quieres limpiar todo el formulario?')) {
      clientData = {
        cliente: '',
        fecha: new Date().toISOString().split('T')[0]
      };
      
      checklistData = checklistData.map(item => ({
        ...item,
        firmaResponsable: '',
        fecha: '',
        completado: false,
        calidad: Object.keys(item.calidad).reduce((acc, key) => {
          acc[key] = typeof item.calidad[key] === 'boolean' ? false : '';
          return acc;
        }, {})
      }));
      
      comentarios = '';
    }
  }
</script>

<div class="checklist-container">
  <div class="container">
    <!-- Título principal -->
    <div class="main-title">
      <h2>PLATAFORMA AVANZADA DE SEGURIDAD Y GESTIÓN DE FLOTAS</h2>
      <h1>¡Tenemos una <span class="highlight">solución</span> para cada <span class="highlight">problemática del Transporte!</span></h1>
    </div>

    <!-- Selector de roles -->
    <RoleSelector />

    <!-- Header del checklist -->
    <ChecklistHeader {clientData} on:update={updateClientData} />

    <!-- Estadísticas del proceso -->
    <ProcessStats {checklistData} {clientData} />

    <!-- Barra de progreso -->
    <div class="progress-section">
      <div class="progress-info">
        <span>Progreso del Proceso: {progress}%</span>
        <span>{checklistData.filter(item => item.completado).length} de {checklistData.length} pasos completados</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: {progress}%"></div>
      </div>
    </div>

    <!-- Tabla del checklist -->
    <ChecklistTable {checklistData} on:update={updateChecklistItem} on:toggle={toggleStepCompletion} />

    <!-- Sección de comentarios -->
    <div class="comments-section">
      <h3>COMENTARIOS:</h3>
      <textarea 
        bind:value={comentarios}
        placeholder="Ingrese comentarios adicionales..."
        rows="4"
      ></textarea>
    </div>

    <!-- Botones de acción -->
    <div class="actions">
      <button class="btn btn-outline" on:click={loadSampleData}>
        Cargar Ejemplo
      </button>
      <button class="btn btn-outline" on:click={clearForm}>
        Limpiar Formulario
      </button>
      <button class="btn btn-outline" on:click={() => window.print()}>
        Imprimir Checklist
      </button>
      <button class="btn btn-primary" on:click={saveChecklist}>
        Guardar Checklist
      </button>
    </div>
  </div>
</div>

<style>
  .checklist-container {
    padding: 40px 0;
    background-color: var(--white);
  }

  .main-title {
    text-align: center;
    margin-bottom: 30px;
  }

  .main-title h2 {
    color: var(--light-grey);
    font-size: 18px;
    font-weight: 400;
    margin-bottom: 10px;
  }

  .main-title h1 {
    color: var(--primary-blue);
    font-size: 32px;
    font-weight: bold;
    line-height: 1.2;
  }

  .highlight {
    color: var(--accent-yellow);
  }

  .progress-section {
    margin-bottom: 30px;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid var(--border-grey);
  }

  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-weight: 500;
    color: var(--primary-blue);
  }

  .progress-bar {
    width: 100%;
    height: 20px;
    background-color: var(--border-grey);
    border-radius: 10px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-yellow), var(--primary-blue));
    transition: width 0.3s ease;
  }

  .comments-section {
    margin: 30px 0;
  }

  .comments-section h3 {
    color: var(--primary-blue);
    margin-bottom: 15px;
    font-size: 18px;
  }

  .comments-section textarea {
    width: 100%;
    padding: 15px;
    border: 2px solid var(--border-grey);
    border-radius: 8px;
    font-family: inherit;
    font-size: 14px;
    resize: vertical;
  }

  .comments-section textarea:focus {
    outline: none;
    border-color: var(--primary-blue);
  }

  .actions {
    display: flex;
    gap: 20px;
    justify-content: center;
    margin-top: 40px;
    flex-wrap: wrap;
  }

  @media (max-width: 768px) {
    .main-title h1 {
      font-size: 24px;
    }

    .progress-info {
      flex-direction: column;
      gap: 5px;
    }

    .actions {
      flex-direction: column;
      align-items: center;
    }
  }
</style>
