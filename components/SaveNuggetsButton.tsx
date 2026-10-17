"use client";

import { API_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";

type SaveNuggetButtonProps = {
  nuggetId: string;
};

type SavedNuggetRecord = {
  id: number;
  nuggetId: string;
  userId: number;
  createdAt: string;
};

export default function SaveNuggetButton({
  nuggetId,
}: SaveNuggetButtonProps) {
  const router = useRouter();

  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSavedStatus() {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/saved-nuggets`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) return;

        const data: SavedNuggetRecord[] =
          await response.json();

        setIsSaved(
          data.some(
            (record) => record.nuggetId === nuggetId
          )
        );
      } catch {
        console.error("Could not check saved status");
      } finally {
        setLoading(false);
      }
    }

    checkSavedStatus();
  }, [nuggetId]);

  async function handleSave() {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      if (isSaved) {
        const response = await fetch(
          `${API_URL}/saved-nuggets/${nuggetId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          setIsSaved(false);
        }
      } else {
        const response = await fetch(
          `${API_URL}/saved-nuggets`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              nuggetId,
            }),
          }
        );

        if (response.ok) {
          setIsSaved(true);
        }
      }
    } catch {
      console.error("Could not update saved nugget");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={loading}
      className={`mt-4 flex w-full items-center justify-center gap-2 rounded border px-4 py-3 text-sm font-medium transition ${
        isSaved
          ? "border-amber-300 bg-amber-300/10 text-amber-300"
          : "border-gray-700 text-gray-300 hover:border-amber-300 hover:text-amber-300"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <Bookmark
        size={18}
        className={
          isSaved
            ? "fill-amber-300 text-amber-300"
            : ""
        }
      />

      {loading
        ? "Checking..."
        : isSaved
          ? "Saved"
          : "Save Nugget"}
    </button>
  );
}