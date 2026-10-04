import path from "node:path";
import { existsSync, realpathSync } from "node:fs";
import { globSync as discoverDirectories, isDynamicPattern } from "tinyglobby";

/**
 * The pinned Next plugin uses exactly this directory-only call. This is not a
 * general fast-glob implementation. Unsupported contracts abort linting rather
 * than returning an empty set that could silently disable internal-link checks.
 */
export function globSync(pattern, options) {
  if (typeof pattern !== "string" || pattern.length === 0 || pattern.length > 8192 || pattern.includes("\0")) {
    throw new TypeError("Lint root pattern must be a nonempty bounded string");
  }
  if (!options || options.onlyDirectories !== true || Object.keys(options).length !== 1) {
    throw new TypeError("Lint root adapter supports only the directory-only Next.js contract");
  }

  // Bound parser nesting before passing an operator-controlled lint setting to
  // the glob parser. A rejected setting fails lint; it never suppresses a rule.
  let depth = 0;
  for (const character of pattern) {
    if (character === "{" || character === "(" || character === "[") {
      depth += 1;
      if (depth > 32) throw new RangeError("Lint root pattern nesting exceeds its safe bound");
    } else if (character === "}" || character === ")" || character === "]") {
      depth = Math.max(0, depth - 1);
    }
  }

  // fast-glob excludes a terminal globstar's base directory; tinyglobby does
  // not. Explicitly require one descendant and disable directory expansion.
  let directoryPattern = pattern.replace(/\/+$/u, "").replace(/(^|\/)\*\*$/u, "$1**/*") || "/";
  // Windows 8.3 aliases and junction roots must match the filesystem spelling
  // used by the walker. Normalize only an existing static prefix, never a glob.
  if (path.isAbsolute(directoryPattern)) {
    let base = directoryPattern;
    while (isDynamicPattern(base)) {
      const parent = path.dirname(base).replaceAll("\\", "/");
      if (parent === base) break;
      base = parent;
    }
    if (existsSync(base)) {
      directoryPattern = path.join(realpathSync.native(base), path.relative(base, directoryPattern)).replaceAll("\\", "/");
    }
  }
  return discoverDirectories(directoryPattern, {
    onlyDirectories: true,
    expandDirectories: false,
    absolute: true
  }).map((directory) => path.resolve(directory));
}
