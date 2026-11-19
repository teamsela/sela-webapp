import { afterEach, describe, expect, it, vi } from "vitest";

const { saveMetadata, saveStudyName } = vi.hoisted(() => ({
  saveMetadata: vi.fn(async (..._args: unknown[]) => undefined),
  saveStudyName: vi.fn(async (..._args: unknown[]) => undefined),
}));
vi.mock("@/lib/actions", () => ({ updateMetadataInDb: saveMetadata, updateStudyName: saveStudyName }));

import { isPracticeMode, setPracticeMode, updateMetadataInDb, updateStudyName } from "./studyPersistence";

describe("studyPersistence", () => {
  afterEach(() => {
    setPracticeMode(false);
    vi.clearAllMocks();
  });

  it("saves normally outside practice mode", async () => {
    await updateMetadataInDb("rec_1", { words: {} } as any);
    await updateStudyName("rec_1", "New name");
    expect(saveMetadata).toHaveBeenCalledWith("rec_1", { words: {} });
    expect(saveStudyName).toHaveBeenCalledWith("rec_1", "New name");
  });

  it("skips every save in practice mode", async () => {
    setPracticeMode(true);
    expect(isPracticeMode()).toBe(true);
    await updateMetadataInDb("rec_1", { words: {} } as any);
    await updateStudyName("rec_1", "New name");
    expect(saveMetadata).not.toHaveBeenCalled();
    expect(saveStudyName).not.toHaveBeenCalled();
  });
});
