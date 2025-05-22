'use client'

interface EmailFormEmbedProps {
  embedCode: string;
}

export function EmailFormEmbed({ embedCode }: EmailFormEmbedProps) {
  return (
    <div
      className="mt-6 w-full max-w-xl mx-auto border rounded-md p-4 bg-muted"
      dangerouslySetInnerHTML={{ __html: embedCode }}
    />
  );
}
