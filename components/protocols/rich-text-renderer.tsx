/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
        <Link
          href={`/m/${child.userId}`}
          key={key}
          data-user-id={child.userId}
          className="rounded-md bg-primary/10 px-1.5 py-0.5 text-sm font-medium text-foreground">
          @{label}
        </Link>
      );
    }

    if (child.type === "case_reference") {
      const label = child.value ?? "";
      const caseId = (child as any).caseId as string | undefined;

      const inner = (
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-1.5 py-0.5 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
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

    // Tabelle
    if (child.type === "table") {
      return (
        <table
          key={key}
          className="my-4 w-full border-collapse rounded-md border bg-background">
          <tbody>{renderChildren(child.children)}</tbody>
        </table>
      );
    }
    if (child.type === "tr") {
      return (
        <tr key={key} className="border-b border-border last:border-b-0">
          {renderChildren(child.children)}
        </tr>
      );
    }
    if (child.type === "td") {
      return (
        <td
          key={key}
          className="min-w-[120px] border-r border-border px-3 py-2 align-top text-sm last:border-r-0">
          {renderChildren(child.children)}
        </td>
      );
    }
    if (child.type === "th") {
      return (
        <th
          key={key}
          className="min-w-[120px] border-r border-border bg-muted/40 px-3 py-2 text-left align-top text-sm font-semibold last:border-r-0">
          {renderChildren(child.children)}
        </th>
      );
    }

    // Image
    if (child.type === "img") {
      const url = (child as any).url as string | undefined;
      const caption = (child as any).caption as string | undefined;
      if (!url) return null;
      return (
        <figure key={key} className="my-4">
          <img
            src={url}
            alt={caption || "Bild"}
            className="block max-h-[600px] w-full rounded-lg object-contain bg-muted/30"
          />
          {caption ? (
            <figcaption className="mt-1 text-center text-xs text-muted-foreground">
              {caption}
            </figcaption>
          ) : null}
        </figure>
      );
    }

    // Trennlinie
    if (child.type === "hr") {
      return <hr key={key} className="my-6 border-border" />;
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
