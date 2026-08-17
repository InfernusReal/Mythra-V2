export type TemplateField = {
  key: string;
  label: string;
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
  name: string;
  icon: string;
  fields: TemplateField[];
};

const text = (key: string, label: string): TemplateField => ({
  key,
  label,
  fieldType: "TEXT",
});
const rich = (key: string, label: string): TemplateField => ({
  key,
  label,
  fieldType: "RICH_TEXT",
});
const refs = (key: string, label: string): TemplateField => ({
  key,
  label,
  fieldType: "REFERENCE_LIST",
});

export const entityTemplates: readonly EntityTemplate[] = [
  {
    key: "character",
    name: "Character",
    icon: "person",
    fields: [
      text("role", "Role"),
      text("age", "Age"),
      text("pronouns", "Pronouns"),
      rich("appearance", "Appearance"),
      rich("personality", "Personality"),
      rich("goals", "Goals"),
      rich("fears", "Fears"),
      rich("arc", "Arc"),
      rich("voice_notes", "Voice notes"),
      refs("affiliations", "Affiliations"),
    ],
  },
  {
    key: "location",
    name: "Location",
    icon: "place",
    fields: [
      text("type", "Type"),
      text("region", "Region"),
      rich("description", "Description"),
      text("atmosphere", "Atmosphere"),
      text("population", "Population"),
      rich("rules", "Rules"),
      refs("connected_locations", "Connected locations"),
    ],
  },
  {
    key: "faction",
    name: "Faction / Organization",
    icon: "group",
    fields: [
      rich("purpose", "Purpose"),
      refs("leadership", "Leadership"),
      refs("members", "Members"),
      rich("ideology", "Ideology"),
      rich("resources", "Resources"),
      refs("rivals", "Rivals"),
      refs("allies", "Allies"),
    ],
  },
  {
    key: "organization",
    name: "Organization",
    icon: "organization",
    fields: [
      rich("purpose", "Purpose"),
      refs("leadership", "Leadership"),
      refs("members", "Members"),
      rich("resources", "Resources"),
    ],
  },
  {
    key: "culture",
    name: "Culture / Religion",
    icon: "culture",
    fields: [
      rich("values", "Values"),
      rich("customs", "Customs"),
      text("language", "Language"),
      rich("hierarchy", "Hierarchy"),
      rich("taboos", "Taboos"),
      rich("rituals", "Rituals"),
      refs("regions", "Regions"),
    ],
  },
  {
    key: "religion",
    name: "Religion",
    icon: "religion",
    fields: [
      rich("values", "Values"),
      rich("beliefs", "Beliefs"),
      rich("hierarchy", "Hierarchy"),
      rich("rituals", "Rituals"),
      refs("regions", "Regions"),
    ],
  },
  {
    key: "power_system",
    name: "Power / Magic System",
    icon: "power",
    fields: [
      rich("principles", "Principles"),
      rich("costs", "Costs"),
      rich("constraints", "Constraints"),
      rich("ranks", "Ranks"),
      rich("techniques", "Techniques"),
      rich("exceptions", "Exceptions"),
    ],
  },
  {
    key: "item",
    name: "Item / Artifact",
    icon: "item",
    fields: [
      text("type", "Type"),
      refs("owner", "Owner"),
      rich("abilities", "Abilities"),
      rich("limitations", "Limitations"),
      rich("history", "History"),
      refs("location", "Location"),
    ],
  },
  {
    key: "species",
    name: "Species",
    icon: "species",
    fields: [
      rich("appearance", "Appearance"),
      rich("traits", "Traits"),
      rich("culture", "Culture"),
      refs("regions", "Regions"),
    ],
  },
  {
    key: "technology",
    name: "Technology",
    icon: "technology",
    fields: [
      rich("principles", "Principles"),
      rich("capabilities", "Capabilities"),
      rich("constraints", "Constraints"),
      refs("creators", "Creators"),
    ],
  },
  {
    key: "event",
    name: "Event",
    icon: "event",
    fields: [
      rich("description", "Description"),
      rich("consequences", "Consequences"),
      refs("participants", "Participants"),
      refs("locations", "Locations"),
    ],
  },
  {
    key: "lore",
    name: "Lore / Concept",
    icon: "lore",
    fields: [
      rich("definition", "Definition"),
      rich("origin", "Origin"),
      rich("consequences", "Consequences"),
      refs("related_concepts", "Related concepts"),
    ],
  },
  { key: "custom", name: "Custom", icon: "custom", fields: [] },
] as const;

export const relationTemplates = [
  {
    key: "parent_of",
    forwardLabel: "Parent of",
    reverseLabel: "Child of",
    directional: true,
  },
  {
    key: "member_of",
    forwardLabel: "Member of",
    reverseLabel: "Has member",
    directional: true,
  },
  {
    key: "located_in",
    forwardLabel: "Located in",
    reverseLabel: "Contains",
    directional: true,
  },
  {
    key: "enemy_of",
    forwardLabel: "Enemy of",
    reverseLabel: "Enemy of",
    directional: false,
  },
  {
    key: "created_by",
    forwardLabel: "Created by",
    reverseLabel: "Created",
    directional: true,
  },
  {
    key: "rules_over",
    forwardLabel: "Rules over",
    reverseLabel: "Ruled by",
    directional: true,
  },
  {
    key: "knows",
    forwardLabel: "Knows",
    reverseLabel: "Known by",
    directional: true,
  },
] as const;
