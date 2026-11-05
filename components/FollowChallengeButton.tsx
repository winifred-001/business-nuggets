"use client";

import {
  Bookmark,
  Check,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

export default function FollowChallengeButton({
  challenge,
}: {
  challenge: string;
}) {
  const [followed, setFollowed] =
    useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem(
          "followedChallenges",
        ) ?? "[]",
      ) as string[];

      setFollowed(
        stored.includes(
          challenge,
        ),
      );
    } catch {
      setFollowed(false);
    }
  }, [challenge]);

  function toggleFollow() {
    try {
      const stored = JSON.parse(
        localStorage.getItem(
          "followedChallenges",
        ) ?? "[]",
      ) as string[];

      const updated =
        stored.includes(challenge)
          ? stored.filter(
              (item) =>
                item !== challenge,
            )
          : [
              ...stored,
              challenge,
            ];

      localStorage.setItem(
        "followedChallenges",
        JSON.stringify(
          updated,
        ),
      );

      setFollowed(
        updated.includes(
          challenge,
        ),
      );
    } catch {
      setFollowed(
        (value) => !value,
      );
    }
  }

  return (
    <button
      type="button"
      onClick={toggleFollow}
      className={`inline-flex min-h-11 w-fit items-center gap-2 rounded-lg px-5 text-[13px] font-semibold transition ${
        followed
          ? "border border-[#E28906] bg-transparent text-[#E28906]"
          : "bg-[#E28906] text-[#080808] hover:bg-[#E28906]"
      }`}
    >
      {followed ? (
        <Check size={15} />
      ) : (
        <Bookmark
          size={15}
        />
      )}

      {followed
        ? "Following Challenge"
        : "Follow Challenge"}
    </button>
  );
}