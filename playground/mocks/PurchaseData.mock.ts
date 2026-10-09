import { defineMock } from "../../src/utils/index.ts";
export default [
  defineMock({
    name: "purchase.report",
    method: "GET",
    route: "/api/reports",
    strategy: "static",
    response: { status: 401, body: { data: [{ id: 1, product: "Notebook", amount: 4500 }] } },
  }),
  defineMock({
    name: "purchase.list",
    method: "GET",
    route: "/api/purchases",
    strategy: "static",
    response: ((request, faker) => {
      return {
      status: 200,
      body: {
        data: {
          "(*.10)": { id: 1, product: faker.product(), faker: faker.firstname(),  amount: faker.price() }
       } },
    }}),
  }),
  defineMock({
    name: "purchase.catalog",
    method: "GET",
    route: "/api/catalog",
    strategy: "factory",
    seed: 7,
    response: {
      status: 200,
      body: {
        data: {
          "(*.{3})": {
            fullname: "{{fullname}}",
            shortname: "{{shortname}}",
            firstname: "{{firstname}}",
            middlename: "{{middlename}}",
            lastname: "{{lastname}}",
            cpf: "{{cpf}}",
            cnpj: "{{cnpj}}",
            email: "{{email}}",
            phone: "{{phone}}",
            gender: "{{gender}}",
            birthday: "{{birthday}}",
            product: "{{product}}",
            catalog: "{{catalog}}",
          },
        },
      },
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
    strategy: "faker",
    response: { status: 201, body: null },
    faker: ({ body }) => ({ id: 999, name: faker.name.fullName() }),
  }),
  defineMock({
    name: "purchase.fail",
    method: "GET",
    route: "/api/status",
    strategy: "scenario",
    scenarios: {
      default: { status: 200, body: { ok: true } },
      failed: { status: 503, body: { message: "Simulated unavailable" } },
    },
  }),
];

