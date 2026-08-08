"use client";

import { useEffect, useId, useState } from "react";

// Fest codierter "boring-avatars" Look für "Mediznetz Medizgroup" (Form/Farben
// bewusst nicht verändert), mit animierten Augen (Blinzeln) und Mund (Lächeln).
export default function InstitutLogo({ size = 80 }: { size?: number }) {
  const maskId = useId();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setAnimate(!query.matches);

    const onChange = () => setAnimate(!query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      role="img"
      aria-label="Logo"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}>
      <mask
        id={maskId}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="36"
        height="36">
        <rect width="36" height="36" rx="72" fill="#FFFFFF" />
      </mask>
      <g mask={`url(#${maskId})`}>
        <rect width="36" height="36" fill="#edecb3" />
        <rect
          x="0"
          y="0"
          width="36"
          height="36"
          transform="translate(4 4) rotate(160 18 18) scale(1.1)"
          fill="#86efac"
          rx="36"
        />
        <g transform="translate(0 -4) rotate(0 18 18)">
          <path
            d="M15 20c2 1 4 1 6 0"
            stroke="#000000"
            fill="none"
            strokeLinecap="round">
            {animate && (
              <animate
                attributeName="d"
                dur="6s"
                repeatCount="indefinite"
                calcMode="spline"
                keyTimes="0; 0.5; 1"
                keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
                values="M15 20c2 1 4 1 6 0; M14 19.5c1.5 2.5 5.5 2.5 8 0; M15 20c2 1 4 1 6 0"
              />
            )}
          </path>
          <rect
            x="14"
            y="14"
            width="1.5"
            height="2"
            rx="1"
            stroke="none"
            fill="#000000"
            className="animate-logo-eye-blink origin-center transform-fill motion-reduce:animate-none"
          />
          <rect
            x="20"
            y="14"
            width="1.5"
            height="2"
            rx="1"
            stroke="none"
            fill="#000000"
            className="animate-logo-eye-blink origin-center transform-fill motion-reduce:animate-none"
          />
        </g>
      </g>
    </svg>
  );
}
