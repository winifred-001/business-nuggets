import { nuggetBlocks, nuggetBoldParts } from "@/lib/nugget-text";

/** Only known formatting becomes React elements. All other input remains escaped text. */
export default function FormattedNuggetText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`nugget-formatted-text space-y-4 ${className}`}>
      {nuggetBlocks(text).map((block, index) => {
        const content = nuggetBoldParts(block.text).map((part, partIndex) =>
          part.bold ? <strong key={partIndex} className="font-bold">{part.text}</strong> : part.text,
        );
        return block.heading ? (
          <h3 key={index} className="bn-nugget-section-title font-serif leading-tight">{content}</h3>
        ) : (
          <p key={index} className="whitespace-pre-line break-words">{content}</p>
        );
      })}
    </div>
  );
}
