// @vitest-environment node
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve, basename } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertFingerprint, fingerprint } from "@/scripts/verify-lint-tooling-migration";

const require = createRequire(import.meta.url);
const adapterPath = resolve("tooling/lint-root-glob/index.js");
const adapter = require(adapterPath) as { globSync: (pattern: unknown, options: unknown) => string[] };
const baseline = JSON.parse(readFileSync("docs/audits/phase7x-lint-tooling-baseline.json", "utf8")) as {
  fixtureDirectories: string[];
  fixtures: { pattern: string; resolved: string[] }[];
};
let fixtureRoot: string;

beforeAll(() => {
  fixtureRoot = realpathSync.native(mkdtempSync(join(tmpdir(), "mythra-lint-fixture-")));
  for (const directory of baseline.fixtureDirectories) mkdirSync(join(fixtureRoot, directory), { recursive: true });
  // Synthetic route files are test data inside the owned temporary directory.
  writeFileSync(join(fixtureRoot, "packages/alpha/pages/index.tsx"), "export default function Page() { return null; }\n");
  writeFileSync(join(fixtureRoot, "packages/beta/src/pages/about.tsx"), "export default function Page() { return null; }\n");
});

afterAll(() => {
  if (dirname(fixtureRoot) !== realpathSync.native(tmpdir()) || !basename(fixtureRoot).startsWith("mythra-lint-fixture-")) {
    throw new Error("Refusing unsafe lint fixture cleanup");
  }
  rmSync(fixtureRoot, { recursive: true, force: true });
});

function runInFixture(source: string): unknown {
  return JSON.parse(execFileSync(process.execPath, ["-e", source], { cwd: fixtureRoot, encoding: "utf8", timeout: 10_000 }));
}

describe("reviewed Next lint root-directory migration", () => {
  it("preserves every original effective config, ignore and Next rule implementation in the actual CLI runtime", () => {
    const output = execFileSync(process.execPath, [require.resolve("tsx/cli"), resolve("scripts/verify-lint-tooling-migration.ts")], {
      encoding: "utf8", timeout: 12_000
    });
    const summary = JSON.parse(output.trim().split(/\r?\n/u).at(-1)!);
    expect(summary).toMatchObject({ event: "lint_migration_verified", paths: 545, assets: 62, affectedImplementations: 0 });
  }, 15_000);

  it.each(baseline.fixtures)("preserves resolved directory identities for $pattern", ({ pattern, resolved: expected }) => {
    // Test trace LINT-FIXTURE-001: Serialize synthetic root identities to the parent assertion, not an application log.
    const source = `const path=require('node:path'); const adapter=require(${JSON.stringify(adapterPath)}); console.log(JSON.stringify(adapter.globSync(${JSON.stringify(pattern)},{onlyDirectories:true}).map(p=>path.relative(process.cwd(),p).replace(/\\\\/g,'/')).sort()));`;
    expect(runInFixture(source)).toEqual(expected);
  });

  it("preserves absolute root discovery and excludes synthetic route files", () => {
    const roots = adapter.globSync(join(fixtureRoot, "packages", "*").replaceAll("\\", "/"), { onlyDirectories: true });
    expect(roots.map((root) => basename(root)).sort()).toEqual(["1", "2", "alpha", "beta", "gamma"]);
    expect(adapter.globSync(join(fixtureRoot, "packages", "alpha", "pages", "*").replaceAll("\\", "/"), { onlyDirectories: true })).toEqual([]);
  });

  it("normalizes an existing Windows short-path/static-prefix spelling without changing discovered roots", () => {
    const operatorPattern = join(tmpdir(), basename(fixtureRoot), "packages", "*").replaceAll("\\", "/");
    expect(adapter.globSync(operatorPattern, { onlyDirectories: true }).sort())
      .toEqual(adapter.globSync(join(fixtureRoot, "packages", "*").replaceAll("\\", "/"), { onlyDirectories: true }).sort());
  });

  it("exercises the actual unmodified Next resolver for default, Windows separators and array settings", () => {
    const resolverPath = resolve("node_modules/@next/eslint-plugin-next/dist/utils/get-root-dirs.js");
    // Test trace LINT-FIXTURE-002: Serialize synthetic Next resolver identities for default/string/array assertions.
    const source = `const path=require('node:path');const{getRootDirs}=require(${JSON.stringify(resolverPath)}); const norm=v=>v.map(p=>path.relative(process.cwd(),p).replace(/\\\\/g,'/')).sort();console.log(JSON.stringify({default:getRootDirs({cwd:process.cwd(),settings:{}}),windows:norm(getRootDirs({cwd:process.cwd(),settings:{next:{rootDir:'packages\\\\*'}}})),array:norm(getRootDirs({cwd:process.cwd(),settings:{next:{rootDir:['packages/alpha','packages/beta',null,17]}}}))}));`;
    expect(runInFixture(source)).toEqual({ default: [fixtureRoot], windows: ["packages/1", "packages/2", "packages/alpha", "packages/beta", "packages/gamma"], array: ["packages/alpha", "packages/beta"] });
  });

  it("reports real internal-link rule violations through the migrated resolver without disabling other Next rules", () => {
    const eslintPath = require.resolve("eslint");
    const pluginPath = require.resolve("@next/eslint-plugin-next");
    // Test trace LINT-FIXTURE-003: Serialize only synthetic rule IDs and severities for the actual Next rule assertion.
    const source = `const{ESLint}=require(${JSON.stringify(eslintPath)});const plugin=require(${JSON.stringify(pluginPath)});(async()=>{const lint=new ESLint({overrideConfigFile:true,overrideConfig:[{files:['**/*.jsx'],languageOptions:{parserOptions:{ecmaFeatures:{jsx:true}}},plugins:{'@next/next':plugin},settings:{next:{rootDir:['packages/alpha','packages/beta/']}},rules:plugin.configs['core-web-vitals'].rules}]});const[result]=await lint.lintText('export default function Example(){return <><a href="/about">About</a><img src="/x.png" alt="Example"/><script src="/x.js"/></>}',{filePath:'fixture.jsx'});console.log(JSON.stringify(result.messages.map(m=>({ruleId:m.ruleId,severity:m.severity})).sort((a,b)=>a.ruleId.localeCompare(b.ruleId))));})();`;
    expect(runInFixture(source)).toEqual([
      { ruleId: "@next/next/no-html-link-for-pages", severity: 2 },
      { ruleId: "@next/next/no-img-element", severity: 1 },
      { ruleId: "@next/next/no-sync-scripts", severity: 2 }
    ]);
  });

  it.each([undefined, null, {}, { onlyDirectories: false }, { onlyDirectories: true, cwd: "." }, { onlyDirectories: true, ignore: [] }])("fails closed on unsupported options %#", (options) => {
    expect(() => adapter.globSync("packages/*", options)).toThrow("directory-only");
  });

  it.each([undefined, null, [], "", "a\0b", "x".repeat(8193)])("rejects invalid or oversized pattern %# without echoing its contents", (pattern) => {
    expect(() => adapter.globSync(pattern, { onlyDirectories: true })).toThrow("bounded string");
  });

  it("rejects the deeply nested advisory-shaped input before parser recursion", () => {
    expect(() => adapter.globSync("{".repeat(3000) + "x" + "}".repeat(3000), { onlyDirectories: true })).toThrow("nesting");
    expect(() => adapter.globSync("@(".repeat(1000) + "x" + ")".repeat(1000), { onlyDirectories: true })).toThrow("nesting");
  });

  it("rejects negative mutations to severity, options, ignores and implementation fingerprints", () => {
    const config = { rules: { example: [2, { bounded: true }] }, ignores: ["generated/**"] };
    for (const altered of [
      { ...config, rules: { example: [0, { bounded: true }] } },
      { ...config, rules: { example: [2, { bounded: false }] } },
      { ...config, ignores: [] }
    ]) expect(() => assertFingerprint(fingerprint(altered), fingerprint(config), "test contract")).toThrow("protected");
    expect(() => assertFingerprint("altered asset", "pinned asset", "implementation")).toThrow("protected");
    expect(fingerprint({ b: 1, a: 2 })).toBe(fingerprint({ a: 2, b: 1 }));
  });

  it("survives 1,000 alternating discovery/rejection operations without persistent state", () => {
    // Test trace LINT-FIXTURE-004: Serialize bounded synthetic stress counts and duration to the parent assertion.
    const source = `const assert=require('node:assert/strict');const{performance}=require('node:perf_hooks');const adapter=require(${JSON.stringify(adapterPath)});const initial=adapter.globSync('packages/{alpha,beta}',{onlyDirectories:true}).sort();assert.equal(initial.length,2);const started=performance.now();for(let i=0;i<1000;i++){if(i%2)assert.throws(()=>adapter.globSync('{'.repeat(33),{onlyDirectories:true}),/nesting/);else assert.deepEqual(adapter.globSync('packages/{alpha,beta}',{onlyDirectories:true}).sort(),initial);}assert.deepEqual(adapter.globSync('packages/{alpha,beta}',{onlyDirectories:true}).sort(),initial);console.log(JSON.stringify({operations:1000,roots:initial.length,elapsedMs:performance.now()-started}));`;
    expect(runInFixture(source)).toMatchObject({ operations: 1000, roots: 2 });
  }, 15_000);
});
