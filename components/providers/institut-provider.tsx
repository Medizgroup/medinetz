"use client";

import * as React from "react";
import type { InstitutConfig } from "@/lib/config";

const InstitutContext = React.createContext<InstitutConfig>({
  name: "Medinetz",
  subtitle: "",
});

export function InstitutProvider({
  value,
  children,
}: {
  value: InstitutConfig;
  children: React.ReactNode;
}) {
  return (
    <InstitutContext.Provider value={value}>{children}</InstitutContext.Provider>
  );
}

export function useInstitut() {
  return React.useContext(InstitutContext);
}
