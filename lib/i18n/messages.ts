import { productMessages } from "@/lib/i18n/product-messages";

const shellMessages = {
  productName: "Mythra",
  home: "Home",
  projects: "Projects",
  settings: "Settings",
  navigation: "Navigation",
  returnAction: "Return",
  emptyTitle: "Your writing space is ready",
  emptyDescription:
    "The foundation is active. Story creation begins in the next verified capability.",
  commandPalette: "Command palette",
  theme: "Theme",
  light: "Light",
  dark: "Dark",
  cream: "Cream",
  system: "System",
  saveNotApplicable: "No document open",
  signIn: "Continue to Mythra",
  signInTitle: "Enter your writing workspace",
  signInDescription:
    "Use the configured identity provider to enter your workspace.",
  oidcRequired:
    "OIDC sign-in must be initiated by the configured deployment identity gateway.",
} as const;

const englishMessages = Object.freeze({ ...shellMessages, ...productMessages });
export type MessageKey = keyof typeof englishMessages;
export type MessageCatalog = Readonly<Record<MessageKey, string>>;

const arabicOverrides = {
  productName: "ميثرا",
  home: "الرئيسية",
  projects: "المشروعات الكتابية",
  settings: "الإعدادات وإدارة مساحة العمل",
  navigation: "التنقل بين أقسام مساحة الكتابة",
  returnAction: "العودة إلى الكتابة",
  emptyTitle: "مساحة الكتابة جاهزة",
  emptyDescription:
    "الأساس نشط، ويمكن متابعة بناء القصة من القدرة التي تم التحقق منها.",
  commandPalette: "لوحة الأوامر والبحث في المشروع",
  theme: "المظهر",
  light: "فاتح",
  dark: "داكن",
  cream: "كريمي",
  system: "إعداد النظام",
  saveNotApplicable: "لا يوجد مستند مفتوح",
  signIn: "المتابعة إلى ميثرا",
  signInTitle: "الدخول إلى مساحة العمل الكتابية",
  signInDescription: "استخدم موفر الهوية المكوّن للدخول إلى مساحة العمل.",
  oidcRequired:
    "يجب بدء تسجيل الدخول الموحّد من بوابة الهوية المكوّنة لبيئة النشر.",
} as const satisfies Partial<MessageCatalog>;

export const messages: Readonly<Record<"en" | "ar", MessageCatalog>> =
  Object.freeze({
    en: englishMessages,
    ar: Object.freeze({ ...englishMessages, ...arabicOverrides }),
  });

export type Locale = keyof typeof messages;
export type TextDirection = "ltr" | "rtl";
export type MessageParameters = Readonly<Record<string, string | number>>;
export type LocalizableError =
  Readonly<{ code?: string; message?: string }> | null | undefined;

const localeTags: Readonly<Record<Locale, string>> = Object.freeze({
  en: "en-US",
  ar: "ar-EG-u-nu-arab",
});

export function resolveLocale(
  acceptLanguage: string | null | undefined,
): Locale {
  const candidates = (acceptLanguage ?? "")
    .toLocaleLowerCase()
    .split(",")
    .map((candidate) => candidate.trim().split(";")[0] ?? "");
  return candidates.some(
    (candidate) => candidate === "ar" || candidate.startsWith("ar-"),
  )
    ? "ar"
    : "en";
}

export function directionFor(locale: Locale): TextDirection {
  return locale === "ar" ? "rtl" : "ltr";
}

export function getMessages(locale: string): MessageCatalog {
  return messages[locale as Locale] ?? messages.en;
}

export function interpolateMessage(
  template: string,
  parameters: MessageParameters,
): string {
  return template.replace(
    /\{([A-Za-z][A-Za-z0-9]*)\}/gu,
    (token, key: string) => {
      const value = parameters[key];
      return value === undefined ? token : String(value);
    },
  );
}

const errorMessageKeys = Object.freeze({
  VALIDATION: "errorValidation",
  UNAUTHENTICATED: "errorUnauthenticated",
  FORBIDDEN: "errorForbidden",
  NOT_FOUND: "errorNotFound",
  CONFLICT: "errorConflict",
  QUOTA_EXCEEDED: "errorQuotaExceeded",
  RATE_LIMITED: "errorRateLimited",
  DEPENDENCY_UNAVAILABLE: "errorDependencyUnavailable",
  RETRYABLE: "errorRetryable",
  INTEGRITY_ERROR: "errorIntegrity",
  INTERNAL: "errorInternal",
} as const satisfies Readonly<Record<string, MessageKey>>);

const enumMessageKeys = Object.freeze({
  ABSOLUTE: "enumAbsolute",
  APPROXIMATE: "enumApproximate",
  RELATIVE: "enumRelative",
  ORDINAL: "enumOrdinal",
  RANGE: "enumRange",
  ENTITY: "enumEntity",
  MILESTONE: "enumMilestone",
  CHAPTER: "enumChapter",
  TIMELINE_EVENT: "enumTimelineEvent",
  NOTE: "enumNote",
  URL: "enumUrl",
  EXCERPT: "enumExcerpt",
  CITATION: "enumCitation",
  FILE: "enumFile",
  PLANNED: "enumPlanned",
  IN_PROGRESS: "enumInProgress",
  COMPLETED: "enumCompleted",
  ARCHIVED: "enumArchived",
  INTRODUCE: "enumIntroduce",
  DEVELOP: "enumDevelop",
  ESCALATE: "enumEscalate",
  TURN: "enumTurn",
  RESOLVE: "enumResolve",
  CUSTOM: "enumCustom",
  PLOT: "enumPlot",
  PLOT_OUTLINE: "enumPlotOutline",
  VOLUME: "enumVolume",
  VOLUME_OUTLINE: "enumVolumeOutline",
  CHAPTER_OUTLINE: "enumChapterOutline",
  SCENE: "enumScene",
  NARRATIVE_INTENT: "enumNarrativeIntent",
  MANUSCRIPT_BLOCK: "enumManuscriptBlock",
  PARAGRAPH_SELECTION: "enumParagraphSelection",
  ENTITY_ARC: "enumEntityArc",
  TENSION: "enumTension",
  REVELATION: "enumRevelation",
  EMOTION: "enumEmotion",
  PACING: "enumPacing",
  AMBIGUITY: "enumAmbiguity",
  ATMOSPHERE: "enumAtmosphere",
  REFERENCE: "enumReference",
  STORY_CHANGE: "enumStoryChange",
  CAPTURE: "enumCapture",
  ENTITY_STATE: "enumEntityState",
  ACTIVE: "enumActive",
  TENTATIVE: "enumTentative",
  RETIRED: "enumRetired",
  CAUSES: "enumCauses",
  ENABLES: "enumEnables",
  REQUIRES: "enumRequires",
  MOTIVATES: "enumMotivates",
  TRIGGERS: "enumTriggers",
  PREVENTS_BLOCKS: "enumPreventsBlocks",
  REVEALS: "enumReveals",
  TRANSFORMS: "enumTransforms",
  RESOLVES: "enumResolves",
  PEEK: "actionPeek",
  OPEN: "actionOpen",
  PIN: "actionPin",
  UNPIN: "actionUnpin",
  HIDE_SESSION: "actionHideSession",
  MUTE_TYPE: "actionMuteType",
  EDIT_SOURCE: "actionEditSource",
  MARK_INTENTIONAL: "actionMarkIntentional",
  WHY_NOW: "actionWhyNow",
  WHAT_CHANGES: "actionWhatChanges",
  MORE: "actionMore",
  INSERT_REFERENCE: "actionInsertReference",
  ATTACH_REFERENCE: "actionAttachReference",
  COPY: "actionCopy",
  JUMP_TO_BLOCK: "actionJumpToBlock",
  WHY: "actionWhy",
  DEPENDS: "actionDepends",
  PINNED: "reasonPinned",
  SELECTION: "reasonSelection",
  CURSOR: "reasonCursor",
  PROJECT: "reasonProject",
  exact: "searchReasonExact",
  prefix: "searchReasonPrefix",
  phrase: "searchReasonPhrase",
  all_tokens: "searchReasonAllTokens",
  fuzzy: "searchReasonFuzzy",
  explicit_reference: "searchReasonExplicitReference",
  current_context: "searchReasonCurrentContext",
  recent: "searchReasonRecent",
  recent_30d: "searchReasonRecentThirtyDays",
  offline_cached: "searchReasonOfflineCached",
  RANGE_DRIFT: "warningRangeDrift",
  DENSITY: "warningDensity",
  ORPHAN_STRUCTURE: "warningOrphanStructure",
  BROKEN_REFERENCE: "warningBrokenReference",
  TIMELINE_ORDER_CONFLICT: "warningTimelineOrderConflict",
  QUOTA_APPROACH: "warningQuotaApproach",
  BACKUP_HEALTH: "warningBackupHealth",
  CAUSAL_TEMPORAL_CONFLICT: "warningCausalTemporalConflict",
  HARD_PREREQUISITE_LOOP: "warningHardPrerequisiteLoop",
  ORPHAN_CAUSAL_ENDPOINT: "warningOrphanCausalEndpoint",
  REVEAL_BEFORE_DISCOVERY: "warningRevealBeforeDiscovery",
  CAUSE_AFTER_EFFECT: "warningCauseAfterEffect",
  CAUSAL_RELATION_TYPE: "enumCausalRelationType",
  UNIVERSE_RELATION_TYPE: "enumUniverseRelationType",
  STORY_REFERENCE: "enumStoryReference",
  CURRENT: "enumCurrent",
  REFRESHED: "enumRefreshed",
  CONSISTENT: "enumConsistent",
  WARNING: "enumWarning",
  INSUFFICIENT_INFORMATION: "enumInsufficientInformation",
  STORY_TIME: "enumStoryTime",
  DISCOVERY_TIME: "enumDiscoveryTime",
  NONE: "enumNone",
  EVENT: "enumEvent",
  DECISION: "enumDecision",
  STATE_CHANGE: "enumStateChange",
  SETUP: "enumSetup",
  PAYOFF: "enumPayoff",
  CONDITION: "enumCondition",
  OUTCOME: "enumOutcome",
  CAPTURE_DERIVED: "enumCaptureDerived",
  DIRECT: "enumDirect",
  CHAPTER_PROSE: "enumChapterProse",
  OUTLINE_BLOCK: "enumOutlineBlock",
  CAPTURE_CONVERSION: "enumCaptureConversion",
  UNPROCESSED: "enumUnprocessed",
  FILED: "enumFiled",
  DEFERRED: "enumDeferred",
  DISMISSED: "enumDismissed",
  CONVERTED: "enumConverted",
  OWNER: "enumOwner",
  ADMIN: "enumAdmin",
  MEMBER: "enumMember",
  core: "enumCore",
  intelligence: "enumIntelligence",
  incomplete: "enumIncomplete",
  trialing: "enumTrialing",
  active: "enumActive",
  grace: "enumGrace",
  past_due: "enumPastDue",
  canceled: "enumCanceled",
  PENDING: "enumPending",
  PROCESSING: "enumProcessing",
  FAILED: "enumFailed",
  VERIFIED: "enumVerified",
  EXPIRED: "enumExpired",
  TEXT: "enumText",
  MARKDOWN: "enumMarkdown",
  DOCX: "enumDocx",
  MYTHRA_JSON: "enumMythraJson",
  MANUSCRIPT: "enumManuscript",
  FULL_PROJECT: "enumFullProject",
  OK: "enumOk",
  FIRING: "enumFiring",
  critical: "enumCritical",
  warning: "enumSeverityWarning",
  paid: "enumPaid",
  open: "enumOpen",
  draft: "enumDraft",
  void: "enumVoid",
  uncollectible: "enumUncollectible",
  BINARY_STORAGE_BYTES: "usageBinaryStorage",
  SNAPSHOT_BYTES: "usageProjectSnapshots",
  REVISION_STORAGE_BYTES: "usageRevisionStorage",
  EXPORT_GENERATION_BYTES: "usageExportGeneration",
  DATABASE_ROWS: "usageStructuredRows",
  BANDWIDTH_BYTES: "usageTransferBandwidth",
  FUTURE_AI_UNITS: "usageFutureIntelligence",
  CORE: "enumCore",
  INTELLIGENCE: "enumIntelligence",
  INCOMPLETE: "enumIncomplete",
  TRIALING: "enumTrialing",
  GRACE: "enumGrace",
  PAST_DUE: "enumPastDue",
  CANCELED: "enumCanceled",
  POTENTIALLY_AFFECTED: "potentiallyAffected",
  RICH_TEXT: "enumRichText",
  NUMBER: "enumNumber",
  BOOLEAN: "enumBoolean",
  DATE: "enumDate",
  SELECT: "enumSelect",
  MULTI_SELECT: "enumMultiSelect",
  REFERENCE_LIST: "enumReferenceList",
  IMAGE: "enumImage",
  UNANCHORED: "enumUnanchored",
  UPSTREAM: "enumUpstream",
  DOWNSTREAM: "enumDownstream",
  UNALLOCATED_VOLUME_RANGE: "warningUnallocatedVolumeRange",
  OVERLAPPING_MILESTONE_RANGES: "warningOverlappingMilestoneRanges",
  chapter_context: "relationshipChapterContext",
  mentions: "relationshipMentions",
  LEGACY_OWNERSHIP: "legacyOwnership",
  ESCALATES: "enumEscalates",
} as const satisfies Readonly<Record<string, MessageKey>>);

const entityTemplateNameMessageKeys = Object.freeze({
  character: "templateNameCharacter",
  location: "templateNameLocation",
  faction: "templateNameFaction",
  organization: "templateNameOrganization",
  culture: "templateNameCulture",
  religion: "templateNameReligion",
  power_system: "templateNamePowerSystem",
  item: "templateNameItem",
  species: "templateNameSpecies",
  technology: "templateNameTechnology",
  event: "templateNameEvent",
  lore: "templateNameLore",
  custom: "templateNameCustom",
} as const satisfies Readonly<Record<string, MessageKey>>);

const entityTemplateFieldMessageKeys = Object.freeze({
  role: "templateFieldRole",
  age: "templateFieldAge",
  pronouns: "templateFieldPronouns",
  appearance: "templateFieldAppearance",
  personality: "templateFieldPersonality",
  goals: "templateFieldGoals",
  fears: "templateFieldFears",
  arc: "templateFieldArc",
  voice_notes: "templateFieldVoiceNotes",
  affiliations: "templateFieldAffiliations",
  type: "templateFieldType",
  region: "templateFieldRegion",
  description: "templateFieldDescription",
  atmosphere: "templateFieldAtmosphere",
  population: "templateFieldPopulation",
  rules: "templateFieldRules",
  connected_locations: "templateFieldConnectedLocations",
  purpose: "templateFieldPurpose",
  leadership: "templateFieldLeadership",
  members: "templateFieldMembers",
  ideology: "templateFieldIdeology",
  resources: "templateFieldResources",
  rivals: "templateFieldRivals",
  allies: "templateFieldAllies",
  values: "templateFieldValues",
  customs: "templateFieldCustoms",
  language: "templateFieldLanguage",
  hierarchy: "templateFieldHierarchy",
  taboos: "templateFieldTaboos",
  rituals: "templateFieldRituals",
  regions: "templateFieldRegions",
  beliefs: "templateFieldBeliefs",
  principles: "templateFieldPrinciples",
  costs: "templateFieldCosts",
  constraints: "templateFieldConstraints",
  ranks: "templateFieldRanks",
  techniques: "templateFieldTechniques",
  exceptions: "templateFieldExceptions",
  owner: "templateFieldOwner",
  abilities: "templateFieldAbilities",
  limitations: "templateFieldLimitations",
  history: "templateFieldHistory",
  location: "templateFieldLocation",
  traits: "templateFieldTraits",
  culture: "templateFieldCulture",
  capabilities: "templateFieldCapabilities",
  creators: "templateFieldCreators",
  consequences: "templateFieldConsequences",
  participants: "templateFieldParticipants",
  locations: "templateFieldLocations",
  definition: "templateFieldDefinition",
  origin: "templateFieldOrigin",
  related_concepts: "templateFieldRelatedConcepts",
} as const satisfies Readonly<Record<string, MessageKey>>);

const relationTemplateMessageKeys = Object.freeze({
  parent_of: ["relationTemplateParentOf", "relationTemplateChildOf"],
  member_of: ["relationTemplateMemberOf", "relationTemplateHasMember"],
  located_in: ["relationTemplateLocatedIn", "relationTemplateContains"],
  enemy_of: ["relationTemplateEnemyOf", "relationTemplateEnemyOf"],
  created_by: ["relationTemplateCreatedBy", "relationTemplateCreated"],
  rules_over: ["relationTemplateRulesOver", "relationTemplateRuledBy"],
  knows: ["relationTemplateKnows", "relationTemplateKnownBy"],
} as const satisfies Readonly<
  Record<string, readonly [MessageKey, MessageKey]>
>);

const searchGroupMessageKeys = Object.freeze({
  CHAPTER: "searchGroupChapters",
  CHAPTER_OUTLINE: "searchGroupChapterOutlines",
  PLOT_OUTLINE: "searchGroupPlotOutlines",
  VOLUME_OUTLINE: "searchGroupVolumeOutlines",
  MILESTONE: "searchGroupMilestones",
  ENTITY: "searchGroupEntities",
  STORY_CHANGE: "searchGroupStoryChanges",
  CAUSAL_RELATION_TYPE: "searchGroupCausalRelationTypes",
  UNIVERSE_RELATION_TYPE: "searchGroupUniverseRelationTypes",
  STORY_REFERENCE: "searchGroupReferences",
  CAPTURE: "searchGroupCaptures",
  TIMELINE_EVENT: "searchGroupTimelineEvents",
  NOTE: "searchGroupNotes",
  RESEARCH: "searchGroupResearch",
} as const satisfies Readonly<Record<string, MessageKey>>);

export function localizedErrorMessage(
  catalog: MessageCatalog,
  error: LocalizableError,
  fallback: string,
): string {
  const key = error?.code
    ? errorMessageKeys[error.code as keyof typeof errorMessageKeys]
    : undefined;
  return key ? catalog[key] : fallback;
}

export function localizedEnumLabel(
  catalog: MessageCatalog,
  value: string,
): string {
  const key = enumMessageKeys[value as keyof typeof enumMessageKeys];
  return key ? catalog[key] : catalog.unknownValue;
}

export function localizedEnumLabelOrValue(
  catalog: MessageCatalog,
  value: string,
): string {
  const key = enumMessageKeys[value as keyof typeof enumMessageKeys];
  return key ? catalog[key] : value;
}

export function localizedSearchGroupLabel(
  catalog: MessageCatalog,
  value: string,
): string {
  const key =
    searchGroupMessageKeys[value as keyof typeof searchGroupMessageKeys];
  return key ? catalog[key] : catalog.unknownValue;
}

export function localizedEntityTemplateName(
  catalog: MessageCatalog,
  systemKey: string | null | undefined,
  fallback: string,
): string {
  const key = systemKey
    ? entityTemplateNameMessageKeys[
        systemKey as keyof typeof entityTemplateNameMessageKeys
      ]
    : undefined;
  return key ? catalog[key] : fallback;
}

export function localizedEntityTemplateFieldLabel(
  catalog: MessageCatalog,
  systemKey: string | null | undefined,
  fieldKey: string,
  fallback: string,
): string {
  if (!systemKey) return fallback;
  const key =
    entityTemplateFieldMessageKeys[
      fieldKey as keyof typeof entityTemplateFieldMessageKeys
    ];
  return key ? catalog[key] : fallback;
}

export function localizedRelationTemplateLabel(
  catalog: MessageCatalog,
  systemKey: string | null | undefined,
  direction: "forward" | "reverse",
  fallback: string,
): string {
  const keys = systemKey
    ? relationTemplateMessageKeys[
        systemKey as keyof typeof relationTemplateMessageKeys
      ]
    : undefined;
  return keys ? catalog[keys[direction === "forward" ? 0 : 1]] : fallback;
}

export function localizedContextTitle(
  catalog: MessageCatalog,
  descriptor: Readonly<{
    type: string;
    title: string;
    payload: Readonly<Record<string, unknown>>;
  }>,
): string {
  if (descriptor.type === "CAUSAL") {
    return descriptor.payload.direction === "UPSTREAM"
      ? catalog.because
      : catalog.consequence;
  }
  if (descriptor.type === "CAPTURE") return catalog.capture;
  if (descriptor.type === "NARRATIVE_INTENT") {
    return descriptor.title
      ? localizedEnumLabel(catalog, descriptor.title)
      : catalog.narrativeIntent;
  }
  if (
    descriptor.type === "REFERENCE" &&
    !descriptor.title &&
    typeof descriptor.payload.targetType === "string"
  )
    return localizedEnumLabel(catalog, descriptor.payload.targetType);
  return descriptor.title || localizedEnumLabel(catalog, descriptor.type);
}

export function localizedCausalEndpointLabel(
  catalog: MessageCatalog,
  locale: Locale,
  endpoint: Readonly<{
    type: string;
    label: string;
    labelCode?: string;
    labelOrdinal?: number;
  }>,
): string {
  const type = localizedEnumLabel(catalog, endpoint.labelCode ?? endpoint.type);
  if (!endpoint.label) {
    return endpoint.labelOrdinal === undefined
      ? type
      : interpolateMessage(catalog.causalEndpointWithOrdinal, {
          type,
          ordinal: formatNumber(locale, endpoint.labelOrdinal),
        });
  }
  return interpolateMessage(
    endpoint.labelOrdinal === undefined
      ? catalog.causalEndpointNamed
      : catalog.causalEndpointNamedWithOrdinal,
    {
      label: endpoint.label,
      type,
      ...(endpoint.labelOrdinal === undefined
        ? {}
        : { ordinal: formatNumber(locale, endpoint.labelOrdinal) }),
    },
  );
}

export function localizedSearchResultTitle(
  catalog: MessageCatalog,
  result: Readonly<{
    documentType: string;
    title: string;
    metadata: Readonly<Record<string, unknown>>;
  }>,
): string {
  if (result.documentType === "CAPTURE") return catalog.capture;
  if (
    result.documentType === "CAUSAL_RELATION_TYPE" &&
    typeof result.metadata.relationType === "string"
  ) {
    return localizedEnumLabel(catalog, result.metadata.relationType);
  }
  return result.title;
}

export function formatNumber(
  locale: Locale,
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(localeTags[locale], options).format(value);
}

export function formatCurrency(
  locale: Locale,
  amountMinorUnits: number,
  currency: string,
): string {
  return formatNumber(locale, amountMinorUnits / 100, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });
}

export function formatDate(
  locale: Locale,
  value: Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(
    localeTags[locale],
    options ?? { dateStyle: "medium" },
  ).format(value);
}

export function formatDateTime(locale: Locale, value: Date): string {
  return new Intl.DateTimeFormat(localeTags[locale], {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function formatBytes(locale: Locale, value: number): string {
  const safeValue = Number.isFinite(value) && value > 0 ? value : 0;
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  const exponent =
    safeValue === 0
      ? 0
      : Math.min(
          Math.floor(Math.log(safeValue) / Math.log(1024)),
          units.length - 1,
        );
  const scaled = safeValue / 1024 ** exponent;
  return `${formatNumber(locale, scaled, { maximumFractionDigits: scaled >= 10 ? 0 : 1 })} ${units[exponent]}`;
}
