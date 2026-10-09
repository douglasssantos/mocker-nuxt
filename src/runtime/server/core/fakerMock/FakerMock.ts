import type { MockResponse } from "../../../../types.js";
import { COMPANIES } from "./data/CompanyData.js";
import { GENDERS } from "./data/GenderData.js";
import { CITIES, DDDS, STATES } from "./data/LocationData.js";
import { FIRST_NAMES, LAST_NAMES, MIDDLE_NAMES } from "./data/PersonNamesData.js";
import { CATALOGS, PRODUCTS } from "./data/ProductCatalogData.js";

const TOKEN = /\{\{\s*([a-zA-Z]+)\s*\}\}/g;

export class FakerMock {
  private rng: number;

  constructor(seed?: number) {
    const base = seed ?? Math.floor(Math.random() * 0xffffffff);
    this.rng = base >>> 0 || 1;
  }

  private next() {
    this.rng = (this.rng + 0x6d2b79f5) >>> 0;
    let value = this.rng;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  private pick<T>(list: readonly T[]): T {
    return list[Math.floor(this.next() * list.length)]!;
  }

  private pickOther<T>(list: readonly T[], avoid: T): T {
    const value = this.pick(list);
    if (value !== avoid) return value;
    const rest = list.filter((item) => item !== avoid);
    return rest.length ? this.pick(rest) : value;
  }

  private digits(length: number) {
    const values = Array.from({ length }, () => Math.floor(this.next() * 10));
    if (values.every((digit) => digit === values[0])) values[0] = (values[0]! + 1) % 10;
    return values;
  }

  private checkDigit(numbers: number[], weights: number[]) {
    const sum = numbers.reduce((total, digit, index) => total + digit * weights[index]!, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  }

  firstname() {
    return this.pick(FIRST_NAMES);
  }

  lastname() {
    return this.pick(LAST_NAMES);
  }

  middlename() {
    return this.pick(MIDDLE_NAMES);
  }

  fullname() {
    const first = this.firstname();
    const middle = this.pickOther(MIDDLE_NAMES, first);
    return `${first} ${middle} ${this.lastname()}`;
  }

  shortname() {
    return `${this.firstname()} ${this.lastname()}`;
  }

  cpf() {
    const base = this.digits(9);
    const first = this.checkDigit(base, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
    const second = this.checkDigit([...base, first], [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
    return [...base, first, second].join("").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  cnpj() {
    const base = this.digits(12);
    const first = this.checkDigit(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const second = this.checkDigit(
      [...base, first],
      [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    );
    return [...base, first, second]
      .join("")
      .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }

  product() {
    return this.pick(PRODUCTS);
  }

  catalog() {
    return this.pick(CATALOGS);
  }

  gender() {
    return this.pick(GENDERS);
  }

  birthday() {
    const year = 1950 + Math.floor(this.next() * 50);
    const month = String(1 + Math.floor(this.next() * 12)).padStart(2, "0");
    const day = String(1 + Math.floor(this.next() * 28)).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  phone() {
    const left = String(Math.floor(this.next() * 10000)).padStart(4, "0");
    const right = String(Math.floor(this.next() * 10000)).padStart(4, "0");
    return `(${this.pick(DDDS)}) 9${left}-${right}`;
  }

  email() {
    const name = `${this.firstname()}.${this.lastname()}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z.]/g, "");
    return `${name}${Math.floor(this.next() * 1000)}@example.com`;
  }

  company() {
    return this.pick(COMPANIES);
  }

  city() {
    return this.pick(CITIES);
  }

  state() {
    return this.pick(STATES);
  }

  cep() {
    const left = String(Math.floor(this.next() * 100000)).padStart(5, "0");
    const right = String(Math.floor(this.next() * 1000)).padStart(3, "0");
    return `${left}-${right}`;
  }

  price() {
    return (this.next() * 5000 + 10).toFixed(2);
  }

  private token(name: string) {
    const generators: Record<string, () => string> = {
      fullname: () => this.fullname(),
      shortname: () => this.shortname(),
      firstname: () => this.firstname(),
      middlename: () => this.middlename(),
      lastname: () => this.lastname(),
      cpf: () => this.cpf(),
      cnpj: () => this.cnpj(),
      product: () => this.product(),
      catalog: () => this.catalog(),
      catolog: () => this.catalog(),
      gender: () => this.gender(),
      birthday: () => this.birthday(),
      phone: () => this.phone(),
      email: () => this.email(),
      company: () => this.company(),
      city: () => this.city(),
      state: () => this.state(),
      cep: () => this.cep(),
      price: () => this.price(),
    };
    return generators[name.toLowerCase()]?.() ?? `{{${name}}}`
  }

  fill(value: unknown): unknown {
    if (typeof value === "string")
      return value.replace(TOKEN, (_match, name: string) => this.token(name));
    if (Array.isArray(value)) return value.map((item) => this.fill(item));
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, item]) => [
          key,
          this.fill(item),
        ]),
      );
    }
    return value
  }
}

export const fakerGeneratorsVariables = {
  fullname: () => '{{fullname}}',
  shortname: () => '{{shortname}}',
  firstname: () => '{{firstname}}',
  middlename: () => '{{middlename}}',
  lastname: () => '{{lastname}}',
  cpf: () => '{{cpf}}',
  cnpj: () => '{{cnpj}}',
  product: () => '{{product}}',
  catalog: () => '{{catalog}}',
  catolog: () => '{{catalog}}',
  gender: () => '{{gender}}',
  birthday: () => '{{birthday}}',
  phone: () => '{{phone}}',
  email: () => '{{email}}',
  company: () => '{{company}}',
  city: () => '{{city}}',
  state: () => '{{state}}',
  cep: () => '{{cep}}',
  price: () => '{{price}}',
} satisfies Record<string, () => string>

export type FakerGeneratorMethods = typeof fakerGeneratorsVariables

export function applyFaker(response: MockResponse, seed?: number): MockResponse {
  return { ...response, body: new FakerMock(seed).fill(response.body) }
}
