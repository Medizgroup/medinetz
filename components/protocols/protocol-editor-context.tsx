"use client";

import * as React from "react";

type ProtocolEditorContextValue = {
  organizationId: string;
  /** Darf dieser Nutzer inhaltlich bearbeiten (COORDINATOR/ADMIN)? Steuert den
   * Editing/Viewing-Umschalter in der Toolbar — reine Betrachter:innen sehen
   * immer nur die gesperrte Viewing-Ansicht. */
  canEdit: boolean;
};

const ProtocolEditorContext = React.createContext<ProtocolEditorContextValue>({
  organizationId: "",
  canEdit: true,
});

export function ProtocolEditorProvider({
  organizationId,
  canEdit = true,
  children,
}: {
  organizationId: string;
  canEdit?: boolean;
  children: React.ReactNode;
}) {
  const value = React.useMemo(
    () => ({ organizationId, canEdit }),
    [organizationId, canEdit],
  );

  return (
    <ProtocolEditorContext.Provider value={value}>
      {children}
    </ProtocolEditorContext.Provider>
  );
}

export function useProtocolEditorContext() {
  return React.useContext(ProtocolEditorContext);
}
