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
  TodoReferenceElement,
  TodoReferenceInputElement,
} from "@/components/ui/todo-reference-node";

const BaseTodoReferenceInputPlugin = createSlatePlugin({
  key: "todo_reference_input",
  editOnly: true,
  node: {
    isElement: true,
    isInline: true,
    isVoid: true,
  },
});

type TodoReferenceConfig = PluginConfig<
  "todo_reference",
  TriggerComboboxPluginOptions
>;

const BaseTodoReferencePlugin = createTSlatePlugin<TodoReferenceConfig>({
  key: "todo_reference",
  node: { isElement: true, isInline: true, isVoid: true },
  options: {
    trigger: "!",
    triggerPreviousCharPattern: /^$|^[\s"']$/,
    createComboboxInput: () => ({
      children: [{ text: "" }],
      type: "todo_reference_input",
    }),
  },
  plugins: [BaseTodoReferenceInputPlugin],
}).overrideEditor(withTriggerCombobox);

export const TodoReferencePlugin = toTPlatePlugin(
  BaseTodoReferencePlugin,
).withComponent(TodoReferenceElement);

export const TodoReferenceInputPluginInstance = toTPlatePlugin(
  BaseTodoReferenceInputPlugin,
).withComponent(TodoReferenceInputElement);

export const TodoReferenceKit = [
  TodoReferencePlugin,
  TodoReferenceInputPluginInstance,
];
