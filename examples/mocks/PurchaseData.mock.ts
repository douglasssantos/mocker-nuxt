import { defineMock } from "mocker-nuxt/utils";
export default [
  defineMock({
    name: "purchase.list",
    method: "GET",
    route: "/api/purchases",
    strategy: "static",
    response: {
      status: 200,
      body: { data: [{ id: 1, product: "Notebook", amount: 4500 }] },
    },
  }),
  defineMock({
    name: "purchase.show",
    method: "GET",
    route: "/api/purchases/:id",
    strategy: "factory",
    factory: ({ params }) => ({
      id: Number(params.id),
      product: "Notebook",
      amount: 4500,
    }),
  }),
  defineMock({
    name: "purchase.create",
    method: "POST",
    route: "/api/purchases",
    strategy: "factory",
    response: { status: 201, body: null },
    factory: ({ body }) => ({ id: 999, ...(body as object) }),
  }),
  defineMock({
    name: "purchase.fail",
    method: "GET",
    route: "/api/purchases/status",
    strategy: "scenario",
    scenarios: {
      default: { status: 200, body: { ok: true } },
      failed: { status: 503, body: { message: "Simulated unavailable" } },
    },
  }),
];
