import type { MediaMatchStatus, R2MediaKind } from "@/lib/use-r2-media-auto-match";

export default function R2MediaMatchStatus({
  status,
  kind,
}: { status: MediaMatchStatus; kind: R2MediaKind }) {
  const name = kind === "images" ? "cover image" : "Nugget audio";
  if (status === "idle" || status === "matched") return null;
  const message = status === "searching" ? `Searching R2 for matching ${name}...`
    : status === "multiple" ? `Multiple matching ${name} files found. Select the correct one manually.`
    : status === "not_found" ? `No matching ${name} found in R2. You can still browse files manually.`
    : `Could not search R2 for ${name}. You can select it manually.`;
  return (
    <p role={status === "error" ? "alert" : "status"}
      className={`mt-2 text-xs ${status === "error" ? "text-red-400" : status === "multiple" ? "text-[#E28906]" : "text-white/50"}`}>
      {message}
    </p>
  );
}
