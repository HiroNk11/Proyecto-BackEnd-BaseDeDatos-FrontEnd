# Etapa 2 — Clientes Web y Expo

Esta rama parte del PR #8 (`775eb8c`) y su PR apunta a esa rama mientras siga abierto. No modifica código de la API, DTOs, permisos ni transiciones del servidor.

## Componentes y comportamiento

- `src/lib/problem.ts` en cada cliente convierte RFC 7807 (`title`, `detail`, estado HTTP real y `errors` por campo) y el formato legado `mensaje` en `ApiError`. Muestra errores de negocio/validación en español y mensajes seguros para 401, 403, 5xx y fallos de conexión.
- `src/lib/session.ts` conserva el contrato público `setAccessTokenProvider`. Una revisión de sesión descarta avisos tardíos de solicitudes anteriores. Obtener el token tiene un límite de 10 segundos; las solicitudes HTTP, de 15 segundos. No hay reintentos automáticos de escrituras.
- `SessionBoundary`: 401 muestra sesión requerida y detiene la pantalla protegida; 403 muestra un aviso sin bloquear las demás vistas. Cambiar el proveedor remonta los datos. El ingreso manual de JWT existe únicamente en desarrollo, usa memoria y no persiste tokens ni los registra. La API siempre valida firma y permisos; reconocer tres segmentos no autentica al usuario.
- Web: `useResource`, `ResourceState`, `StatusBadge`, `Modal` y `ConfirmModal`; pedidos con filtros en URL por estado, cliente y fecha, tabla adaptable, checkout con estimación, detalle y confirmación antes de cancelar. Inventario con reintento, filtros y bloqueo de envío. Productos/clientes conservan CRUD y eliminan los warnings de efectos preexistentes.
- Expo: `NuevoPedidoModal` con resumen fijo fuera del scroll, controles de cantidad de 44 px, límite de stock y prevención de doble envío. Historial con filtros y pull-to-refresh; detalle con pull-to-refresh y acción explícita para actualizar seguimiento. `AccionesPedido` confirma cambios y muestra progreso/errores. Navegación web de Expo con cuatro pestañas.

La API solo admite **Pendiente, Confirmado, Entregado y Cancelado**. Los badges pueden representar “En preparación”, pero no se ofrece ese filtro ni una transición inexistente.

## Identidad y configuración

Web conserva `VITE_API_URL`. Mobile permite configurar `EXPO_PUBLIC_API_URL`, manteniendo como fallback la dirección local anterior. Ambas variables representan la URL base con `/api`, sin credenciales. El host de producción debe conectar su SDK OIDC mediante el export existente `setAccessTokenProvider(() => sdk.getAccessToken())`. El formulario de desarrollo no se incluye como login de producción. Sin proveedor, la API protegida responde 401 y la interfaz lo explica.

Los permisos siguen bajo control de la API: una cuenta Cliente no obtiene capacidades de Admin/Operador. Las pantallas de administración y su selector de clientes requieren los permisos correspondientes; un 403 no se interpreta como sesión vencida. No se agregan credenciales ni claves de firma.

## Validación reproducible

En `ComercioPedidos/frontend`:

```sh
npm ci --ignore-scripts
npm run typecheck
npm run lint
npm run build
npm test
```

En `comercio-pedidos-mobile`:

```sh
npm ci --ignore-scripts
npm run typecheck
npm run lint
npm run build
```

El build de Mobile exporta **bundles de Android, iOS y Web**, sin producir APK/IPA ni sustituir la prueba en dispositivo. El workflow de calidad ejecuta tipos, lint sin warnings y builds de ambos clientes, además de las pruebas del núcleo y las comprobaciones backend existentes.

### Prueba de interacción en navegador

Con Chrome instalado, iniciar dos terminales (sin API real):

```sh
# ComercioPedidos/frontend
npm run dev -- --host 127.0.0.1 --port 4175 --strictPort
# comercio-pedidos-mobile
npx expo start --web --localhost --port 8087 --max-workers 2
```

Desde `ComercioPedidos/frontend`, ejecutar `npm run test:ux`. Playwright intercepta las solicitudes con datos sintéticos y un token ficticio; nunca accede a datos reales. Guarda evidencias en `.ux-artifacts/` (ignorado por Git). `UX_OUTPUT` permite elegir otro directorio. Prueba sesión 401/403, errores por campo, confirmación destructiva, único POST/PUT ante doble clic, anchura web de 390 px, cantidades, navegación, carrito fijo y actualización de seguimiento en Expo Web. El gesto nativo de pull-to-refresh y el teclado requieren validación adicional en dispositivo.

`npm test` ejecuta pruebas independientes de ambos núcleos: formatos de error, campos inválidos, estado HTTP real, mensajes seguros y carreras entre revisiones de sesión.
