export function EventCoverImage({
  src,
  alt = "",
  loading = "lazy",
  paddingClassName = "p-2",
}: {
  src: string;
  alt?: string;
  loading?: "eager" | "lazy";
  paddingClassName?: string;
}) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- external event artwork from unpredictable hosts */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-2xl"
        loading={loading}
        decoding="async"
      />
      <span className="absolute inset-0 bg-zinc-950/30" aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element -- external event artwork from unpredictable hosts */}
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 z-[1] h-full w-full object-contain ${paddingClassName}`}
        loading={loading}
        decoding="async"
      />
    </>
  );
}
