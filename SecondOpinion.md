Best fix (clean + scalable): add multiline to InlineTextEditorV2 and use normalized innerHTML when multiline
1) Update props

Add this to InlineTextEditorV2Props:

multiline?: boolean;


and default it in the component signature:

multiline = false,

2) Normalize HTML for multiline and save that (instead of textContent)

Replace saveContent() with this version (minimal but robust):

const normalizeMultilineHTML = (html: string) => {
  return html
    .replace(/<br\s*\/?>/gi, '<br>')      // normalize <br/>
    .replace(/<(div|p)><br><\/\1>/gi, '<br>') // empty lines
    .replace(/<(div|p)>/gi, '<br>')      // convert blocks to <br>
    .replace(/<\/(div|p)>/gi, '')        // remove closing tags
    .replace(/^<br>/, '');               // remove leading break
};

const saveContent = () => {
  if (!editorRef.current) return;

  try {
    const html = editorRef.current.innerHTML;

    const hasFormatting = !!editorRef.current.querySelector('span[style]');
    const shouldPreserveStructure = multiline; // key: multiline drives behavior

    let finalContent: string;

    if (hasFormatting) {
      finalContent = html;
    } else if (shouldPreserveStructure && (html.includes('<br') || html.includes('<div') || html.includes('<p'))) {
      finalContent = normalizeMultilineHTML(html);
    } else {
      finalContent = editorRef.current.textContent || '';
    }

    if (finalContent !== originalContentRef.current) {
      onContentChange(finalContent);
      originalContentRef.current = finalContent;
    }
  } catch (error) {
    console.error('Error saving content:', error);
  }
};

1. Prefer node traversal approach or simpler innerHTML manipulation?

Answer simpler innerHTML

2. Should this apply to all multiline elements or just announcement supporting_copy?

Answer: all multiline elements