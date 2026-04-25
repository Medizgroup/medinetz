"use client";

import * as React from "react";

import type { TComboboxInputElement, TMentionElement } from "platejs";
import type { PlateElementProps } from "platejs/react";
import { getMentionOnSelectItem } from "@platejs/mention";

import { IS_APPLE, KEYS } from "platejs";
import {
  PlateElement,
  useFocused,
  useReadOnly,
  useSelected,
} from "platejs/react";

import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/use-mounted";
import { useDebounce } from "@/hooks/use-debounce";
import { useProtocolEditorContext } from "@/components/protocols/protocol-editor-context";

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxInput,
  InlineComboboxItem,
} from "./inline-combobox";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { getInitials } from "@/lib/helper/user";
import Link from "next/link";

type MentionUser = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  email: string;
};

export function MentionElement(
  props: PlateElementProps<TMentionElement> & { prefix?: string },
) {
  const element = props.element;
  const selected = useSelected();
  const focused = useFocused();
  const mounted = useMounted();
  const readOnly = useReadOnly();

  return (
    <PlateElement
      {...props}
      className={cn(
        "inline-block rounded-md bg-primary/10 px-1.5 py-0.5 align-baseline font-medium text-primary text-sm",
        !readOnly && "cursor-pointer",
        selected && focused && "ring-2 ring-ring",
        element.children[0][KEYS.bold] === true && "font-bold",
        element.children[0][KEYS.italic] === true && "italic",
        element.children[0][KEYS.underline] === true && "underline",
      )}
      attributes={{
        ...props.attributes,
        contentEditable: false,
        "data-slate-value": element.value,
        "data-user-id": (element as unknown as { userId?: string }).userId,
        draggable: true,
      }}>
      {mounted && IS_APPLE ? (
        <Link href={`/m/${(element as unknown as { userId?: string }).userId}`}>
          {props.children}
          {props.prefix}@{element.value}
        </Link>
      ) : (
        <Link href={`/m/${(element as unknown as { userId?: string }).userId}`}>
          {props.prefix}@{element.value}
          {props.children}
        </Link>
      )}
    </PlateElement>
  );
}

const onSelectMentionItem = getMentionOnSelectItem();

export function MentionInputElement(
  props: PlateElementProps<TComboboxInputElement>,
) {
  const { editor, element } = props;
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 200);
  const [users, setUsers] = React.useState<MentionUser[]>([]);
  const [loading, setLoading] = React.useState(false);

  const { organizationId } = useProtocolEditorContext();

  // Direkt beim Öffnen schon Top-Mitglieder zeigen
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams();
    params.set("q", debouncedSearch);
    if (organizationId) params.set("organizationId", organizationId);

    fetch(`/api/users/search?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: MentionUser[]) => {
        if (!cancelled) setUsers(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, organizationId]);

  const insertMention = React.useCallback(
    (user: MentionUser) => {
      // 1) Plates Standard-Handler: entfernt den @-Input, fügt einen
      //    Mention-Node + Leerzeichen ein, setzt den Cursor korrekt.
      onSelectMentionItem(
        editor,
        { key: user.id, text: user.displayName },
        search,
      );

      // 2) Den gerade eingefügten Mention-Node finden und mit userId anreichern.
      //    Wir matchen auf "Mention mit diesem displayName, aber noch ohne userId".
      const matches = [
        ...editor.api.nodes<any>({
          at: [],
          match: (n: any) =>
            n.type === "mention" && n.value === user.displayName && !n.userId,
        }),
      ];

      if (matches.length > 0) {
        const [, path] = matches[matches.length - 1];
        editor.tf.setNodes({ userId: user.id } as any, { at: path });
      }
    },
    [editor, search],
  );

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox
        value={search}
        element={element}
        setValue={setSearch}
        showTrigger={false}
        trigger="@"
        filter={false}>
        <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline text-sm ring-ring focus-within:ring-2">
          <InlineComboboxInput />
        </span>

        <InlineComboboxContent className="my-1.5">
          <InlineComboboxEmpty>
            {loading ? "Loading..." : "Keine Mitglieder gefunden"}
          </InlineComboboxEmpty>

          <InlineComboboxGroup className="space-y-2">
            {users.map((user) => (
              <InlineComboboxItem
                key={user.id}
                value={user.displayName}
                onClick={() => insertMention(user)}>
                <div className="flex items-center gap-2 ">
                  <Avatar className="size-6">
                    <AvatarImage src={user.avatarUrl ?? ""} />
                    <AvatarFallback>
                      {" "}
                      {getInitials(user.displayName ?? user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.displayName}</span>
                  {/* <span className="text-xs text-muted-foreground">
                    {user.email}
                  </span> */}
                </div>
              </InlineComboboxItem>
            ))}
          </InlineComboboxGroup>
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}
