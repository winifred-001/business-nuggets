import Link from "next/link";
import type { SiteSection } from "@/lib/legal-pages";

function safeUrl(value?: string): string | null {
  if (!value || !/^(?:https:\/\/[^\s]+|\/(?!\/)[^\s]*)$/.test(value)) return null;
  return value;
}

export function SiteSectionExtras({ section }: { section: SiteSection }) {
  const image = safeUrl(section.imageUrl);
  const link = safeUrl(section.buttonHref);
  return (
    <>
      {image && (
        // Intentional: page admins can choose arbitrary validated HTTPS media URLs.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={section.imageAlt || section.title || "Page illustration"}
          loading="lazy" className="mt-5 max-h-[560px] w-full rounded-lg object-cover" />
      )}
      {link && section.buttonText && (
        <Link href={link} className="bn-button mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#E28906] px-5 py-3 text-sm font-semibold text-[#10110f] hover:opacity-90"
          {...(link.startsWith("https://") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {section.buttonText}
        </Link>
      )}
    </>
  );
}

export function SitePageBlock({ section, light = false }: { section: SiteSection; light?: boolean }) {
  const kind = section.kind || "text";
  const align = section.alignment === "center" ? "text-center" : "text-left";
  const appearance = section.appearance === "accent"
    ? "border-[#E28906]/50 bg-[#E28906]/10"
    : section.appearance === "card" || kind === "callout" || kind === "author"
      ? (light ? "border-black/15 bg-white" : "border-white/10 bg-[#191b18]")
      : "border-transparent bg-transparent";
  if (kind === "divider") return <hr className="my-8 border-[#E28906]/25" />;

  if (kind === "faq") {
    return (
      <details id={section.id} className={`scroll-mt-28 rounded-xl border border-[#E28906]/25 p-5 ${light ? "bg-white" : "bg-[#191b18]"}`}>
        <summary className={`cursor-pointer font-semibold ${light ? "text-[#79500A]" : "text-[#E28906]"}`}>{section.title}</summary>
        <p className={`mt-4 whitespace-pre-wrap leading-7 ${light ? "text-[#4F4941]" : "text-[#b4b2ab]"}`}>{section.body}</p>
        <SiteSectionExtras section={section} />
      </details>
    );
  }

  if (kind === "quote") {
    return (
      <blockquote id={section.id} className={`scroll-mt-28 rounded-xl border-l-4 border-[#E28906] p-7 ${light ? "bg-white" : "bg-[#191b18]"}`}>
        <p className="whitespace-pre-wrap font-serif text-xl italic leading-8">{section.body}</p>
        {section.title && <cite className={`mt-4 block text-sm not-italic ${light ? "text-[#79500A]" : "text-[#E28906]"}`}>{section.title}</cite>}
        <SiteSectionExtras section={section} />
      </blockquote>
    );
  }

  return (
    <section id={section.id} className={"scroll-mt-28 rounded-xl border p-6 sm:p-8 " + appearance + " " + align}>
      {section.title && <h2 className={`font-serif text-[28px] leading-tight ${light ? "text-[#211E19]" : "text-[#FAF9F6]"}`}>{section.title}</h2>}
      {section.body && <p className={`mt-4 whitespace-pre-wrap text-[15px] leading-8 ${light ? "text-[#4F4941]" : "text-[#b4b2ab]"}`}>{section.body}</p>}
      <SiteSectionExtras section={section} />
    </section>
  );
}
