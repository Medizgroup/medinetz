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
  EventReferenceElement,
  EventReferenceInputElement,
} from "@/components/ui/event-reference-node";

const BaseEventReferenceInputPlugin = createSlatePlugin({
  key: "event_reference_input",
  editOnly: true,
  node: {
    isElement: true,
    isInline: true,
    isVoid: true,
  },
});

type EventReferenceConfig = PluginConfig<
  "event_reference",
  TriggerComboboxPluginOptions
>;

const BaseEventReferencePlugin = createTSlatePlugin<EventReferenceConfig>({
  key: "event_reference",
  node: { isElement: true, isInline: true, isVoid: true },
  options: {
    trigger: "$",
    triggerPreviousCharPattern: /^$|^[\s"']$/,
    createComboboxInput: () => ({
      children: [{ text: "" }],
      type: "event_reference_input",
    }),
  },
  plugins: [BaseEventReferenceInputPlugin],
}).overrideEditor(withTriggerCombobox);

export const EventReferencePlugin = toTPlatePlugin(
  BaseEventReferencePlugin,
).withComponent(EventReferenceElement);

export const EventReferenceInputPluginInstance = toTPlatePlugin(
  BaseEventReferenceInputPlugin,
).withComponent(EventReferenceInputElement);

export const EventReferenceKit = [
  EventReferencePlugin,
  EventReferenceInputPluginInstance,
];
