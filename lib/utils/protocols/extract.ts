type AnyNode = {
  type?: string;
  text?: string;
  value?: string;
  userId?: string;
  caseId?: string;
  children?: AnyNode[];
  [key: string]: unknown;
};

function walkNodes(nodes: unknown, visit: (node: AnyNode) => void) {
  if (!Array.isArray(nodes)) return;

  for (const raw of nodes) {
    const node = raw as AnyNode;
    visit(node);

    if (Array.isArray(node.children)) {
      walkNodes(node.children, visit);
    }
  }
}

export function extractPlainTextFromNodes(nodes: unknown): string {
  const parts: string[] = [];

  walkNodes(nodes, (node) => {
    if (typeof node.text === "string") {
      parts.push(node.text);
    }
    if (node.type === "mention" && typeof node.value === "string") {
      parts.push(`@${node.value}`);
    }
    if (node.type === "case_reference" && typeof node.value === "string") {
      parts.push(node.value); // bereits "#42"
    }
  });

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function extractMentionedUserIds(nodes: unknown): string[] {
  const ids = new Set<string>();

  walkNodes(nodes, (node) => {
    if (
      node.type === "mention" &&
      typeof node.userId === "string" &&
      node.userId.length > 0
    ) {
      ids.add(node.userId);
    }
  });

  return Array.from(ids);
}

export function extractReferencedCaseIds(nodes: unknown): string[] {
  // Für Phase B (Case-Reference Plugin) — vorläufig schon mal vorbereitet
  const ids = new Set<string>();

  walkNodes(nodes, (node) => {
    if (node.type === "case_reference" && typeof node.caseId === "string") {
      ids.add(node.caseId);
    }
  });

  return Array.from(ids);
}
