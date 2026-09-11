"use client";

import Link from "next/link";
import { PersonIcon } from "@/components/icons";

const FACE_POSITION_BY_INSTRUCTOR: Record<string, string> = {
  "Anyelo Marty": "68% 25%",
  "Bartek Grunt": "28% 18%",
  "Dawid Gnatowski": "50% 18%",
  "Grzegorz Winiarek": "64% 14%",
  "Julia Martowicz": "50% 20%",
  "Karolina Winiarek": "34% 14%",
  "Maja Modliszewska": "50% 20%",
  "Paweł Tomkiewicz": "69% 18%",
};

export function InstructorAvatar({
  name,
  photoUrl,
  sizeClassName = "h-8 w-8",
  linked = true,
  className = "",
}: {
  name: string;
  photoUrl?: string;
  sizeClassName?: string;
  linked?: boolean;
  className?: string;
}) {
  const image = (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-600/70 bg-zinc-800 text-muted ${sizeClassName} ${className}`}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- external instructor photos come from school sources
        <img
          src={photoUrl}
          alt=""
          className="h-full w-full object-cover"
          style={{ objectPosition: FACE_POSITION_BY_INSTRUCTOR[name] ?? "50% 24%" }}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <PersonIcon className="h-1/2 w-1/2" />
      )}
    </span>
  );

  if (!linked) return image;

  return (
    <Link
      href={`/instruktorzy/${encodeURIComponent(name)}`}
      onClick={(event) => event.stopPropagation()}
      aria-label={`Zobacz profil instruktora: ${name}`}
      title={name}
      className="relative inline-flex rounded-full outline-none transition-transform hover:z-10 hover:scale-105 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
    >
      {image}
    </Link>
  );
}

export function InstructorAvatarGroup({
  names,
  photos,
  sizeClassName = "h-8 w-8",
  className = "",
}: {
  names: string[];
  photos?: Record<string, string>;
  sizeClassName?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex -space-x-2 ${className}`} aria-label={`Instruktorzy: ${names.join(", ")}`}>
      {names.map((name) => (
        <InstructorAvatar
          key={name}
          name={name}
          photoUrl={photos?.[name]}
          sizeClassName={sizeClassName}
          className="ring-2 ring-zinc-950"
        />
      ))}
    </span>
  );
}
