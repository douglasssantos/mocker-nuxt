import { defineMock } from "../../src/utils/index.ts";

export default [
  defineMock({
    name: "faker.customers",
    method: "GET",
    route: "/api/customers",
    strategy: "factory",
    seed: 11,
    response: {
      status: 200,
      body: {
        data: {
          "(*.100)": {
            fullname: "{{fullname}}",
            shortname: "{{shortname}}",
            cpf: "{{cpf}}",
            email: "{{email}}",
            phone: "{{phone}}",
            gender: "{{gender}}",
            birthday: "{{birthday}}",
            city: "{{city}}",
            state: "{{state}}",
            cep: "{{cep}}",
          },
        },
      },
    },
  }),
  defineMock({
    name: "faker.companies",
    method: "GET",
    route: "/api/companies",
    strategy: "factory",
    seed: 13,
    response: {
      status: 200,
      body: {
        data: {
          "(*.{4})": {
            company: "{{company}}",
            cnpj: "{{cnpj}}",
            email: "{{email}}",
            phone: "{{phone}}",
            city: "{{city}}",
            state: "{{state}}",
            cep: "{{cep}}",
          },
        },
      },
    },
  }),
  defineMock({
    name: "faker.products",
    method: "GET",
    route: "/api/products",
    strategy: "factory",
    seed: 17,
    response: {
      status: 200,
      body: {
        data: {
          "(*.{8})": {
            product: "{{product}}",
            catalog: "{{catalog}}",
            price: "{{price}}",
          },
        },
      },
    },
  }),
  defineMock({
    name: "faker.addresses",
    method: "GET",
    route: "/api/addresses",
    strategy: "factory",
    seed: 19,
    response: {
      status: 200,
      body: {
        data: {
          "(*.{4})": {
            city: "{{city}}",
            state: "{{state}}",
            cep: "{{cep}}",
          },
        },
      },
    },
  }),
  defineMock({
    name: "faker.profile",
    method: "GET",
    route: "/api/profile",
    strategy: "faker",
    seed: 23,
    response: {
      status: 200,
      body: {
        fullname: "{{fullname}}",
        cpf: "{{cpf}}",
        email: "{{email}}",
        phone: "{{phone}}",
        gender: "{{gender}}",
        birthday: "{{birthday}}",
        company: "{{company}}",
        city: "{{city}}",
        state: "{{state}}",
        cep: "{{cep}}",
      },
    },
  }),
];
