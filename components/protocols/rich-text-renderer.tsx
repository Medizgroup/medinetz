import { FolderOpen } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

type RichTextNode = {
  type?: string;
  text?: string;
  url?: string;
  value?: string;
  userId?: string;
  children?: RichTextNode[];
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
};

const LEGACY_MENTION_RE = /@\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * Rendert Plain-Text und parst dabei das alte `@[name](id)` Format,
 * damit alte Kommentare schön aussehen.
 */
function renderTextWithLegacyMentions(text: string, baseKey: string) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  LEGACY_MENTION_RE.lastIndex = 0;

  while ((match = LEGACY_MENTION_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <Fragment key={`${baseKey}-t-${i++}`}>
          {text.slice(lastIndex, match.index)}
        </Fragment>,
      );
    }
    parts.push(
      <span
        key={`${baseKey}-m-${i++}`}
        className="rounded bg-primary/10 px-1.5 py-0.5 text-sm font-medium text-primary">
        @{match[1]}
      </span>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(
      <Fragment key={`${baseKey}-t-${i++}`}>{text.slice(lastIndex)}</Fragment>,
    );
  }

  return parts.length > 0 ? <>{parts}</> : <>{text}</>;
}

function renderLeaf(node: RichTextNode, key: string) {
  let content: React.ReactNode = renderTextWithLegacyMentions(
    node.text ?? "",
    key,
  );

  if (node.bold) content = <strong>{content}</strong>;
  if (node.italic) content = <em>{content}</em>;
  if (node.underline) content = <u>{content}</u>;
  if (node.strikethrough) content = <s>{content}</s>;

  return <Fragment key={key}>{content}</Fragment>;
}

function renderChildren(children?: RichTextNode[]) {
  if (!children?.length) return null;

  return children.map((child, index) => {
    const key = `${child.type ?? "leaf"}-${index}`;

    if (typeof child.text === "string") {
      return renderLeaf(child, key);
    }

    if (child.type === "a") {
      return (
        <Link
          key={key}
          href={child.url ?? "#"}
          target="_blank"
          className="underline underline-offset-4">
          {renderChildren(child.children)}
        </Link>
      );
    }

    if (child.type === "mention") {
      // Neue Mentions: Display-Name in `value`, User-ID in `userId`
      const label = child.value ?? child.children?.[0]?.text ?? "mention";
      return (
        <span
          key={key}
          data-user-id={child.userId}
          className="rounded bg-primary/10 px-1.5 py-0.5 text-sm font-medium text-primary">
          @{label}
        </span>
      );
    }

    if (child.type === "case_reference") {
      const label = child.value ?? "";
      const caseId = (child as any).caseId as string | undefined;

      const inner = (
        <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          <FolderOpen className="size-3.5" />
          {label}
        </span>
      );

      if (caseId) {
        return (
          <Link key={key} href={`/cases/${caseId}`}>
            {inner}
          </Link>
        );
      }
      return <Fragment key={key}>{inner}</Fragment>;
    }

    return <Fragment key={key}>{renderChildren(child.children)}</Fragment>;
  });
}

export default function RichTextRenderer({ value }: { value: unknown }) {
  if (!Array.isArray(value) || value.length === 0) {
    return <p className="text-muted-foreground">Kein Inhalt.</p>;
  }

  return (
    <div className="space-y-2">
      {value.map((node: RichTextNode, index: number) => {
        const key = `${node.type ?? "node"}-${index}`;

        switch (node.type) {
          case "h1":
            return (
              <h1 key={key} className="text-2xl font-semibold">
                {renderChildren(node.children)}
              </h1>
            );
          case "h2":
            return (
              <h2 key={key} className="text-xl font-semibold">
                {renderChildren(node.children)}
              </h2>
            );
          case "ul":
            return (
              <ul key={key} className="list-disc space-y-1 pl-5">
                {(node.children ?? []).map((li, liIndex) => (
                  <li key={`${key}-li-${liIndex}`}>
                    {renderChildren(li.children)}
                  </li>
                ))}
              </ul>
            );
          case "p":
          default:
            return (
              <p key={key} className="leading-7 text-foreground">
                {renderChildren(node.children)}
              </p>
            );
        }
      })}
    </div>
  );
}
