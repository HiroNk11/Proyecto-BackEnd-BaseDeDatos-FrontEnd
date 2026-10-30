# ComercioPedidos | Gestión de Indumentaria

![C#](https://img.shields.io/badge/C%23-512BD4?style=flat-square)
![ASP.NET Core](https://img.shields.io/badge/ASP.NET_Core-10-512BD4?style=flat-square)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat-square&logo=react)
![SQL Server](https://img.shields.io/badge/SQL_Server-CC2927?style=flat-square)

## Descripción

ComercioPedidos es un sistema de gestión de retail para un emprendimiento de indumentaria. Centraliza la administración de productos, clientes, pedidos y movimientos de stock para facilitar el seguimiento de la operación comercial.

La solución integra una aplicación web desarrollada en React y una aplicación móvil construida con React Native y Expo. Ambas consumen la misma API REST en ASP.NET Core, que concentra las reglas de negocio y el acceso a los datos mediante Entity Framework Core y SQL Server.

## Recorrido de uso

Con la API y el cliente iniciados:

1. Registrar un producto y un cliente.
2. Crear un pedido y consultar su detalle.
3. Confirmar el pedido y revisar su estado.
4. Consultar el stock y sus movimientos desde las pantallas de gestión.
5. Consultar la información desde el otro cliente, conectado a la misma API.

## Arquitectura y Tecnologías

```text
React · Web ───────────────┐
                          ├── HTTP / JSON ── ASP.NET Core API
React Native · Mobile ────┘                         │
                                          Entity Framework Core
                                                   │
                                               SQL Server
```

| Componente | Tecnologías | Responsabilidad |
| --- | --- | --- |
| API | C#, .NET 10 y ASP.NET Core | Exponer endpoints y coordinar las solicitudes. |
| Aplicación | DTOs, entidades e interfaces de servicios | Definir contratos y conceptos del negocio. |
| Infraestructura | Entity Framework Core | Implementar servicios y acceso a datos. |
| Base de datos | SQL Server | Persistir la información comercial. |
| Frontend web | React 19, TypeScript, Vite, React Router y Axios | Proporcionar la interfaz de gestión web. |
| Frontend móvil | React Native, TypeScript, Expo y Expo Router | Permitir la gestión desde dispositivos móviles. |
| Documentación API | Swagger / OpenAPI | Explorar los endpoints en desarrollo. |

El backend utiliza inyección de dependencias, manejo global de excepciones con Problem Details y una política CORS para la integración con el frontend web.

## Características Principales

- Gestión de productos: alta, consulta, modificación y eliminación.
- Gestión de clientes: administración de la información de los compradores.
- Creación de pedidos: registro de operaciones comerciales.
- Seguimiento de pedidos: confirmación, cancelación y entrega.
- Filtros de pedidos: búsqueda por estado, cliente y rango de fechas.
- Paginación: consulta de pedidos en grupos de resultados.
- Control de stock: consulta y registro de movimientos.
- Acceso web y móvil: integración de ambos clientes con una API compartida.
- Documentación interactiva: exploración de endpoints mediante Swagger en desarrollo.

## Prerrequisitos

- Git.
- .NET SDK 10, según el framework declarado en el backend.
- Node.js y npm compatibles con las dependencias de cada package.json.
- SQL Server, con permisos para crear o actualizar la base de datos.
- Entity Framework Core CLI (dotnet-ef) 10.x, compatible con los paquetes del proyecto.
- Un dispositivo o emulador compatible con la versión de Expo utilizada.
- Android Studio, para utilizar un emulador Android.
- macOS y Xcode, para utilizar el simulador iOS.
- Opcional: Visual Studio, Visual Studio Code o Rider.

## Instalación y Ejecución

### 1. Clonar el repositorio

```powershell
git clone https://github.com/HiroNk11/Proyecto-BackEnd-BaseDeDatos-FrontEnd.git
cd Proyecto-BackEnd-BaseDeDatos-FrontEnd
```

Los comandos del backend se ejecutan desde la raíz del repositorio.

### 2. Restaurar las dependencias del backend

```powershell
dotnet restore ComercioPedidos/backend/ComercioPedidos.API/ComercioPedidos.API.csproj
```

### 3. Configurar la conexión a SQL Server

La API utiliza la clave ConnectionStrings:ComercioPedidos.

Para configurar la conexión de desarrollo mediante User Secrets:

```powershell
dotnet user-secrets init --project ComercioPedidos/backend/ComercioPedidos.API
dotnet user-secrets set "ConnectionStrings:ComercioPedidos" "Server=localhost;Database=ComercioPedidos;Trusted_Connection=True;TrustServerCertificate=True;" --project ComercioPedidos/backend/ComercioPedidos.API
```

La conexión del ejemplo utiliza autenticación integrada de Windows. Ajustá el servidor y el mecanismo de autenticación según tu instalación.

Las credenciales de base de datos deben mantenerse fuera del control de versiones.

### 4. Aplicar las migraciones

Si todavía no tenés instalada la herramienta de Entity Framework Core:

```powershell
dotnet tool install --global dotnet-ef --version "10.*"
```

Si ya está instalada, verificá su versión:

```powershell
dotnet ef --version
```

Aplicá las migraciones indicando el proyecto de infraestructura y el proyecto de inicio:

```powershell
dotnet ef database update --project ComercioPedidos/backend/ComercioPedidos.Infrastructure --startup-project ComercioPedidos/backend/ComercioPedidos.API
```

### 5. Iniciar la API

Configurá el certificado HTTPS de desarrollo:

```powershell
dotnet dev-certs https --trust
```

Iniciá el backend:

```powershell
dotnet run --project ComercioPedidos/backend/ComercioPedidos.API -- --environment Development
```

La terminal mostrará las direcciones disponibles. En desarrollo, podés acceder a Swagger agregando /swagger a la URL de la API.

### 6. Iniciar el frontend web

En otra terminal, desde la raíz del repositorio:

```powershell
cd ComercioPedidos/frontend
npm install
npm run dev
```

El backend tiene configurado CORS para:
http://localhost:5173
Las direcciones utilizadas para consumir la API se encuentran en:
ComercioPedidos/frontend/src/services/
Verificá que coincidan con las direcciones del backend. Por ejemplo, el servicio de productos utiliza:
https://localhost:7072/api/Productos
Para generar la compilación del frontend:

```powershell
npm run build
```

### 7. Iniciar la aplicación móvil

En otra terminal, desde la raíz del repositorio:

```powershell
cd comercio-pedidos-mobile
npm install
npm start
```

También podés iniciar Expo para una plataforma específica:

```powershell
npm run android
```

Para iOS, desde macOS con el entorno correspondiente:

```powershell
npm run ios
```

La URL del backend móvil se configura en:
comercio-pedidos-mobile/src/config/api.ts
Ejemplo de configuración para un dispositivo conectado a la misma red:

```typescript
export const API_URL = "http://192.168.1.10:5272/api";
```

Reemplazá la IP por la dirección local de tu computadora y verificá el puerto del backend.

Para permitir conexiones desde la red local, iniciá la API desde la raíz del repositorio:

```powershell
dotnet run --project ComercioPedidos/backend/ComercioPedidos.API -- --environment Development --urls http://0.0.0.0:5272
```

En un dispositivo físico, localhost apunta al propio dispositivo. Utilizá la IP de tu computadora y asegurate de que el puerto sea accesible. En el emulador estándar de Android, 10.0.2.2 permite acceder al equipo anfitrión.

## Estructura del Proyecto

```text
Proyecto-BackEnd-BaseDeDatos-FrontEnd/
├── ComercioPedidos/
│   ├── backend/
│   │   ├── ComercioPedidos.API/
│   │   │   ├── Controllers/
│   │   │   ├── Exceptions/
│   │   │   ├── Properties/
│   │   │   ├── Program.cs
│   │   │   └── appsettings.json
│   │   │
│   │   ├── ComercioPedidos.Application/
│   │   │   ├── DTO/
│   │   │   ├── Entitites/
│   │   │   ├── Enum/
│   │   │   ├── Exceptions/
│   │   │   └── Services/
│   │   │
│   │   ├── ComercioPedidos.Infrastructure/
│   │   │   ├── Data/
│   │   │   ├── Migrations/
│   │   │   └── Services/
│   │   │
│   │   └── ComercioPedidos.slnx
│   │
│   └── frontend/
│       ├── public/
│       ├── src/
│       │   ├── components/
│       │   ├── models/
│       │   ├── pages/
│       │   ├── services/
│       │   └── styles/
│       └── package.json
│
├── comercio-pedidos-mobile/
│   ├── assets/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── config/
│   │   ├── models/
│   │   └── services/
│   ├── app.json
│   └── package.json
│
└── README.md
```


