import { useBookUiStore } from "@/shared/store/bookUi";
import { beforeEach, describe, expect, it } from "vitest";

describe("book UI store", () => {
  beforeEach(() => useBookUiStore.getState().reset());

  it("manages editor and confirmation state independently", () => {
    useBookUiStore.getState().openCreate("reading");
    expect(useBookUiStore.getState().editorState).toMatchObject({
      open: true,
      mode: "create",
      initialStatus: "reading",
    });

    useBookUiStore.getState().openEdit("book-id");
    useBookUiStore.getState().openFinish("book-id");
    useBookUiStore.getState().openDelete("book-id");
    expect(useBookUiStore.getState()).toMatchObject({
      editorState: { open: true, mode: "edit", bookId: "book-id" },
      finishBookId: "book-id",
      deleteBookId: "book-id",
    });

    useBookUiStore.getState().reset();
    expect(useBookUiStore.getState()).toMatchObject({
      editorState: { open: false, mode: "create" },
      finishBookId: null,
      deleteBookId: null,
    });
  });
});
