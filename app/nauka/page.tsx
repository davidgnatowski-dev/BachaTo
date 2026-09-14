import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";
import { YouTubeLessonCard } from "@/components/YouTubeLessonCard";

const instructor = "Dawid Gnatowski";

const videos = [
  { id: "7REoWwnxgf8", title: "Open - Close" },
  { id: "lelN08xBSjg", title: "czaczacza" },
  { id: "Bd5t1DAq1cc", title: "diagonal" },
  { id: "1H2CPNBdOmM", title: "podbitka" },
  { id: "bJLkEJegWiM", title: "pięta palce" },
  { id: "w11CA7PlmDM", title: "Falki przód tył" },
  { id: "C2iAMOlqZq8", title: "fale z przemieszaniem Trim" },
  { id: "5hLzoXRYwI4", title: "fale góra dół" },
  { id: "zNsP1YVkS2w", title: "fale bokiem" },
  { id: "q7lnZ0SGUXQ", title: "falki bokiem z odbiciem" },
  { id: "VqyFh94s44U", title: "180" },
  { id: "aQXmCeor6yo", title: "Slide" },
  { id: "CGbY4IjNu2o", title: "Krok podstawowy" },
  { id: "nCqtW-sy5xY", title: "Podstawowe obroty, w lewo i w prawo" },
  { id: "y2HVqtdg0gA", title: "Obroty przez plecy1" },
  { id: "CAFjwNO5arE", title: "lateral1" },
  { id: "JpAyenRZdSQ", title: "Box step" },
] as const;

export const metadata: Metadata = {
  title: "Nauka bachaty — BachaTo",
  description: "Filmy i materiały do samodzielnej nauki bachaty.",
};

export const dynamic = "force-dynamic";

export default async function LearningPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logowanie");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
      <Header />
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet">Ucz się krok po kroku</p>
        <h1 className="mt-1 font-heading text-2xl font-semibold text-zinc-50">Nauka</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Krótkie materiały wideo, do których możesz wrócić po zajęciach i ćwiczyć we własnym tempie.
        </p>
      </header>
      <section className="rounded-2xl border border-line bg-zinc-900/35 p-4 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet">Biblioteka wideo</p>
          <h2 className="mt-1 font-heading text-xl font-semibold text-zinc-50">Twoje lekcje</h2>
          <p className="mt-1 text-sm text-muted">Kliknij miniaturę, aby rozpocząć oglądanie bez opuszczania BachaTo.</p>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {videos.map((video, index) => (
            <YouTubeLessonCard key={video.id} videoId={video.id} title={video.title} lessonNumber={index + 1} instructor={instructor} />
          ))}
        </div>
      </section>
    </div>
  );
}
