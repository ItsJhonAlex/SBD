# 🏛️ SBD - Sistema de Base de Datos - UCI

> Sistema de Inventario de Hardware y Software para la Universidad de las Ciencias Informáticas

## 🚀 Inicio Rápido con Docker

### Prerequisitos
- **Docker** y **Docker Compose** instalados
- **Node.js 18+** y **pnpm** (para el servidor de aplicación)

### ⚡ Configuración en 3 Pasos

```bash
# 1. Clonar y entrar al directorio
git clone <tu-repo>
cd SBD

# 2. Instalar dependencias de Node.js
pnpm install express cors dotenv pg

# 3. Levantar la base de datos con Docker
./scripts/docker-dev.sh start
```

¡Listo! Tu base de datos PostgreSQL ya está corriendo con datos de ejemplo.

### 🖥️ Ejecutar la Aplicación

```bash
# En una nueva terminal, ejecutar el servidor de la aplicación
node server.js
```

Accede a la aplicación en: **http://localhost:3000**

## 🐳 Gestión con Docker

### Scripts de Desarrollo

```bash
# Iniciar servicios (PostgreSQL + pgAdmin)
./scripts/docker-dev.sh start

# Ver estado de los servicios
./scripts/docker-dev.sh status

# Ver logs en tiempo real
./scripts/docker-dev.sh logs

# Detener servicios
./scripts/docker-dev.sh stop

# Reiniciar servicios
./scripts/docker-dev.sh restart

# ⚠️ Resetear base de datos (ELIMINA TODOS LOS DATOS)
./scripts/docker-dev.sh reset

# Ver ayuda
./scripts/docker-dev.sh help
```

### Servicios Disponibles

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **SBD App** | http://localhost:3000 | - |
| **PostgreSQL** | localhost:5432 | user: `sbd_user`<br>pass: `sbd_password` |
| **pgAdmin** | http://localhost:8080 | email: `admin@sbd.local`<br>pass: `admin123` |

## 📊 Funcionalidades del Sistema

### 🖥️ **Dashboard Principal**
- Estadísticas del sistema en tiempo real
- Actividad reciente
- Auto-actualización cada 30 segundos
- Exportación de datos en JSON

### 🖥️ **Gestión de Agentes**
- Vista completa de todas las computadoras
- Búsqueda en tiempo real por nombre, IP, SO
- Detalles técnicos incluye información de RAM
- Historial de ubicaciones

### 📦 **Inventario Inteligente**
- **Resumen por agente**: Hardware y software por computadora
- **Hardware completo**: Motherboards, procesadores, RAM, storage
- **Software categorizado**: Por tipo de aplicación
- **Configuraciones detalladas**: Especificaciones técnicas

### 📍 **Ubicaciones Jerárquicas**
- Gestión de ubicaciones UCI (Facultades, Laboratorios, etc.)
- Estadísticas por ubicación
- Historial de movimientos de equipos

### 📈 **Análisis Avanzado**
- **Análisis de RAM**: Utilización de slots por motherboard
- **Estadísticas de inventario**: Resúmenes y tendencias
- **Reportes exportables**: JSON para análisis externo

### 🔍 **Búsqueda Global**
- Búsqueda unificada en agentes y equipos
- Resultados en tiempo real
- Filtros por tipo de elemento

## 🗄️ Estructura de la Base de Datos

### Tablas Principales
- **`agents`**: Computadoras de la red
- **`locations`**: Ubicaciones jerárquicas UCI  
- **`inventories`**: Inventarios base (hardware/software)
- **`hardware_inventories`**: Detalles de hardware
- **`software_inventories`**: Software instalado
- **`motherboards`**: Tarjetas madre y configuraciones
- **`processors`**: Información de procesadores
- **`ram_memories`**: Módulos de memoria RAM
- **`storage_devices`**: Dispositivos de almacenamiento
- **`io_devices`**: Dispositivos de entrada/salida

### Vistas y Funciones
- **Vistas optimizadas** para consultas frecuentes
- **Funciones PostgreSQL** para lógica de negocio
- **Índices estratégicos** para mejor rendimiento

## 🛠️ Comandos Útiles

### Docker Compose Manual

```bash
# Levantar solo PostgreSQL
docker-compose up -d postgres

# Levantar todo el stack
docker-compose up -d

# Ver logs específicos
docker-compose logs -f postgres

# Conectar a PostgreSQL directamente
docker-compose exec postgres psql -U sbd_user -d sbd_inventory

# Eliminar volúmenes (⚠️ BORRA DATOS)
docker-compose down -v
```

### Base de Datos

```bash
# Backup de la base de datos
docker-compose exec postgres pg_dump -U sbd_user sbd_inventory > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U sbd_user sbd_inventory < backup.sql

# Ejecutar script SQL personalizado
docker-compose exec -T postgres psql -U sbd_user sbd_inventory < mi_script.sql
```

## 🏗️ Arquitectura del Proyecto

```
SBD/
├── 🐳 docker-compose.yml        # Orchestración de servicios
├── 📋 script.sql                # Schema y datos iniciales
├── 🔧 server.js                 # Servidor Express principal
├── ⚙️ config/
│   └── database.js             # Configuración PostgreSQL
├── 📡 routes/                   # Endpoints de la API
│   ├── agents.js               # Gestión de agentes
│   ├── inventory.js            # Inventarios
│   ├── locations.js            # Ubicaciones
│   └── statistics.js           # Estadísticas
├── 🌐 public/                   # Frontend
│   ├── index.html              # Aplicación principal
│   ├── styles/                 # CSS modular
│   └── js/                     # JavaScript por funcionalidad
├── 🐳 docker/                   # Configuraciones Docker
│   ├── postgres/               # Scripts de inicialización
│   └── pgadmin/                # Configuración pgAdmin
└── 📜 scripts/                  # Scripts de automatización
    └── docker-dev.sh           # Helper de desarrollo
```

## 🔒 Variables de Entorno

Copia `.env.example` a `.env` y ajusta según necesites:

```bash
# Database Configuration (Docker)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sbd_inventory
DB_USER=sbd_user
DB_PASSWORD=sbd_password

# Server Configuration
PORT=3000
NODE_ENV=development
```

## 📱 API REST

### Endpoints Principales

```http
# Estadísticas
GET /api/statistics

# Agentes
GET /api/agents
GET /api/agents/search/:term
GET /api/agents/:id/details
GET /api/agents/:id/ram

# Inventario
GET /api/inventory/summary
GET /api/inventory/hardware
GET /api/inventory/software
GET /api/inventory/motherboards
GET /api/inventory/ram-analysis

# Ubicaciones
GET /api/locations
GET /api/locations/statistics
GET /api/locations/history
```

## 🤝 Desarrollo

### Estructura de Commits
Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat(agents): add RAM analysis feature
fix(api): resolve database connection timeout
docs(readme): update Docker instructions
style(ui): improve responsive design
refactor(inventory): optimize query performance
```

### Tecnologías Utilizadas

**Backend:**
- **Node.js** + **Express** - Servidor web
- **PostgreSQL 15** - Base de datos
- **Docker** - Contenedorización

**Frontend:**
- **Vanilla JavaScript ES6+** - Sin frameworks, máximo rendimiento
- **CSS3 Grid/Flexbox** - Layout responsivo
- **Fetch API** - Comunicación con backend

**DevOps:**
- **Docker Compose** - Orquestación local
- **pgAdmin** - Administración de DB

## 📄 Licencia

Este proyecto está desarrollado para la Universidad de las Ciencias Informáticas (UCI).

---

💻 **Desarrollado con ❤️ para la UCI** 

¿Preguntas? ¿Bugs? ¡Abre un issue! 🐛 