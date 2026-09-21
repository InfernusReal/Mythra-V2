import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

async function fixture(page: Page) {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Continue to Mythra" }).click();
  await page.waitForURL(/\/app$/);
  return page.evaluate(async () => {
    const request = async <T>(
      url: string,
      method: string,
      body?: unknown,
    ): Promise<T> => {
      const response = await fetch(url, {
        method,
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const envelope = (await response.json()) as {
        data?: T;
        error?: { message: string };
      };
      if (!response.ok || !envelope.data)
        throw new Error(envelope.error?.message ?? `${method} ${url} failed`);
      return envelope.data;
    };
    const project = await request<{ id: string }>("/api/v2/projects", "POST", {
      title: `Universe ${Date.now()}`,
    });
    const chapter = await request<{ chapter: { id: string } }>(
      `/api/v2/projects/${project.id}/chapters`,
      "POST",
      { title: "Universe chapter" },
    );
    return { projectId: project.id, chapterId: chapter.chapter.id };
  });
}

test.describe("Sub-gate 9 Universe", () => {
  test.setTimeout(120_000);
  test.beforeEach(({}, testInfo) =>
    test.skip(
      testInfo.project.name !== "chromium",
      "S9 desktop flows run once in desktop Chromium.",
    ),
  );
  test("creates a minimal entity, relation and immutable historical state in bounded views", async ({
    page,
  }) => {
    const data = await fixture(page);
    await page.goto(
      `/app/projects/${data.projectId}/universe?returnChapterId=${data.chapterId}`,
    );
    await expect(page.getByRole("heading", { name: "Universe" })).toBeVisible();
    await page.getByRole("textbox", { name: "Name" }).fill("Mara Venn");
    await page.getByRole("button", { name: "Create entity" }).click();
    await expect(page.getByRole("link", { name: /Mara Venn/ })).toBeVisible();
    const entityHref = await page
      .getByRole("link", { name: /Mara Venn/ })
      .getAttribute("href");
    const firstId = entityHref!.split("/").at(-1)!.split("?")[0]!;
    await page.getByRole("textbox", { name: "Name" }).fill("Second entity");
    await page.getByRole("button", { name: "Create entity" }).click();
    const secondHref = await page
      .getByRole("link", { name: /Second entity/ })
      .getAttribute("href");
    const secondId = secondHref!.split("/").at(-1)!.split("?")[0]!;
    await page.goto(entityHref!);
    await page.getByRole("textbox", { name: "Other entity ID" }).fill(secondId);
    await page.getByRole("button", { name: "Add relation" }).click();
    await expect(
      page.getByText("Relation created. Refresh to view it."),
    ).toBeVisible();
    await page
      .getByRole("textbox", { name: "State JSON" })
      .fill('{"location":"harbor"}');
    await page.getByRole("button", { name: "Add immutable state" }).click();
    await expect(page.getByText(/position 0/)).toBeVisible();
    const proof = await page.evaluate(
      async ({ projectId, entityId }) =>
        (
          await (
            await fetch(
              `/api/v2/projects/${projectId}/universe/entities/${entityId}`,
            )
          ).json()
        ).data,
      { projectId: data.projectId, entityId: firstId },
    );
    expect(proof.detail.outgoing).toHaveLength(1);
    expect(proof.detail.snapshots).toHaveLength(1);
    await page.addScriptTag({
      path: path.resolve("node_modules/axe-core/axe.min.js"),
    });
    const violations = await page.evaluate(async () =>
      (
        await (
          window as typeof window & {
            axe: {
              run(): Promise<{ violations: Array<{ impact: string | null }> }>;
            };
          }
        ).axe.run()
      ).violations.filter(
        (item) => item.impact === "critical" || item.impact === "serious",
      ),
    );
    expect(violations).toEqual([]);
    await page.screenshot({
      path: "test-results/universe-detail-desktop.png",
      fullPage: true,
    });
  });
  test("quick-creates from a selection without changing visible prose and restores focus", async ({
    page,
  }) => {
    const data = await fixture(page);
    await page.goto(`/app/chapters/${data.chapterId}`);
    const editor = page.getByRole("textbox", { name: "Chapter manuscript" });
    await editor.fill("Mara crossed the harbor before dawn.");
    await expect(page.locator(".command-bar .save-status")).toHaveText(
      "Saved",
      { timeout: 15_000 },
    );
    await editor.focus();
    await page.keyboard.press("Home");
    await page.keyboard.down("Shift");
    for (let index = 0; index < 4; index += 1)
      await page.keyboard.press("ArrowRight");
    await page.keyboard.up("Shift");
    const before = await editor.textContent();
    await page
      .getByRole("button", { name: "Create Entity from Selection" })
      .click();
    const dialog = page.getByRole("dialog", { name: "Create entity" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Create and reference" }).click();
    await expect(
      page.getByText("Entity created and invisible reference attached."),
    ).toBeVisible({ timeout: 20_000 });
    await expect(editor).toBeFocused();
    expect(await editor.textContent()).toBe(before);
    const universe = await page.evaluate(
      async (projectId) =>
        (
          await (
            await fetch(`/api/v2/projects/${projectId}/universe?limit=50`)
          ).json()
        ).data,
      data.projectId,
    );
    expect(universe.entities).toContainEqual(
      expect.objectContaining({ name: "Mara" }),
    );
  });
});

test("keeps the Universe collection usable on mobile", async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  test.skip(
    testInfo.project.name !== "mobile-chromium",
    "S9 mobile flow runs in mobile Chromium.",
  );
  const data = await fixture(page);
  await page.goto(
    `/app/projects/${data.projectId}/universe?returnChapterId=${data.chapterId}`,
  );
  await expect(page.getByRole("heading", { name: "Universe" })).toBeVisible();
  await page.getByRole("textbox", { name: "Name" }).fill("Mobile entity");
  await page.getByRole("button", { name: "Create entity" }).click();
  await expect(page.getByRole("link", { name: /Mobile entity/ })).toBeVisible();
  await page.screenshot({
    path: "test-results/universe-mobile.png",
    fullPage: true,
  });
});
