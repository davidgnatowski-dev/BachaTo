import { PinIcon, ExternalLinkIcon, PhoneIcon, MailIcon, InstagramIcon, FacebookIcon, TikTokIcon } from "@/components/icons";

const SOCIAL_BUTTON_CLASS =
  "flex h-9 w-9 items-center justify-center rounded-full border border-line text-foreground hover:border-zinc-500";

const ROW_CLASS = "flex items-center gap-3 text-sm text-foreground";
const ICON_WRAP_CLASS = "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800/60 text-muted";

/** Every field is individually optional and hidden when absent; the whole section is hidden only if nothing at all is known. */
export function SchoolContact({
  address,
  website,
  phone,
  email,
  instagram,
  facebook,
  tiktok,
}: {
  address?: string;
  website?: string;
  phone?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
}) {
  const hasSocials = Boolean(instagram || facebook || tiktok);
  if (!address && !website && !phone && !email && !hasSocials) return null;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-line bg-zinc-900/60 p-5">
      <h2 className="font-heading text-lg font-semibold text-foreground">Informacje</h2>

      <div className="flex flex-col gap-3.5">
        {address && (
          <div className={ROW_CLASS}>
            <span className={ICON_WRAP_CLASS}>
              <PinIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p>{address}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-accent hover:text-accent-peach"
              >
                Pokaż na mapie
              </a>
            </div>
          </div>
        )}

        {website && (
          <a href={website} target="_blank" rel="noopener noreferrer" className={`${ROW_CLASS} hover:text-accent`}>
            <span className={ICON_WRAP_CLASS}>
              <ExternalLinkIcon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 truncate">{website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
          </a>
        )}

        {phone && (
          <a href={`tel:${phone}`} className={`${ROW_CLASS} hover:text-accent`}>
            <span className={ICON_WRAP_CLASS}>
              <PhoneIcon className="h-4 w-4" />
            </span>
            <span>{phone}</span>
          </a>
        )}

        {email && (
          <a href={`mailto:${email}`} className={`${ROW_CLASS} hover:text-accent`}>
            <span className={ICON_WRAP_CLASS}>
              <MailIcon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 truncate">{email}</span>
          </a>
        )}

        {hasSocials && (
          <div className="flex items-center gap-2 pt-1">
            {instagram && (
              <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={SOCIAL_BUTTON_CLASS}>
                <InstagramIcon className="h-4 w-4" />
              </a>
            )}
            {facebook && (
              <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={SOCIAL_BUTTON_CLASS}>
                <FacebookIcon className="h-4 w-4" />
              </a>
            )}
            {tiktok && (
              <a href={tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className={SOCIAL_BUTTON_CLASS}>
                <TikTokIcon className="h-4 w-4" />
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
