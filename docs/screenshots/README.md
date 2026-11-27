# Screenshot provenance

These images document the Stage 3 implementation (`eaf9c7f`), including Stages 1 and 2.

| File | Scenario |
| --- | --- |
| `01-catalog-and-order-flow.png` | Draft order with two catalog items, current availability, quantities and estimated total |
| `02-orders-management-filters.png` | Orders across all six states with date/customer/state filters |
| `03-order-status-timeline.png` | Order detail with Pending → Confirmed → In preparation audit entries |
| `04-inventory-stock-movements.png` | Product at its minimum threshold, a restocking draft and preceding audited adjustments |
| `05-catalog-stock-availability.png` | Apparel catalog with available, low-stock and out-of-stock items |

- Capture date: November 27, 2026.
- Headless Google Chrome driven by Playwright; viewport **1440 × 1080**, device scale factor **1**, PNG viewport captures without resizing or compositing.
- Spanish application UI, `es-AR` locale, UTC browser timezone, light color scheme.
- Real ASP.NET Core API and SQL Server LocalDB with all four migrations applied; no intercepted/mocked HTTP responses or hidden error banners.
- Authentication: an expiring local `dotnet user-jwts` Admin token, entered through the development control. No token, signing key or account credential is included in these files.
- Isolated fictional dataset: seven apparel products, four customers, six orders, stock reservations/releases, receipts and manual adjustments. Size/color values are product labels, not independently modeled variants. `example.com` customer emails are synthetic.
- The order composer and replenishment form are unsubmitted drafts. Audit entries were created through authenticated API operations.
- The temporary application processes were stopped after capture. The temporary database and token output were removed.

The previous hosted-demo images (`dashboard.png`, `flujo-principal.png`, `movimientos-stock.png`) were replaced and removed after checking repository references. The public hosted demo remains a separate showcase and may differ from this local implementation.
