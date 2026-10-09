import { describe, expect, it } from "vitest";
import { FakerMock } from "../src/runtime/server/core/fakerMock/FakerMock.js";
import { MockResolver } from "../src/runtime/server/core/MockResolver.js";
import type { MockRequest } from "../src/types.js";

function cpfDigits(value: string) {
  const digits = value.replace(/\D/g, "").split("").map(Number);
  const check = (length: number) => {
    const weights = Array.from({ length }, (_, index) => length + 1 - index);
    const sum = digits.slice(0, length).reduce((total, digit, index) => total + digit * weights[index]!, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return digits[9] === check(9) && digits[10] === check(10);
}

const request: MockRequest = {
  method: "GET",
  path: "/api/catalog",
  params: {},
  query: {},
  headers: {},
};

describe("FakerMock", () => {
  it("repeats the same values for the same seed", () => {
    expect(new FakerMock(4).fullname()).toBe(new FakerMock(4).fullname());
  });

  it("builds a full name with a middle name and a short name without it", () => {
    const full = new FakerMock(4).fullname().split(" ");
    const short = new FakerMock(4).shortname().split(" ");
    expect(full).toHaveLength(3);
    expect(full[0]).not.toBe(full[1]);
    expect(short).toHaveLength(2);
  });

  it("builds a valid CPF and CNPJ", () => {
    const faker = new FakerMock(9);
    expect(faker.cpf()).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
    expect(cpfDigits(faker.cpf())).toBe(true);
    expect(faker.cnpj()).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
  });

  it("fills placeholders inside a replicated factory response", async () => {
    const response = await new MockResolver().execute(
      {
        name: "people",
        route: "/api/catalog",
        method: "GET",
        strategy: "factory",
        seed: 3,
        response: {
          status: 200,
          body: {
            "(*.{2})": { fullname: "{{fullname}}", email: "{{email}}", product: "{{product}}" },
          },
        },
      },
      request,
    );
    const people = response.body as { fullname: string; email: string; product: string }[];
    expect(people).toHaveLength(2);
    expect(people[0]?.fullname).not.toBe(people[1]?.fullname);
    expect(people[0]?.email).toMatch(/@example\.com$/);
    expect(people[0]?.product).not.toContain("{{");
  });

  it("fills placeholders in a static response", async () => {
    const response = await new MockResolver().execute(
      {
        name: "contact",
        route: "/api/contact",
        method: "GET",
        strategy: "static",
        seed: 2,
        response: { status: 200, body: { phone: "{{phone}}", city: "{{city}}" } },
      },
      request,
    );
    const body = response.body as { phone: string; city: string };
    expect(body.phone).toMatch(/^\(\d{2}\) 9\d{4}-\d{4}$/);
    expect(body.city).not.toContain("{{");
  });
});
