"use client";

import {
  Bookmark,
  Check,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

export default function FollowTopicButton({
  topic,
}: {
  topic: string;
}) {
  const [followed, setFollowed] =
    useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem(
          "followedTopics",
        ) ?? "[]",
      ) as string[];

      setFollowed(
        stored.includes(topic),
      );
    } catch {
      setFollowed(false);
    }
  }, [topic]);

  function toggleFollow() {
    try {
      const stored = JSON.parse(
        localStorage.getItem(
          "followedTopics",
        ) ?? "[]",
      ) as string[];

      const updated = stored.includes(
        topic,
      )
        ? stored.filter(
            (item) =>
              item !== topic,
          )
        : [...stored, topic];

      localStorage.setItem(
        "followedTopics",
        JSON.stringify(updated),
      );

      setFollowed(
        updated.includes(topic),
      );
    } catch {
      setFollowed((value) => !value);
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
        <Bookmark size={15} />
      )}

      {followed
        ? "Following Topic"
        : "Follow Topic"}
    </button>
  );
}