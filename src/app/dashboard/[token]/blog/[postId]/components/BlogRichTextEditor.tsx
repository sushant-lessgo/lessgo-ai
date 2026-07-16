'use client'

// Blog (Tiptap phase): WYSIWYG authoring surface. MARKDOWN STAYS CANONICAL —
// this component parses the stored markdown into a Tiptap doc and serializes
// back to markdown on every change (tiptap-markdown); the parent's `markdown`
// state / save path / publish pipeline / XSS contract are untouched.
// Extension set mirrors tiptapRoundTrip.test.ts (the round-trip contract):
// v3 StarterKit (bundles Link) + Image (NOT bundled — images drop without it).
//
// 🚨 blog-composer-redesign phase 2 touched this file for TOOLBAR CHROME ONLY. Untouched
// on purpose, and not up for casual edits:
//   - the extension set (dropping `Image` silently drops every image from posts),
//   - `immediatelyRender: false` (the Next SSR hydration guard),
//   - the markdown-canonical `onUpdate` serialization,
//   - `PROSE` below — it deliberately mirrors what READERS get from BlogPostBodyBlock, so
//     it is reader fidelity, not app chrome; retokenizing it to app-* fonts would make the
//     WYSIWYG lie about the published article.
// The `window.prompt`/`alert` in the link + image-upload handlers below are a KNOWN, ACCEPTED
// leftover: this phase's remit was styling here, and swapping them for the shared dialog/toast
// hosts is behaviour. Tracked, not forgotten.
import { useRef } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Markdown } from 'tiptap-markdown'

interface BlogRichTextEditorProps {
  /** Initial markdown — parsed once on mount; later external changes are NOT synced in. */
  initialMarkdown: string
  onChange: (markdown: string) => void
  /** For inline image uploads via /api/upload-image. */
  tokenId: string
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // keep editor selection/focus
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`min-w-[30px] rounded-[7px] px-2 py-1 font-app-sans text-[12.5px] transition-colors disabled:opacity-30 ${
        active ? 'bg-app-ink text-white' : 'text-app-slate hover:bg-app-hairline'
      }`}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor, tokenId }: { editor: Editor; tokenId: string }) {
  const fileRef = useRef<HTMLInputElement>(null)

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL (https://…)', prev || 'https://')
    if (url === null) return
    if (!url || url === 'https://') {
      editor.chain().focus().unsetLink().run()
      return
    }
    if (!/^https:\/\//i.test(url)) {
      alert('Only https:// links are allowed')
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const insertImage = async (file: File) => {
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('tokenId', tokenId)
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) throw new Error(data?.error || 'Upload failed')
      editor.chain().focus().setImage({ src: data.url }).run()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const divider = <span className="mx-1 h-5 w-px bg-app-border" aria-hidden="true" />

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-app-hairline bg-app-canvas px-2 py-1.5">
      <ToolbarButton
        title="Paragraph"
        active={editor.isActive('paragraph')}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        ¶
      </ToolbarButton>
      <ToolbarButton
        title="Heading 2"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        title="Heading 3"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </ToolbarButton>
      {divider}
      <ToolbarButton
        title="Bold"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        title="Inline code"
        active={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        {'</>'}
      </ToolbarButton>
      {divider}
      <ToolbarButton
        title="Bullet list"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        ••
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        title="Quote"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        &ldquo;
      </ToolbarButton>
      <ToolbarButton
        title="Code block"
        active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        {'{ }'}
      </ToolbarButton>
      {divider}
      <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
        🔗
      </ToolbarButton>
      <ToolbarButton title="Insert image" onClick={() => fileRef.current?.click()}>
        🖼
      </ToolbarButton>
      <ToolbarButton title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        —
      </ToolbarButton>
      {divider}
      <ToolbarButton title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        ↺
      </ToolbarButton>
      <ToolbarButton title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        ↻
      </ToolbarButton>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && insertImage(e.target.files[0])}
      />
    </div>
  )
}

// Prose styles mirror the retired ReactMarkdown preview pane so WYSIWYG matches
// what readers get from BlogPostBodyBlock.
const PROSE =
  'prose prose-sm max-w-none min-h-[480px] p-6 focus:outline-none ' +
  '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 ' +
  '[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-3 ' +
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 ' +
  '[&_a]:text-blue-600 [&_a]:underline ' +
  '[&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-3 [&_blockquote]:text-gray-600 ' +
  '[&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-auto ' +
  '[&_img]:max-w-full [&_img]:rounded [&_hr]:my-6'

export default function BlogRichTextEditor({ initialMarkdown, onChange, tokenId }: BlogRichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Image, Markdown],
    content: initialMarkdown,
    immediatelyRender: false, // Next.js SSR hydration guard (Tiptap v3)
    editorProps: {
      attributes: { class: PROSE },
    },
    onUpdate: ({ editor }) => {
      onChange((editor.storage as any).markdown.getMarkdown())
    },
  })

  if (!editor) {
    return <div className="min-h-[480px] p-6 font-app-sans text-[12.5px] text-app-faint">Loading editor…</div>
  }

  return (
    <div>
      <Toolbar editor={editor} tokenId={tokenId} />
      <EditorContent editor={editor} />
    </div>
  )
}
