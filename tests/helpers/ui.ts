import type { Page } from "@playwright/test";

export async function dismissEmailVerificationIfPresent(page: Page) {
  const verifyHeading = page.getByRole("heading", { name: /verify your email/i });
  if (await verifyHeading.isVisible().catch(() => false)) {
    const cancel = page.getByRole("button", { name: /^cancel$/i });
    if (await cancel.isVisible().catch(() => false)) {
      await cancel.click();
      return;
    }

    const close = page.getByRole("button", { name: /close modal/i });
    if (await close.isVisible().catch(() => false)) {
      await close.click();
    }
  }
}
