import { describe, it, expect, vi } from 'vitest';
import Page from "../src/models/pageModel.js";
import Section from "../src/models/sectionModel.js";

describe("Section model test", () => {
  it("Should test section", async () => {
    const pageData = {
      title: "title",
      content: "content",
    };
    const page = new Page(pageData);

    const sectionData = {
      name: "sectionName",
      pages: [page],
    }

    const mockSave = vi.fn().mockResolvedValue({
      name: "sectionName",
      pages: [page],
    });

    const section = new Section(sectionData);
    section.save = mockSave;
    await section.save();

    expect(mockSave).toHaveBeenCalled;
    expect(section.name).toBe(sectionData.name);
    expect(section.pages).toStrictEqual(sectionData.pages);
  })
});
