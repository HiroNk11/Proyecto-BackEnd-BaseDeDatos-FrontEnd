import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "../ComercioPedidos/frontend/node_modules/typescript/lib/typescript.js";

async function load(client, file) {
  const source = await readFile(
    new URL(`../${client}/src/lib/${file}.ts`, import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(outputText + `\n// ${client}/${file}`).toString("base64")}`
  );
}
for (const client of ["ComercioPedidos/frontend", "comercio-pedidos-mobile"]) {
  const problem = await load(client, "problem");
  const session = await load(client, "session");
  const lifecycle = await load(client, "lifecycle");
  test(`${client}: lifecycle exposes preparation and shipping without skipping stages`, () => {
    assert.deepEqual(lifecycle.orderActions("Confirmado"), [
      "preparar",
      "cancelar",
    ]);
    assert.deepEqual(lifecycle.orderActions("EnPreparacion"), [
      "enviar",
      "cancelar",
    ]);
    assert.deepEqual(lifecycle.orderActions("Enviado"), [
      "entregar",
      "cancelar",
    ]);
    assert.deepEqual(lifecycle.orderActions("Entregado"), []);
    assert.deepEqual(lifecycle.orderActions("Cancelado"), []);
    assert.deepEqual(lifecycle.orderActions("unknown"), []);
    assert.equal(lifecycle.stateLabel("EnPreparacion"), "En preparación");
  });
  test(`${client}: availability uses configurable inclusive minimum instead of fixed five`, () => {
    assert.equal(lifecycle.availability(0, 3), "Sin stock");
    assert.equal(lifecycle.availability(3, 3), "Últimas unidades");
    assert.equal(lifecycle.availability(4, 3), "Disponible");
    assert.equal(lifecycle.availability(9, 10), "Últimas unidades");
  });
  test(`${client}: ProblemDetails preserves validation fields and uses actual HTTP status`, () => {
    const error = problem.parseProblem(400, {
      status: 200,
      title: "Validation",
      errors: {
        "$.Detalles[0].Cantidad": ["Debe ser positiva.", 99],
        Email: ["Email inválido."],
      },
    });
    assert.equal(error.status, 400);
    assert.match(error.message, /Cantidad: Debe ser positiva/);
    assert.match(error.message, /Email: Email inválido/);
    assert.deepEqual(error.fields.Email, ["Email inválido."]);
  });
  test(`${client}: 401/403 clear messages without leaking internal error or token`, () => {
    for (const status of [401, 403, 500]) {
      const error = problem.parseProblem(status, { detail: "private-marker" });
      assert.ok(!error.message.includes("private-marker"));
      assert.equal(error.status, status);
    }
  });
  test(`${client}: malformed / legacy / plain error bodies remain usable`, () => {
    assert.match(problem.parseProblem(409, null).message, /stock/);
    assert.equal(
      problem.parseProblem(422, { mensaje: "Producto inactivo." }).message,
      "Producto inactivo.",
    );
    assert.equal(
      problem.parseProblem(400, { errors: { Precio: "invalid format" } }).fields
        .Precio,
      undefined,
    );
    assert.ok(
      problem
        .errorMessage(new TypeError("Failed to fetch"))
        .includes("conectar"),
    );
  });
  test(`${client}: token provider, revision, stale errors and forbidden notice`, async () => {
    let calls = 0;
    const unsubscribe = session.subscribeSession(() => calls++);
    session.setAccessTokenProvider(async () => "header.payload.signature");
    const revision = session.getSessionSnapshot().revision;
    assert.equal(await session.getAccessToken(), "header.payload.signature");
    session.reportSession(401, revision - 1);
    assert.equal(session.getSessionSnapshot().status, null);
    session.reportSession(403, revision);
    assert.equal(session.getSessionSnapshot().status, 403);
    session.dismissSessionNotice();
    assert.equal(session.getSessionSnapshot().status, null);
    session.reportSession(401, revision);
    session.reportSession(403, revision);
    assert.equal(session.getSessionSnapshot().status, 401);
    assert.equal(session.setDevelopmentToken("not a token"), false);
    assert.equal(session.setDevelopmentToken("new.payload.signature"), true);
    assert.equal(session.getSessionSnapshot().status, null);
    session.clearSession();
    assert.equal(await session.getAccessToken(), null);
    assert.ok(calls >= 4);
    unsubscribe();
  });
}
