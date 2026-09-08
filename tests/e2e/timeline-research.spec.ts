import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

async function fixture(page: Page) {
  await page.goto("/sign-in"); await page.getByRole("button", { name: "Continue to Mythra" }).click(); await page.waitForURL(/\/app$/u);
  return page.evaluate(async () => {
    const request = async <T>(url: string, method: string, body?: unknown): Promise<T> => { const response = await fetch(url, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined }); const envelope = await response.json() as { data?: T; error?: { message: string } }; if (!response.ok || !envelope.data) throw new Error(envelope.error?.message ?? `${method} ${url} failed`); return envelope.data; };
    const project = await request<{ id: string }>("/api/v2/projects", "POST", { title: `Timeline Research ${Date.now()}` }); const chapter = await request<{ chapter: { id: string } }>(`/api/v2/projects/${project.id}/chapters`, "POST", { title: "Harbor Chronicle" });
    return { projectId: project.id, chapterId: chapter.chapter.id };
  });
}

test.describe("Sub-gate 11 Timeline + Research", () => {
  test.setTimeout(180_000);
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "chromium", "S11 desktop flows run once in desktop Chromium."));

  test("keeps chronology non-causal, activates links/Search/Context, and preserves Note/Capture provenance", async ({ page }) => {
    const emitted: string[] = []; page.on("console", (message) => emitted.push(message.text())); const data = await fixture(page);
    const seeded = await page.evaluate(async ({ projectId, chapterId }) => {
      const request = async <T>(url: string, body: unknown): Promise<T> => { const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); const envelope = await response.json() as { data?: T; error?: { code?: string; message: string } }; if (!response.ok || !envelope.data) throw new Error(`${url} returned ${response.status} ${envelope.error?.code ?? "UNKNOWN"}: ${envelope.error?.message ?? "missing data"}`); return envelope.data; };
      const absolute = await request<{ event: { id: string }; projectStructuralVersion: number }>(`/api/v2/projects/${projectId}/timeline`, { title: "Founding Signal", mode: "ABSOLUTE", displayLabel: "Year of Ash 10", sortStart: 10 });
      const approximate = await request<{ event: { id: string }; projectStructuralVersion: number }>(`/api/v2/projects/${projectId}/timeline`, { title: "Approximate Thaw", mode: "APPROXIMATE", displayLabel: "Around the thaw", sortStart: 12 });
      const relative = await request<{ event: { id: string }; projectStructuralVersion: number }>(`/api/v2/projects/${projectId}/timeline`, { title: "Three Beats Later", mode: "RELATIVE", displayLabel: "Three beats later", relativeToEventId: absolute.event.id, relativeOffset: 3 });
      const ordinal = await request<{ event: { id: string }; projectStructuralVersion: number }>(`/api/v2/projects/${projectId}/timeline`, { title: "First Remembered", mode: "ORDINAL", displayLabel: "First remembered", ordinalValue: 1 });
      const range = await request<{ event: { id: string }; projectStructuralVersion: number }>(`/api/v2/projects/${projectId}/timeline`, { title: "Long Winter", mode: "RANGE", displayLabel: "Long winter", sortStart: 20, sortEnd: 30 });
      const link = await request<{ linkId: string }>(`/api/v2/projects/${projectId}/timeline/links`, { eventId: absolute.event.id, targetType: "CHAPTER", targetId: chapterId, label: "explicit chronology" });
      const note = await request<{ note: { id: string } }>(`/api/v2/projects/${projectId}/notes`, { title: "Harbor Lore", body: "Durable harbor evidence", tags: ["Lore", "harbor"] });
      const research = await request<{ item: { id: string } }>(`/api/v2/projects/${projectId}/research`, { kind: "CITATION", title: "Harbor Archive", citation: "Archive shelf 7" });
      await request(`/api/v2/projects/${projectId}/research/links`, { researchItemId: research.item.id, targetType: "CHAPTER", targetId: chapterId, label: "chapter evidence" });
      const capture = await request<{ capture: { id: string }; projectStructuralVersion: number }>("/api/v2/captures", { clientCaptureId: crypto.randomUUID(), projectId, rawText: "Capture to durable Note", route: location.pathname, chapterId, entityContext: [], capturedAt: new Date().toISOString() });
      const converted = await request<{ targetType: string; targetId: string; projectStructuralVersion: number }>(`/api/v2/projects/${projectId}/captures/${capture.capture.id}/conversions`, { conversionType: "NOTE", idempotencyKey: "s11-note", targetBlockId: "", expectedStructuralVersion: range.projectStructuralVersion });
      return { eventIds: [absolute.event.id, approximate.event.id, relative.event.id, ordinal.event.id, range.event.id], linkId: link.linkId, noteId: note.note.id, researchId: research.item.id, converted };
    }, data);
    expect(seeded.eventIds).toHaveLength(5); expect(seeded.converted.targetType).toBe("NOTE");
    await page.goto(`/app/projects/${data.projectId}/timeline?returnChapterId=${data.chapterId}`); await expect(page.getByRole("heading", { name: "Timeline" })).toBeVisible(); for (const mode of ["Absolute", "Approximate", "Relative", "Ordinal", "Range"]) await expect(page.getByText(new RegExp(`${mode} · v`, "u"))).toBeVisible(); await expect(page.getByText("Chronology, not causality")).toBeVisible();
    const causal = await page.evaluate(async ({ projectId }) => (await (await fetch(`/api/v2/projects/${projectId}/causality`)).json()).data.relations.length, data); expect(causal).toBe(0);
    await page.goto(`/app/projects/${data.projectId}/search?returnChapterId=${data.chapterId}`); const searchBox = page.getByRole("textbox"); await searchBox.fill("Harbor"); await expect(page.getByRole("heading", { name: "Notes" })).toBeVisible({ timeout: 30_000 }); await expect(page.getByRole("heading", { name: "Research" })).toBeVisible(); await searchBox.fill("Founding"); await expect(page.getByRole("heading", { name: "Timeline events" })).toBeVisible({ timeout: 30_000 }); await page.getByRole("button", { name: "Why does this happen?" }).first().click(); await expect(page.getByText(/bounded paths/u)).toBeVisible();
    await page.goto(`/app/chapters/${data.chapterId}`); const field = page.getByRole("region", { name: "Contextual Writing Field" }); await expect(field.getByText("Founding Signal")).toBeVisible({ timeout: 30_000 }); await expect(field.getByText("Harbor Archive")).toBeVisible();
    expect(emitted.join("\n")).toContain("S11-");
  });

  test("validates/scans private files, issues signed access, labels degradation, and records a11y/visual evidence", async ({ page }) => {
    const data = await fixture(page); await page.goto(`/app/projects/${data.projectId}/research?returnChapterId=${data.chapterId}`); const research = page.getByRole("heading", { name: "Research" }).locator(".."); await research.getByLabel("Private file").setInputFiles({ name: "harbor.txt", mimeType: "text/plain", buffer: Buffer.from("clean harbor file") }); await expect(page.getByText("Private file validated, scanned, and added to Research.")).toBeVisible({ timeout: 30_000 });
    const access = await page.evaluate(async ({ projectId }) => { const list = await (await fetch(`/api/v2/projects/${projectId}/research?kind=FILE&limit=10`)).json(); const assetId = list.data.items[0].asset.id; const response = await fetch(`/api/v2/projects/${projectId}/research/assets/${assetId}/access`, { method: "POST" }); const envelope = await response.json(); const download = await fetch(envelope.data.href); return { href: envelope.data.href, expires: envelope.data.expiresInSeconds, status: download.status, body: await download.text() }; }, data); expect(access.href).toContain("access="); expect(access.expires).toBe(300); expect(access).toMatchObject({ status: 200, body: "clean harbor file" });
    await page.goto(`/app/projects/${data.projectId}/search?returnChapterId=${data.chapterId}`); await page.getByRole("textbox").fill("Harbor"); await page.waitForTimeout(300); await page.context().setOffline(true); await page.evaluate(() => window.dispatchEvent(new Event("offline"))); await expect(page.getByRole("status").filter({ hasText: "Offline limited mode" })).toBeVisible(); await page.getByRole("textbox").fill("Harbor Chronicle"); await expect(page.getByText(/Offline limited search/u)).toBeVisible();
    await page.context().setOffline(false); await page.evaluate(() => window.dispatchEvent(new Event("online"))); await page.goto(`/app/projects/${data.projectId}/structure`); await page.context().setOffline(true); await page.evaluate(() => window.dispatchEvent(new Event("offline"))); await expect(page.getByText(/Structure changes are unavailable offline/u)).toBeVisible(); await expect(page.getByLabel("Presentation mode")).toBeDisabled();
    await page.context().setOffline(false); await page.addScriptTag({ path: path.resolve("node_modules/axe-core/axe.min.js") }); const violations = await page.evaluate(async () => (await (window as typeof window & { axe: { run(): Promise<{ violations: Array<{ impact: string | null }> }> } }).axe.run()).violations.filter((item) => item.impact === "critical" || item.impact === "serious")); expect(violations).toEqual([]); await page.screenshot({ path: "test-results/timeline-research-desktop.png", fullPage: true });
  });
});

test("keeps Timeline and Research responsive on mobile", async ({ page }, testInfo) => {
  test.setTimeout(120_000); test.skip(testInfo.project.name !== "mobile-chromium", "S11 mobile flow runs in mobile Chromium."); const data = await fixture(page); await page.goto(`/app/projects/${data.projectId}/timeline?returnChapterId=${data.chapterId}`); await expect(page.getByRole("heading", { name: "Timeline" })).toBeVisible(); await page.screenshot({ path: "test-results/timeline-mobile.png", fullPage: true }); await page.goto(`/app/projects/${data.projectId}/research?returnChapterId=${data.chapterId}`); await expect(page.getByRole("heading", { name: "Notes and Research" })).toBeVisible(); await page.screenshot({ path: "test-results/research-mobile.png", fullPage: true });
});
