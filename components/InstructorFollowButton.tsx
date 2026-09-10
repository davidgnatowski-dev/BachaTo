"use client";

import { useInstructorFollow } from "@/lib/instructorFollows";
import { HeartIcon } from "@/components/icons";

export function InstructorFollowButton({ name }: { name: string }) {
  const { isFollowing, toggle } = useInstructorFollow(name);
  return <button type="button" onClick={toggle} aria-pressed={isFollowing} className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold ${isFollowing ? "border-violet/50 bg-violet/15 text-violet" : "border-line text-zinc-300 hover:border-violet/50"}`}><HeartIcon className="h-3.5 w-3.5" filled={isFollowing} />{isFollowing ? "Obserwujesz" : "Obserwuj instruktora"}</button>;
}
