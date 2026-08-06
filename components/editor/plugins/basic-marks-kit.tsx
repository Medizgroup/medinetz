'use client';

import {
  BoldRules,
  CodeRules,
  ItalicRules,
  StrikethroughRules,
} from '@platejs/basic-nodes';
import {
  BoldPlugin,
  CodePlugin,
  HighlightPlugin,
  ItalicPlugin,
  KbdPlugin,
  StrikethroughPlugin,
  SubscriptPlugin,
  SuperscriptPlugin,
  UnderlinePlugin,
} from '@platejs/basic-nodes/react';

import { CodeLeaf } from '@/components/ui/code-node';
import { HighlightLeaf } from '@/components/ui/highlight-node';
import { KbdLeaf } from '@/components/ui/kbd-node';

// Markdown-Eingabe-Regeln (**fett**, *kursiv*, `code`, ~~durchgestrichen~~)
// laufen beim Tippen automatisch mit, zusätzlich zu den Tastenkürzeln.
export const BasicMarksKit = [
  BoldPlugin.configure({
    inputRules: [BoldRules.markdown()],
  }),
  ItalicPlugin.configure({
    inputRules: [ItalicRules.markdown()],
  }),
  UnderlinePlugin,
  CodePlugin.configure({
    node: { component: CodeLeaf },
    shortcuts: { toggle: { keys: 'mod+e' } },
    inputRules: [CodeRules.markdown()],
  }),
  StrikethroughPlugin.configure({
    shortcuts: { toggle: { keys: 'mod+shift+x' } },
    inputRules: [StrikethroughRules.markdown()],
  }),
  SubscriptPlugin.configure({
    shortcuts: { toggle: { keys: 'mod+comma' } },
  }),
  SuperscriptPlugin.configure({
    shortcuts: { toggle: { keys: 'mod+period' } },
  }),
  HighlightPlugin.configure({
    node: { component: HighlightLeaf },
    shortcuts: { toggle: { keys: 'mod+shift+h' } },
  }),
  KbdPlugin.withComponent(KbdLeaf),
];
