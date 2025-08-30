// ===== VARIABLES GLOBALES =====
let currentPage = 'dashboard';
let currentUniversityTab = 'horario';

// Datos para gestión financiera
let debts = JSON.parse(localStorage.getItem('debts')) || [];
let totalDebt = 0;
let categoriasDeudas = JSON.parse(localStorage.getItem('categoriasDeudas')) || [];
let categoriasMeDeben = JSON.parse(localStorage.getItem('categoriasMeDeben')) || [];

// Datos para kanban
let tasks = JSON.parse(localStorage.getItem('tasks')) || {
    'todo': [],
    'doing': [],
    'done': []
};

// Datos para universidad
let asignaturas = JSON.parse(localStorage.getItem('asignaturas')) || [];
let horario = JSON.parse(localStorage.getItem('horario')) || {};
let examenes = JSON.parse(localStorage.getItem('examenes')) || [];
let notas = JSON.parse(localStorage.getItem('notas')) || [];

// ===== FUNCIONES DE NAVEGACIÓN =====
function showPage(pageId) {
    // Ocultar todas las páginas
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    
    // Mostrar la página seleccionada
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.style.display = 'block';
        currentPage = pageId;
    }
    
    // Actualizar navegación activa
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageId}"]`)?.classList.add('active');
    
    // Renderizar contenido específico de la página
    switch(pageId) {
        case 'deudas':
            renderDebts();
            break;
        case 'tareas':
            renderKanban();
            break;
        case 'universidad':
            showUniversityTab('horario');
            break;
        case 'dashboard':
            renderDashboard();
            break;
    }
}

function showUniversityTab(tabId) {
    // Ocultar todas las pestañas universitarias
    document.querySelectorAll('.universidad-tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Mostrar la pestaña seleccionada
    const targetTab = document.getElementById(tabId + 'Tab');
    if (targetTab) {
        targetTab.style.display = 'block';
        currentUniversityTab = tabId;
    }
    
    // Actualizar navegación de pestañas activa
    document.querySelectorAll('.tab-btn').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[onclick="mostrarTabUniversidad('${tabId}')"]`)?.classList.add('active');
    
    // Renderizar contenido específico de la pestaña
    switch(tabId) {
        case 'horario':
            renderHorario();
            break;
        case 'asignaturas':
            renderAsignaturas();
            break;
        case 'examenes':
            renderExamenes();
            break;
        case 'notas':
            renderNotas();
            break;
    }
}

// Función para compatibilidad con el HTML existente
function mostrarTabUniversidad(tabId) {
    showUniversityTab(tabId);
}

// ===== FUNCIONES DE UTILIDAD =====
function saveToLocalStorage() {
    localStorage.setItem('debts', JSON.stringify(debts));
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('asignaturas', JSON.stringify(asignaturas));
    localStorage.setItem('horario', JSON.stringify(horario));
    localStorage.setItem('examenes', JSON.stringify(examenes));
    localStorage.setItem('notas', JSON.stringify(notas));
    localStorage.setItem('categoriasDeudas', JSON.stringify(categoriasDeudas));
    localStorage.setItem('categoriasMeDeben', JSON.stringify(categoriasMeDeben));
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Función para compatibilidad con el HTML existente
function openModal(modalId) {
    showModal(modalId);
}

function closeModal(modalId) {
    hideModal(modalId);
}

function clearModalForm(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

// ===== DASHBOARD =====
function renderDashboard() {
    // Actualizar resumen financiero
    calculateTotalDebt();
    updateDashboardSummary();
}

function updateDashboardSummary() {
    // Actualizar total de deudas en dashboard
    const dashboardTotalDeudas = document.getElementById('dashboardTotalDeudas');
    const dashboardContadorDeudas = document.getElementById('dashboardContadorDeudas');
    const dashboardTotalMeDeben = document.getElementById('dashboardTotalMeDeben');
    const dashboardContadorMeDeben = document.getElementById('dashboardContadorMeDeben');
    const dashboardBalanceNeto = document.getElementById('dashboardBalanceNeto');
    const dashboardEstadoBalance = document.getElementById('dashboardEstadoBalance');
    
    if (dashboardTotalDeudas) {
        dashboardTotalDeudas.textContent = `€${totalDebt.toFixed(2)}`;
    }
    
    if (dashboardContadorDeudas) {
        dashboardContadorDeudas.textContent = `${debts.length} deudas activas`;
    }
    
    // Por ahora, los otros elementos pueden mostrar valores por defecto
    if (dashboardTotalMeDeben) {
        dashboardTotalMeDeben.textContent = '€0.00';
    }
    
    if (dashboardContadorMeDeben) {
        dashboardContadorMeDeben.textContent = '0 pendientes de cobro';
    }
    
    if (dashboardBalanceNeto) {
        const balance = -totalDebt;
        dashboardBalanceNeto.textContent = `€${balance.toFixed(2)}`;
        
        // Actualizar color del balance
        const balanceCard = dashboardBalanceNeto.closest('.card');
        if (balanceCard) {
            balanceCard.classList.remove('positive', 'negative');
            if (balance > 0) {
                balanceCard.classList.add('positive');
            } else if (balance < 0) {
                balanceCard.classList.add('negative');
            }
        }
    }
    
    if (dashboardEstadoBalance) {
        if (totalDebt > 0) {
            dashboardEstadoBalance.textContent = 'Tienes deudas pendientes';
        } else {
            dashboardEstadoBalance.textContent = 'Sin deudas registradas';
        }
    }
    
    // Actualizar secciones de tareas y vencimientos
    updateDashboardTasks();
    updateDashboardVencimientos();
}

function refreshDashboard() {
    renderDashboard();
    renderDebts();
    renderKanban();
    alert('Dashboard actualizado');
}

function updateDashboardTasks() {
    const dashboardTareas = document.getElementById('dashboardTareas');
    if (!dashboardTareas) return;
    
    dashboardTareas.innerHTML = '';
    
    // Obtener todas las tareas que no están en "done"
    const tareasActivas = [...tasks.todo, ...tasks.doing];
    
    if (tareasActivas.length === 0) {
        dashboardTareas.innerHTML = `
            <div class="dashboard-empty">
                <p>No hay tareas pendientes</p>
                <button class="btn btn-link" onclick="document.querySelector('[data-page=tareas]').click()">
                    Crear primera tarea <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `;
        return;
    }
    
    // Mostrar las primeras 3 tareas
    tareasActivas.slice(0, 3).forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = 'dashboard-task-item';
        taskItem.innerHTML = `
            <div class="task-info">
                <h4>${task.title}</h4>
                <p>${task.description}</p>
            </div>
            <div class="task-status">
                <span class="status-badge ${task.status || 'todo'}">${task.status === 'doing' ? 'En progreso' : 'Pendiente'}</span>
            </div>
        `;
        dashboardTareas.appendChild(taskItem);
    });
    
    if (tareasActivas.length > 3) {
        const moreInfo = document.createElement('div');
        moreInfo.className = 'dashboard-more';
        moreInfo.innerHTML = `<p>Y ${tareasActivas.length - 3} tareas más...</p>`;
        dashboardTareas.appendChild(moreInfo);
    }
}

function updateDashboardVencimientos() {
    const dashboardVencimientos = document.getElementById('dashboardVencimientos');
    if (!dashboardVencimientos) return;
    
    dashboardVencimientos.innerHTML = '';
    
    if (debts.length === 0) {
        dashboardVencimientos.innerHTML = `
            <div class="dashboard-empty">
                <p>No hay deudas registradas</p>
            </div>
        `;
        return;
    }
    
    // Ordenar deudas por fecha de vencimiento
    const deudasConVencimiento = debts
        .filter(debt => debt.dueDate)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    if (deudasConVencimiento.length === 0) {
        dashboardVencimientos.innerHTML = `
            <div class="dashboard-empty">
                <p>No hay fechas de vencimiento definidas</p>
            </div>
        `;
        return;
    }
    
    // Mostrar las primeras 3 deudas próximas a vencer
    deudasConVencimiento.slice(0, 3).forEach(debt => {
        const fechaVencimiento = new Date(debt.dueDate);
        const hoy = new Date();
        const diasRestantes = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
        
        let estadoClase = '';
        let estadoTexto = '';
        if (diasRestantes < 0) {
            estadoClase = 'vencido';
            estadoTexto = 'Vencido';
        } else if (diasRestantes === 0) {
            estadoClase = 'hoy';
            estadoTexto = 'Vence hoy';
        } else if (diasRestantes <= 7) {
            estadoClase = 'proximo';
            estadoTexto = `${diasRestantes} días`;
        } else {
            estadoTexto = `${diasRestantes} días`;
        }
        
        const vencimientoItem = document.createElement('div');
        vencimientoItem.className = 'dashboard-vencimiento-item';
        vencimientoItem.innerHTML = `
            <div class="vencimiento-info">
                <h4>${debt.creditor}</h4>
                <p>€${debt.amount.toFixed(2)}</p>
            </div>
            <div class="vencimiento-status">
                <span class="status-badge ${estadoClase}">${estadoTexto}</span>
            </div>
        `;
        dashboardVencimientos.appendChild(vencimientoItem);
    });
}

// ===== GESTIÓN FINANCIERA =====
function calculateTotalDebt() {
    totalDebt = debts
        .filter(debt => debt.sumarTotal !== false)
        .reduce((sum, debt) => sum + (debt.amount || debt.cantidad || 0), 0);
    
    const totalDebtElement = document.getElementById('totalDeudas');
    if (totalDebtElement) {
        totalDebtElement.textContent = `€${totalDebt.toFixed(2)}`;
    }
}

function renderDebts() {
    const categoriasContainer = document.getElementById('categoriasContainer');
    const totalDeudas = document.getElementById('totalDeudas');
    const totalCategorias = document.getElementById('totalCategorias');
    const totalItems = document.getElementById('totalItems');
    
    // Calcular totales
    calculateTotalDebt();
    
    if (totalDeudas) {
        totalDeudas.textContent = `€${totalDebt.toFixed(2)}`;
    }
    
    if (totalCategorias) {
        totalCategorias.textContent = `${categoriasDeudas.length || 1} categoría${categoriasDeudas.length > 1 ? 's' : ''}`;
    }
    
    if (totalItems) {
        totalItems.textContent = `${debts.length} elemento${debts.length !== 1 ? 's' : ''}`;
    }
    
    if (!categoriasContainer) return;
    
    categoriasContainer.innerHTML = '';
    
    // Si no hay categorías, crear una por defecto
    if (categoriasDeudas.length === 0) {
        if (debts.length === 0) {
            categoriasContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-credit-card"></i>
                    <h3>No hay deudas registradas</h3>
                    <p>Crea una categoría y añade tu primera deuda</p>
                    <div class="empty-actions">
                        <button class="btn btn-secondary" onclick="openModal('categoriaDeudaModal')">
                            <i class="fas fa-folder-plus"></i>
                            Nueva Categoría
                        </button>
                        <button class="btn btn-primary" onclick="openModal('deudaModal')">
                            <i class="fas fa-plus"></i>
                            Nueva Deuda
                        </button>
                    </div>
                </div>
            `;
            return;
        } else {
            // Crear categoría por defecto para deudas existentes
            categoriasDeudas.push({
                id: 'default',
                nombre: 'Mis Deudas',
                icono: '💳',
                color: 'red'
            });
            saveToLocalStorage();
        }
    }
    
    // Renderizar cada categoría
    categoriasDeudas.forEach(categoria => {
        const deudasCategoria = debts.filter(debt => 
            debt.categoria === categoria.nombre || 
            (debt.categoria === undefined && categoria.id === 'default')
        );
        
        const totalCategoria = deudasCategoria
            .filter(debt => debt.sumarTotal !== false)
            .reduce((sum, debt) => sum + debt.amount, 0);
        
        const categoriaCard = document.createElement('div');
        categoriaCard.className = `categoria-card categoria-${categoria.color}`;
        categoriaCard.innerHTML = `
            <div class="categoria-header">
                <h3>
                    <span class="categoria-icono">${categoria.icono}</span>
                    ${categoria.nombre}
                </h3>
                <div class="categoria-actions">
                    <span class="categoria-total">€${totalCategoria.toFixed(2)}</span>
                    <button onclick="deleteCategoria('${categoria.id}')" class="btn-delete-categoria" title="Eliminar categoría">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="categoria-items">
                ${deudasCategoria.length === 0 ? `
                    <div class="categoria-empty">
                        <p>No hay deudas en esta categoría</p>
                        <button class="btn btn-link" onclick="openModalWithCategory('deudaModal', '${categoria.nombre}')">
                            <i class="fas fa-plus"></i>
                            Añadir primera deuda
                        </button>
                    </div>
                ` : deudasCategoria.map((debt, index) => `
                    <div class="deuda-item">
                        <div class="deuda-info">
                            <h4>${debt.creditor || debt.nombre}</h4>
                            <span class="deuda-amount">€${debt.amount || debt.cantidad}</span>
                        </div>
                        <div class="deuda-meta">
                            <small>Vence: ${debt.dueDate || debt.vencimiento ? 
                                new Date(debt.dueDate || debt.vencimiento).toLocaleDateString('es-ES') : 
                                'Sin fecha'}</small>
                            ${debt.sumarTotal === false ? '<span class="no-total">No cuenta para total</span>' : ''}
                        </div>
                        <div class="deuda-actions">
                            <button onclick="editDebt(${debts.indexOf(debt)})" class="btn-edit-small">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteDebt(${debts.indexOf(debt)})" class="btn-delete-small">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        categoriasContainer.appendChild(categoriaCard);
    });
}

function addDebt() {
    const form = document.getElementById('deudaForm');
    const formData = new FormData(form);
    
    const categoria = formData.get('categoria');
    const nombre = formData.get('nombre');
    const cantidad = parseFloat(formData.get('cantidad'));
    const vencimiento = formData.get('vencimiento');
    const sumarTotal = formData.get('sumarTotal') === 'on';
    const notas = formData.get('notas');
    
    if (!nombre || !cantidad) {
        alert('Por favor, completa todos los campos obligatorios');
        return;
    }
    
    debts.push({
        creditor: nombre, // Para compatibilidad
        nombre: nombre,
        amount: cantidad, // Para compatibilidad
        cantidad: cantidad,
        dueDate: vencimiento, // Para compatibilidad
        vencimiento: vencimiento,
        categoria: categoria,
        sumarTotal: sumarTotal,
        notas: notas,
        id: Date.now()
    });
    
    saveToLocalStorage();
    renderDebts();
    closeModal('deudaModal');
    form.reset();
    
    // Actualizar dashboard si está visible
    if (currentPage === 'dashboard') {
        renderDashboard();
    }
}

function editDebt(index) {
    const debt = debts[index];
    if (!debt) return;
    
    // Actualizar opciones de categoría
    updateDebtForm();
    
    // Llenar el formulario con los datos existentes
    const form = document.getElementById('deudaForm');
    if (form) {
        form.querySelector('[name="categoria"]').value = debt.categoria || '';
        form.querySelector('[name="nombre"]').value = debt.creditor || debt.nombre || '';
        form.querySelector('[name="cantidad"]').value = debt.amount || debt.cantidad || '';
        form.querySelector('[name="vencimiento"]').value = debt.dueDate || debt.vencimiento || '';
        form.querySelector('[name="sumarTotal"]').checked = debt.sumarTotal !== false;
        form.querySelector('[name="notas"]').value = debt.notas || '';
    }
    
    // Cambiar el comportamiento del botón para editar
    const submitBtn = document.querySelector('#deudaModal .btn-primary');
    if (submitBtn) {
        submitBtn.onclick = (e) => {
            e.preventDefault();
            updateDebt(index);
        };
        submitBtn.textContent = 'Actualizar Deuda';
    }
    
    openModal('deudaModal');
}

function updateDebt(index) {
    const form = document.getElementById('deudaForm');
    const formData = new FormData(form);
    
    const categoria = formData.get('categoria');
    const nombre = formData.get('nombre');
    const cantidad = parseFloat(formData.get('cantidad'));
    const vencimiento = formData.get('vencimiento');
    const sumarTotal = formData.get('sumarTotal') === 'on';
    const notas = formData.get('notas');
    
    if (!nombre || !cantidad) {
        alert('Por favor, completa todos los campos obligatorios');
        return;
    }
    
    debts[index] = {
        ...debts[index],
        creditor: nombre, // Para compatibilidad
        nombre: nombre,
        amount: cantidad, // Para compatibilidad
        cantidad: cantidad,
        dueDate: vencimiento, // Para compatibilidad
        vencimiento: vencimiento,
        categoria: categoria,
        sumarTotal: sumarTotal,
        notas: notas
    };
    
    saveToLocalStorage();
    renderDebts();
    closeModal('deudaModal');
    form.reset();
    
    // Restaurar el comportamiento original del botón
    const submitBtn = document.querySelector('#deudaModal .btn-primary');
    if (submitBtn) {
        submitBtn.onclick = (e) => {
            e.preventDefault();
            addDebt();
        };
        submitBtn.textContent = 'Guardar Deuda';
    }
    
    // Actualizar dashboard si está visible
    if (currentPage === 'dashboard') {
        renderDashboard();
    }
}

function deleteDebt(index) {
    if (confirm('¿Estás seguro de que quieres eliminar esta deuda?')) {
        debts.splice(index, 1);
        saveToLocalStorage();
        renderDebts();
        // Actualizar dashboard si está visible
        if (currentPage === 'dashboard') {
            renderDashboard();
        }
    }
}

// ===== GESTIÓN DE CATEGORÍAS DE DEUDAS =====
function addCategoriaDeuda() {
    const form = document.getElementById('categoriaDeudaForm');
    const formData = new FormData(form);
    
    const nombre = formData.get('nombre');
    const icono = formData.get('icono') || '📁';
    const color = formData.get('color');
    
    if (!nombre || !color) {
        alert('Por favor, completa todos los campos obligatorios');
        return;
    }
    
    // Verificar que no exista una categoría con el mismo nombre
    if (categoriasDeudas.find(cat => cat.nombre === nombre)) {
        alert('Ya existe una categoría con ese nombre');
        return;
    }
    
    categoriasDeudas.push({
        id: Date.now().toString(),
        nombre: nombre,
        icono: icono,
        color: color
    });
    
    saveToLocalStorage();
    renderDebts();
    closeModal('categoriaDeudaModal');
    form.reset();
}

function deleteCategoria(categoriaId) {
    const categoria = categoriasDeudas.find(cat => cat.id === categoriaId);
    if (!categoria) return;
    
    // Verificar si hay deudas en esta categoría
    const deudasEnCategoria = debts.filter(debt => debt.categoria === categoria.nombre);
    
    if (deudasEnCategoria.length > 0) {
        if (!confirm(`La categoría "${categoria.nombre}" contiene ${deudasEnCategoria.length} deuda(s). ¿Estás seguro de que quieres eliminarla? Las deudas se moverán a "Sin categoría".`)) {
            return;
        }
        
        // Mover deudas a sin categoría
        deudasEnCategoria.forEach(debt => {
            debt.categoria = undefined;
        });
    }
    
    // Eliminar categoría
    categoriasDeudas = categoriasDeudas.filter(cat => cat.id !== categoriaId);
    
    saveToLocalStorage();
    renderDebts();
}

function openModalWithCategory(modalId, categoria) {
    // Pre-seleccionar la categoría en el modal
    openModal(modalId);
    
    setTimeout(() => {
        const categoriaSelect = document.getElementById('categoriaSelect');
        if (categoriaSelect && categoria) {
            categoriaSelect.value = categoria;
        }
    }, 100);
}

function updateDebtForm() {
    const categoriaSelect = document.getElementById('categoriaSelect');
    if (!categoriaSelect) return;
    
    categoriaSelect.innerHTML = '<option value="">Seleccionar categoría</option>';
    
    // Añadir categorías existentes
    categoriasDeudas.forEach(categoria => {
        categoriaSelect.innerHTML += `<option value="${categoria.nombre}">${categoria.icono} ${categoria.nombre}</option>`;
    });
}

// ===== GESTIÓN DE KANBAN =====
function renderKanban() {
    const kanbanBoard = document.getElementById('kanbanBoard');
    if (!kanbanBoard) return;
    
    kanbanBoard.innerHTML = '';
    
    // Crear las columnas por defecto
    const columnData = [
        { id: 'todo', title: 'Por Hacer', class: 'todo' },
        { id: 'doing', title: 'En Progreso', class: 'doing' },
        { id: 'done', title: 'Terminado', class: 'done' }
    ];
    
    columnData.forEach(col => {
        const column = document.createElement('div');
        column.className = 'kanban-column';
        column.innerHTML = `
            <div class="column-header">
                <h3>${col.title}</h3>
                <span class="task-count">${tasks[col.id].length}</span>
            </div>
            <div class="column-content" id="${col.id}-tasks">
                <!-- Las tareas se insertan aquí -->
            </div>
        `;
        kanbanBoard.appendChild(column);
    });
    
    // Renderizar las tareas en cada columna
    ['todo', 'doing', 'done'].forEach(status => {
        const column = document.getElementById(`${status}-tasks`);
        if (!column) return;
        
        column.innerHTML = '';
        
        if (tasks[status].length === 0) {
            column.innerHTML = `
                <div class="empty-column">
                    <p>No hay tareas</p>
                </div>
            `;
            return;
        }
        
        tasks[status].forEach((task, index) => {
            const taskCard = document.createElement('div');
            taskCard.className = 'task-card';
            taskCard.draggable = true;
            taskCard.dataset.status = status;
            taskCard.dataset.index = index;
            
            taskCard.innerHTML = `
                <div class="task-header">
                    <h4>${task.title}</h4>
                </div>
                <div class="task-description">
                    <p>${task.description}</p>
                </div>
                <div class="task-actions">
                    <button onclick="editTask('${status}', ${index})" class="btn-edit-small">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteTask('${status}', ${index})" class="btn-delete-small">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            // Eventos de drag and drop
            taskCard.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({status, index}));
            });
            
            column.appendChild(taskCard);
        });
    });
}

function addTask() {
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    
    if (!title || !description) {
        alert('Por favor, completa todos los campos');
        return;
    }
    
    tasks.todo.push({
        title: title,
        description: description,
        id: Date.now(),
        createdAt: new Date().toISOString()
    });
    
    saveToLocalStorage();
    renderKanban();
    hideModal('task-modal');
    clearModalForm('task-modal');
}

function editTask(status, index) {
    const task = tasks[status][index];
    if (!task) return;
    
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description;
    
    // Cambiar el comportamiento del botón para editar
    const submitBtn = document.querySelector('#task-modal .btn-primary');
    submitBtn.onclick = () => updateTask(status, index);
    submitBtn.textContent = 'Actualizar Tarea';
    
    showModal('task-modal');
}

function updateTask(status, index) {
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    
    if (!title || !description) {
        alert('Por favor, completa todos los campos');
        return;
    }
    
    tasks[status][index] = {
        ...tasks[status][index],
        title: title,
        description: description
    };
    
    saveToLocalStorage();
    renderKanban();
    hideModal('task-modal');
    clearModalForm('task-modal');
    
    // Restaurar el comportamiento original del botón
    const submitBtn = document.querySelector('#task-modal .btn-primary');
    submitBtn.onclick = addTask;
    submitBtn.textContent = 'Agregar Tarea';
}

function deleteTask(status, index) {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        tasks[status].splice(index, 1);
        saveToLocalStorage();
        renderKanban();
    }
}

// Configurar drag and drop para kanban
function setupKanbanDragDrop() {
    // Esperar a que el kanban se haya renderizado
    setTimeout(() => {
        ['todo', 'doing', 'done'].forEach(status => {
            const column = document.getElementById(`${status}-tasks`);
            if (!column) return;
            
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.classList.add('drag-over');
            });
            
            column.addEventListener('dragleave', (e) => {
                if (!column.contains(e.relatedTarget)) {
                    column.classList.remove('drag-over');
                }
            });
            
            column.addEventListener('drop', (e) => {
                e.preventDefault();
                column.classList.remove('drag-over');
                
                try {
                    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                    const {status: oldStatus, index: oldIndex} = data;
                    
                    if (oldStatus !== status) {
                        // Mover tarea a nueva columna
                        const task = tasks[oldStatus][oldIndex];
                        if (task) {
                            tasks[oldStatus].splice(oldIndex, 1);
                            tasks[status].push(task);
                            
                            saveToLocalStorage();
                            renderKanban();
                            setupKanbanDragDrop(); // Re-configurar eventos después del render
                        }
                    }
                } catch (error) {
                    console.error('Error al mover tarea:', error);
                }
            });
        });
    }, 100);
}

// ===== GESTIÓN UNIVERSITARIA =====

// --- Horarios ---
function renderHorario() {
    const tablaHorario = document.getElementById('tablaHorario');
    if (!tablaHorario) return;
    
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const horas = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    
    tablaHorario.innerHTML = '';
    
    // Crear tabla
    const table = document.createElement('table');
    table.className = 'horario-table';
    
    // Crear encabezados
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>Hora</th>';
    dias.forEach(dia => {
        headerRow.innerHTML += `<th>${dia}</th>`;
    });
    table.appendChild(headerRow);
    
    // Crear filas de horas
    horas.forEach(hora => {
        const row = document.createElement('tr');
        row.innerHTML = `<td class="hora-cell">${hora}</td>`;
        
        dias.forEach(dia => {
            const cell = document.createElement('td');
            cell.className = 'horario-cell';
            
            const claseKey = `${dia.toLowerCase()}-${hora}`;
            if (horario[claseKey]) {
                cell.innerHTML = `
                    <div class="clase-item">
                        <strong>${horario[claseKey].asignatura}</strong><br>
                        <small>${horario[claseKey].aula || 'Sin aula'}</small>
                        <button onclick="deleteClase('${claseKey}')" class="btn-delete-clase">×</button>
                    </div>
                `;
                cell.classList.add('occupied');
            } else {
                cell.innerHTML = `<button onclick="addClase('${dia.toLowerCase()}', '${hora}')" class="btn-add-clase">+</button>`;
            }
            
            row.appendChild(cell);
        });
        
        table.appendChild(row);
    });
    
    tablaHorario.appendChild(table);
}

function addClase(dia, hora) {
    document.getElementById('clase-dia').value = dia;
    document.getElementById('clase-hora').value = hora;
    
    // Llenar select de asignaturas
    const asignaturaSelect = document.getElementById('clase-asignatura');
    asignaturaSelect.innerHTML = '<option value="">Seleccionar asignatura</option>';
    asignaturas.forEach(asignatura => {
        asignaturaSelect.innerHTML += `<option value="${asignatura.nombre}">${asignatura.nombre}</option>`;
    });
    
    showModal('clase-modal');
}

function saveClase() {
    const dia = document.getElementById('clase-dia').value;
    const hora = document.getElementById('clase-hora').value;
    const asignatura = document.getElementById('clase-asignatura').value;
    const aula = document.getElementById('clase-aula').value;
    
    if (!dia || !hora || !asignatura || !aula) {
        alert('Por favor, completa todos los campos');
        return;
    }
    
    const claseKey = `${dia}-${hora}`;
    horario[claseKey] = {
        asignatura: asignatura,
        aula: aula,
        dia: dia,
        hora: hora
    };
    
    saveToLocalStorage();
    renderHorario();
    hideModal('clase-modal');
    clearModalForm('clase-modal');
}

function deleteClase(claseKey) {
    if (confirm('¿Estás seguro de que quieres eliminar esta clase?')) {
        delete horario[claseKey];
        saveToLocalStorage();
        renderHorario();
    }
}

// --- Asignaturas ---
function renderAsignaturas() {
    const asignaturasContainer = document.getElementById('asignaturasContainer');
    if (!asignaturasContainer) return;
    
    asignaturasContainer.innerHTML = '';
    
    if (asignaturas.length === 0) {
        asignaturasContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <h3>No hay asignaturas</h3>
                <p>Añade tu primera asignatura para empezar</p>
                <button class="btn btn-primary" onclick="openModal('asignaturaModal')">
                    <i class="fas fa-plus"></i>
                    Nueva Asignatura
                </button>
            </div>
        `;
        return;
    }
    
    asignaturas.forEach((asignatura, index) => {
        const asignaturaCard = document.createElement('div');
        asignaturaCard.className = 'asignatura-card';
        asignaturaCard.innerHTML = `
            <div class="asignatura-header">
                <h3>${asignatura.nombre}</h3>
                <span class="asignatura-creditos">${asignatura.creditos || 0} ECTS</span>
            </div>
            <div class="asignatura-info">
                <p><strong>Código:</strong> ${asignatura.codigo || 'Sin código'}</p>
                <p><strong>Profesor:</strong> ${asignatura.profesor || 'Sin profesor'}</p>
                <p><strong>Curso:</strong> ${asignatura.curso || '1'}º - ${asignatura.semestre || '1'}º Semestre</p>
            </div>
            <div class="asignatura-actions">
                <button onclick="editAsignatura(${index})" class="btn btn-edit">
                    <i class="fas fa-edit"></i>
                    Editar
                </button>
                <button onclick="deleteAsignatura(${index})" class="btn btn-delete">
                    <i class="fas fa-trash"></i>
                    Eliminar
                </button>
            </div>
        `;
        asignaturasContainer.appendChild(asignaturaCard);
    });
}

function addAsignatura() {
    const nombre = document.getElementById('asignatura-nombre').value;
    const codigo = document.getElementById('asignatura-codigo').value;
    const creditos = parseInt(document.getElementById('asignatura-creditos').value);
    const profesor = document.getElementById('asignatura-profesor').value;
    
    if (!nombre || !codigo || !creditos || !profesor) {
        alert('Por favor, completa todos los campos');
        return;
    }
    
    asignaturas.push({
        nombre: nombre,
        codigo: codigo,
        creditos: creditos,
        profesor: profesor,
        id: Date.now()
    });
    
    saveToLocalStorage();
    renderAsignaturas();
    hideModal('asignatura-modal');
    clearModalForm('asignatura-modal');
}

function editAsignatura(index) {
    const asignatura = asignaturas[index];
    if (!asignatura) return;
    
    document.getElementById('asignatura-nombre').value = asignatura.nombre;
    document.getElementById('asignatura-codigo').value = asignatura.codigo;
    document.getElementById('asignatura-creditos').value = asignatura.creditos;
    document.getElementById('asignatura-profesor').value = asignatura.profesor;
    
    // Cambiar el comportamiento del botón para editar
    const submitBtn = document.querySelector('#asignatura-modal .btn-primary');
    submitBtn.onclick = () => updateAsignatura(index);
    submitBtn.textContent = 'Actualizar Asignatura';
    
    showModal('asignatura-modal');
}

function updateAsignatura(index) {
    const nombre = document.getElementById('asignatura-nombre').value;
    const codigo = document.getElementById('asignatura-codigo').value;
    const creditos = parseInt(document.getElementById('asignatura-creditos').value);
    const profesor = document.getElementById('asignatura-profesor').value;
    
    if (!nombre || !codigo || !creditos || !profesor) {
        alert('Por favor, completa todos los campos');
        return;
    }
    
    asignaturas[index] = {
        ...asignaturas[index],
        nombre: nombre,
        codigo: codigo,
        creditos: creditos,
        profesor: profesor
    };
    
    saveToLocalStorage();
    renderAsignaturas();
    hideModal('asignatura-modal');
    clearModalForm('asignatura-modal');
    
    // Restaurar el comportamiento original del botón
    const submitBtn = document.querySelector('#asignatura-modal .btn-primary');
    submitBtn.onclick = addAsignatura;
    submitBtn.textContent = 'Agregar Asignatura';
}

function deleteAsignatura(index) {
    if (confirm('¿Estás seguro de que quieres eliminar esta asignatura?')) {
        asignaturas.splice(index, 1);
        saveToLocalStorage();
        renderAsignaturas();
    }
}

// --- Exámenes ---
function renderExamenes() {
    const examenesProximos = document.getElementById('examenesProximos');
    const examenesTodos = document.getElementById('examenesTodos');
    
    if (!examenesProximos || !examenesTodos) return;
    
    // Limpiar contenedores
    examenesProximos.innerHTML = '';
    examenesTodos.innerHTML = '';
    
    if (examenes.length === 0) {
        examenesTodos.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-graduation-cap"></i>
                <h3>No hay exámenes</h3>
                <p>Añade tu primer examen para empezar</p>
                <button class="btn btn-primary" onclick="openModal('examenModal')">
                    <i class="fas fa-plus"></i>
                    Nuevo Examen
                </button>
            </div>
        `;
        return;
    }
    
    // Ordenar exámenes por fecha
    const examenesOrdenados = [...examenes].sort((a, b) => {
        const fechaA = new Date(a.fechaHora || a.fecha);
        const fechaB = new Date(b.fechaHora || b.fecha);
        return fechaA - fechaB;
    });
    
    const hoy = new Date();
    const proximosSieteDias = new Date();
    proximosSieteDias.setDate(hoy.getDate() + 7);
    
    examenesOrdenados.forEach((examen, index) => {
        const fechaExamen = new Date(examen.fechaHora || examen.fecha);
        const diasRestantes = Math.ceil((fechaExamen - hoy) / (1000 * 60 * 60 * 24));
        
        let estadoClase = '';
        let estadoTexto = '';
        if (diasRestantes < 0) {
            estadoClase = 'pasado';
            estadoTexto = 'Pasado';
        } else if (diasRestantes === 0) {
            estadoClase = 'hoy';
            estadoTexto = 'Hoy';
        } else if (diasRestantes <= 7) {
            estadoClase = 'proximo';
            estadoTexto = `Faltan ${diasRestantes} días`;
        } else {
            estadoTexto = `Faltan ${diasRestantes} días`;
        }
        
        const examenCard = document.createElement('div');
        examenCard.className = 'examen-card';
        examenCard.innerHTML = `
            <div class="examen-header">
                <h3>${examen.asignatura}</h3>
                <span class="examen-estado ${estadoClase}">${estadoTexto}</span>
            </div>
            <div class="examen-info">
                <p><strong>Tipo:</strong> ${examen.tipo || 'Examen'}</p>
                <p><strong>Fecha:</strong> ${fechaExamen.toLocaleDateString('es-ES')}</p>
                <p><strong>Hora:</strong> ${fechaExamen.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}</p>
                <p><strong>Aula:</strong> ${examen.aula || 'Por determinar'}</p>
                ${examen.duracion ? `<p><strong>Duración:</strong> ${examen.duracion} min</p>` : ''}
            </div>
            <div class="examen-actions">
                <button onclick="editExamen(${examenes.indexOf(examen)})" class="btn btn-edit">
                    <i class="fas fa-edit"></i>
                    Editar
                </button>
                <button onclick="deleteExamen(${examenes.indexOf(examen)})" class="btn btn-delete">
                    <i class="fas fa-trash"></i>
                    Eliminar
                </button>
            </div>
        `;
        
        // Añadir a próximos si es en los próximos 7 días y no ha pasado
        if (fechaExamen >= hoy && fechaExamen <= proximosSieteDias) {
            examenesProximos.appendChild(examenCard.cloneNode(true));
        }
        
        // Añadir a todos los exámenes
        examenesTodos.appendChild(examenCard);
    });
    
    // Si no hay exámenes próximos
    if (examenesProximos.children.length === 0) {
        examenesProximos.innerHTML = `
            <div class="empty-state-small">
                <p>No hay exámenes en los próximos 7 días</p>
            </div>
        `;
    }
}

function addExamen() {
    const asignatura = document.getElementById('examen-asignatura').value;
    const fecha = document.getElementById('examen-fecha').value;
    const hora = document.getElementById('examen-hora').value;
    const aula = document.getElementById('examen-aula').value;
    const tipo = document.getElementById('examen-tipo').value;
    
    if (!asignatura || !fecha || !hora || !aula || !tipo) {
        alert('Por favor, completa todos los campos');
        return;
    }
    
    examenes.push({
        asignatura: asignatura,
        fecha: fecha,
        hora: hora,
        aula: aula,
        tipo: tipo,
        id: Date.now()
    });
    
    saveToLocalStorage();
    renderExamenes();
    hideModal('examen-modal');
    clearModalForm('examen-modal');
}

function editExamen(index) {
    const examen = examenes[index];
    if (!examen) return;
    
    // Llenar select de asignaturas
    const asignaturaSelect = document.getElementById('examen-asignatura');
    asignaturaSelect.innerHTML = '<option value="">Seleccionar asignatura</option>';
    asignaturas.forEach(asignatura => {
        const selected = asignatura.nombre === examen.asignatura ? 'selected' : '';
        asignaturaSelect.innerHTML += `<option value="${asignatura.nombre}" ${selected}>${asignatura.nombre}</option>`;
    });
    
    document.getElementById('examen-fecha').value = examen.fecha;
    document.getElementById('examen-hora').value = examen.hora;
    document.getElementById('examen-aula').value = examen.aula;
    document.getElementById('examen-tipo').value = examen.tipo;
    
    // Cambiar el comportamiento del botón para editar
    const submitBtn = document.querySelector('#examen-modal .btn-primary');
    submitBtn.onclick = () => updateExamen(index);
    submitBtn.textContent = 'Actualizar Examen';
    
    showModal('examen-modal');
}

function updateExamen(index) {
    const asignatura = document.getElementById('examen-asignatura').value;
    const fecha = document.getElementById('examen-fecha').value;
    const hora = document.getElementById('examen-hora').value;
    const aula = document.getElementById('examen-aula').value;
    const tipo = document.getElementById('examen-tipo').value;
    
    if (!asignatura || !fecha || !hora || !aula || !tipo) {
        alert('Por favor, completa todos los campos');
        return;
    }
    
    examenes[index] = {
        ...examenes[index],
        asignatura: asignatura,
        fecha: fecha,
        hora: hora,
        aula: aula,
        tipo: tipo
    };
    
    saveToLocalStorage();
    renderExamenes();
    hideModal('examen-modal');
    clearModalForm('examen-modal');
    
    // Restaurar el comportamiento original del botón
    const submitBtn = document.querySelector('#examen-modal .btn-primary');
    submitBtn.onclick = addExamen;
    submitBtn.textContent = 'Agregar Examen';
}

function deleteExamen(index) {
    if (confirm('¿Estás seguro de que quieres eliminar este examen?')) {
        examenes.splice(index, 1);
        saveToLocalStorage();
        renderExamenes();
    }
}

// --- Notas ---
function renderNotas() {
    const notasDetalle = document.getElementById('notasDetalle');
    const mediaGeneral = document.getElementById('mediaGeneral');
    const creditosAprobados = document.getElementById('creditosAprobados');
    const asignaturasAprobadas = document.getElementById('asignaturasAprobadas');
    
    if (!notasDetalle) return;
    
    notasDetalle.innerHTML = '';
    
    if (notas.length === 0) {
        notasDetalle.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <h3>No hay notas registradas</h3>
                <p>Añade tu primera nota para empezar</p>
                <button class="btn btn-primary" onclick="openModal('notaModal')">
                    <i class="fas fa-plus"></i>
                    Nueva Nota
                </button>
            </div>
        `;
        return;
    }
    
    // Agrupar notas por asignatura
    const notasPorAsignatura = {};
    notas.forEach(nota => {
        if (!notasPorAsignatura[nota.asignatura]) {
            notasPorAsignatura[nota.asignatura] = [];
        }
        notasPorAsignatura[nota.asignatura].push(nota);
    });
    
    let sumaMedias = 0;
    let contadorAsignaturas = 0;
    let creditosTotal = 0;
    let asignaturasAprobCount = 0;
    
    Object.keys(notasPorAsignatura).forEach(asignatura => {
        const asignaturaSection = document.createElement('div');
        asignaturaSection.className = 'asignatura-notas-section';
        
        const notasAsignatura = notasPorAsignatura[asignatura];
        
        // Calcular promedio ponderado si hay pesos, sino promedio simple
        let promedio = 0;
        let pesoTotal = 0;
        
        notasAsignatura.forEach(nota => {
            if (nota.peso && nota.peso > 0) {
                promedio += nota.calificacion * (nota.peso / 100);
                pesoTotal += nota.peso;
            }
        });
        
        // Si no hay pesos o no suman 100%, usar promedio simple
        if (pesoTotal === 0 || pesoTotal !== 100) {
            promedio = notasAsignatura.reduce((sum, nota) => sum + nota.calificacion, 0) / notasAsignatura.length;
        }
        
        sumaMedias += promedio;
        contadorAsignaturas++;
        
        // Buscar créditos de la asignatura
        const asignaturaData = asignaturas.find(a => a.nombre === asignatura);
        const creditos = asignaturaData ? asignaturaData.creditos : 0;
        
        if (promedio >= 5) {
            asignaturasAprobCount++;
            creditosTotal += creditos;
        }
        
        const estadoAprobado = promedio >= 5 ? 'aprobado' : 'suspendido';
        
        asignaturaSection.innerHTML = `
            <div class="asignatura-notas-header">
                <h4>${asignatura}</h4>
                <div class="promedio-container">
                    <span class="promedio ${estadoAprobado}">${promedio.toFixed(2)}</span>
                    <small>${creditos} ECTS</small>
                </div>
            </div>
            <div class="notas-lista">
                ${notasAsignatura.map((nota, index) => `
                    <div class="nota-item">
                        <div class="nota-info">
                            <strong>${nota.evaluacion || nota.tipoEvaluacion}</strong>
                            <span class="nota-valor">${nota.calificacion || nota.nota}</span>
                        </div>
                        <div class="nota-detalles">
                            <small>Fecha: ${new Date(nota.fecha).toLocaleDateString('es-ES')}</small>
                            ${nota.peso ? `<small>Peso: ${nota.peso}%</small>` : ''}
                        </div>
                        <div class="nota-actions">
                            <button onclick="editNota(${notas.indexOf(nota)})" class="btn-edit-small">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteNota(${notas.indexOf(nota)})" class="btn-delete-small">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        notasDetalle.appendChild(asignaturaSection);
    });
    
    // Actualizar resumen
    const mediaGeneralValor = contadorAsignaturas > 0 ? (sumaMedias / contadorAsignaturas) : 0;
    
    if (mediaGeneral) {
        mediaGeneral.textContent = mediaGeneralValor.toFixed(2);
    }
    
    if (creditosAprobados) {
        creditosAprobados.textContent = creditosTotal;
    }
    
    if (asignaturasAprobadas) {
        asignaturasAprobadas.textContent = asignaturasAprobCount;
    }
}

function addNota() {
    const asignatura = document.getElementById('nota-asignatura').value;
    const evaluacion = document.getElementById('nota-evaluacion').value;
    const calificacion = parseFloat(document.getElementById('nota-calificacion').value);
    const fecha = document.getElementById('nota-fecha').value;
    const peso = parseFloat(document.getElementById('nota-peso').value);
    
    if (!asignatura || !evaluacion || !calificacion || !fecha || !peso) {
        alert('Por favor, completa todos los campos');
        return;
    }
    
    if (calificacion < 0 || calificacion > 10) {
        alert('La calificación debe estar entre 0 y 10');
        return;
    }
    
    notas.push({
        asignatura: asignatura,
        evaluacion: evaluacion,
        calificacion: calificacion,
        fecha: fecha,
        peso: peso,
        id: Date.now()
    });
    
    saveToLocalStorage();
    renderNotas();
    hideModal('nota-modal');
    clearModalForm('nota-modal');
}

function editNota(index) {
    const nota = notas[index];
    if (!nota) return;
    
    // Llenar select de asignaturas
    const asignaturaSelect = document.getElementById('nota-asignatura');
    asignaturaSelect.innerHTML = '<option value="">Seleccionar asignatura</option>';
    asignaturas.forEach(asignatura => {
        const selected = asignatura.nombre === nota.asignatura ? 'selected' : '';
        asignaturaSelect.innerHTML += `<option value="${asignatura.nombre}" ${selected}>${asignatura.nombre}</option>`;
    });
    
    document.getElementById('nota-evaluacion').value = nota.evaluacion;
    document.getElementById('nota-calificacion').value = nota.calificacion;
    document.getElementById('nota-fecha').value = nota.fecha;
    document.getElementById('nota-peso').value = nota.peso;
    
    // Cambiar el comportamiento del botón para editar
    const submitBtn = document.querySelector('#nota-modal .btn-primary');
    submitBtn.onclick = () => updateNota(index);
    submitBtn.textContent = 'Actualizar Nota';
    
    showModal('nota-modal');
}

function updateNota(index) {
    const asignatura = document.getElementById('nota-asignatura').value;
    const evaluacion = document.getElementById('nota-evaluacion').value;
    const calificacion = parseFloat(document.getElementById('nota-calificacion').value);
    const fecha = document.getElementById('nota-fecha').value;
    const peso = parseFloat(document.getElementById('nota-peso').value);
    
    if (!asignatura || !evaluacion || !calificacion || !fecha || !peso) {
        alert('Por favor, completa todos los campos');
        return;
    }
    
    if (calificacion < 0 || calificacion > 10) {
        alert('La calificación debe estar entre 0 y 10');
        return;
    }
    
    notas[index] = {
        ...notas[index],
        asignatura: asignatura,
        evaluacion: evaluacion,
        calificacion: calificacion,
        fecha: fecha,
        peso: peso
    };
    
    saveToLocalStorage();
    renderNotas();
    hideModal('nota-modal');
    clearModalForm('nota-modal');
    
    // Restaurar el comportamiento original del botón
    const submitBtn = document.querySelector('#nota-modal .btn-primary');
    submitBtn.onclick = addNota;
    submitBtn.textContent = 'Agregar Nota';
}

function deleteNota(index) {
    if (confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
        notas.splice(index, 1);
        saveToLocalStorage();
        renderNotas();
    }
}

// ===== FUNCIONES DE CONFIGURACIÓN DE MODALES =====
function setupExamenModal() {
    const asignaturaSelect = document.getElementById('examen-asignatura');
    if (asignaturaSelect) {
        asignaturaSelect.innerHTML = '<option value="">Seleccionar asignatura</option>';
        asignaturas.forEach(asignatura => {
            asignaturaSelect.innerHTML += `<option value="${asignatura.nombre}">${asignatura.nombre}</option>`;
        });
    }
}

function setupNotaModal() {
    const asignaturaSelect = document.getElementById('nota-asignatura');
    if (asignaturaSelect) {
        asignaturaSelect.innerHTML = '<option value="">Seleccionar asignatura</option>';
        asignaturas.forEach(asignatura => {
            asignaturaSelect.innerHTML += `<option value="${asignatura.nombre}">${asignatura.nombre}</option>`;
        });
    }
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    // Configurar event listeners para navegación
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const pageId = this.getAttribute('data-page');
            if (pageId) {
                showPage(pageId);
            }
        });
    });
    
    // Event listeners para formularios
    const categoriaDeudaForm = document.getElementById('categoriaDeudaForm');
    if (categoriaDeudaForm) {
        categoriaDeudaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addCategoriaDeuda();
        });
    }
    
    const deudaForm = document.getElementById('deudaForm');
    if (deudaForm) {
        deudaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addDebt();
        });
    }
    
    // Event listener para actualizar formulario de deudas cuando se abre el modal
    const deudaModal = document.getElementById('deudaModal');
    if (deudaModal) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    if (deudaModal.style.display === 'flex') {
                        updateDebtForm();
                    }
                }
            });
        });
        observer.observe(deudaModal, { attributes: true });
    }
    
    // Mostrar página inicial
    showPage('dashboard');
    
    // Renderizar contenido inicial
    renderDebts();
    renderKanban();
    
    // Configurar drag and drop para kanban
    setupKanbanDragDrop();
    
    // Event listeners para cerrar modales
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
        
        if (e.target.classList.contains('close') || e.target.classList.contains('modal-close')) {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        }
    });
    
    // Event listeners para botones de agregar que necesitan configuración especial
    const addExamenBtn = document.querySelector('[onclick="openModal(\'examenModal\')"]');
    if (addExamenBtn) {
        addExamenBtn.addEventListener('click', setupExamenModal);
    }
    
    const addNotaBtn = document.querySelector('[onclick="openModal(\'notaModal\')"]');
    if (addNotaBtn) {
        addNotaBtn.addEventListener('click', setupNotaModal);
    }
    
    console.log('Aplicación inicializada correctamente');
});
