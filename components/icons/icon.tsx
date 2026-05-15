// components/icon.tsx
import type { ComponentType, SVGProps } from "react";

interface SolarIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  mirrored?: boolean;
}

interface IconProps extends Omit<SolarIconProps, "size"> {
  icon: ComponentType<SolarIconProps>;
  className?: string;
}

export function Icon({ icon: IconComponent, className, ...props }: IconProps) {
  return (
    <IconComponent
      color="currentColor"
      size="100%"
      className={className}
      {...props}
    />
  );
}
