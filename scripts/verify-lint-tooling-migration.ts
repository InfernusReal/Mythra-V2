import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const BASELINE_SHA256 = "da293fd359d7d58623d9eef42639a6f1c8042f87c641eda87d69aeb48e0ffd81";

interface Baseline {
  configSourceHash: string;
  groups: { configHash: string; paths: string[] }[];
  assets: { path: string; sha256: string }[];
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a === b ? 0 : a < b ? -1 : 1)
      .map(([key, child]) => [key, stable(child)]));
  }
  return value;
}

export function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

export function assertFingerprint(actual: string, expected: string, boundary: string): void {
  if (actual !== expected) throw new Error(`Lint migration changed protected ${boundary}`);
}

function sourceFingerprint(source: string): string {
  return createHash("sha256").update(source).digest("hex");
}

export async function verifyLintToolingMigration(): Promise<{ paths: number; assets: number }> {
  const baselineSource = readFileSync("docs/audits/phase7x-lint-tooling-baseline.json", "utf8").replaceAll("\r\n", "\n");
  assertFingerprint(sourceFingerprint(baselineSource), BASELINE_SHA256, "pre-migration baseline");
  const baseline = JSON.parse(baselineSource) as Baseline;
  assertFingerprint(sourceFingerprint(readFileSync("eslint.config.mjs", "utf8").replaceAll("\r\n", "\n")),
    baseline.configSourceHash, "ESLint configuration source");
  // Console trace LINT-MIGRATION-001: Accept the immutable pre-migration rule and source baseline.
  console.log(JSON.stringify({ event: "lint_migration_baseline_verified", groups: baseline.groups.length, assets: baseline.assets.length }));

  const { ESLint } = await import("eslint");
  const lint = new ESLint();
  const configCache = new WeakMap<object, string>();
  let checked = 0;
  for (const group of baseline.groups) {
    for (const path of group.paths) {
      const config = await lint.calculateConfigForFile(path);
      let hash = config ? configCache.get(config) : fingerprint(null);
      if (!hash && config) {
        hash = fingerprint(config.toJSON());
        configCache.set(config, hash);
      }
      assertFingerprint(hash!, group.configHash, "effective rules, options, parser, globals, settings and ignores");
      checked += 1;
    }
  }
  // Console trace LINT-MIGRATION-002: Verify effective lint configuration for every baseline source.
  console.log(JSON.stringify({ event: "lint_migration_effective_rules_verified", paths: checked, groups: baseline.groups.length }));

  const actualAssets: string[] = [];
  for (const packageName of ["@next/eslint-plugin-next", "eslint-config-next"]) {
    const packageRoot = resolve("node_modules", packageName);
    const manifest = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8")) as { version: string };
    if (manifest.version !== "16.3.6") throw new Error("Lint migration requires the reviewed pinned Next packages");
    const walk = (directory: string, prefix: string): void => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = `${prefix}/${entry.name}`;
        if (entry.isDirectory()) walk(join(directory, entry.name), path);
        else actualAssets.push(path);
      }
    };
    walk(join(packageRoot, "dist"), `${packageName}/dist`);
  }
  assertFingerprint(fingerprint(actualAssets.sort()), fingerprint(baseline.assets.map((asset) => asset.path).sort()), "complete Next rule/configuration asset inventory");
  for (const asset of baseline.assets) {
    assertFingerprint(sourceFingerprint(readFileSync(join("node_modules", asset.path), "utf8")), asset.sha256, "Next rule/configuration implementation bytes");
  }
  const consumerRequire = createRequire(resolve("node_modules/@next/eslint-plugin-next/dist/utils/get-root-dirs.js"));
  const installedAdapter = consumerRequire.resolve("fast-glob");
  if (resolve(installedAdapter) !== resolve("tooling/lint-root-glob/index.js")) {
    throw new Error("Next root resolver does not load the reviewed local adapter");
  }
  const adapter = JSON.parse(readFileSync(join(dirname(installedAdapter), "package.json"), "utf8")) as { name: string; version: string; dependencies: Record<string, string> };
  if (adapter.name !== "@mythra/lint-root-glob" || adapter.version !== "0.1.0" || adapter.dependencies.tinyglobby !== "0.2.17") {
    throw new Error("Lint migration adapter identity or backing dependency differs");
  }
  // Console trace LINT-MIGRATION-003: Confirm untouched Next implementation and actual scoped adapter resolution.
  console.log(JSON.stringify({ event: "lint_migration_consumer_verified", assets: actualAssets.length, adapterVersion: adapter.version }));

  const lock = JSON.parse(readFileSync("package-lock.json", "utf8")) as {
    packages: Record<string, { name?: string; resolved?: string; link?: boolean }>;
  };
  const manifest = JSON.parse(readFileSync("package.json", "utf8")) as {
    devDependencies: Record<string, string>;
    overrides: Record<string, Record<string, string>>;
  };
  if (manifest.devDependencies["fast-glob"] !== "file:tooling/lint-root-glob" ||
      manifest.overrides["@next/eslint-plugin-next@16.3.6"]?.["fast-glob"] !== "$fast-glob") {
    throw new Error("Lint migration dependency alias or version-qualified consumer scope differs");
  }
  for (const [path, entry] of Object.entries(lock.packages)) {
    if (/(?:^|\/)node_modules\/(?:braces|micromatch)$/u.test(path) ||
        (/(?:^|\/)node_modules\/fast-glob$/u.test(path) &&
         (!entry.link || entry.resolved !== "tooling/lint-root-glob"))) {
      throw new Error("Affected lint dependency implementation remains in the lockfile");
    }
  }
  // Console trace LINT-MIGRATION-004: Finish rule-preserving tooling verification without audit suppression.
  console.log(JSON.stringify({ event: "lint_migration_verified", paths: checked, assets: actualAssets.length, affectedImplementations: 0 }));
  return { paths: checked, assets: actualAssets.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await verifyLintToolingMigration();
}
