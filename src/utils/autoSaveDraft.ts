// /utils/autoSaveDraft.ts
export async function autoSaveDraft({
  tokenId,
  inputText,
  confirmedFields,
}: {
  tokenId: string;
  inputText: string;
  confirmedFields: Record<string, string>;
}) {
  try {
    await fetch("/api/saveDraft", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tokenId,
        inputText,
        content: confirmedFields,
        title: "Draft in progress",
        themeValues: null,
      }),
    });
  } catch (err) {
    console.error("Auto-save failed", err);
  }
}
