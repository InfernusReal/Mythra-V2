// @vitest-environment node
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { assertFingerprint, fingerprint } from "../../scripts/verify-lint-tooling-migration";

const verifierPath = "scripts/verify-lint-tooling-migration.ts";
const normalize = (value: string) => value.replaceAll("\r\n", "\n");

/** Independent original canonicalization; no lint loading or config cache substitutes for this hash. */
function originalFingerprint(value: unknown): string {
  const stable = (child: unknown): unknown => {
    if (Array.isArray(child)) return child.map(stable);
    if (child !== null && typeof child === "object") {
      return Object.fromEntries(Object.entries(child).sort(([a], [b]) => a === b ? 0 : a < b ? -1 : 1)
        .map(([key, item]) => [key, stable(item)]));
    }
    return child;
  };
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

describe("bounded lint migration execution optimization", () => {
  it("restores the complete original verifier using only the two reviewed import substitutions", () => {
    const original = normalize(execFileSync("git", ["show", `fd60f7f0035cc9cf49ab50264941d0fbdc36a846:${verifierPath}`], { encoding: "utf8" }));
    const expected = original.replace('import { ESLint } from "eslint";\n', "")
      .replace('  const lint = new ESLint();', '  const { ESLint } = await import("eslint");\n  const lint = new ESLint();');
    expect(normalize(readFileSync(verifierPath, "utf8"))).toBe(expected);
    expect(expected.match(/calculateConfigForFile\(path\)/gu)).toHaveLength(1);
    expect(expected).toContain('for (const group of baseline.groups)');
    expect(expected).toContain('for (const path of group.paths)');
  });

  it("imports and uses pure fingerprint helpers in a fresh process without loading ESLint", () => {
    const source = `import {createRequire} from 'node:module';const require=createRequire(import.meta.url);const {fingerprint,assertFingerprint}=await import(${JSON.stringify(new URL(`../../${verifierPath}`, import.meta.url).href)});const hash=fingerprint({b:1,a:2});assertFingerprint(hash,fingerprint({a:2,b:1}),'synthetic');process.stdout.write(JSON.stringify({eslintLoaded:Object.keys(require.cache).some(path=>/[\\/]eslint[\\/]lib[\\/]api\\.js$/u.test(path)),verified:true}));`;
    const result = execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", source], {
      cwd: resolve("."), encoding: "utf8", timeout: 12_000,
    });
    expect(JSON.parse(result)).toEqual({ eslintLoaded: false, verified: true });
  });

  it("preserves canonical hashes for 1,000 nested, numeric, unicode, array and reordered cases", () => {
    const values: unknown[] = [null, true, false, 0, -0, Number.NaN, Infinity, [], {}, [undefined, null], { z: undefined, a: "café" }];
    for (let index = 0; index < 1000; index++) {
      values.push({ z: [index, { b: index % 3 === 0, a: `界${index}` }], a: { "2": index, "10": -index, "01": null }, sparse: [null, undefined] });
    }
    for (const value of values) expect(fingerprint(value)).toBe(originalFingerprint(value));
  });

  it("retains mismatch rejection rather than accepting stale or altered evidence", () => {
    const expected = fingerprint({ rule: [2, { enabled: true }], ignores: ["generated/**"] });
    for (const altered of [{ rule: [0, { enabled: true }], ignores: ["generated/**"] }, { rule: [2, { enabled: false }], ignores: ["generated/**"] }, { rule: [2, { enabled: true }], ignores: [] }]) {
      expect(() => assertFingerprint(fingerprint(altered), expected, "synthetic configuration")).toThrow("protected");
    }
  });
});
