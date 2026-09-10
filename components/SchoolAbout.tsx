"use client";

import { useEffect, useRef, useState } from "react";

/** Hidden entirely when there's no description. Shows "Czytaj więcej" only if the 4-line clamp is actually cutting text off. */
export function SchoolAbout({ description }: { description?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    setIsClamped(el.scrollHeight > el.clientHeight + 1);
  }, [description]);

  if (!description) return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-heading text-lg font-semibold text-foreground">O szkole</h2>
      <p ref={textRef} className={`whitespace-pre-line text-sm text-muted ${expanded ? "" : "line-clamp-4"}`}>
        {description}
      </p>
      {(isClamped || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 w-fit text-sm font-semibold text-accent hover:text-accent-peach"
        >
          {expanded ? "Pokaż mniej" : "Czytaj więcej"}
        </button>
      )}
    </section>
  );
}
