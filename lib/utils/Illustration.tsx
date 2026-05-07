function SearchCardsIllustration() {
  return (
    <div className="relative h-32 w-56" aria-hidden="true">
      {/* Bottom card */}
      <div className="bg-muted/50 dark:bg-muted/25 border-border/40 absolute right-6 bottom-4 left-6 flex h-12 items-center gap-2.5 rounded-lg border px-3">
        <div className="bg-muted-foreground/10 size-5 shrink-0 rounded" />
        <div className="flex flex-1 flex-col gap-1">
          <div className="bg-muted-foreground/10 h-2 w-full rounded" />
          <div className="bg-muted-foreground/8 h-2 w-2/3 rounded" />
        </div>
      </div>
      {/* Middle card */}
      <div className="bg-muted/70 dark:bg-muted/40 border-border/50 absolute right-3 bottom-8 left-3 flex h-12 items-center gap-2.5 rounded-lg border px-3">
        <div className="bg-muted-foreground/12 size-5 shrink-0 rounded" />
        <div className="flex flex-1 flex-col gap-1">
          <div className="bg-muted-foreground/12 h-2 w-full rounded" />
          <div className="bg-muted-foreground/10 h-2 w-3/4 rounded" />
        </div>
      </div>
      {/* Front card */}
      <div className="bg-background border-border absolute inset-x-0 bottom-12 flex h-14 items-center gap-3 rounded-lg border px-3.5 shadow-sm">
        <div className="bg-muted size-7 shrink-0 rounded" />
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="bg-muted h-2.5 w-full rounded" />
          <div className="bg-muted/70 h-2 w-3/5 rounded" />
        </div>
      </div>
      {/* Fade */}
      <div className="from-background/0 to-background pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-b" />
    </div>
  );
}

function NodesIllustration() {
  return (
    <svg
      width="200"
      height="120"
      viewBox="0 0 200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true">
      {/* Connection lines */}
      <line
        x1="100"
        y1="60"
        x2="44"
        y2="30"
        className="stroke-border"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <line
        x1="100"
        y1="60"
        x2="44"
        y2="90"
        className="stroke-border"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <line
        x1="100"
        y1="60"
        x2="156"
        y2="30"
        className="stroke-border"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <line
        x1="100"
        y1="60"
        x2="156"
        y2="90"
        className="stroke-border"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      {/* Center node */}
      <circle
        cx="100"
        cy="60"
        r="18"
        className="fill-primary/10 dark:fill-primary/15 stroke-primary/40"
        strokeWidth="1.5"
      />
      <circle cx="100" cy="60" r="6" className="fill-primary/30" />
      <circle cx="100" cy="60" r="2.5" className="fill-primary" />
      {/* Top-left node */}
      <circle
        cx="44"
        cy="30"
        r="14"
        className="fill-muted dark:fill-muted/60 stroke-border"
        strokeWidth="1.5"
      />
      <rect
        x="37"
        y="26"
        width="14"
        height="3"
        rx="1.5"
        className="fill-muted-foreground/20"
      />
      <rect
        x="40"
        y="32"
        width="8"
        height="2"
        rx="1"
        className="fill-muted-foreground/12"
      />
      {/* Bottom-left node */}
      <circle
        cx="44"
        cy="90"
        r="14"
        className="fill-muted dark:fill-muted/60 stroke-border"
        strokeWidth="1.5"
      />
      <rect
        x="37"
        y="86"
        width="14"
        height="3"
        rx="1.5"
        className="fill-muted-foreground/20"
      />
      <rect
        x="40"
        y="92"
        width="8"
        height="2"
        rx="1"
        className="fill-muted-foreground/12"
      />
      {/* Top-right node */}
      <circle
        cx="156"
        cy="30"
        r="14"
        className="fill-muted dark:fill-muted/60 stroke-border"
        strokeWidth="1.5"
      />
      <rect
        x="149"
        y="26"
        width="14"
        height="3"
        rx="1.5"
        className="fill-muted-foreground/20"
      />
      <rect
        x="152"
        y="32"
        width="8"
        height="2"
        rx="1"
        className="fill-muted-foreground/12"
      />
      {/* Bottom-right node */}
      <circle
        cx="156"
        cy="90"
        r="14"
        className="fill-muted dark:fill-muted/60 stroke-border"
        strokeWidth="1.5"
      />
      <rect
        x="149"
        y="86"
        width="14"
        height="3"
        rx="1.5"
        className="fill-muted-foreground/20"
      />
      <rect
        x="152"
        y="92"
        width="8"
        height="2"
        rx="1"
        className="fill-muted-foreground/12"
      />
      {/* Small floating dots */}
      <circle cx="72" cy="40" r="2" className="fill-primary/15" />
      <circle cx="128" cy="80" r="2" className="fill-primary/15" />
      <circle cx="72" cy="80" r="1.5" className="fill-muted-foreground/10" />
      <circle cx="128" cy="40" r="1.5" className="fill-muted-foreground/10" />
    </svg>
  );
}

export { SearchCardsIllustration, NodesIllustration };
