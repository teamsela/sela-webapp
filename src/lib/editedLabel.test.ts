import { describe, expect, it } from "vitest";
import { editedLabel } from "./editedLabel";

const now = new Date("2026-11-21T12:00:00Z");
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000);

describe("editedLabel", () => {
  it("is empty without a date", () => expect(editedLabel(undefined, now)).toBe(""));
  it("says just now under a minute", () => expect(editedLabel(ago(20), now)).toBe("Edited just now"));
  it("counts minutes and hours", () => {
    expect(editedLabel(ago(5 * 60), now)).toBe("Edited 5 minutes ago");
    expect(editedLabel(ago(2 * 3600), now)).toBe("Edited 2 hours ago");
  });
  it("says yesterday, then days", () => {
    expect(editedLabel(ago(86400), now)).toBe("Edited yesterday");
    expect(editedLabel(ago(3 * 86400), now)).toBe("Edited 3 days ago");
  });
  it("gives the date after a week, with the year only when it differs", () => {
    expect(editedLabel(new Date("2026-11-03T12:00:00Z"), now)).toBe("Edited Nov 3");
    expect(editedLabel(new Date("2025-11-03T12:00:00Z"), now)).toBe("Edited Nov 3, 2025");
  });
});
