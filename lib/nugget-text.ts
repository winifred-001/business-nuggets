/** Converts supported paragraph/break tags to text; never executes HTML. */
export function nuggetText(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n\n")
    .replace(/<p\s*>/gi, "")
    .trim();
}

export function nuggetBoldParts(value: string) {
  const pattern = /\*\*([\s\S]+?)\*\*|<(strong|b)\s*>([\s\S]+?)<\/\2\s*>/gi;
  const parts: { text: string; bold: boolean }[] = [];
  let end = 0;
  for (const match of value.matchAll(pattern)) {
    if (match.index > end) parts.push({ text: value.slice(end, match.index), bold: false });
    parts.push({ text: match[1] ?? match[3], bold: true });
    end = match.index + match[0].length;
  }
  if (end < value.length) parts.push({ text: value.slice(end), bold: false });
  return parts;
}

export function nuggetBlocks(value: string) {
  return nuggetText(value).split(/\n{2,}/).flatMap((paragraph) => {
    const blocks: { text: string; heading: boolean }[] = [];
    let lines: string[] = [];
    const flush = () => {
      if (lines.length) blocks.push({ text: lines.join("\n"), heading: false });
      lines = [];
    };
    for (const line of paragraph.split("\n")) {
      const heading = /^#{1,6}\s+(.+)$/.exec(line);
      if (heading) {
        flush();
        blocks.push({ text: heading[1], heading: true });
      } else lines.push(line);
    }
    flush();
    return blocks;
  });
}

export function nuggetExcerpt(value: string) {
  return nuggetBlocks(value)
    .map(block => nuggetBoldParts(block.text).map(part => part.text).join(""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
