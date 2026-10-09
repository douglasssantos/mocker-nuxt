export default defineEventHandler(async () => {
  const url = "https://api.exemplo.com/purchases";
  const [native, ofetch, unmatched] = await Promise.all([
    fetch(url).then((response) => response.json()),
    $fetch(url),
    fetch("https://jsonplaceholder.typicode.com/todos/1").then((response) =>
      response.json(),
    ),
  ]);
  return { native, ofetch, unmatched };
});
