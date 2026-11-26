import { parseDocument } from "htmlparser2";
import type { CSSProperties } from "react";

export type NuggetHtmlNode = { text: string } | {
  tag: string; children: NuggetHtmlNode[]; href?: string; newTab?: boolean; style?: CSSProperties;
};
const allowed = new Set(["p", "br", "strong", "b", "bold", "em", "i", "u", "s", "del", "strike", "ul", "ol", "li", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6", "a", "code", "pre", "hr", "span", "div", "section", "sub", "sup", "mark"]);
const blocked = new Set(["script", "style", "iframe", "object", "embed", "svg", "math", "template", "noscript", "form"]);
export const hasNuggetHtml = (value: string) => /<\/?[a-z][^>]*>/i.test(value);
export const nuggetBlockTags = new Set(["p", "div", "section", "blockquote", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "pre", "hr"]);
function safeStyle(value = ""): CSSProperties | undefined {
  const result: CSSProperties = {};
  for (const declaration of value.split(";")) {
    const [name, ...rest] = declaration.split(":");
    const content = rest.join(":").trim().toLowerCase();
    switch (name.trim().toLowerCase()) {
      case "text-align": if (["left", "right", "center", "justify"].includes(content)) result.textAlign = content as CSSProperties["textAlign"]; break;
      case "font-weight": if (/^(normal|bold|bolder|[1-9]00)$/.test(content)) result.fontWeight = content as CSSProperties["fontWeight"]; break;
      case "font-style": if (content === "italic" || content === "normal") result.fontStyle = content; break;
      case "text-decoration": if (/^(underline|line-through|none)$/.test(content)) result.textDecoration = content; break;
    }
  }
  return Object.keys(result).length ? result : undefined;
}
function safeHref(value = "") {
  if (/[\u0000-\u0020\\]/.test(value)) return undefined;
  return /^(https?:\/\/|mailto:|tel:|#)/i.test(value) || /^\/(?!\/)/.test(value) ? value : undefined;
}
/** Parse into an allowlisted tree; never pass imported markup to the DOM as HTML. */
export function nuggetHtml(value: string): NuggetHtmlNode[] {
  const source = value.replace(/^#{1,6}\s+(.+)$/gm, "<h3>$1</h3>");
  type Node = ReturnType<typeof parseDocument>["children"][number];
  function convert(nodes: Node[], depth: number): NuggetHtmlNode[] {
    if (depth > 80) return [];
    return nodes.flatMap((node): NuggetHtmlNode[] => {
      if (node.type === "text") return [{ text: node.data }];
      if (!("name" in node) || !("attribs" in node)) return [];
      const tag = node.name.toLowerCase();
      if (blocked.has(tag)) return [];
      const children = convert(node.children, depth + 1);
      if (!allowed.has(tag)) return children;
      return [{ tag: tag === "bold" || tag === "b" ? "strong" : tag === "i" ? "em" : tag === "strike" ? "del" : tag,
        children, ...(tag === "a" ? { href: safeHref(node.attribs.href), newTab: node.attribs.target === "_blank" } : {}), style: safeStyle(node.attribs.style) }];
    });
  }
  return convert(parseDocument(source, { decodeEntities: true }).children, 0);
}
export function nuggetHtmlText(nodes: NuggetHtmlNode[]): string {
  return nodes.map(node => "text" in node ? node.text : node.tag === "br" ? "\n" : `${nuggetBlockTags.has(node.tag) ? "\n" : ""}${nuggetHtmlText(node.children)}${nuggetBlockTags.has(node.tag) ? "\n" : ""}`).join("");
}
