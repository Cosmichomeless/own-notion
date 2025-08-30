# 💰 Finanzas Personales - Aplicación Web

Una aplicación web moderna para gestionar tus deudas y gastos personales, con almacenamiento local y sincronización en la nube usando Supabase.

## ✨ Características

- **Gestión de Deudas**: Registra quién te debe dinero y a quién le debes
- **Resumen Financiero**: Visualiza tu balance neto al instante
- **Vista por Personas**: Agrupa todas las deudas por persona
- **Almacenamiento Local**: Funciona sin conexión usando localStorage
- **Sincronización en la Nube**: Backup automático con Supabase
- **Autenticación**: Login seguro con magic links por email
- **Actividad Reciente**: Historial de todas tus operaciones
- **Exportar/Importar**: Respalda tus datos en formato JSON

## 🚀 Instalación y Configuración

### 1. Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Ve al SQL Editor en tu proyecto de Supabase
4. Copia y pega todo el contenido del archivo `supabase_schema.sql`
5. Ejecuta el script completo
6. Ve a Settings > API para obtener tu URL y anon key

**IMPORTANTE**: El script incluye:
- Creación automática de perfil de usuario al registrarse
- Migración para usuarios existentes sin perfil
- Políticas de seguridad RLS
- Índices optimizados para rendimiento

### 2. Configurar la Aplicación

1. Abre el archivo `main.js`
2. Busca las líneas que contienen:
   ```javascript
   const SUPABASE_URL = "https://tu-proyecto.supabase.co";
   const SUPABASE_ANON_KEY = "tu-anon-key-aqui";
   ```
3. Reemplaza con los valores de tu proyecto de Supabase

### 3. Desplegar

Puedes usar la aplicación de varias formas:

#### Opción A: GitHub Pages
1. Sube los archivos a un repositorio de GitHub
2. Activa GitHub Pages
3. Accede desde `https://tu-usuario.github.io/tu-repo`

#### Opción B: Servidor Local
1. Usa cualquier servidor HTTP simple:
   ```bash
   # Python
   python -m http.server 8000
   
   # Node.js
   npx serve .
   
   # PHP
   php -S localhost:8000
   ```

#### Opción C: Netlify/Vercel
1. Arrastra la carpeta completa a Netlify o Vercel
2. Se desplegará automáticamente

## 📋 Uso de la Aplicación

### Primera Vez
1. Abre la aplicación en tu navegador
2. Ve a la pestaña "Configuración"
3. Ingresa tu email y haz clic en "Entrar / Enviarme enlace"
4. Revisa tu email (incluye spam) y haz clic en el enlace
5. Configura tu nombre en la sección de información personal

### Registrar Deudas
1. Ve a la pestaña "Finanzas"
2. Usa el formulario "Me deben" para registrar dinero que te deben
3. Usa el formulario "Debo" para registrar dinero que debes
4. Completa todos los campos y haz clic en "Registrar"

### Ver Resumen
- El dashboard principal muestra tu balance total
- "Me deben": Total de dinero que te deben
- "Debo": Total de dinero que debes
- "Balance neto": Diferencia entre ambos (verde si es positivo, rojo si es negativo)

### Vista por Personas
- Ve a la pestaña "Personas" para ver las deudas agrupadas por persona
- Cada persona muestra el balance total contigo
- Verde: Te debe dinero neto
- Rojo: Le debes dinero neto

## 🛠️ Funciones Avanzadas

### Exportar Datos
1. Ve a Configuración
2. Haz clic en "Exportar datos JSON"
3. Se descargará un archivo con todos tus datos

### Importar Datos
1. Ve a Configuración
2. Haz clic en "Importar datos JSON"
3. Selecciona un archivo previamente exportado

### Limpiar Datos
1. Ve a Configuración
2. Haz clic en "Limpiar todos los datos"
3. Confirma la acción (no se puede deshacer)

### Diagnóstico
1. Ve a Configuración
2. Haz clic en "Ejecutar diagnóstico"
3. Revisa la consola para información detallada sobre la conexión

## 🔧 Estructura del Proyecto

```
finanzas-personales/
├── index.html          # Interfaz principal
├── main.js             # Lógica de la aplicación
├── supabase_schema.sql # Esquema de la base de datos
└── README.md           # Este archivo
```

## 🔒 Seguridad y Privacidad

- **RLS (Row Level Security)**: Cada usuario solo puede ver sus propios datos
- **Autenticación JWT**: Tokens seguros para la comunicación con Supabase
- **Magic Links**: No hay contraseñas que recordar o hackear
- **HTTPS**: Toda la comunicación está encriptada
- **Almacenamiento Local**: Los datos se guardan en tu navegador

## 🔍 Solución de Problemas

### No puedo hacer login
1. Verifica que hayas configurado correctamente SUPABASE_URL y SUPABASE_ANON_KEY
2. Revisa tu email (incluye spam)
3. Asegúrate de que tu proyecto de Supabase esté activo

### No se sincronizan los datos
1. Verifica tu conexión a internet
2. Ve a Configuración > Diagnóstico para ver errores
3. Revisa la consola del navegador (F12)

### No aparece mi nombre al iniciar sesión en otro dispositivo
1. La aplicación crea automáticamente un perfil con tu email como nombre base
2. Si cambias tu nombre en un dispositivo, se sincronizará automáticamente
3. Usa el diagnóstico para verificar que el perfil de usuario existe

### Los datos no persisten entre dispositivos
1. Asegúrate de estar logueado con el mismo email en ambos dispositivos
2. Verifica que la sincronización esté funcionando (ve a Diagnóstico)
3. Los datos se sincronizan automáticamente al iniciar sesión

### Perdí mis datos
1. Si tenías sincronización activa, haz login de nuevo
2. Si tienes un backup JSON, usa la función de importar
3. Los datos locales se mantienen en localStorage del navegador

## 🤝 Contribuir

¿Encontraste un bug o tienes una sugerencia? ¡Genial!

1. Abre un issue describiendo el problema
2. Si quieres contribuir código, haz un fork y envía un pull request
3. Asegúrate de probar tus cambios antes de enviar

## 📄 Licencia

Este proyecto es de código abierto. Puedes usarlo, modificarlo y distribuirlo libremente.

## 🙏 Agradecimientos

- [Supabase](https://supabase.com) por el backend as a service
- [Font Awesome](https://fontawesome.com) por los iconos (si se usan)
- La comunidad de desarrolladores por las mejores prácticas

---

**¡Disfruta gestionando tus finanzas de forma inteligente! 💰**
