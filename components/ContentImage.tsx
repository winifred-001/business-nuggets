"use client";

import Image from "next/image";
import { useState } from "react";

const SAMPLE_IMAGE = "/images/nuggetCard.png";

type ContentImageProps = {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
};

export default function ContentImage({
  src,
  alt,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  className = "object-cover",
}: ContentImageProps) {
  const [failedSources, setFailedSources] = useState<string[]>([]);

  const requested =
    src.startsWith("/") && !src.startsWith("//")
      ? src
      : SAMPLE_IMAGE;

  const selected = failedSources.includes(requested)
    ? SAMPLE_IMAGE
    : requested;

  if (failedSources.includes(selected)) {
    return (
      <div
        role="img"
        aria-label={`${alt}: image unavailable`}
        className="absolute inset-0 flex items-center justify-center bg-gray-900 p-4 text-center text-sm text-gray-400"
      >
        Image coming soon
      </div>
    );
  }

  return (
    <Image
      src={selected}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() =>
        setFailedSources((previous) =>
          previous.includes(selected)
            ? previous
            : [...previous, selected],
        )
      }
    />
  );
}