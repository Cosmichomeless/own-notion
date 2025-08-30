# Mi Notion Personal - Gestión Financiera

Una aplicación web privada tipo Notion diseñada específicamente para la gestión de finanzas personales.
https://cosmichomeless.github.io/own-notion/


## Características

### 📊 Dashboard Principal
- **Resumen financiero**: Balance total, gastos e ingresos del mes
- **Alertas de deudas**: Visualización de deudas pendientes y urgentes
- **Transacciones recientes**: Últimos movimientos registrados
- **Próximos pagos**: Calendario de vencimientos
- **Objetivos de ahorro**: Seguimiento de metas financieras con barras de progreso

### 💳 Gestión de Gastos
- Registro detallado de gastos por categorías
- Categorías predefinidas: Alimentación, Transporte, Vivienda, Entretenimiento, Salud
- Múltiples métodos de pago: Efectivo, Tarjeta Débito/Crédito, Transferencia
- Filtros por fecha, categoría y búsqueda
- Edición y eliminación de registros

### ⚠️ Control de Deudas
- Registro completo de deudas (Tarjetas de crédito, préstamos, hipotecas)
- Alertas para pagos urgentes
- Seguimiento de tasas de interés
- Cálculo de pagos mínimos mensuales
- Estado visual de cada deuda

### 🎯 Organización Personal
- Sistema de notas (en desarrollo)
- Calendario de eventos financieros (en desarrollo)
- Seguimiento de objetivos (en desarrollo)

## Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **CSS3**: Diseño responsive con CSS Grid y Flexbox
- **JavaScript Vanilla**: Funcionalidad interactiva
- **Font Awesome**: Iconografía
- **Google Fonts (Inter)**: Tipografía moderna

## Características Técnicas

### 🎨 Diseño
- Interfaz limpia inspirada en Notion
- Diseño responsive para móviles y tablets
- Esquema de colores profesional
- Animaciones suaves y transiciones

### 💾 Persistencia de Datos
- Almacenamiento local en el navegador (localStorage)
- Auto-guardado de cambios
- Función de exportar/importar datos en JSON

### 🔧 Funcionalidades
- Modales para formularios
- Sistema de notificaciones
- Validación de formularios
- Cálculos automáticos de totales
- Filtros y búsqueda en tiempo real

## Instalación y Uso

1. **Descarga los archivos**:
   - `index.html`
   - `styles.css`
   - `script.js`

2. **Abre la aplicación**:
   ```bash
   # Opción 1: Abrir directamente
   open index.html
   
   # Opción 2: Servidor local (recomendado)
   python -m http.server 8000
   # Luego visita http://localhost:8000
   ```

3. **Empieza a usar**:
   - Navega por las diferentes secciones usando el sidebar
   - Añade tus gastos y deudas usando los botones "+"
   - Revisa tu dashboard para un resumen completo

## Estructura de Archivos

```
mi-notion-financiero/
├── index.html          # Página principal con toda la estructura
├── styles.css          # Estilos CSS responsivos
├── script.js           # Lógica JavaScript
└── README.md           # Este archivo
```

## Próximas Funcionalidades

- [ ] **Gráficos interactivos** con Chart.js
- [ ] **Categorías personalizadas** para gastos
- [ ] **Presupuestos mensuales** con alertas
- [ ] **Reportes PDF** exportables
- [ ] **Calculadora de deudas** con estrategias de pago
- [ ] **Sincronización en la nube** (opcional)
- [ ] **Modo oscuro**
- [ ] **Múltiples monedas**

## Personalización

### Cambiar Categorías de Gastos
Edita el archivo `script.js` en las funciones `getCategoryIcon()` y `getCategoryName()`:

```javascript
function getCategoryIcon(category) {
    const icons = {
        'alimentacion': '🍕',
        'transporte': '🚗',
        'tu-categoria': '🎯'  // Añade aquí
    };
    return icons[category] || '📦';
}
```

### Modificar Colores
Edita el archivo `styles.css`:

```css
:root {
    --primary-color: #2383e2;     /* Color principal */
    --success-color: #51cf66;     /* Color de éxito */
    --danger-color: #e03131;      /* Color de peligro */
    --background-color: #fafafa;  /* Fondo principal */
}
```

## Datos de Ejemplo

La aplicación viene con datos de ejemplo para que puedas probar todas las funcionalidades:

- **Gastos**: Supermercado, gasolina
- **Deudas**: Tarjeta de crédito, préstamo personal
- **Objetivos**: Vacaciones 2025, fondo de emergencia

## Privacidad y Seguridad

- ✅ **100% Local**: Todos los datos se guardan en tu navegador
- ✅ **Sin servidor**: No se envía información a internet
- ✅ **Open Source**: Código completamente visible y modificable
- ✅ **Sin tracking**: No hay analytics ni cookies de terceros

## Soporte y Contribuciones

Esta es una aplicación personal, pero si tienes sugerencias o encuentras errores:

1. Revisa el código JavaScript en la consola del navegador
2. Modifica los archivos según tus necesidades
3. Guarda copias de seguridad de tus datos regularmente

## Licencia

Código libre para uso personal y modificación.

---

**¡Empieza a tomar control de tus finanzas hoy mismo!** 💰✨
