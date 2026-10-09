<template>
  <main>
    <h1>Mocker playground</h1>
    <p>Open Nuxt DevTools and select Mock Server.</p>
    <button type="button" @click="load('/api/purchases')">
      GET /api/purchases
    </button>
    <button type="button" @click="load('/api/catalog')">
      GET /api/catalog
    </button>
    <button type="button" @click="load('/api/customers')">
      GET /api/customers
    </button>
    <button type="button" @click="load('/api/companies')">
      GET /api/companies
    </button>
    <button type="button" @click="load('/api/products')">
      GET /api/products
    </button>
    <button type="button" @click="load('/api/addresses')">
      GET /api/addresses
    </button>
    <button type="button" @click="load('/api/profile')">
      GET /api/profile
    </button>
    <button type="button" @click="createPurchase">
      POST /api/purchases
    </button>
    <button type="button" @click="load('https://api.exemplo.com/api/generic')">
      GET /api/generic
    </button>
    <button type="button" @click="load('/api/reports')">
      GET /api/reports
    </button>
    <button type="button" @click="load('/api/status')">
      GET /api/status
    </button>
    <button type="button" @click="load('/api/products/choice')">
      GET /api/products/choice
    </button>
    <button type="button" @click="loadAbsolute">
      $fetch https://api.exemplo.com/purchases
    </button>
    <button type="button" @click="loadNative">
      fetch https://api.exemplo.com/purchases
    </button>
    <button type="button" @click="loadXhr">
      XHR https://api.exemplo.com/purchases
    </button>
    <pre>{{ output }}</pre>
  </main>
</template>

<script setup lang="ts">
const output = ref("");

async function load(path: string) {
  try {
    output.value = JSON.stringify(await $fetch(path), null, 2);
  } catch (error) {
    output.value = error instanceof Error ? error.message : String(error);
  }
}

async function loadAbsolute() {
  try {
    output.value = JSON.stringify(
      await $fetch("https://api.exemplo.com/purchases"),
      null,
      2,
    );
  } catch (error) {
    output.value = error instanceof Error ? error.message : String(error);
  }
}

async function loadNative() {
  try {
    const response = await fetch("https://api.exemplo.com/purchases");
    output.value = JSON.stringify(await response.json(), null, 2);
  } catch (error) {
    output.value = error instanceof Error ? error.message : String(error);
  }
}

function loadXhr() {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "https://api.exemplo.com/purchases");
  xhr.setRequestHeader("accept", "application/json");
  xhr.onload = () => {
    output.value = xhr.responseText;
  };
  xhr.onerror = () => {
    output.value = "XHR error";
  };
  xhr.send();
}

async function createPurchase() {
  try {
    output.value = JSON.stringify(
      await $fetch("/api/purchases", {
        method: "POST",
        body: { amount: 4500 },
      }),
      null,
      2,
    );
  } catch (error) {
    output.value = error instanceof Error ? error.message : String(error);
  }
}
</script>

<style scoped>
main { font-family: ui-sans-serif, system-ui, sans-serif; padding: 24px; }
button { margin: 0 8px 8px 0; }
pre { white-space: pre-wrap; }
</style>
