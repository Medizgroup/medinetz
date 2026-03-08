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
  });

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function extractMentionedUserIds(nodes: unknown): string[] {
  const ids = new Set<string>();

  walkNodes(nodes, (node) => {
    // mention-kit stores usually type=mention and value=<id>
    if (node.type === "mention" && typeof node.value === "string") {
      ids.add(node.value);
    }

    if (node.type === "mention" && typeof node.userId === "string") {
      ids.add(node.userId);
    }
  });

  return Array.from(ids);
}

export function extractReferencedCaseIds(nodes: unknown): string[] {
  const ids = new Set<string>();

  walkNodes(nodes, (node) => {
    // custom case reference node
    if (node.type === "case_reference" && typeof node.caseId === "string") {
      ids.add(node.caseId);
    }

    // fallback if slash inserts link-like node with metadata
    if (node.type === "a" && typeof node.caseId === "string") {
      ids.add(node.caseId);
    }
  });

  return Array.from(ids);
}
