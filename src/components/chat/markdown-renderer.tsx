"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Button } from "@/components/ui/button";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose-chat max-w-none text-sm leading-7">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ ...props }) => <h1 className="mb-3 text-2xl font-semibold leading-tight" {...props} />,
          h2: ({ ...props }) => <h2 className="mb-3 mt-6 text-xl font-semibold leading-tight" {...props} />,
          h3: ({ ...props }) => <h3 className="mb-2 mt-5 text-lg font-semibold leading-tight" {...props} />,
          p: ({ ...props }) => <p className="mb-3 last:mb-0" {...props} />,
          ul: ({ ...props }) => <ul className="mb-3 list-disc space-y-1 pl-5" {...props} />,
          ol: ({ ...props }) => <ol className="mb-3 list-decimal space-y-1 pl-5" {...props} />,
          li: ({ ...props }) => <li className="pl-1" {...props} />,
          table: ({ ...props }) => <div className="my-4 overflow-x-auto"><table {...props} /></div>,
          th: ({ ...props }) => <th className="bg-[color:var(--color-primary-soft)] font-semibold text-[color:var(--color-primary)]" {...props} />,
          a: ({ ...props }) => <a className="font-medium text-[color:var(--color-primary)] underline underline-offset-2" {...props} rel="noreferrer" target="_blank" />,
          pre: ({ children }) => <PreBlock>{children}</PreBlock>,
          code: ({ className, children, ...props }) => {
            if (className?.includes("language-")) {
              return <code className={className} {...props}>{children}</code>;
            }

            return (
              <code
                className="rounded-lg bg-[color:var(--color-primary-soft)] px-1.5 py-0.5 text-[0.85em] text-[color:var(--color-primary)]"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function PreBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const child = children as React.ReactElement<{ className?: string; children?: React.ReactNode }>;
  const className = child?.props?.className ?? "";
  const match = className.match(/language-([\w-]+)/);
  const language = match?.[1] ?? "text";
  const code = extractText(child?.props?.children);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#171717]">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#111111] px-4 py-2 text-xs text-white/70">
        <span className="font-medium uppercase tracking-[0.14em]">{language}</span>
        <Button aria-label="Copy code block" className="h-8 gap-2 rounded-xl bg-white/10 px-3 text-xs text-white hover:bg-white/15" onClick={() => void handleCopy()} type="button" variant="ghost">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre>{children}</pre>
    </div>
  );
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map(extractText).join("");
  }

  if (node && typeof node === "object" && "props" in node) {
    return extractText((node as { props?: { children?: React.ReactNode } }).props?.children);
  }

  return "";
}
