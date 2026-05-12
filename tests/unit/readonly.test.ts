import { describe, it, expect } from "vitest";
import { ALL_TOOLS, filterReadonlyActions } from "../../src/tools.js";
import { ro, bp } from "../../src/types.js";

describe("ro() helper", () => {
  it("marks an ActionSpec as readonly", () => {
    const spec = ro(bp("test", "test_bridge"));
    expect(spec.readonly).toBe(true);
    expect(spec.bridge).toBe("test_bridge");
  });

  it("preserves all other fields", () => {
    const mapFn = (p: Record<string, unknown>) => p;
    const spec = ro(bp("desc", "bridge", mapFn));
    expect(spec.description).toBe("desc");
    expect(spec.bridge).toBe("bridge");
    expect(spec.mapParams).toBe(mapFn);
    expect(spec.readonly).toBe(true);
  });
});

describe("filterReadonlyActions()", () => {
  it("returns null for a tool with no readonly actions", () => {
    const tool = ALL_TOOLS.find((t) => t.name === "demo");
    expect(tool).toBeDefined();
    expect(filterReadonlyActions(tool!)).toBeNull();
  });

  it("returns null for feedback tool (no readonly actions)", () => {
    const tool = ALL_TOOLS.find((t) => t.name === "feedback");
    expect(tool).toBeDefined();
    expect(filterReadonlyActions(tool!)).toBeNull();
  });

  it("keeps only readonly actions for project tool", () => {
    const tool = ALL_TOOLS.find((t) => t.name === "project");
    expect(tool).toBeDefined();
    const filtered = filterReadonlyActions(tool!);
    expect(filtered).not.toBeNull();
    // All returned actions must be tagged readonly
    for (const [name, spec] of Object.entries(filtered!.actions)) {
      expect(spec.readonly, `action '${name}' should be readonly`).toBe(true);
    }
    // Write actions must be excluded
    expect(filtered!.actions).not.toHaveProperty("set_config");
    expect(filtered!.actions).not.toHaveProperty("build");
    expect(filtered!.actions).not.toHaveProperty("write_cpp_file");
    // Read actions must be present
    expect(filtered!.actions).toHaveProperty("get_status");
    expect(filtered!.actions).toHaveProperty("read_config");
    expect(filtered!.actions).toHaveProperty("list_modules");
  });

  it("the schema action enum only lists readonly action names", () => {
    const tool = ALL_TOOLS.find((t) => t.name === "reflection");
    const filtered = filterReadonlyActions(tool!);
    expect(filtered).not.toBeNull();
    const actionEnum = (filtered!.schema.action as { options: string[] }).options;
    for (const name of actionEnum) {
      expect(filtered!.actions[name].readonly).toBe(true);
    }
  });

  it("every tool with at least one readonly action returns a non-null result", () => {
    for (const tool of ALL_TOOLS) {
      const hasReadonly = Object.values(tool.actions).some((s) => s.readonly);
      const result = filterReadonlyActions(tool);
      if (hasReadonly) {
        expect(result, `${tool.name} should return filtered tool`).not.toBeNull();
      } else {
        expect(result, `${tool.name} should return null`).toBeNull();
      }
    }
  });

  it("ALL_TOOLS contains readonly-tagged actions across multiple tools", () => {
    const toolsWithReadonly = ALL_TOOLS.filter((t) =>
      Object.values(t.actions).some((s) => s.readonly)
    );
    // Should cover most tools (project, asset, blueprint, level, etc.)
    expect(toolsWithReadonly.length).toBeGreaterThanOrEqual(15);
  });
});
