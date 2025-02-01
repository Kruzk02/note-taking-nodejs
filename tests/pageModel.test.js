import { describe, it, expect, vi } from 'vitest';
import Page from "../src/models/pageModel.js"

describe('Page model test', () => {
  it("Should save page", async () => {
    const pageData = {
      title: "title",
      content: "content",
    };

    const mockSave = vi.fn().mockResolvedValue({
      title: "title",
      content: "content",
    });

    const page = new Page(pageData);
    page.save = mockSave;
    await page.save();

    expect(mockSave).toHaveBeenCalled;
    expect(page.title).toBe(pageData.title);
  });
});
