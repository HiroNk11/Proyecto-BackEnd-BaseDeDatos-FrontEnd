const {
  chromium,
} = require("../ComercioPedidos/frontend/node_modules/playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const output =
  process.env.UX_OUTPUT || path.join(__dirname, "../.ux-artifacts");
fs.mkdirSync(output, { recursive: true });
const token = "test.payload.signature";
function fixtures() {
  return {
    products: [
      {
        id: 1,
        nombre: "Remera algodón",
        descripcion: "Producto de prueba",
        precio: 18500,
        stock: 8,
        activo: true,
      },
      {
        id: 2,
        nombre: "Buzo oversize",
        descripcion: "Producto de prueba",
        precio: 35000,
        stock: 3,
        activo: true,
      },
    ],
    clients: [
      {
        id: 1,
        nombre: "Cliente",
        apellido: "Demo",
        email: "demo@example.com",
        activo: true,
      },
    ],
    orders: [
      {
        id: 10,
        clienteId: 1,
        nombreCliente: "Cliente Demo",
        fecha: "2026-11-27T12:00:00Z",
        estado: "Pendiente",
        total: 18500,
        detalles: [
          {
            productoId: 1,
            nombreProducto: "Remera algodón",
            cantidad: 1,
            precioUnitario: 18500,
            subtotal: 18500,
          },
        ],
      },
    ],
    creates: 0,
    changes: 0,
    failCreate: false,
    forbid: false,
  };
}
async function mock(page, state) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    };
    const send = (status, body) =>
      route.fulfill({
        status,
        headers,
        contentType:
          status >= 400 ? "application/problem+json" : "application/json",
        body: JSON.stringify(body),
      });
    if (method === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (request.headers().authorization !== `Bearer ${token}`)
      return send(401, {
        title: "Unauthorized",
        detail: "session missing",
        status: 401,
      });
    const resource = url.pathname.toLowerCase();
    if (state.forbid && resource.includes("pedidos"))
      return send(403, { title: "Forbidden", status: 403 });
    if (resource.endsWith("/clientes")) return send(200, state.clients);
    if (resource.endsWith("/productos")) return send(200, state.products);
    if (resource.includes("movimientos-stock"))
      return send(200, {
        items: [],
        pagina: 1,
        totalPaginas: 0,
        totalRegistros: 0,
      });
    if (method === "POST" && resource.endsWith("/pedidos")) {
      state.creates++;
      await new Promise((resolve) => setTimeout(resolve, 250));
      if (state.failCreate)
        return send(400, {
          title: "Validation",
          status: 400,
          errors: { Cantidad: ["No puede superar el stock disponible."] },
        });
      const body = request.postDataJSON();
      const item = {
        id: 11,
        clienteId: body.clienteId,
        nombreCliente: "Cliente Demo",
        fecha: new Date().toISOString(),
        estado: "Pendiente",
        total: body.detalles.reduce(
          (sum, d) =>
            sum +
            state.products.find((p) => p.id === d.productoId).precio *
              d.cantidad,
          0,
        ),
        detalles: body.detalles.map((d) => ({
          ...d,
          nombreProducto: state.products.find((p) => p.id === d.productoId)
            .nombre,
          precioUnitario: state.products.find((p) => p.id === d.productoId)
            .precio,
          subtotal:
            state.products.find((p) => p.id === d.productoId).precio *
            d.cantidad,
        })),
      };
      state.orders.unshift(item);
      return send(201, 11);
    }
    if (method === "PUT" && resource.includes("/pedidos/")) {
      state.changes++;
      await new Promise((resolve) => setTimeout(resolve, 250));
      const id = Number(resource.split("/").at(-2));
      const order = state.orders.find((o) => o.id === id);
      order.estado = resource.endsWith("cancelar")
        ? "Cancelado"
        : resource.endsWith("confirmar")
          ? "Confirmado"
          : "Entregado";
      return route.fulfill({ status: 204, headers });
    }
    if (resource.match(/\/pedidos\/\d+$/))
      return send(
        200,
        state.orders.find((o) => o.id === Number(resource.split("/").at(-1))),
      );
    if (resource.endsWith("/pedidos")) {
      const all = state.orders.filter(
        (o) =>
          !url.searchParams.get("estado") ||
          o.estado === url.searchParams.get("estado"),
      );
      return send(200, {
        items: all,
        pagina: 1,
        tamanioPagina: 10,
        totalPaginas: all.length ? 1 : 0,
        totalRegistros: all.length,
      });
    }
    return send(404, { status: 404, title: "Not found" });
  });
}
async function web(browser) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const state = fixtures();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", message => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) errors.push(message.text());
  });
  await mock(page, state);
  await page.goto("http://127.0.0.1:4175/pedidos");
  await page
    .getByText("Sesión requerida o expirada", { exact: true })
    .waitFor();
  await page.getByLabel("Access token").fill(token);
  await page
    .getByRole("button", { name: "Usar token y recargar datos" })
    .click();
  await page
    .getByRole("button", { name: "Ver detalle", exact: true })
    .first()
    .waitFor();
  await page.screenshot({
    path: path.join(output, "web-pedidos.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Nuevo pedido", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Cliente", { exact: true }).selectOption("1");
  await dialog.getByLabel("Producto", { exact: true }).selectOption("1");
  state.failCreate = true;
  await dialog
    .getByRole("button", { name: "Crear pedido", exact: true })
    .click();
  await dialog
    .getByText("Cantidad: No puede superar el stock disponible.", {
      exact: true,
    })
    .waitFor();
  state.failCreate = false;
  const before = state.creates;
  await dialog
    .getByRole("button", { name: "Crear pedido", exact: true })
    .dblclick();
  await dialog.waitFor({ state: "hidden" });
  assert.equal(state.creates - before, 1, "Web duplicated POST");
  await page
    .getByRole("button", { name: "Ver detalle", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Cancelar pedido", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Volver", exact: true })
    .click();
  assert.equal(state.changes, 0, "Cancel executed before confirmation");
  await page
    .getByRole("button", { name: "Cancelar pedido", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirmar", exact: true })
    .dblclick();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  assert.equal(state.changes, 1, "Web duplicated state change");
  state.forbid = true;
  await page.getByRole("button", { name: "Actualizar", exact: true }).click();
  await page.getByText("Acceso restringido", { exact: true }).waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Nuevo pedido", exact: true })
      .count(),
    1,
    "403 blocked whole app",
  );
  await page.screenshot({
    path: path.join(output, "web-403.png"),
    fullPage: true,
  });
  state.forbid = false;
  await page.getByRole("button", { name: "Ocultar aviso" }).click();
  await page.getByRole("button", { name: "Actualizar", exact: true }).click();
  await page
    .getByRole("button", { name: "Ver detalle", exact: true })
    .first()
    .waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: path.join(output, "web-responsive.png"),
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "Web overflows",
  );
  assert.deepEqual(errors, []);
  await page.close();
  console.log(
    "PASS Web: 401 recovery, validation fields, single POST/PUT, destructive confirmation, 403 banner, mobile width.",
  );
}
async function mobile(browser) {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const state = fixtures();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", message => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) errors.push(message.text());
  });
  await mock(page, state);
  await page.goto("http://localhost:8087");
  await page
    .getByText("Sesión requerida o expirada", { exact: true })
    .waitFor();
  await page.getByLabel("Access token").fill(token);
  await page.getByRole("button", { name: "Usar token", exact: true }).click();
  await page.getByText("Remera algodón", { exact: true }).first().waitFor();
  await page.getByRole("button", { name: "Armar pedido" }).click();
  await page.getByRole("radio", { name: "Cliente Demo" }).click();
  await page
    .getByRole("button", { name: "Agregar Remera algodón", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Agregar Remera algodón", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Quitar Remera algodón", exact: true })
    .click();
  assert.equal(
    await page.getByLabel("Cantidad de Remera algodón").inputValue(),
    "1",
  );
  await page.screenshot({
    path: path.join(output, "mobile-carrito.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Crear pedido", exact: true })
    .dblclick();
  await page.getByText("Pedido #11 creado.", { exact: true }).waitFor();
  assert.equal(state.creates, 1, "Mobile duplicated POST");
  await page.getByRole("tab", { name: "Pedidos", exact: true }).click();
  await page
    .getByRole("button", { name: "Ver pedido 11", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Ver pedido 11", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Actualizar seguimiento", exact: true })
    .click();
  await page.getByText("Cliente Demo", { exact: true }).first().waitFor();
  await page.screenshot({
    path: path.join(output, "mobile-detalle.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Volver a pedidos" }).click();
  state.forbid = true;
  await page.getByRole("button", { name: "Pendientes", exact: true }).click();
  await page.getByText("Acceso restringido", { exact: true }).waitFor();
  await page.getByRole("tab", { name: "Productos", exact: true }).click();
  await page.getByText("Remera algodón", { exact: true }).first().waitFor();
  state.forbid = false;
  await page.getByRole("button", { name: "Ocultar aviso" }).click();
  await page.getByRole("tab", { name: "Pedidos", exact: true }).click();
  // A retry recovers the denied resource; other tabs remained usable.
  const retry = page.getByRole("button", { name: "Reintentar", exact: true });
  if (await retry.count()) await retry.click();
  await page.getByRole("button", { name: "Ver pedido 11", exact: true }).waitFor();
  await page.getByRole("button", { name: "Entregados", exact: true }).click();
  await page.getByText("Aún no tenés pedidos en esta vista", { exact: true }).waitFor();
  assert.deepEqual(errors, []);
  await page.close();
  console.log(
    "PASS Expo Web: 401 recovery, quantity stepper, sticky checkout, single POST, navigation and detail refresh.",
  );
}
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    await web(browser);
    await mobile(browser);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
