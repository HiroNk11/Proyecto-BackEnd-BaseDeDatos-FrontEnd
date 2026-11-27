# Etapa 1 · Calidad técnica y seguridad

## Auditoría inicial

La API compilaba con cuatro avisos de nulabilidad y no había proyectos de pruebas: `dotnet test` no ejecutaba casos. Las entidades y contratos residen en Application; Infrastructure implementa EF Core/SQL Server y la API compone las dependencias. Application no referencia ASP.NET ni EF. No se creó otra capa Domain ni se renombraron namespaces para evitar una migración pública innecesaria; las reglas puras de pedido quedan en `Application/Rules` y se prueban sin infraestructura.

Se encontraron endpoints sin autenticación, ausencia de control de propiedad, errores de negocio como JSON `{mensaje}` y excepciones inesperadas sin un contrato uniforme. `appsettings.json` tenía una conexión LocalDB específica de la máquina, con autenticación Windows, no una contraseña. No se encontraron claves JWT ni passwords en los archivos fuente revisados. El frontend no compilaba por una `s` suelta en `Pedido.ts` y su auditoría npm reportaba tres avisos de severidad alta.

El repositorio ya versionaba artefactos `bin/obj`. No se incluyen sus modificaciones generadas por el build en este cambio; conviene retirarlos del historial de trabajo en una etapa de limpieza separada. No se revisó todo el historial Git ni se afirma una auditoría integral del cliente móvil y sus dependencias.

## Configuración de identidad

No se creó un servidor de identidad ni se emiten tokens de producción. La API valida JWT/OIDC; no hay bypass anónimo ni esquema mock disponible en la aplicación. `X-Test-Role` solo funciona dentro del host de pruebas, donde se registra el handler de la asamblea de integration tests.

En producción, configurar fuera de Git:

```powershell
$env:ConnectionStrings__ComercioPedidos = '<conexión SQL Server de tu entorno>'
$env:Authentication__Authority = 'https://tu-proveedor.example/tenant'
$env:Authentication__Audience = 'comerciopedidos-api'
$env:Authentication__Issuer = 'https://tu-proveedor.example/tenant'
$env:Cors__AllowedOrigins__0 = 'https://tu-web.example'
```

`Issuer` es opcional si coincide con el issuer de discovery; si se define debe ser el issuer real del token. La firma, emisor, audiencia, expiración y HTTPS de discovery son obligatorios. Se usa un margen de reloj de 30 segundos. La API no devuelve detalles internos del rechazo de un token.

En desarrollo sin proveedor, usar JWT locales firmados de .NET, guardando la clave en User Secrets:

```powershell
dotnet user-secrets set 'ConnectionStrings:ComercioPedidos' 'Server=(localdb)\MSSQLLocalDB;Database=ComercioPedidosDB;Integrated Security=True;TrustServerCertificate=True;' --project ComercioPedidos/backend/ComercioPedidos.API
dotnet user-jwts create --project ComercioPedidos/backend/ComercioPedidos.API --name operador-local --role Admin --valid-for 1h
dotnet run --project ComercioPedidos/backend/ComercioPedidos.API --launch-profile https
```

`user-jwts` genera la clave fuera del repositorio y agrega issuer/audiencias a la configuración Development. No publicar el token ni su salida. El token local es exclusivamente de desarrollo. No se ejecutó la generación de User Secrets en la cuenta del usuario durante esta entrega.

### Roles y propiedad

| Operación | Roles |
| --- | --- |
| Leer productos | Admin, Operador, Cliente |
| Crear/editar productos; gestionar clientes y movimientos | Admin, Operador |
| Eliminar clientes/productos | Admin |
| Listar, crear, consultar y cancelar pedidos | Admin, Operador; Cliente únicamente sus propios pedidos |
| Confirmar y entregar pedidos | Admin, Operador |

Los tokens usan el claim `role`. Para Cliente, el proveedor debe emitir un único `cliente_id` entero positivo asociado al registro real; nunca debe obtenerlo de un formulario editable por el usuario. El listado fuerza ese filtro. Consultar/cancelar un pedido ajeno devuelve 404 para no revelar su existencia; crear para otro cliente o forzar otro filtro devuelve 403. Claims faltantes, inválidos o múltiples no habilitan acceso a pedidos ajenos. Los clientes no tienen acceso al directorio de clientes ni a movimientos de stock.

### Compatibilidad Web / Mobile

Se conservaron métodos, URLs, nombres de campos, respuesta numérica de creación de pedido y objetos/paginación de éxito. Los servicios existentes usan un transporte que agrega Bearer solo al origen/ruta de la API. Los tokens se obtienen mediante un proveedor registrado por la sesión, sin persistirlos ni incluirlos en variables públicas de build.

Web:

```ts
import { setAccessTokenProvider } from './services/http';
// Conectar al cliente OIDC elegido cuando esté disponible.
setAccessTokenProvider(() => session.getAccessToken());
```

Mobile:

```ts
import { setAccessTokenProvider } from './services/authorizedFetch';
setAccessTokenProvider(() => session.getAccessToken());
```

`session` en los ejemplos representa la integración futura, no una dependencia ya incluida. Para una prueba manual local se puede pasar un proveedor en memoria con un JWT temporal. **El acceso antes anónimo ahora requiere token**: sin registrar un proveedor la API devuelve 401. No se inventó un login ni se incorporó un SDK de identidad sin un proveedor elegido. Las pantallas y navegación se conservan, pero no se afirma que exista un flujo de login OIDC completo. Un usuario Cliente no puede usar las funciones administrativas de las pantallas actuales.

Web permite configurar `VITE_API_URL` (ver `.env.example`). Mobile conserva su configuración actual en `src/config/api.ts`. No enviar tokens por HTTP fuera de una red de desarrollo controlada; producción requiere HTTPS. La demo pública estática de ComercioPedidos no usa esta API y no fue modificada ni redesplegada.

## Errores y validación

Todas las respuestas de error de la API usan `application/problem+json`, con `type`, `title`, `status`, `detail`, `instance`, `traceId` y el campo legado `mensaje`. Los errores de validación incluyen `errors`. Nunca se retorna el stack ni mensajes técnicos de fallos inesperados, incluso en Development.

| HTTP | Caso |
| --- | --- |
| 400 | DTO/query/ruta inválidos, JSON malformado, campos desconocidos/over-posting |
| 401 / 403 | Sin JWT válido / rol o propiedad insuficiente |
| 404 | Recurso inexistente o pedido ajeno |
| 409 | Stock insuficiente, transición inválida, recurso con historial, actualización concurrente o conflicto de integridad SQL conocido |
| 413 | Cuerpo mayor al límite de Kestrel (64 KiB) |
| 422 | Otra regla de negocio: producto/cliente inactivo, cantidades/importes fuera del dominio |
| 500 | Fallo inesperado, con mensaje genérico |

Los clientes Web que leían `mensaje` continúan recibiéndolo; Mobile puede leer `detail`. El código HTTP de ciertas reglas cambia intencionalmente de 400 a 409/422. El límite de Kestrel no se afirma probado mediante TestServer, que no es Kestrel.

Se rechazan propiedades JSON no declaradas. Los controllers reciben DTOs, nunca entidades de EF para escritura. Se validan detalles nulos, máximo 100 líneas, IDs positivos, longitudes, precios dentro de decimal(18,2), fracciones de centavo, cantidades y paginación sin overflow. Los productos repetidos se agrupan antes de validar stock agregado. La API calcula precios y totales, sin aceptar un total enviado por el cliente.

## Transacciones, concurrencia y logs

Crear/cancelar pedido engloba pedido, stock y movimientos en una transacción. Stock y Estado de pedido son tokens de concurrencia optimista sobre columnas existentes: una actualización usa también el valor original y una escritura obsoleta produce 409, en lugar de sobrescribir cambios. No se agrega columna ni se aplica una migración sobre datos existentes. Este mecanismo no reemplaza una clave de idempotencia para POST: un reintento de creación puede generar un segundo pedido si el cliente no verifica el resultado previo.

No se registran cuerpos, cabeceras, access tokens, connection strings ni excepciones completas. Los errores inesperados registran solamente tipo e identificador. Se deshabilitan las categorías automáticas de excepción y comando EF que pueden contener mensajes/SQL sensibles. No se habilita `EnableSensitiveDataLogging`. CORS usa orígenes explícitos sin wildcard ni cookies y no reemplaza la autorización.

## Reproducir pruebas

```powershell
dotnet restore ComercioPedidos/backend/ComercioPedidos.slnx
dotnet build ComercioPedidos/backend/ComercioPedidos.slnx --no-restore -warnaserror
dotnet test ComercioPedidos/backend/ComercioPedidos.slnx --no-build
```

Validación local: build con `-warnaserror`, cero errores/advertencias; 19 unit tests y 36 integration tests aprobados. Unit tests: cálculo decimal, límites, agrupación y transiciones. Integration tests: WebApplicationFactory, servicios reales y SQLite relacional temporal; autenticación mock solo de test y una suite adicional que valida el handler JWT real con claves aleatorias de prueba. Cubren 201/204/400/401/403/404/409/422/500, propiedad, rollback, validación anidada, CORS y concurrencia optimista. No se simula un proveedor OIDC externo: discovery/JWKS y la pantalla de login deben verificarse al elegirlo.

Para repetir los flujos críticos también en SQL Server LocalDB:

```powershell
$env:COMERCIO_TEST_SQL_SERVER = '(localdb)\MSSQLLocalDB'
dotnet test ComercioPedidos/backend/tests/ComercioPedidos.IntegrationTests --no-build --filter 'FullyQualifiedName~CreateConfirmDeliverAndCancelPreserveContractsAndStock|FullyQualifiedName~InsufficientStockRollsBackOrderAndMovement|FullyQualifiedName~ClientCannotReadCreateOrCancelAnotherCustomersOrders|FullyQualifiedName~OptimisticConcurrencyRejectsStaleStockSnapshot|FullyQualifiedName~ReferencedResourcesCannotBeDeletedAndDuplicateLinesRespectAggregateStock'
Remove-Item Env:COMERCIO_TEST_SQL_SERVER
```

Los cinco casos del comando anterior también pasaron en SQL Server LocalDB. Solo se crean/eliminan bases `ComercioTests_<GUID>` generadas por cada factory, nunca la base operativa. El servidor debe ser de desarrollo y la identidad Windows debe poder crear bases. La suite no demuestra rendimiento o bloqueo bajo carga distribuida.

Web: `npm ci`, `npm run build`, `npm run lint`. Mobile: `npm ci`, `npx tsc --noEmit`, `npm run lint`. Se corrigió además la falta de declaraciones de CSS en Mobile que impedía typecheck; no se cambió ningún módulo nativo. Los avisos React del lint Web preexistentes no se ocultaron ni se reescribieron pantallas en esta etapa.

Referencias: [JWT Bearer](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/configure-jwt-bearer-authentication?view=aspnetcore-10.0), [JWT locales](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/jwt-authn?view=aspnetcore-10.0) y [WebApplicationFactory](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0).
