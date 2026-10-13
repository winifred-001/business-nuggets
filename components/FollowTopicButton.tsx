"use client";

import { useEffect, useState } from "react";

type Props = {
  topic: string;
};

export default function FollowTopicButton({ topic }: Props) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function checkFollowing() {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:3001/following/topics",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
          setFollowing(
            data.some(
              (item) => item.topic === topic
            )
          );
        }
      } finally {
        setLoading(false);
      }
    }

    checkFollowing();
  }, [topic]);

  async function toggleFollow() {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch(
        following
          ? `http://localhost:3001/following/topics/${encodeURIComponent(
              topic
            )}`
          : "http://localhost:3001/following/topics",
        {
          method: following ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          ...(following
            ? {}
            : {
                body: JSON.stringify({
                  topic,
                }),
              }),
        }
      );

      if (response.ok) {
        setFollowing((current) => !current);
      }
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleFollow}
      disabled={updating}
      className={`rounded-md px-4 py-2 text-xs font-semibold transition ${
        following
          ? "border border-amber-300 text-amber-300"
          : "bg-amber-300 text-black hover:bg-amber-400"
      } disabled:opacity-50`}
    >
      {updating
        ? "Updating..."
        : following
          ? "Following"
          : "Follow Topic"}
    </button>
  );
}