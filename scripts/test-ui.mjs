process.loadEnvFile?.(".env");

import { chromium } from "@playwright/test";

import { createConfirmedTestAccount } from "./test-account.mjs";

const appUrl = process.env.APP_URL ?? "http://127.0.0.1:3000";

const account = await createConfirmedTestAccount();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto(`${appUrl}/login`, { waitUntil: "networkidle" });

  await page.getByLabel("Email công việc").fill(account.email);
  await page.getByLabel("Mật khẩu").fill(account.password);
  await page.getByRole("button", { name: "Vào bảng điều khiển" }).click();

  await page.waitForTimeout(2000);
  const currentPath = new URL(page.url()).pathname;

  if (currentPath !== "/products") {
    const bodyText = await page.locator("body").innerText();
    throw new Error(`Login did not redirect. Path: ${currentPath}\n${bodyText}`);
  }

  await page.waitForLoadState("networkidle");
  await page.getByText("Control room cho đội bán hàng").waitFor();

  const productCode = `UI-${Date.now()}`;

  await page.getByRole("link", { exact: true, name: "Thêm sản phẩm" }).click();
  await page.waitForURL(/\/products\/new$/);

  await page.getByLabel("Mã sản phẩm").fill(productCode);
  await page.getByLabel("Tên sản phẩm").fill("Set quà giao diện");
  await page.getByLabel("Giá bán (VND)").fill("145000");
  await page.getByRole("button", { name: "Tạo sản phẩm" }).click();

  await page.waitForURL(/\/products(\?status=created)?$/);
  await page.getByText("Đã tạo sản phẩm thành công.").waitFor();

  await page.getByPlaceholder("Tìm theo mã hoặc tên sản phẩm").fill(productCode);
  await page.waitForLoadState("networkidle");
  await page.getByText(productCode, { exact: true }).first().waitFor();

  await page.getByRole("link", { name: "Sửa" }).first().click();
  await page.waitForURL(/\/products\/.+\/edit$/);
  await page.getByLabel("Tên sản phẩm").fill("Set quà giao diện đã cập nhật");
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await page.waitForURL(/\/products(\?status=updated)?$/);
  await page.getByText("Đã cập nhật sản phẩm thành công.").waitFor();

  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });
  await page.getByRole("button", { name: "Xóa" }).first().click();
  await page.getByText("Đã xóa sản phẩm thành công.").waitFor();
} finally {
  await browser.close();
}

console.log("UI login + CRUD test passed.");
