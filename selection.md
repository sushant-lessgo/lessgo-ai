
For exit mechanism:

🔧 Recommended Implementation:
🚀 MVP:
In InlineTextEditor.tsx:

tsx
Copy
Edit
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setTextEditingMode(false); // Exit editing
      blurTextInput();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
Add click outside detector using a useClickAway hook from usehooks-ts or custom.

If blur is acceptable:

tsx
Copy
Edit
onBlur={() => setTextEditingMode(false)}


For partial selection:

🚀 Recommended Implementation Plan:
✅ Step 1: Detect and Format Selection (MVP)
ts
Copy
Edit
const selection = window.getSelection();
if (!selection?.rangeCount) return;

const range = selection.getRangeAt(0);
const span = document.createElement('span');
span.style.fontWeight = 'bold';
span.style.color = '#3b82f6';
range.surroundContents(span);
💡 Wrap this logic in a formatText({ bold: true, color: '#3b82f6' }) helper.

✅ Step 2: Persist as HTML
In your EditableText component:

tsx
Copy
Edit
<div
  contentEditable
  dangerouslySetInnerHTML={{ __html: savedHTML }}
  onInput={(e) => updateHTML(e.currentTarget.innerHTML)}
/>
💡 You must store HTML in state (or db), not plain text, from now on.

🚩 Step 3: Nesting/Conflicts (After MVP)
Clean up adjacent/overlapping spans

Normalize on paste (strip extra styles)

Use a light HTML sanitizer (e.g. DOMPurify)

==================

On your new addition

🧠 My Suggestions to Improve Further
✅ 1. Encapsulate in a Hook
Create a useSelectionPreserver() hook to avoid globals:

ts
Copy
Edit
function useSelectionPreserver() {
  const savedRangeRef = useRef<Range | null>(null);

  const save = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restore = () => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  return { saveSelection: save, restoreSelection: restore };
}
Use this in your editor component:

tsx
Copy
Edit
const { saveSelection, restoreSelection } = useSelectionPreserver();

onMouseDown={() => saveSelection()} // before toolbar opens
onClick={() => {
  restoreSelection();
  applyFormatting();
}}
✅ 2. Save on mouseup or selectionchange
For even more robustness, you can auto-track selections:

ts
Copy
Edit
useEffect(() => {
  const handleSelectionChange = () => saveSelection();
  document.addEventListener("selectionchange", handleSelectionChange);
  return () => document.removeEventListener("selectionchange", handleSelectionChange);
}, []);
✅ 3. Optional: Delay Toolbar Rendering
Some apps delay showing the toolbar by requestAnimationFrame or a setTimeout(0) so the browser doesn’t reset the selection while focusing a button.