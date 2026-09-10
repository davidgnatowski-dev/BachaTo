/** Hidden entirely when there are no known styles — never renders an empty section. */
export function DanceStyleChips({ styles }: { styles: string[] }) {
  if (styles.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold text-foreground">Style taneczne</h2>
      <div className="flex flex-wrap gap-2">
        {styles.map((style) => (
          <span key={style} className="rounded-full border border-line bg-zinc-900/60 px-3 py-1.5 text-sm font-medium text-foreground">
            {style}
          </span>
        ))}
      </div>
    </section>
  );
}
