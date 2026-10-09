import { defineMock } from "../../src/utils/index.ts";

export default defineMock({
  name: "purchase.external",
  target: "purchase-api",
  route: "/purchases",
  method: "GET",
  strategy: "static",
  response: {
    status: 200,
    body: {
      source: "external-mock",
      data: [{ id: 1, product: "Notebook", amount: 4500 }],
    },
  },
});
