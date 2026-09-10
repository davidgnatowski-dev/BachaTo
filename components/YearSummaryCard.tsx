"use client";

import { useState } from "react";

interface YearSummaryProps {
  year: number;
  classes: number;
  hours: number;
  events: number;
  practice: number;
  school?: string;
  instructor?: string;
  style?: string;
}

function createStoryImage({ year, classes, hours, events, practice, school, instructor, style }: YearSummaryProps) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext("2d");
  if (!context) return Promise.resolve<Blob | null>(null);

  const gradient = context.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, "#17102e");
  gradient.addColorStop(0.5, "#0b0e16");
  gradient.addColorStop(1, "#30140b");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1080, 1920);

  context.globalAlpha = 0.22;
  context.fillStyle = "#8b5cf6";
  context.beginPath(); context.arc(930, 210, 310, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#ff6517";
  context.beginPath(); context.arc(110, 1710, 330, 0, Math.PI * 2); context.fill();
  context.globalAlpha = 1;

  context.fillStyle = "#ff7a37";
  context.font = "700 34px Arial, sans-serif";
  context.letterSpacing = "4px";
  context.fillText(`BACHATO WRAPPED ${year}`, 86, 170);
  context.letterSpacing = "0px";
  context.fillStyle = "#ffffff";
  context.font = "700 88px Arial, sans-serif";
  context.fillText("Mój rok", 86, 310);
  context.fillText("w tańcu", 86, 410);
  context.fillStyle = "#b9b5c7";
  context.font = "400 34px Arial, sans-serif";
  context.fillText("Ruch, muzyka i ludzie — zapisane w jednym miejscu.", 86, 485);

  const stats = [
    { value: String(classes), label: "ZAJĘĆ" },
    { value: `${hours} h`, label: "TAŃCA" },
    { value: String(events), label: "WYDARZEŃ" },
    { value: String(practice), label: "PRAKTYK TANECZNYCH" },
  ];
  stats.forEach((stat, index) => {
    const x = index % 2 === 0 ? 86 : 555;
    const y = index < 2 ? 610 : 900;
    context.fillStyle = "rgba(255,255,255,0.07)";
    context.beginPath(); context.roundRect(x, y, 405, 230, 30); context.fill();
    context.fillStyle = index % 2 === 0 ? "#ff7a37" : "#a78bfa";
    context.font = "700 74px Arial, sans-serif";
    context.fillText(stat.value, x + 36, y + 105);
    context.fillStyle = "#cac7d3";
    context.font = "700 22px Arial, sans-serif";
    context.fillText(stat.label, x + 36, y + 165);
  });

  const favorites = [
    school ? `Najczęściej: ${school}` : null,
    instructor ? `Instruktor: ${instructor}` : style ? `Styl: ${style}` : null,
  ].filter(Boolean) as string[];
  context.fillStyle = "#ffffff";
  context.font = "700 34px Arial, sans-serif";
  context.fillText("Moje taneczne podpisy", 86, 1280);
  context.font = "400 32px Arial, sans-serif";
  context.fillStyle = "#d5d2dc";
  favorites.forEach((value, index) => context.fillText(value, 86, 1355 + index * 65));

  context.fillStyle = "#ffffff";
  context.font = "700 44px Arial, sans-serif";
  context.fillText("BachaTo", 86, 1760);
  context.fillStyle = "#a4a0ad";
  context.font = "400 26px Arial, sans-serif";
  context.fillText("Moja historia tańca w Warszawie", 86, 1810);

  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
}

export function YearSummaryCard(props: YearSummaryProps) {
  const { year, classes, hours, events, practice, school, instructor, style } = props;
  const [status, setStatus] = useState<"idle" | "working" | "done">("idle");

  async function share() {
    setStatus("working");
    try {
      const blob = await createStoryImage(props);
      if (!blob) return;
      const file = new File([blob], `bachato-wrapped-${year}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `Moje BachaTo ${year}`, text: "Mój rok w tańcu 💃", files: [file] });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(url);
      }
      setStatus("done");
      window.setTimeout(() => setStatus("idle"), 2200);
    } catch {
      setStatus("idle");
    }
  }

  const items = [
    { value: classes, label: "zajęć" },
    { value: `${hours} h`, label: "tańca" },
    { value: events, label: "wydarzeń" },
    { value: practice, label: "praktyk tanecznych" },
    { value: school || "—", label: "najczęstsza szkoła" },
    { value: instructor || style || "—", label: instructor ? "najczęstszy instruktor" : "ulubiony styl" },
  ];

  return <section className="relative overflow-hidden rounded-2xl border border-violet/30 bg-gradient-to-br from-violet/20 via-zinc-900/80 to-accent/10 p-5 sm:p-6">
    <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-violet/15 blur-2xl" />
    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet">BachaTo Wrapped {year}</p><h2 className="mt-1 font-heading text-2xl font-semibold text-zinc-50">Twój rok w tańcu</h2><p className="mt-2 text-sm text-zinc-300">{classes + events > 0 ? "Podsumowanie rośnie po każdym potwierdzonym treningu i wydarzeniu." : "Potwierdź pierwszą aktywność, a zaczniemy budować Twoją historię."}</p></div>
      <button type="button" onClick={share} disabled={status === "working"} className="shrink-0 rounded-full border border-violet/50 bg-violet/10 px-4 py-2 text-xs font-semibold text-violet hover:bg-violet/20 disabled:opacity-60">{status === "working" ? "Tworzę grafikę…" : status === "done" ? "Grafika gotowa ✓" : "Udostępnij jako relację"}</button>
    </div>
    <div className="relative mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => <div key={item.label} className="rounded-xl border border-white/5 bg-black/20 p-3"><p className="truncate font-heading text-lg font-semibold text-zinc-50">{item.value}</p><p className="mt-1 text-[10px] text-zinc-400">{item.label}</p></div>)}
    </div>
  </section>;
}
