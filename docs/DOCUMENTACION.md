# 🦅 Centralita Neron - Manual Técnico y de Usuario

Bienvenido a la documentación oficial de **Centralita Neron**. Este documento detalla el funcionamiento interno, la arquitectura y los procedimientos de mantenimiento del sistema.

---

## 🏗️ 1. Arquitectura del Sistema

La aplicación está construida siguiendo un modelo de **Aplicación de Página Única (SPA)** con un servidor integrado.

- **Frontend**: React 18 + Vite. Interfaz moderna, reactiva y optimizada para rendimiento.
- **Backend**: Node.js + Express. Gestiona la lógica de negocio, autenticación y comunicación con la base de datos.
- **Base de Datos**: SQLite3. Motor ligero y portable que no requiere instalación de servidores externos.
- **Estilos**: Tailwind CSS para una interfaz limpia, oscura y profesional.

---

## 🔐 2. Seguridad y Cifrado

La seguridad es un pilar fundamental en Centralita Neron.

### 2.1 Hashing de Contraseñas
No almacenamos contraseñas en texto plano. Utilizamos **bcryptjs** para realizar un proceso de "hashing" con sal (salt).
- **Proceso**: Cuando se crea un usuario, la contraseña se mezcla con una cadena aleatoria y se procesa mediante un algoritmo criptográfico de una sola vía.
- **Ventaja**: Incluso si alguien accede al archivo de la base de datos, no podrá revertir el código para obtener la contraseña real.

### 2.2 Autenticación
El sistema utiliza sesiones basadas en estado local para mantener al operador identificado mientras la aplicación esté abierta.

---

## 📊 3. Base de Datos (Estructura)

La base de datos se encuentra en `BaseCentralita/neron.db`. Consta de dos tablas principales:

### 3.1 Tabla `operators`
Almacena los perfiles del equipo.
- `id`: Identificador único.
- `name`: Nombre del operador (único).
- `password`: Hash de la contraseña.
- `role`: 'admin' o 'user'.
- `department`: Departamento asignado.
- `extension`: Número de extensión telefónica.
- `status`: Estado actual (Libre, Ocupado, Ausente, Offline).

### 3.2 Tabla `tickets`
Gestiona el flujo de llamadas e incidencias.
- `client_name / client_number`: Datos del cliente.
- `status`: 'pending', 'assigned', 'completed'.
- `assigned_to`: ID del operador que tiene el ticket.
- `created_by`: ID del operador que registró la llamada.
- `transferred_from`: Historial de traspaso (quién cedió el ticket).
- `created_at`: Fecha y hora exacta (UTC).

---

## ⚙️ 4. Automatización y Mantenimiento

### 4.1 Tarea Programada (CRON)
El sistema incluye un motor de tareas (`node-cron`) que realiza limpiezas de mantenimiento:
- **Horario**: Todos los Viernes a las 18:00h (Hora Española).
- **Acción**: Elimina tickets con estado 'completado' que tengan más de 30 días de antigüedad para mantener el sistema ágil.

### 4.2 Limpieza Manual
Desde el **Panel de Administrador**, existe un botón de "Mantenimiento" que permite borrar todos los tickets finalizados al instante si se requiere liberar espacio.

---

## 📦 5. Distribución y Portabilidad

El sistema está diseñado para ser **Portable**.

- **El Ejecutable**: `NeronCentralita.exe` contiene todo el código necesario.
- **Dependencia Crítica**: Requiere el archivo `node_sqlite3.node` en la misma carpeta para funcionar en Windows.
- **Base de Datos**: Se crea automáticamente en la carpeta `BaseCentralita`. Para migrar la aplicación a otro PC manteniendo los datos, basta con copiar esta carpeta junto al ejecutable.

---

## 🛠️ 6. Desarrollo y Builds

Si deseas realizar cambios en el código:
1.  Edita los archivos en `client/src` o `server/`.
2.  Ejecuta `build.bat`.
3.  El script generará automáticamente un nuevo pack en la carpeta `PackNeronCentralita`.

---
*Documentación generada para Centralita Neron - V1.0*
