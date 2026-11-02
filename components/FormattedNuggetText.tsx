import { hasNuggetHtml, nuggetHtml, nuggetBlockTags, type NuggetHtmlNode } from "@/lib/nugget-html";
import { createElement, Fragment, type ReactNode } from "react";
import { nuggetBlocks, nuggetBoldParts } from "@/lib/nugget-text";

/** Only known formatting becomes React elements. All other input remains escaped text. */
export default function FormattedNuggetText({ text, className = "", preview = false }: { text: string; className?: string; preview?: boolean }) {
  if (hasNuggetHtml(text)) return (
    <div className={`nugget-formatted-text whitespace-pre-line break-words ${preview ? "line-clamp-6" : "space-y-4"} ${className}`}>
      {renderHtml(nuggetHtml(text), preview)}
    </div>
  );
  return (
    <div className={`nugget-formatted-text ${preview ? "line-clamp-6" : "space-y-4"} ${className}`}>
      {nuggetBlocks(text).map((block, index) => {
        const content = nuggetBoldParts(block.text).map((part, partIndex) =>
          part.bold ? <strong key={partIndex} className="font-bold">{part.text}</strong> : part.text,
        );
        if (preview) {
          return (
            <Fragment key={index}>
              {index > 0 && "\n\n"}
              <span className={block.heading ? "bn-nugget-section-title font-serif" : undefined}>{content}</span>
            </Fragment>
          );
        }
        return block.heading ? (
          <h3 key={index} className="bn-nugget-section-title font-serif leading-tight">{content}</h3>
        ) : (
          <p key={index} className="whitespace-pre-line break-words">{content}</p>
        );
      })}
    </div>
  );
}

function renderHtml(nodes: NuggetHtmlNode[], preview: boolean): ReactNode[] {
  return nodes.map((node, index) => {
    if ("text" in node) return <Fragment key={index}>{nuggetBoldParts(node.text).map((part, i) => part.bold ? <strong key={i} className="font-bold">{part.text}</strong> : part.text)}</Fragment>;
    const heading = /^h[1-6]$/.test(node.tag);
    const children = renderHtml(node.children, preview);
    if (preview && node.tag === "br") return "\n";
    if (preview && nuggetBlockTags.has(node.tag)) return <Fragment key={index}>{index > 0 && "\n"}<span className={heading ? "bn-nugget-section-title font-serif" : undefined}>{children}</span>{"\n"}</Fragment>;
    const tag = heading ? "h3" : node.tag === "section" ? "div" : node.tag;
    const className = heading ? "bn-nugget-section-title font-serif leading-tight" : {
      strong: "font-bold", em: "italic", u: "underline", s: "line-through", del: "line-through",
      ul: "list-disc space-y-2 pl-6", ol: "list-decimal space-y-2 pl-6", li: "list-item",
      blockquote: "border-l-2 border-current pl-4 italic", a: "underline underline-offset-2", pre: "whitespace-pre-wrap break-words", code: "font-mono", p: "whitespace-pre-line break-words",
    }[tag];
    const props = { key: index, className, style: node.style,
      ...(tag === "a" ? { href: node.href, ...(node.newTab && node.href ? { target: "_blank", rel: "noopener noreferrer" } : {}) } : {}) };
    return createElement(tag, props, tag === "br" || tag === "hr" ? undefined : children);
  });
}
