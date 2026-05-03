"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type Org = { id: string; name: string };

export default function DashboardFilters({
  orgs,
  currentOrgId,
  currentRange,
  customFrom,
  customTo,
}: {
  orgs: Org[];
  currentOrgId: string;
  currentRange: string;
  customFrom: string;
  customTo: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params?.toString() ?? "");
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    router.push(`${pathname}?${next.toString()}`);
  }

  const showCustom = currentRange === "custom";

  return (
    <div className="flex flex-wrap items-center gap-2  p-3">
      <Select
        items={[
          { value: "all", label: "Alle Organisationen" },
          ...orgs.map((o) => ({ value: o.id, label: o.name })),
        ]}
        value={currentOrgId}
        onValueChange={(v) => update({ org: v ?? "all" })}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Alle Organisationen" />
        </SelectTrigger>
        <SelectPopup alignItemWithTrigger={false}>
          <SelectItem value="all">Alle Organisationen</SelectItem>
          {orgs.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>

      <Select
        items={[
          { value: "year", label: "Aktuelles Jahr" },
          { value: "12m", label: "Letzte 12 Monate" },
          { value: "lifetime", label: "Gesamt" },
          { value: "custom", label: "Eigener Zeitraum" },
        ]}
        value={currentRange}
        onValueChange={(v) => update({ range: v ?? "year" })}>
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectPopup alignItemWithTrigger={false}>
          <SelectItem value="year">Aktuelles Jahr</SelectItem>
          <SelectItem value="12m">Letzte 12 Monate</SelectItem>
          <SelectItem value="lifetime">Gesamt</SelectItem>
          <SelectItem value="custom">Eigener Zeitraum</SelectItem>
        </SelectPopup>
      </Select>

      {showCustom ? (
        <>
          <Input
            type="date"
            value={customFrom}
            onChange={(e) => update({ from: e.target.value })}
            className="w-[160px]"
          />
          <Input
            type="date"
            value={customTo}
            onChange={(e) => update({ to: e.target.value })}
            className="w-[160px]"
          />
        </>
      ) : null}
    </div>
  );
}
