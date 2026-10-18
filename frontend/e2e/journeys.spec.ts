/** Run only against a disposable migrated + seeded local backend. */
import { test, expect } from "@playwright/test";
test("register, branch, refresh, pause, sign in again, compare costs and publish", async ({
  page,
}) => {
  const email = `browser-${Date.now()}@example.com`;
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Find the Problem. Follow the Fix." }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Start Troubleshooting", exact: true })
    .first()
    .click();
  await page
    .getByRole("link")
    .filter({ has: page.getByRole("heading", { name: "Laptop", exact: true }) })
    .click();
  await page
    .getByRole("button")
    .filter({
      has: page.getByRole("heading", { name: "Won’t charge", exact: true }),
    })
    .click();
  await page.getByRole("button", { name: "Sign in to save & start" }).click();
  await page.getByRole("link", { name: "Create an account" }).click();
  await page.getByLabel("Your name").fill("Browser Tester");
  await page.getByLabel("Email address").fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("Browser test password 123!");
  await page.getByRole("button", { name: "Create account" }).click();
  await page
    .getByRole("button")
    .filter({
      has: page.getByRole("heading", { name: "Won’t charge", exact: true }),
    })
    .click();
  await page.getByRole("button", { name: "Start diagnostic" }).click();
  await page.getByRole("radio", { name: "No", exact: true }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Does the wall socket work with a known-working, undamaged device?",
    }),
  ).toBeVisible();
  const caseURL = page.url();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Does the wall socket work with a known-working, undamaged device?",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause & save" }).click();
  await expect(page.getByRole("button", { name: "Resume case" })).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto(caseURL);
  await page.getByLabel("Email address").fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("Browser test password 123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("button", { name: "Resume case" }).click();
  await page.getByRole("radio", { name: "No", exact: true }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "The power source may be unavailable." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mark resolved" }).click();
  await page
    .getByRole("link", { name: "Repair or replace", exact: true })
    .click();
  await page.getByLabel("Estimated repair cost (PKR)").fill("100.10");
  await page.getByLabel("Replacement device cost (PKR)").fill("500");
  await page
    .getByLabel("Additional expected repair expenses (PKR)")
    .fill("0.20");
  await page.getByRole("button", { name: "Compare & save" }).click();
  await expect(
    page.getByRole("heading", { name: /399.70 estimated difference/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Community", exact: true }).click();
  await page.getByRole("button", { name: "Share an experience" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Title", { exact: true })
    .fill("Browser test external connection check");
  await dialog
    .getByLabel("Symptoms", { exact: true })
    .fill("The charging light did not turn on.");
  await dialog
    .getByLabel("Checks or fixes you attempted")
    .fill("I checked a known-working outlet safely.");
  await dialog
    .getByLabel("What happened afterwards")
    .fill("The charging indicator appeared afterwards.");
  await dialog.getByRole("button", { name: "Publish experience" }).click();
  await page
    .getByRole("textbox", { name: "Search community solutions" })
    .fill("Browser test external");
  await expect(
    page.getByRole("heading", {
      name: "Browser test external connection check",
    }),
  ).toBeVisible();
});
test("mobile navigation and reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Community", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "What worked for someone else?" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});
