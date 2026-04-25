"use client";

import * as React from "react";

type ProtocolEditorContextValue = {
  organizationId: string;
};

const ProtocolEditorContext = React.createContext<ProtocolEditorContextValue>({
  organizationId: "",
});

export function ProtocolEditorProvider({
  organizationId,
  children,
}: {
  organizationId: string;
  children: React.ReactNode;
}) {
  const value = React.useMemo(() => ({ organizationId }), [organizationId]);

  return (
    <ProtocolEditorContext.Provider value={value}>
      {children}
    </ProtocolEditorContext.Provider>
  );
}

export function useProtocolEditorContext() {
  return React.useContext(ProtocolEditorContext);
}
