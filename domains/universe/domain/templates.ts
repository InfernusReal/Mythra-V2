export type TemplateField = {
  key: string;
  fieldType:
    | "TEXT"
    | "RICH_TEXT"
    | "NUMBER"
    | "BOOLEAN"
    | "DATE"
    | "SELECT"
    | "MULTI_SELECT"
    | "REFERENCE"
    | "REFERENCE_LIST"
    | "URL";
  config?: Record<string, unknown>;
};
export type EntityTemplate = {
  key: string;
  icon: string;
  fields: TemplateField[];
};

const text = (key: string): TemplateField => ({
  key,
  fieldType: "TEXT",
});
const rich = (key: string): TemplateField => ({
  key,
  fieldType: "RICH_TEXT",
});
const refs = (key: string): TemplateField => ({
  key,
  fieldType: "REFERENCE_LIST",
});

export const entityTemplates: readonly EntityTemplate[] = [
  {
    key: "character",
    icon: "person",
    fields: [
      text("role"),
      text("age"),
      text("pronouns"),
      rich("appearance"),
      rich("personality"),
      rich("goals"),
      rich("fears"),
      rich("arc"),
      rich("voice_notes"),
      refs("affiliations"),
    ],
  },
  {
    key: "location",
    icon: "place",
    fields: [
      text("type"),
      text("region"),
      rich("description"),
      text("atmosphere"),
      text("population"),
      rich("rules"),
      refs("connected_locations"),
    ],
  },
  {
    key: "faction",
    icon: "group",
    fields: [
      rich("purpose"),
      refs("leadership"),
      refs("members"),
      rich("ideology"),
      rich("resources"),
      refs("rivals"),
      refs("allies"),
    ],
  },
  {
    key: "organization",
    icon: "organization",
    fields: [
      rich("purpose"),
      refs("leadership"),
      refs("members"),
      rich("resources"),
    ],
  },
  {
    key: "culture",
    icon: "culture",
    fields: [
      rich("values"),
      rich("customs"),
      text("language"),
      rich("hierarchy"),
      rich("taboos"),
      rich("rituals"),
      refs("regions"),
    ],
  },
  {
    key: "religion",
    icon: "religion",
    fields: [
      rich("values"),
      rich("beliefs"),
      rich("hierarchy"),
      rich("rituals"),
      refs("regions"),
    ],
  },
  {
    key: "power_system",
    icon: "power",
    fields: [
      rich("principles"),
      rich("costs"),
      rich("constraints"),
      rich("ranks"),
      rich("techniques"),
      rich("exceptions"),
    ],
  },
  {
    key: "item",
    icon: "item",
    fields: [
      text("type"),
      refs("owner"),
      rich("abilities"),
      rich("limitations"),
      rich("history"),
      refs("location"),
    ],
  },
  {
    key: "species",
    icon: "species",
    fields: [
      rich("appearance"),
      rich("traits"),
      rich("culture"),
      refs("regions"),
    ],
  },
  {
    key: "technology",
    icon: "technology",
    fields: [
      rich("principles"),
      rich("capabilities"),
      rich("constraints"),
      refs("creators"),
    ],
  },
  {
    key: "event",
    icon: "event",
    fields: [
      rich("description"),
      rich("consequences"),
      refs("participants"),
      refs("locations"),
    ],
  },
  {
    key: "lore",
    icon: "lore",
    fields: [
      rich("definition"),
      rich("origin"),
      rich("consequences"),
      refs("related_concepts"),
    ],
  },
  { key: "custom", icon: "custom", fields: [] },
] as const;

export const relationTemplates = [
  { key: "parent_of", directional: true },
  { key: "member_of", directional: true },
  { key: "located_in", directional: true },
  { key: "enemy_of", directional: false },
  { key: "created_by", directional: true },
  { key: "rules_over", directional: true },
  { key: "knows", directional: true },
] as const;
