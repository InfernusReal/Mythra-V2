import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UniverseWorkspace } from "@/components/universe/UniverseWorkspace";
import { EntityDetail } from "@/components/universe/EntityDetail";

const id = (n: number) =>
  `90000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const catalog = {
  entityTypes: [
    {
      id: id(2),
      key: "character",
      systemKey: "character",
      name: "Character",
      description: null,
      icon: "person",
      locale: "en",
      fields: [],
    },
  ],
  relationTypes: [
    {
      id: id(5),
      key: "knows",
      systemKey: "knows",
      forwardLabel: "Knows",
      reverseLabel: "Known by",
      directional: true,
    },
  ],
};
const entity = {
  id: id(3),
  projectId: id(1),
  typeId: id(2),
  typeKey: "character",
  typeName: "Character",
  name: "Mara",
  aliases: [],
  summary: null,
  status: "ACTIVE" as const,
  tags: [],
  icon: null,
  colorToken: null,
  version: 1,
  updatedAt: new Date().toISOString(),
  fieldValues: [],
};
const response = (data: unknown) =>
  new Response(JSON.stringify({ data }), { status: 200 });
beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => undefined);
});
describe("Universe UI", () => {
  it("renders optional empty-state guidance and creates a minimal entity", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      response({ entity, projectStructuralVersion: 2 }),
    );
    render(
      <UniverseWorkspace
        projectId={id(1)}
        initialEntities={[]}
        initialCatalog={catalog}
        initialStructuralVersion={1}
      />,
    );
    expect(screen.getByText(/without Universe setup/)).toBeVisible();
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Mara" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create entity" }));
    expect(await screen.findByRole("link", { name: /Mara/ })).toBeVisible();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('"step":"S9-UI-001"'),
    );
  });
  it("adds relation intent and immutable state without overwriting the current entity", async () => {
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(response({ projectStructuralVersion: 2 }))
      .mockResolvedValueOnce(
        response({ snapshotId: id(9), projectStructuralVersion: 3 }),
      );
    render(
      <EntityDetail
        projectId={id(1)}
        initialDetail={{
          entity,
          outgoing: [],
          incoming: [],
          snapshots: [],
          backlinks: [],
          backlinkCounts: {},
          backlinkPages: {},
        }}
        catalog={catalog}
        initialStructuralVersion={1}
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Other entity ID" }), {
      target: { value: id(4) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add relation" }));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByRole("textbox", { name: "State JSON" }), {
      target: { value: '{"location":"harbor"}' },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Add immutable state" }),
    );
    expect(await screen.findByText(/position 0/)).toBeVisible();
    expect(screen.getByRole("heading", { name: "Mara" })).toBeVisible();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('"step":"S9-UI-002"'),
    );
  });
  it("filters existing cards, renders optional authored detail, and preserves Return to Chapter", () => {
    const rich = {
      ...entity,
      summary: "A bounded summary",
      aliases: ["M"],
      tags: ["lead"],
    };
    const alternate = {
      ...catalog.entityTypes[0]!,
      id: id(99),
      key: "location",
      systemKey: "location",
      name: "Location",
    };
    render(
      <UniverseWorkspace
        projectId={id(1)}
        initialEntities={[rich]}
        initialCatalog={{
          ...catalog,
          entityTypes: [...catalog.entityTypes, alternate],
        }}
        initialStructuralVersion={1}
        returnChapterId={id(8)}
      />,
    );
    expect(
      screen.getByRole("link", { name: "Return to Chapter" }),
    ).toHaveAttribute("href", `/app/chapters/${id(8)}`);
    expect(screen.getByText("A bounded summary")).toBeVisible();
    fireEvent.change(screen.getByRole("combobox", { name: "Filter by type" }), {
      target: { value: id(99) },
    });
    expect(screen.getByText(/No entities match/)).toBeVisible();
  });
  it("reports create failure and can hydrate an initially empty catalog", async () => {
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        response({ ...catalog, projectStructuralVersion: 4 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { message: "Version conflict" } }),
          { status: 409 },
        ),
      );
    render(
      <UniverseWorkspace
        projectId={id(1)}
        initialEntities={[]}
        initialCatalog={{ entityTypes: [], relationTypes: [] }}
        initialStructuralVersion={1}
      />,
    );
    fireEvent.focus(screen.getByRole("combobox", { name: "Type" }));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Conflict entity" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create entity" }));
    expect(await screen.findByText("Version conflict")).toBeVisible();
  });
  it("renders populated fields, directions, snapshots and backlinks and reports invalid state", async () => {
    const full = {
      ...entity,
      aliases: ["Alias"],
      tags: ["lead"],
      summary: "Summary",
      fieldValues: [
        {
          fieldDefinitionId: id(20),
          key: "motive",
          label: "Motive",
          fieldType: "TEXT" as const,
          value: "Protect home",
        },
      ],
    };
    const detail = {
      entity: full,
      outgoing: [
        {
          id: id(21),
          otherId: id(4),
          otherName: "Other",
          label: "Knows",
          relationTypeId: id(5),
          note: null,
        },
      ],
      incoming: [
        {
          id: id(22),
          otherId: id(6),
          otherName: "Third",
          label: "Known by",
          relationTypeId: id(5),
          note: null,
        },
      ],
      snapshots: [
        {
          id: id(23),
          anchorType: "CHAPTER" as const,
          anchorId: id(30),
          state: { place: "harbor" },
          note: null,
          orderIndex: 0,
          sourceEntityVersion: 1,
          createdAt: new Date().toISOString(),
        },
      ],
      backlinks: [
        {
          sourceType: "CHAPTER",
          sourceId: id(30),
          sourceBlockId: null,
          relationshipKey: "mentions",
          provenanceType: "DIRECT",
          createdAt: new Date().toISOString(),
        },
      ],
      backlinkCounts: { CHAPTER: 1 },
      backlinkPages: { CHAPTER: { returned: 1, total: 1, nextCursor: null } },
    };
    render(
      <EntityDetail
        projectId={id(1)}
        initialDetail={detail}
        catalog={catalog}
        initialStructuralVersion={3}
        returnChapterId={id(30)}
      />,
    );
    expect(screen.getByText("Protect home")).toBeVisible();
    expect(screen.getByText(/Knows: Other/)).toBeVisible();
    expect(screen.getByText(/Known by: Third/)).toBeVisible();
    expect(screen.getByText(/CHAPTER · mentions/)).toBeVisible();
    fireEvent.change(screen.getByRole("textbox", { name: "State JSON" }), {
      target: { value: "not-json" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Add immutable state" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      /not valid JSON/,
    );
  });
  it("edits common and typed custom fields while excluding deferred binary fields", async () => {
    const typedCatalog = {
      ...catalog,
      entityTypes: [
        {
          ...catalog.entityTypes[0]!,
          fields: [
            {
              id: id(30),
              key: "age",
              label: "Age",
              fieldType: "NUMBER" as const,
              requiredByUser: false,
              orderIndex: 0,
              config: {},
            },
            {
              id: id(31),
              key: "active",
              label: "Active",
              fieldType: "BOOLEAN" as const,
              requiredByUser: true,
              orderIndex: 1,
              config: {},
            },
            {
              id: id(32),
              key: "lore",
              label: "Lore",
              fieldType: "RICH_TEXT" as const,
              requiredByUser: false,
              orderIndex: 2,
              config: {},
            },
            {
              id: id(33),
              key: "tags",
              label: "Labels",
              fieldType: "MULTI_SELECT" as const,
              requiredByUser: false,
              orderIndex: 3,
              config: {},
            },
            {
              id: id(34),
              key: "allies",
              label: "Allies",
              fieldType: "REFERENCE_LIST" as const,
              requiredByUser: false,
              orderIndex: 4,
              config: {},
            },
            {
              id: id(35),
              key: "portrait",
              label: "Portrait",
              fieldType: "IMAGE" as const,
              requiredByUser: false,
              orderIndex: 5,
              config: {},
            },
            {
              id: id(36),
              key: "archive",
              label: "Archive",
              fieldType: "FILE" as const,
              requiredByUser: false,
              orderIndex: 6,
              config: {},
            },
          ],
        },
      ],
    };
    const typedEntity = {
      ...entity,
      fieldValues: [
        {
          fieldDefinitionId: id(30),
          key: "age",
          label: "Age",
          fieldType: "NUMBER" as const,
          value: 2,
        },
      ],
    };
    const updated = {
      ...typedEntity,
      name: "Mara Venn",
      summary: "Updated",
      version: 2,
    };
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        response({ entity: updated, projectStructuralVersion: 2 }),
      )
      .mockResolvedValueOnce(
        response({
          entity: { ...updated, version: 3 },
          projectStructuralVersion: 3,
        }),
      );
    render(
      <EntityDetail
        projectId={id(1)}
        initialDetail={{
          entity: typedEntity,
          outgoing: [],
          incoming: [],
          snapshots: [],
          backlinks: [],
          backlinkCounts: {},
          backlinkPages: {},
        }}
        catalog={typedCatalog}
        initialStructuralVersion={1}
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Mara Venn" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Summary" }), {
      target: { value: "Updated" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Save entity details" }),
    );
    expect(await screen.findByText("Entity details updated.")).toBeVisible();
    fireEvent.change(screen.getByRole("textbox", { name: /Age/ }), {
      target: { value: "42" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /Active/ }), {
      target: { value: "true" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /Lore/ }), {
      target: { value: '{"type":"doc"}' },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /Labels/ }), {
      target: { value: '["lead"]' },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /Allies/ }), {
      target: { value: `["${id(4)}"]` },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save custom fields" }));
    expect(await screen.findByText("Custom fields updated.")).toBeVisible();
    const secondBody = JSON.parse(String(fetcher.mock.calls[1]?.[1]?.body)) as {
      values: Array<{ fieldDefinitionId: string; value: unknown }>;
    };
    expect(secondBody.values).toEqual([
      { fieldDefinitionId: id(30), value: 42 },
      { fieldDefinitionId: id(31), value: true },
      { fieldDefinitionId: id(32), value: { type: "doc" } },
      { fieldDefinitionId: id(33), value: ["lead"] },
      { fieldDefinitionId: id(34), value: [id(4)] },
    ]);
    expect(
      screen.getAllByDisplayValue("Available after private storage activation"),
    ).toHaveLength(2);
    expect(
      screen.getByText("BOOLEAN · required by project configuration"),
    ).toBeVisible();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('"step":"S9-UI-004"'),
    );
  });
  it("surfaces bounded fallback errors for entity, relation, state and custom-field mutations", async () => {
    const errorCatalog = {
      ...catalog,
      entityTypes: [
        {
          ...catalog.entityTypes[0]!,
          fields: [
            {
              id: id(40),
              key: "broken",
              label: "Broken JSON",
              fieldType: "MULTI_SELECT" as const,
              requiredByUser: false,
              orderIndex: 0,
              config: {},
            },
          ],
        },
      ],
    };
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue("network unavailable");
    render(
      <EntityDetail
        projectId={id(1)}
        initialDetail={{
          entity,
          outgoing: [],
          incoming: [],
          snapshots: [],
          backlinks: [],
          backlinkCounts: {},
          backlinkPages: {},
        }}
        catalog={errorCatalog}
        initialStructuralVersion={1}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Save entity details" }),
    );
    expect(await screen.findByText("Entity update failed.")).toBeVisible();
    fireEvent.change(screen.getByRole("textbox", { name: /Broken JSON/ }), {
      target: { value: "[" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save custom fields" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Unexpected end of JSON input",
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Other entity ID" }), {
      target: { value: id(4) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add relation" }));
    expect(await screen.findByText("Relation failed.")).toBeVisible();
    fireEvent.change(screen.getByRole("textbox", { name: "State JSON" }), {
      target: { value: "{}" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Add immutable state" }),
    );
    expect(
      await screen.findByText("State must be a valid JSON object."),
    ).toBeVisible();
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it("creates a custom type, refreshes the catalog and preserves project-home navigation", async () => {
    const customType = {
      ...catalog.entityTypes[0]!,
      id: id(50),
      key: "guild",
      systemKey: null,
      name: "Guild",
    };
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        response({ typeId: id(50), projectStructuralVersion: 2 }),
      )
      .mockResolvedValueOnce(
        response({
          entityTypes: [...catalog.entityTypes, customType],
          relationTypes: catalog.relationTypes,
          projectStructuralVersion: 2,
        }),
      );
    render(
      <UniverseWorkspace
        projectId={id(1)}
        initialEntities={[]}
        initialCatalog={catalog}
        initialStructuralVersion={1}
      />,
    );
    expect(
      screen.getByRole("link", { name: "Return to Project Home" }),
    ).toHaveAttribute("href", `/app/projects/${id(1)}`);
    fireEvent.change(screen.getByRole("textbox", { name: "Stable key" }), {
      target: { value: "guild" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Type name" }), {
      target: { value: "Guild" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create custom type" }));
    expect(await screen.findByText("Custom type created.")).toBeVisible();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("combobox", { name: "Type" })).toHaveValue(id(50));
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('"step":"S9-UI-005"'),
    );
  });
});
