// lib/icons.tsx
import type { ComponentType, SVGProps } from "react";
import {
  Home as SolarHome,
  Calendar as SolarCalendar,
  FolderOpen as SolarFolderOpen,
  DocumentAdd as SolarDocumentAdd,
  Bell as SolarBell,
  History3 as SolarHistory,
  ChecklistMinimalistic as SolarChecklistMinimalistic,
  Documents as SolarDocuments,
  LayersMinimalistic as SolarLayersMinimalistic,
  QuestionCircle as SolarQuestionCircle,
  Plain3 as SolarPlain3,
} from "@solar-icons/react-perf/LineDuotone";

type SolarIconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  color?: string;
  mirrored?: boolean;
};

function adapt(Component: ComponentType<SolarIconProps>) {
  const Adapted = (props: SolarIconProps) => (
    <Component color="currentColor" {...props} />
  );
  Adapted.displayName = Component.displayName || Component.name;
  return Adapted;
}

export const Home = adapt(SolarHome);
export const Calendar = adapt(SolarCalendar);
export const FolderOpen = adapt(SolarFolderOpen);
export const DocumentAdd = adapt(SolarDocumentAdd);
export const Bell = adapt(SolarBell);
export const History = adapt(SolarHistory);
export const Checklist = adapt(SolarChecklistMinimalistic);
export const Documents = adapt(SolarDocuments);
export const Layers = adapt(SolarLayersMinimalistic);
export const QuestionMark = adapt(SolarQuestionCircle);
export const Plain = adapt(SolarPlain3);
