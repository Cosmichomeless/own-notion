# FinanzApp - Control de Deudas

Una aplicación web moderna para controlar quién te debe dinero, con autenticación Magic Link de Supabase y persistencia en la nube.

## 🚀 Características

- **Autenticación sin contraseñas**: Magic Link de Supabase
- **Gestión de deudas**: Agregar, editar, marcar como pagadas y eliminar
- **Dashboard intuitivo**: Resumen visual de tus finanzas
- **Filtros avanzados**: Por estado y persona
- **Responsive**: Diseño adaptable a móviles y desktop
- **Persistencia en la nube**: Todos los datos se sincronizan automáticamente
- **Exportación de datos**: Descarga tu información en JSON

## 📁 Estructura del Proyecto

```
/
├── index.html          # Estructura HTML principal
├── styles.css          # Estilos CSS modernos y responsivos
├── app.js             # Lógica JavaScript de la aplicación
├── supabase_schema.sql # Schema SQL para Supabase
└── README_FINANZAS.md  # Documentación del proyecto
```

## 🛠️ Configuración

### 1. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ve al SQL Editor y ejecuta el contenido de `supabase_schema.sql`
3. Actualiza las credenciales en `app.js`:
   ```javascript
   const SUPABASE_URL = "tu-url-de-supabase";
   const SUPABASE_ANON_KEY = "tu-clave-anonima";
   ```

### 2. Configurar autenticación

1. En tu proyecto Supabase, ve a Authentication > Settings
2. Configura la URL del sitio (Site URL)
3. Agrega tu dominio a las URLs permitidas (Redirect URLs)

### 3. Desplegar

Puedes desplegar la aplicación en cualquier hosting estático:
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting

## 📊 Base de Datos

### Tablas

#### `user_profiles`
- `id` (UUID): ID del usuario (FK a auth.users)
- `name` (TEXT): Nombre del usuario
- `created_at`, `updated_at` (TIMESTAMP)

#### `debts`
- `id` (UUID): ID único de la deuda
- `user_id` (UUID): ID del usuario propietario
- `person_name` (TEXT): Nombre de la persona que debe
- `amount` (DECIMAL): Cantidad de dinero
- `description` (TEXT): Descripción opcional
- `date_created` (TIMESTAMP): Fecha de creación
- `date_due` (TIMESTAMP): Fecha límite de pago
- `is_paid` (BOOLEAN): Estado de la deuda
- `created_at`, `updated_at` (TIMESTAMP)

### Seguridad (RLS)

La aplicación utiliza Row Level Security (RLS) para garantizar que:
- Los usuarios solo puedan ver y modificar sus propios datos
- No hay acceso cruzado entre usuarios
- Los datos están protegidos a nivel de base de datos

## 💻 Funcionalidades

### Dashboard
- Resumen total de dinero pendiente
- Número de deudas activas
- Contador de personas únicas
- Lista de deudas recientes
- Formulario de agregar deuda rápida

### Gestión de Deudas
- Lista completa de todas las deudas
- Filtros por estado (pendientes/pagadas) y persona
- Marcar deudas como pagadas/pendientes
- Editar información de deudas existentes
- Eliminar deudas (con confirmación)

### Vista de Personas
- Resumen agrupado por persona
- Total adeudado por cada persona
- Número de deudas activas y totales
- Fecha de última actividad

### Perfil de Usuario
- Editar nombre del usuario
- Exportar todos los datos en JSON
- Sincronización manual con la nube
- Información de la cuenta

## 🎨 Diseño

La aplicación utiliza:
- Variables CSS para un tema consistente
- Diseño responsive mobile-first
- Iconos de Font Awesome
- Animaciones suaves y transiciones
- Paleta de colores moderna
- Typography system escalable

## 🔐 Autenticación

### Magic Link Flow
1. Usuario ingresa su email
2. Supabase envía un enlace mágico
3. Usuario hace click en el enlace
4. Sesión se establece automáticamente
5. Datos se cargan desde la nube

### Persistencia de Sesión
- Las sesiones se mantienen entre recargas
- Auto-refresh de tokens
- Detección automática de cambios de autenticación

## 📱 Responsive Design

La aplicación es completamente responsive:
- **Mobile**: Navegación apilada, formularios de una columna
- **Tablet**: Grid adaptativo, formularios de dos columnas
- **Desktop**: Layout completo, todas las funcionalidades visibles

## 🚀 Desarrollo Local

1. Clona el repositorio
2. Configura las credenciales de Supabase
3. Abre `index.html` en un servidor local
4. ¡Listo para desarrollar!

## 📝 Próximas Funcionalidades

- [ ] Notificaciones por email para deudas vencidas
- [ ] Categorías de deudas
- [ ] Gráficos y estadísticas avanzadas
- [ ] Recordatorios programados
- [ ] Importación desde CSV/Excel
- [ ] Modo oscuro
- [ ] PWA (Progressive Web App)

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE para detalles.

---

**FinanzApp** - Controla tus finanzas de manera simple y eficiente 💰