export type RichTextNode = {
  type?: string;
  text?: string;
  url?: string;
  children?: RichTextNode[];
};

export function plainTextToRichText(input: string): RichTextNode[] {
  const lines = input
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd());

  const nodes: RichTextNode[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (!bulletBuffer.length) return;

    nodes.push({
      type: "ul",
      children: bulletBuffer.map((item) => ({
        type: "li",
        children: [{ text: item }],
      })),
    });

    bulletBuffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushBullets();
      continue;
    }

    if (trimmed.startsWith("- ")) {
      bulletBuffer.push(trimmed.slice(2));
      continue;
    }

    flushBullets();

    if (trimmed.startsWith("## ")) {
      nodes.push({
        type: "h2",
        children: [{ text: trimmed.slice(3) }],
      });
      continue;
    }

    if (trimmed.startsWith("# ")) {
      nodes.push({
        type: "h1",
        children: [{ text: trimmed.slice(2) }],
      });
      continue;
    }

    nodes.push({
      type: "p",
      children: [{ text: trimmed }],
    });
  }

  flushBullets();

  if (!nodes.length) {
    return [
      {
        type: "p",
        children: [{ text: "" }],
      },
    ];
  }

  return nodes;
}

export function richTextToPlainText(value: unknown): string {
  if (!Array.isArray(value)) return "";

  const walk = (node: RichTextNode): string => {
    if (typeof node.text === "string") return node.text;
    if (!Array.isArray(node.children)) return "";
    return node.children.map(walk).join("");
  };

  return value
    .map((node) => {
      if (node?.type === "li") return `- ${walk(node)}`;
      if (node?.type === "ul") {
        return (node.children ?? [])
          .map((child: RichTextNode) => `- ${walk(child)}`)
          .join("\n");
      }
      if (node?.type === "h1") return `# ${walk(node)}`;
      if (node?.type === "h2") return `## ${walk(node)}`;
      return walk(node);
    })
    .join("\n\n");
}
