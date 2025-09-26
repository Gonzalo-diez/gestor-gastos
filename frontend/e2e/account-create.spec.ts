import { test, expect } from "@playwright/test";
import { mockAuthed } from "./mocks";

test("accounts renderiza la nueva cuenta creada por API", async ({ page }) => {
  await mockAuthed(page);

  // estado simulado
  const accounts: any[] = [];

  // ⬅️ matchea /accounts y variantes con querystring
  await page.route("**/accounts**", async (r) => {
    const m = r.request().method();
    if (m === "GET") {
      return r.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(accounts),
      });
    }
    if (m === "POST") {
      const body = await r.request().postDataJSON();
      const created = {
        id: "acc_1",
        name: body?.name ?? "Cuenta Prueba",
        currencyCode: body?.currencyCode ?? "ARS",
      };
      accounts.push(created);
      return r.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(created),
      });
    }
    return r.continue();
  });

  // 1) lista vacía
  await page.goto("/accounts");
  await expect(page.locator("tbody tr")).toHaveCount(0);

  // 2) alta por API dentro del browser
  const postDone = page.waitForRequest(
    (req) => req.url().includes("/accounts") && req.method() === "POST"
  );
  await page.evaluate(async () => {
    await fetch("/accounts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Cuenta Prueba", currencyCode: "ARS" }),
    });
  });
  await postDone;

  // 3) recarga y espera al GET real antes de asertar
  const getDone = page.waitForResponse(
    (res) => res.url().includes("/accounts") && res.request().method() === "GET"
  );
  await page.reload();
  await getDone;
  await page.waitForLoadState("networkidle");

  // En vez de contar filas, validá por el nombre renderizado
  await expect(page.getByText("Cuenta Prueba", { exact: false })).toBeVisible();
});
