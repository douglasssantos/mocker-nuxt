import { defineMock } from "../../src/utils/index.ts";

export default [
  defineMock({
    name: "products.choice",
    method: "GET",
    route: "/api/products/choice",
    strategy: "factory",
    response: {
      status: 500,
      body: {
        data: {
          products: { id: 1, product: "Notebook", amount: 4500 },
        }
      }
    }
  }),

]
