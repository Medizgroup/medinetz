"use client";

import {
  createSlatePlugin,
  createTSlatePlugin,
  type PluginConfig,
} from "platejs";
import { toTPlatePlugin } from "platejs/react";
import {
  type TriggerComboboxPluginOptions,
  withTriggerCombobox,
} from "@platejs/combobox";

import {
  CaseReferenceElement,
  CaseReferenceInputElement,
} from "@/components/ui/case-reference-node";

/**
 * Input-Plugin: der temporäre Node während der User "#…" tippt.
 */
const BaseCaseReferenceInputPlugin = createSlatePlugin({
  key: "case_reference_input",
  editOnly: true,
  node: {
    isElement: true,
    isInline: true,
    isVoid: true,
  },
});

/**
 * Haupt-Plugin: der finale case_reference-Node + Trigger-Logik.
 */
type CaseReferenceConfig = PluginConfig<
  "case_reference",
  TriggerComboboxPluginOptions
>;

const BaseCaseReferencePlugin = createTSlatePlugin<CaseReferenceConfig>({
  key: "case_reference",
  node: { isElement: true, isInline: true, isVoid: true },
  options: {
    trigger: "#",
    triggerPreviousCharPattern: /^$|^[\s"']$/,
    createComboboxInput: () => ({
      children: [{ text: "" }],
      type: "case_reference_input",
    }),
  },
  plugins: [BaseCaseReferenceInputPlugin],
}).overrideEditor(withTriggerCombobox);

// In React-Plugins konvertieren und Components zuweisen
export const CaseReferencePlugin = toTPlatePlugin(
  BaseCaseReferencePlugin,
).withComponent(CaseReferenceElement);

export const CaseReferenceInputPluginInstance = toTPlatePlugin(
  BaseCaseReferenceInputPlugin,
).withComponent(CaseReferenceInputElement);

export const CaseReferenceKit = [
  CaseReferencePlugin,
  CaseReferenceInputPluginInstance,
];
