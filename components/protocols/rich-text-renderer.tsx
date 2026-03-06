import Link from "next/link";
import { Fragment } from "react";

type RichTextNode = {
  type?: string;
  text?: string;
  url?: string;
  children?: RichTextNode[];
  bold?: boolean;
  italic?: boolean;
};

function renderLeaf(node: RichTextNode, key: string) {
  let content = <>{node.text ?? ""}</>;

  if (node.bold) content = <strong>{content}</strong>;
  if (node.italic) content = <em>{content}</em>;

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
      return (
        <span
          key={key}
          className="rounded bg-muted px-1.5 py-0.5 text-sm font-medium">
          @{child.children?.[0]?.text ?? "mention"}
        </span>
      );
    }

    return <Fragment key={key}>{renderChildren(child.children)}</Fragment>;
  });
}

export default function RichTextRenderer({ value }: { value: unknown }) {
  if (!Array.isArray(value) || value.length === 0) {
    return <p className="text-muted-foreground">Kein Inhalt.</p>;
  }

  return (
    <div className="space-y-4">
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
