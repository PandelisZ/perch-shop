// The ten regression tests, written the way the GitTested review wrote its
// Playwright suite: controls by role and visible name, exact text checks.
import { expect, test } from "@playwright/test";

const billing = (page) => page.getByRole("region", { name: "Billing" });
const cart = (page) => page.getByRole("region", { name: "Your cart" });
const checkout = (page) => page.getByRole("region", { name: "Checkout" });
const preview = (page) => page.getByRole("dialog", { name: "Invoice preview" });

async function signIn(page) {
  await page.goto("./");
  await page.getByLabel("Email").fill("robin@perch.test");
  await page.getByLabel("Password").fill("perch-demo");
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function pay(page, card) {
  await checkout(page).getByLabel("Card number").fill(card);
  await checkout(page).getByLabel("Name on card").fill("Robin");
  await checkout(page).getByRole("button", { name: "Pay now" }).click();
}

test("01 signing in opens the shop", async ({ page }) => {
  await signIn(page);
  await expect(page.getByText("Signed in as Robin")).toBeVisible();
  await expect(billing(page).getByText("Current plan: Free")).toBeVisible();
  await expect(cart(page).getByText("Cart total: $28.00")).toBeVisible();
});

test("02 a wrong password is refused", async ({ page }) => {
  await page.goto("./");
  await page.getByLabel("Email").fill("robin@perch.test");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toHaveText("Incorrect email or password.");
  await expect(page.getByText("Signed in as Robin")).toBeHidden();
});

test("03 the Pro invoice preview opens without confirming", async ({ page }) => {
  await signIn(page);
  await billing(page).getByRole("button", { name: "Upgrade to Pro" }).click();
  await expect(preview(page)).toBeVisible();
  await expect(preview(page).getByRole("heading", { name: "Invoice preview" })).toBeVisible();
  await expect(preview(page).getByText("Prorated amount: $10.00")).toBeVisible();
  await expect(billing(page).getByText("Current plan: Free")).toBeVisible();
});

test("04 confirming the upgrade moves the account to Pro", async ({ page }) => {
  await signIn(page);
  await billing(page).getByRole("button", { name: "Upgrade to Pro" }).click();
  await preview(page).getByRole("button", { name: "Confirm upgrade" }).click();
  await expect(billing(page).getByText("Current plan: Pro")).toBeVisible();
  await expect(preview(page)).toBeHidden();
});

test("05 adding a notebook updates the cart", async ({ page }) => {
  await signIn(page);
  await page.getByRole("button", { name: "Add Perch notebook to cart" }).click();
  await expect(cart(page).getByText("Perch notebook", { exact: true })).toBeVisible();
  await expect(cart(page).getByText("Items in cart: 3")).toBeVisible();
  await expect(cart(page).getByText("Cart total: $36.00")).toBeVisible();
});

test("06 raising the mug quantity updates the total", async ({ page }) => {
  await signIn(page);
  await cart(page).getByRole("button", { name: "Increase Perch mug quantity" }).click();
  await expect(cart(page).getByText("Quantity: 2")).toBeVisible();
  await expect(cart(page).getByText("Cart total: $40.00")).toBeVisible();
});

test("07 removing the mug updates the count and total", async ({ page }) => {
  await signIn(page);
  await cart(page).getByRole("button", { name: "Remove Perch mug" }).click();
  await expect(cart(page).getByText("Perch mug", { exact: true })).toBeHidden();
  await expect(cart(page).getByText("Items in cart: 1")).toBeVisible();
  await expect(cart(page).getByText("Cart total: $16.00")).toBeVisible();
});

test("08 paying with the test card confirms the order", async ({ page }) => {
  await signIn(page);
  await pay(page, "4242 4242 4242 4242");
  await expect(checkout(page).getByText("Payment successful")).toBeVisible();
  await expect(checkout(page).getByText("Charged $28.00 to the card ending 4242")).toBeVisible();
  await expect(cart(page).getByText("Your cart is empty.")).toBeVisible();
});

test("09 a declined card is not shown as paid", async ({ page }) => {
  await signIn(page);
  await pay(page, "4000 0000 0000 0002");
  await expect(checkout(page).getByText("Payment declined. Your card was not charged.")).toBeVisible();
  await expect(checkout(page).getByText("Payment successful")).toBeHidden();
  await expect(cart(page).getByText("Cart total: $28.00")).toBeVisible();
});

test("10 signing out returns to the sign-in page", async ({ page }) => {
  await signIn(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByText("Signed in as Robin")).toBeHidden();
});
