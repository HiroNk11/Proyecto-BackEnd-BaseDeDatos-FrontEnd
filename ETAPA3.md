# Etapa 3 — Ciclo de pedidos e inventario auditable

Base: PR #9 (`16aa8fd`), que incluye el PR #8. Este PR se revisa sobre la rama de Etapa 2; no aplica cambios a una base de producción ni fusiona automáticamente a `main`.

## Auditoría inicial y decisiones

La solución existente contiene API, Application (entidades, contratos y reglas) e Infrastructure; no se agrega una capa ni una tabla de movimientos paralela. Ya había `MovimientosStock`, reserva al crear pedidos, reposición por cancelación y tokens de concurrencia sobre `Producto.Stock` y `Pedido.Estado`. No había `rowversion`/`[Timestamp]`, responsable del movimiento ni historial de estados. No existen variantes, talles o colores en este modelo.

Se conservan ambos tokens y se agrega `Version` (`Guid`, token optimista administrado por la aplicación) en producto y pedido. Cambia en cada alta/modificación, también cuando cambian precio o mínimo. Detecta el caso ABA (stock 10 → 9 → 10) que comparar únicamente el stock no detectaba. Funciona tanto en SQL Server como en los tests SQLite sin simular `rowversion`. `DbUpdateConcurrencyException` sigue produciendo RFC 7807 con HTTP 409. El cliente nuevo envía la versión leída al ajustar inventario o editar un producto; los clientes anteriores pueden omitirla, conservando la protección entre lectura y escritura en el servidor.

## Migración

`20261127060558_CicloPedidosAuditoriaStock`:

- Extiende `Productos` con `StockMinimo` (0 para registros existentes) y `Version`; agrega `Version` a `Pedidos`.
- Extiende **la misma** tabla `MovimientosStock` con `TipoMovimiento` y `UsuarioId`, e índice por producto, fecha e ID.
- Crea únicamente la tabla nueva `HistorialEstadosPedidos`, con pedido, estado anterior/nuevo, fecha UTC, responsable e índice de consulta. Su FK restringe el borrado del pedido auditado.
- Conserva nombres físicos existentes `Fecha` y `StockPosterior`. La respuesta agrega `fechaUtc` y `stockNuevo` como equivalentes, manteniendo `fecha`, `stockPosterior` y `tipo` para clientes anteriores.
- Clasifica los movimientos previos a partir de dirección y pedido asociado; marca su actor como `historico-desconocido`. Para pedidos existentes crea un registro del estado observado al migrar con actor `migracion-snapshot` y hora de migración. **No reconstruye transiciones históricas desconocidas**.
- Conserva las migraciones anteriores sin reescribirlas. La prueba LocalDB migra primero al esquema anterior, inserta datos, aplica la nueva migración dos veces y verifica conservación y ausencia de diferencias de modelo.

Preparación y generación de un script para revisar (desde la raíz):

```powershell
dotnet tool restore
dotnet ef migrations script --idempotent `
  --project ComercioPedidos/backend/ComercioPedidos.Infrastructure `
  --startup-project ComercioPedidos/backend/ComercioPedidos.API `
  --output migraciones.sql
```

Para aplicar en la base elegida, configurar `ConnectionStrings__ComercioPedidos` fuera del repositorio y ejecutar `dotnet ef database update` con los mismos `--project` y `--startup-project`. La fábrica de diseño permite generar migraciones sin arrancar OIDC ni la aplicación. El nombre local fallback `ComercioPedidosDesign` no contiene credenciales y solo se usa al no configurar una conexión. Revisar el script y respaldar los datos antes de desplegar; `Down` elimina el historial nuevo y las columnas agregadas, por lo que no sirve como recuperación de auditoría.

## Reglas y compatibilidad

```text
Pendiente → Confirmado → EnPreparacion → Enviado → Entregado
    └────────────── Cancelado ←───────────┘
```

- Se puede cancelar desde cualquier estado previo a la entrega. Una cancelación repone las unidades **una sola vez** y registra la liberación dentro de la misma transacción. Entregado y Cancelado son terminales.
- Por compatibilidad, el endpoint anterior permite aún `Confirmado → Entregado`; la UI nueva siempre ofrece preparación y envío. Los valores numéricos previos del enum se conservan y los nuevos estados se añaden al final.
- La reserva descuenta stock al crear el pedido; confirmar, preparar, enviar y entregar no vuelven a descontarlo. No se agrega una segunda columna de reservas: `Stock` sigue representando disponibilidad.
- Cada creación/cambio de estado incorpora actor autenticado (`sub`, con fallback `NameIdentifier`) y fecha UTC. Las nuevas filas de auditoría son de solo anexado en el contexto; no se ofrecen endpoints de edición o eliminación.
- Todo cambio de stock por servicios queda registrado: stock inicial, reserva por pedido, liberación por cancelación, ingreso y ajuste manual, incluidos el PUT de producto y las rutas antiguas de entrada/salida. El CRUD anterior usa un motivo explícito de compatibilidad si no lo enviaba. Los formularios nuevos exigen un motivo del operador.
- En ajustes, `cantidad` es un **delta firmado**: ingreso positivo; ajuste manual positivo o negativo, nunca cero. En el historial, `cantidad` conserva la magnitud positiva y `tipo` indica Entrada/Salida; `stockAnterior` y `stockNuevo` explicitan el resultado. Se rechazan stock negativo y overflow.
- HTTP 400 para DTO inválido; 404 para recurso ausente; 409 para stock insuficiente o concurrencia; **422 para transición inválida** (cambio intencional respecto de los 409 de Etapa 1). Ambos clientes usan el parser ProblemDetails existente.

## Endpoints

| Método y ruta | Acceso | Resultado |
| --- | --- | --- |
| `PUT /api/pedidos/{id}/preparar` | Admin / Operador | Confirmado → EnPreparacion; 204 |
| `PUT /api/pedidos/{id}/enviar` | Admin / Operador | EnPreparacion → Enviado; 204 |
| `POST /api/productos/{id}/ajustes-stock` | Admin / Operador | Ajuste atómico + movimiento; 204 |
| `GET /api/productos/{id}/movimientos-stock?pagina=1&tamanioPagina=10` | Admin / Operador | Historial paginado, orden estable fecha/ID descendente |
| `GET /api/productos/stock-bajo` | Admin / Operador | Productos activos con `Stock <= StockMinimo`, incluidos agotados |
| `GET /api/pedidos/{id}` | Staff / Cliente propietario | Agrega `historial`, ordenado por fecha/ID ascendente |

Ejemplo de ajuste (la versión es el GUID obtenido al consultar el producto):

```json
{
  "tipoMovimiento": "AjusteManual",
  "cantidad": -2,
  "motivo": "Unidades dañadas verificadas",
  "version": "00000000-0000-0000-0000-000000000001"
}
```

`StockMinimo` se configura al crear/editar productos. Omitirlo en un PUT antiguo conserva el valor existente. Una alerta es información de reposición, no una compra automática. Los permisos y la propiedad del recurso siguen aplicándose en el servidor; las interfaces no conceden permisos a partir del token introducido en desarrollo.

## Clientes

- Web: `ProductInventoryModal` consulta el producto actualizado, su historial paginado y registra ingresos/ajustes con motivo y versión. Muestra stock antes/después, pedido, actor y fecha; un 409 requiere actualizar datos y decidir un nuevo envío. `OrderTimeline` consulta el detalle al abrir, con estados, responsable y hora local a partir de UTC. El listado no carga todas las colecciones históricas. Filtros, badges y acciones incorporan preparación/envío.
- Web: catálogo y dashboard usan el mínimo configurable. El dashboard consume `stock-bajo`; la edición agrega mínimo, versión y motivo. La página general de inventario y su formulario usan la misma API auditada.
- Expo: catálogo con “Sin stock” / “Últimas unidades” según el mínimo real. Botones y entrada numérica impiden superar el stock leído; la API revalida ante cambios concurrentes. Seguimiento con preparación/envío y detalle actualizado, historial, acciones y pull-to-refresh. La pantalla de stock muestra causa, usuario, hora y movimiento; sus ajustes envían motivo y versión.
- `src/lib/lifecycle.ts` de cada cliente centraliza nombres, estados, disponibilidad y acciones. Se mantienen los adaptadores de tokens y el ingreso manual exclusivamente de desarrollo del PR #9. No se introduce un proveedor de identidad nuevo.

## Verificaciones

```powershell
dotnet build ComercioPedidos/backend/ComercioPedidos.slnx -warnaserror
dotnet test ComercioPedidos/backend/ComercioPedidos.slnx --no-build
# Windows con LocalDB: todas las pruebas, incluidas migraciones SQL reales
$env:COMERCIO_TEST_SQL_SERVER='(localdb)\MSSQLLocalDB'
dotnet test ComercioPedidos/backend/ComercioPedidos.slnx --no-build
```

Las bases de tests tienen nombres únicos `ComercioTests_*` / `ComercioMigrationTests_*` y se eliminan al terminar. Sin la variable SQL, las pruebas generales usan SQLite y la prueba específica de migraciones SQL se informa como omitida. CI agrega un job Windows/LocalDB para que esa verificación se ejecute además de SQLite.

En cada cliente: `npm ci --ignore-scripts`, `npm run typecheck`, `npm run lint` y `npm run build`. Web también ejecuta `npm test` (12 pruebas de núcleo en ambos clientes). El build Expo exporta bundles de Android/iOS/Web; no genera APK/IPA ni reemplaza la validación de teclado/gestos en dispositivo.

Para Playwright, seguir los dos servidores y `npm run test:ux` de `UX-ETAPA2.md`. Mantiene la regresión de sesión/validaciones/doble envío y agrega preparación/envío, timeline, ajuste auditado, motivo obligatorio, 409 sin modificación, recuperación, disponibilidad y cantidades límite en Expo. Usa fixtures sintéticos; las reglas reales se verifican además mediante `WebApplicationFactory` y SQL Server/SQLite.
