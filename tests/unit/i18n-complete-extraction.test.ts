import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  formatBytes,
  formatCurrency,
  formatDate,
  formatNumber,
  getMessages,
  interpolateMessage,
  localizedCausalEndpointLabel,
  localizedEntityTemplateFieldLabel,
  localizedEntityTemplateName,
  localizedEnumLabel,
  localizedRelationTemplateLabel,
} from "@/lib/i18n/messages";
import { commandRegistry } from "@/lib/commands/registry";

const workspaceRoot = process.cwd();
const localizedAttributeNames = new Set([
  "alt",
  "aria-description",
  "aria-label",
  "label",
  "placeholder",
  "title",
]);

function tsxFiles(root: string): string[] {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) return tsxFiles(absolute);
    return entry.isFile() && entry.name.endsWith(".tsx") ? [absolute] : [];
  });
}

function visibleEnglishViolations(file: string): string[] {
  const sourceText = fs.readFileSync(file, "utf8");
  const source = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const violations: string[] = [];
  const add = (node: ts.Node, value: string) => {
    const normalized = value.replace(/\s+/gu, " ").trim();
    if (!/[A-Za-z]{2}/u.test(normalized)) return;
    const position = source.getLineAndCharacterOfPosition(
      node.getStart(source),
    );
    violations.push(
      `${path.relative(workspaceRoot, file)}:${position.line + 1}:${normalized}`,
    );
  };
  const addDisplayExpression = (expression: ts.Expression): void => {
    if (
      ts.isParenthesizedExpression(expression) ||
      ts.isAsExpression(expression) ||
      ts.isSatisfiesExpression(expression) ||
      ts.isNonNullExpression(expression)
    ) {
      addDisplayExpression(expression.expression);
      return;
    }
    if (
      ts.isStringLiteral(expression) ||
      ts.isNoSubstitutionTemplateLiteral(expression)
    ) {
      add(expression, expression.text);
      return;
    }
    if (ts.isTemplateExpression(expression)) {
      add(
        expression,
        [
          expression.head.text,
          ...expression.templateSpans.map((span) => span.literal.text),
        ].join(" "),
      );
      return;
    }
    if (ts.isConditionalExpression(expression)) {
      addDisplayExpression(expression.whenTrue);
      addDisplayExpression(expression.whenFalse);
      return;
    }
    if (
      ts.isBinaryExpression(expression) &&
      [ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.PlusToken].includes(
        expression.operatorToken.kind,
      )
    ) {
      addDisplayExpression(expression.left);
      addDisplayExpression(expression.right);
    }
  };
  const isPresentationSetter = (
    expression: ts.LeftHandSideExpression,
  ): boolean =>
    ts.isIdentifier(expression) &&
    /^set[A-Za-z0-9]*(?:Error|Message|Notice|Status|Warning)$/u.test(
      expression.text,
    );
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) add(node, node.text);
    if (
      ts.isJsxAttribute(node) &&
      localizedAttributeNames.has(node.name.getText(source)) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer)
    )
      add(node, node.initializer.text);
    if (
      ts.isJsxAttribute(node) &&
      localizedAttributeNames.has(node.name.getText(source)) &&
      node.initializer &&
      ts.isJsxExpression(node.initializer) &&
      node.initializer.expression
    )
      addDisplayExpression(node.initializer.expression);
    if (
      ts.isJsxExpression(node) &&
      node.expression &&
      !ts.isJsxAttribute(node.parent)
    )
      addDisplayExpression(node.expression);
    if (
      ts.isCallExpression(node) &&
      isPresentationSetter(node.expression) &&
      node.arguments[0]
    )
      addDisplayExpression(node.arguments[0]);
    if (
      ts.isNewExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "Error" &&
      node.arguments?.[0] &&
      !file.endsWith("ThemeProvider.tsx")
    )
      addDisplayExpression(node.arguments[0]);
    if (
      ts.isPropertyAssignment(node) &&
      node.name.getText(source) === "message" &&
      (ts.isStringLiteral(node.initializer) ||
        ts.isNoSubstitutionTemplateLiteral(node.initializer))
    )
      add(node.initializer, node.initializer.text);
    if (
      ts.isPropertyAssignment(node) &&
      ["aria-label", "aria-description", "title", "placeholder"].includes(
        node.name.getText(source).replaceAll(/["']/gu, ""),
      )
    )
      addDisplayExpression(node.initializer);
    if (
      ts.isPropertyAssignment(node) &&
      (() => {
        let parent: ts.Node | undefined = node.parent;
        while (
          parent &&
          (ts.isObjectLiteralExpression(parent) ||
            ts.isAsExpression(parent) ||
            ts.isSatisfiesExpression(parent) ||
            ts.isParenthesizedExpression(parent))
        )
          parent = parent.parent;
        return (
          parent !== undefined &&
          ts.isVariableDeclaration(parent) &&
          /Labels$/iu.test(parent.name.getText(source))
        );
      })() &&
      (ts.isStringLiteral(node.initializer) ||
        ts.isNoSubstitutionTemplateLiteral(node.initializer))
    )
      add(node.initializer, node.initializer.text);
    if (
      ts.isBindingElement(node) &&
      node.initializer &&
      /(?:label|message|status|title)$/iu.test(node.name.getText(source))
    )
      addDisplayExpression(node.initializer);
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      /(?:disabledReason|emptyMessage|statusMessage)$/iu.test(
        node.name.getText(source),
      )
    )
      addDisplayExpression(node.initializer);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return violations;
}

describe("complete UI resource extraction", () => {
  it("has no directly embedded user-facing English JSX copy", () => {
    const files = [
      ...tsxFiles(path.join(workspaceRoot, "components")),
      ...tsxFiles(path.join(workspaceRoot, "app")),
    ];
    expect(files.flatMap(visibleEnglishViolations), "unowned UI copy").toEqual(
      [],
    );
  });

  it("uses typed fallback and interpolation without mutating resource templates", () => {
    const english = getMessages("en");
    const arabic = getMessages("ar");
    expect(arabic.semanticZoom).toBe(english.semanticZoom);
    expect(interpolateMessage(english.wordCount, { count: 12 })).toBe(
      "12 words",
    );
    expect(english.wordCount).toBe("{count} words");
  });

  it("resolves every command label through the typed resource catalog", () => {
    const english = getMessages("en");
    expect(commandRegistry.map((command) => english[command.labelKey])).toEqual(
      [
        "Open commands",
        "Toggle Focus mode",
        "Save checkpoint",
        "Continue Writing",
        "Write first chapter",
        "Create project",
        "Peek chapter outline",
        "Peek linked milestone",
        "Create milestone",
        "Add cause",
        "Add consequence",
        "Relevant Now / Context",
        "Quick Capture",
        "Create Entity from Selection",
        "Create entity",
        "Open full Search",
        "Open Structure",
        "Open Universe",
        "Open Timeline",
        "Open Notes",
        "Open Research",
        "Open Capture Inbox",
        "Open Suggestions",
        "Create verified snapshot",
        "Export manuscript",
        "Export full project archive",
      ],
    );
    expect(
      fs.readFileSync(
        path.join(workspaceRoot, "lib", "commands", "registry.ts"),
        "utf8",
      ),
    ).not.toContain('label: "Open commands"');
  });

  it("localizes built-in Universe templates while preserving custom author labels", () => {
    const english = getMessages("en");
    const arabic = getMessages("ar");
    expect(localizedEntityTemplateName(english, "character", "raw")).toBe(
      "Character",
    );
    expect(localizedEntityTemplateName(arabic, "character", "raw")).toBe(
      "Character",
    );
    expect(
      localizedEntityTemplateFieldLabel(
        english,
        "character",
        "voice_notes",
        "raw",
      ),
    ).toBe("Voice notes");
    expect(
      localizedRelationTemplateLabel(english, "parent_of", "reverse", "raw"),
    ).toBe("Child of");
    expect(localizedEntityTemplateName(english, null, "Author type")).toBe(
      "Author type",
    );
    expect(
      localizedEntityTemplateFieldLabel(
        english,
        null,
        "custom_field",
        "Author field",
      ),
    ).toBe("Author field");
    expect(localizedEnumLabel(english, "BOOLEAN")).toBe("Boolean");

    const templates = fs.readFileSync(
      path.join(workspaceRoot, "domains", "universe", "domain", "templates.ts"),
      "utf8",
    );
    expect(templates).not.toContain('name: "Character"');
    expect(templates).not.toContain('forwardLabel: "Parent of"');
  });

  it("formats real-world values with the selected locale", () => {
    const instant = new Date("2026-09-07T12:30:00.000Z");
    expect(formatNumber("en", 12_345)).not.toBe(formatNumber("ar", 12_345));
    expect(formatCurrency("en", 1500, "USD")).toContain("15");
    expect(formatDate("en", instant)).not.toBe(formatDate("ar", instant));
    expect(formatBytes("en", 1_572_864)).toContain("1.5");
  });

  it("localizes structured causal endpoint presentation without changing author labels", () => {
    const english = getMessages("en");
    expect(
      localizedCausalEndpointLabel(english, "en", {
        type: "MILESTONE",
        label: "The breach",
      }),
    ).toBe("The breach · Milestone");
    expect(
      localizedCausalEndpointLabel(english, "en", {
        type: "ENTITY_STATE",
        label: "Mara",
        labelCode: "ENTITY_STATE",
        labelOrdinal: 3,
      }),
    ).toBe("Mara · Entity state 3");
    expect(
      localizedCausalEndpointLabel(english, "en", {
        type: "CAPTURE_DERIVED",
        label: "",
        labelCode: "CAPTURE_DERIVED",
      }),
    ).toBe("Capture-derived object");
  });

  it("does not expose transport error prose through presentation surfaces", () => {
    const files = [
      ...tsxFiles(path.join(workspaceRoot, "components")),
      path.join(workspaceRoot, "lib", "context", "use-context-field.ts"),
      path.join(workspaceRoot, "lib", "writing", "use-durable-chapter.ts"),
    ];
    const violations = files.flatMap((file) => {
      const source = fs.readFileSync(file, "utf8");
      const rawLabels = source
        .split(/\r?\n/u)
        .flatMap((line, index) =>
          /(?:envelope|payload|result|response|project|chapter|itemPayload|changeEnvelope|relationEnvelope)\.error\?\.message/u.test(
            line,
          )
            ? [`${path.relative(workspaceRoot, file)}:${index + 1}:raw-label`]
            : [],
        );
      const lostValues =
        /<option\s+key=\{(?:item|value|type)\}(?![^>]*\bvalue=)[^>]*>\s*\{localizedEnumLabel/gu.test(
          source,
        )
          ? [
              `${path.relative(workspaceRoot, file)}:localized-option-without-machine-value`,
            ]
          : [];
      return [...rawLabels, ...lostValues];
    });
    expect(violations, "transport error prose exposed to users").toEqual([]);
  });

  it("renders resource-owned labels for machine enum values", () => {
    const files = tsxFiles(path.join(workspaceRoot, "components"));
    const violations = files.flatMap((file) => {
      const source = fs.readFileSync(file, "utf8");
      return source
        .split(/\r?\n/u)
        .flatMap((line, index) =>
          /<option[^>]*>\{(?:item|value|type)(?:\.replaceAll\([^)]*\))?\}<\/option>/u.test(
            line,
          )
            ? [`${path.relative(workspaceRoot, file)}:${index + 1}`]
            : [],
        );
    });
    expect(violations, "raw machine enum rendered as a label").toEqual([]);
  });

  it("owns root metadata and empty-preview copy in the resource catalog", () => {
    const layout = fs.readFileSync(
      path.join(workspaceRoot, "app", "layout.tsx"),
      "utf8",
    );
    const searchPeek = fs.readFileSync(
      path.join(workspaceRoot, "components", "search", "SearchPeek.tsx"),
      "utf8",
    );
    expect(layout).not.toContain(
      'description: "A context-aware long-form writing environment"',
    );
    expect(searchPeek).not.toContain('|| "No text preview."');
  });

  it("keeps stable projection codes separate from localized presentation copy", () => {
    const forbiddenPresentationReads = [
      ["components/context/ContextualWritingField.tsx", "action.label"],
      [
        "components/context/ContextualWritingField.tsx",
        "descriptor.reason.toLowerCase()",
      ],
      ["components/search/SearchResultGroups.tsx", "action.label"],
      ["components/search/SearchResultGroups.tsx", "group.label"],
      ["components/search/SearchResultGroups.tsx", "result.matchReasons.join"],
      ["components/search/SearchPeek.tsx", "result.matchReasons.join"],
      ["components/language/EditorSearchBridge.tsx", "visibleLookup.message"],
      ["components/live-model/LiveModelFreshness.tsx", "warning.message"],
      ["components/structure/CausalLens.tsx", "warning.message"],
      ["components/shell/CommandPalette.tsx", "{item.command.label}"],
      ["components/capture/CaptureInbox.tsx", "{type.name}"],
      [
        "components/structure/RelationshipLens.tsx",
        "{reference.relationshipKey}",
      ],
      ["components/universe/EntityDetail.tsx", ">{backlink.sourceType}<"],
      [
        "components/portability/PortabilityPanel.tsx",
        "{snapshot.structuralVersion}",
      ],
      ["components/timeline/TimelineWorkspace.tsx", "v{item.version}"],
      ["components/research/ResearchWorkspace.tsx", "v{item.version}"],
    ] as const;
    const violations = forbiddenPresentationReads.flatMap(
      ([relative, token]) =>
        fs
          .readFileSync(path.join(workspaceRoot, relative), "utf8")
          .includes(token)
          ? [`${relative}:${token}`]
          : [],
    );
    expect(
      violations,
      "server projection prose rendered without localization",
    ).toEqual([]);
  });

  it("does not define presentation labels in search, context, language, or warning domain services", () => {
    const forbiddenDomainCopy = [
      ["domains/context/domain/resolver.ts", 'label: "Peek"'],
      [
        "domains/search/infrastructure/prisma-search-repository.ts",
        'label: "Peek"',
      ],
      ["domains/language/application/service.ts", 'message: "No deterministic'],
      ["domains/live-model/domain/warnings.ts", "neutralWarningMessages"],
      ["domains/causality/domain/chronology.ts", 'message: "The recorded'],
      [
        "domains/causality/infrastructure/prisma-causality-repository.ts",
        'language: "potentially affected"',
      ],
      ["domains/context/domain/resolver.ts", "label: `More ("],
      [
        "domains/context/domain/resolver.ts",
        "`${source.relationType}: ${source.endpointLabel}`",
      ],
      [
        "domains/context/infrastructure/prisma-context-repository.ts",
        '?? "Research file"',
      ],
      [
        "domains/causality/infrastructure/prisma-endpoint-adapters.ts",
        '"Capture-derived causal identity"',
      ],
      [
        "domains/causality/infrastructure/prisma-endpoint-adapters.ts",
        '"Narrative intent"',
      ],
      ["domains/live-model/infrastructure/projector.ts", '?? "Scene"'],
      [
        "domains/live-model/infrastructure/projector.ts",
        '"Capture-derived object"',
      ],
      [
        "domains/portability/domain/import.ts",
        'customRole: "Legacy ownership"',
      ],
      [
        "domains/structure/infrastructure/prisma-structure-repository.ts",
        'title: "Main plot"',
      ],
      [
        "domains/writing/application/commands.ts",
        'default("Untitled chapter")',
      ],
      ["domains/portability/domain/import.ts", 'title: "Imported chapter"'],
      ["domains/portability/domain/import.ts", 'title: "Imported preface"'],
      [
        "lib/auth/runtime.ts",
        'displayName: env.DEV_AUTH_NAME ?? "Local Author"',
      ],
    ] as const;
    const violations = forbiddenDomainCopy.flatMap(([relative, token]) =>
      fs
        .readFileSync(path.join(workspaceRoot, relative), "utf8")
        .includes(token)
        ? [`${relative}:${token}`]
        : [],
    );
    expect(
      violations,
      "presentation copy embedded below the presentation boundary",
    ).toEqual([]);
  });
});
