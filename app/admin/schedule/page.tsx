"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import AdminShell from "@/components/AdminShell";
import { API_URL } from "@/lib/api";

type AdminNugget = {
  id: string;
  slug: string;
  number: number;
  title: string;
  topic: string;
  scriptureRef: string;
  status: string;
};

type ScheduleItem = {
  id: number;

  nuggetId: string;

  scheduledFor: string;

  nugget:
    | AdminNugget
    | null;
};

const WEEKDAYS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

export default function AdminSchedulePage() {
  const [schedule, setSchedule] =
    useState<ScheduleItem[]>([]);

  const [nuggets, setNuggets] =
    useState<AdminNugget[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [
    selectedMonth,
    setSelectedMonth,
  ] = useState(() => {
    const now =
      new Date();

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    );
  });

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingItem,
    setEditingItem,
  ] =
    useState<ScheduleItem | null>(
      null,
    );

  const [
    selectedNugget,
    setSelectedNugget,
  ] = useState("");

  const [
    selectedDate,
    setSelectedDate,
  ] = useState("");

  const [
    selectedTime,
    setSelectedTime,
  ] = useState("06:00");

  function getToken() {
    return (
      localStorage.getItem(
        "adminToken",
      ) ||
      sessionStorage.getItem(
        "adminToken",
      )
    );
  }

  /* =========================================
     LOAD
  ========================================= */

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const token =
      getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const [
        scheduleResponse,
        nuggetsResponse,
      ] =
        await Promise.all([
          fetch(
            `${API_URL}/admin/schedule`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          ),

          fetch(
            `${API_URL}/admin/nuggets`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          ),
        ]);

      const scheduleData =
        await scheduleResponse
          .json()
          .catch(() => []);

      const nuggetsData =
        await nuggetsResponse
          .json()
          .catch(() => []);

      if (
        !scheduleResponse.ok
      ) {
        throw new Error(
          scheduleData.message ||
            "Could not load schedule",
        );
      }

      if (
        !nuggetsResponse.ok
      ) {
        throw new Error(
          nuggetsData.message ||
            "Could not load Nuggets",
        );
      }

      setSchedule(
        Array.isArray(
          scheduleData,
        )
          ? scheduleData
          : [],
      );

      setNuggets(
        Array.isArray(
          nuggetsData,
        )
          ? nuggetsData
          : [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the server.",
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================
     CALENDAR
  ========================================= */

  const calendarDays =
    useMemo(() => {
      const year =
        selectedMonth.getFullYear();

      const month =
        selectedMonth.getMonth();

      const daysInMonth =
        new Date(
          year,
          month + 1,
          0,
        ).getDate();

      /*
       * JS Sunday = 0.
       * Calendar starts Monday.
       */

      const firstDay =
        new Date(
          year,
          month,
          1,
        ).getDay();

      const mondayOffset =
        firstDay === 0
          ? 6
          : firstDay - 1;

      const cells:
        (
          | number
          | null
        )[] = [];

      for (
        let i = 0;
        i < mondayOffset;
        i += 1
      ) {
        cells.push(null);
      }

      for (
        let day = 1;
        day <= daysInMonth;
        day += 1
      ) {
        cells.push(day);
      }

      while (
        cells.length % 7 !==
        0
      ) {
        cells.push(null);
      }

      return cells;
    }, [selectedMonth]);

  function getScheduleForDay(
    day: number,
  ) {
    return schedule.filter(
      (item) => {
        const date =
          new Date(
            item.scheduledFor,
          );

        return (
          date.getFullYear() ===
            selectedMonth.getFullYear() &&
          date.getMonth() ===
            selectedMonth.getMonth() &&
          date.getDate() === day
        );
      },
    );
  }

  const monthLabel =
    new Intl.DateTimeFormat(
      "en",
      {
        month: "long",
        year: "numeric",
      },
    ).format(
      selectedMonth,
    );

  /* =========================================
     UP NEXT
  ========================================= */

  const upcoming =
    useMemo(() => {
      const now =
        Date.now();

      return schedule
        .filter(
          (item) =>
            new Date(
              item.scheduledFor,
            ).getTime() >=
            now,
        )
        .sort(
          (a, b) =>
            new Date(
              a.scheduledFor,
            ).getTime() -
            new Date(
              b.scheduledFor,
            ).getTime(),
        )
        .slice(0, 4);
    }, [schedule]);

  /* =========================================
     OPEN SCHEDULE
  ========================================= */

  function openCreate(
    day?: number,
  ) {
    setEditingItem(null);

    setSelectedNugget("");

    if (day) {
      const year =
        selectedMonth.getFullYear();

      const month =
        String(
          selectedMonth.getMonth() +
            1,
        ).padStart(
          2,
          "0",
        );

      const date =
        String(day).padStart(
          2,
          "0",
        );

      setSelectedDate(
        `${year}-${month}-${date}`,
      );
    } else {
      const now =
        new Date();

      setSelectedDate(
        [
          now.getFullYear(),

          String(
            now.getMonth() +
              1,
          ).padStart(
            2,
            "0",
          ),

          String(
            now.getDate(),
          ).padStart(
            2,
            "0",
          ),
        ].join("-"),
      );
    }

    setSelectedTime(
      "06:00",
    );

    setModalOpen(true);
  }

  function openEdit(
    item: ScheduleItem,
  ) {
    const date =
      new Date(
        item.scheduledFor,
      );

    setEditingItem(
      item,
    );

    setSelectedNugget(
      item.nuggetId,
    );

    setSelectedDate(
      [
        date.getFullYear(),

        String(
          date.getMonth() +
            1,
        ).padStart(
          2,
          "0",
        ),

        String(
          date.getDate(),
        ).padStart(
          2,
          "0",
        ),
      ].join("-"),
    );

    setSelectedTime(
      `${String(
        date.getHours(),
      ).padStart(
        2,
        "0",
      )}:${String(
        date.getMinutes(),
      ).padStart(
        2,
        "0",
      )}`,
    );

    setModalOpen(true);
  }

  /* =========================================
     SAVE
  ========================================= */

  async function saveSchedule() {
    if (
      !selectedNugget ||
      !selectedDate ||
      !selectedTime
    ) {
      setError(
        "Choose a Nugget, date and time.",
      );

      return;
    }

    const token =
      getToken();

    if (!token) return;

    setSaving(true);
    setError("");
    setSuccess("");

    /*
     * This produces local time,
     * then sends a proper ISO value.
     */

    const localDate =
      new Date(
        `${selectedDate}T${selectedTime}:00`,
      );

    const payload = {
      nuggetId:
        selectedNugget,

      scheduledFor:
        localDate.toISOString(),
    };

    try {
      const response =
        await fetch(
          editingItem
            ? `${API_URL}/admin/schedule/${editingItem.id}`
            : `${API_URL}/admin/schedule`,
          {
            method:
              editingItem
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify(
                payload,
              ),
          },
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        setError(
          data.message ||
            "Could not save schedule.",
        );

        return;
      }

      setModalOpen(false);

      setSuccess(
        editingItem
          ? "Schedule updated."
          : "Nugget scheduled.",
      );

      await loadData();
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================
     DELETE
  ========================================= */

  async function removeSchedule() {
    if (!editingItem) {
      return;
    }

    const confirmed =
      window.confirm(
        "Remove this scheduled Nugget?",
      );

    if (!confirmed) {
      return;
    }

    const token =
      getToken();

    if (!token) return;

    setSaving(true);

    try {
      const response =
        await fetch(
          `${API_URL}/admin/schedule/${editingItem.id}`,
          {
            method:
              "DELETE",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      if (!response.ok) {
        setError(
          "Could not remove schedule.",
        );

        return;
      }

      setModalOpen(false);

      setSuccess(
        "Scheduled item removed.",
      );

      await loadData();
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================
     AUTO FILL
  ========================================= */

  async function autoFillWeek() {
    const token =
      getToken();

    if (!token) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `${API_URL}/admin/schedule/auto-fill`,
          {
            method:
              "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const data =
        await response
          .json()
          .catch(() => []);

      if (!response.ok) {
        setError(
          data.message ||
            "Could not auto-fill week.",
        );

        return;
      }

      setSchedule(
        Array.isArray(data)
          ? data
          : [],
      );

      setSuccess(
        "Next available days were filled.",
      );
    } catch {
      setError(
        "Could not connect to the server.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================
     MONTH NAVIGATION
  ========================================= */

  function previousMonth() {
    setSelectedMonth(
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() -
          1,
        1,
      ),
    );
  }

  function nextMonth() {
    setSelectedMonth(
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() +
          1,
        1,
      ),
    );
  }

  return (
    <AdminShell>
      <main className="px-4 py-6 sm:px-6 lg:px-7">
        {/* HEADER */}

        <section className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-[32px]">
              Daily Schedule
            </h1>

            <p className="mt-2 text-[10px] text-white/35">
              Plan which Nugget
              appears on each day.
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={
              autoFillWeek
            }
            className="h-9 w-fit rounded-md border border-white/10 px-4 text-[9px] text-white/55 transition hover:border-[#C8A35A]/35 hover:text-white disabled:opacity-40"
          >
            Auto-Fill Week
          </button>
        </section>

        {/* MESSAGES */}

        {error && (
          <div className="mt-5 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-[10px] text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-md border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3 text-[10px] text-emerald-400">
            {success}
          </div>
        )}

        <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          {/* CALENDAR */}

          <div className="rounded-[10px] border border-white/10 bg-[#111111] p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={
                  previousMonth
                }
                className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/40 hover:text-white"
              >
                <ChevronLeft
                  size={14}
                />
              </button>

              <h2 className="font-serif text-[18px]">
                {monthLabel}
              </h2>

              <button
                type="button"
                onClick={
                  nextMonth
                }
                className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/40 hover:text-white"
              >
                <ChevronRight
                  size={14}
                />
              </button>
            </div>

            {/* WEEKDAYS */}

            <div className="mt-5 grid grid-cols-7 gap-1 sm:gap-2">
              {WEEKDAYS.map(
                (day) => (
                  <div
                    key={day}
                    className="pb-2 text-center text-[7px] text-white/30"
                  >
                    {day}
                  </div>
                ),
              )}

              {/* DAYS */}

              {calendarDays.map(
                (
                  day,
                  index,
                ) => {
                  if (!day) {
                    return (
                      <div
                        key={
                          `empty-${index}`
                        }
                        className="min-h-[80px] rounded-md border border-transparent sm:min-h-[100px]"
                      />
                    );
                  }

                  const items =
                    getScheduleForDay(
                      day,
                    );

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        if (
                          items[0]
                        ) {
                          openEdit(
                            items[0],
                          );
                        } else {
                          openCreate(
                            day,
                          );
                        }
                      }}
                      className="min-h-[80px] rounded-md border border-white/[0.07] bg-[#080808] p-2 text-left transition hover:border-[#C8A35A]/30 sm:min-h-[100px]"
                    >
                      <span className="text-[8px] text-white/45">
                        {day}
                      </span>

                      <div className="mt-2 space-y-1">
                        {items
                          .slice(
                            0,
                            2,
                          )
                          .map(
                            (
                              item,
                            ) => (
                              <div
                                key={
                                  item.id
                                }
                                className="rounded bg-[#C8A35A]/15 px-1.5 py-1"
                              >
                                <p className="truncate text-[6px] text-[#E0C48A] sm:text-[7px]">
                                  {formatTime(
                                    item.scheduledFor,
                                  )}{" "}
                                  ·{" "}
                                  {item
                                    .nugget
                                    ?.title ||
                                    "Nugget"}
                                </p>
                              </div>
                            ),
                          )}
                      </div>
                    </button>
                  );
                },
              )}
            </div>

            {loading && (
              <p className="mt-4 text-[9px] text-white/30">
                Loading
                schedule...
              </p>
            )}
          </div>

          {/* UP NEXT */}

          <aside className="flex min-h-[420px] flex-col rounded-[10px] border border-white/10 bg-[#111111] p-4">
            <h2 className="font-serif text-[18px]">
              Up Next
            </h2>

            <div className="mt-4 space-y-3">
              {upcoming.map(
                (item) => (
                  <button
                    key={
                      item.id
                    }
                    type="button"
                    onClick={() =>
                      openEdit(
                        item,
                      )
                    }
                    className="w-full rounded-md border border-white/[0.07] bg-[#080808] p-3 text-left transition hover:border-[#C8A35A]/30"
                  >
                    <p className="truncate text-[9px] text-white/65">
                      {item
                        .nugget
                        ?.title ||
                        "Unknown Nugget"}
                    </p>

                    <p className="mt-2 flex items-center gap-1 text-[7px] text-white/25">
                      <Clock3
                        size={
                          9
                        }
                      />

                      {formatScheduleDate(
                        item.scheduledFor,
                      )}
                    </p>
                  </button>
                ),
              )}

              {!loading &&
                upcoming.length ===
                  0 && (
                  <p className="text-[9px] text-white/30">
                    Nothing
                    scheduled
                    yet.
                  </p>
                )}
            </div>

            <button
              type="button"
              onClick={() =>
                openCreate()
              }
              className="mt-auto inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#C8A35A] text-[9px] font-semibold text-[#080808] transition hover:bg-[#E0C48A]"
            >
              <Plus
                size={12}
              />

              Schedule Nugget
            </button>
          </aside>
        </section>

        {/* MODAL */}

        {modalOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-5">
            <div className="w-full max-w-[470px] rounded-[10px] border border-white/10 bg-[#111111] p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-serif text-[24px]">
                    {editingItem
                      ? "Edit Schedule"
                      : "Schedule Nugget"}
                  </h2>

                  <p className="mt-2 text-[9px] text-white/30">
                    Choose the
                    Nugget and
                    scheduled
                    time.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setModalOpen(
                      false,
                    )
                  }
                  className="text-white/30 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* NUGGET */}

              <label className="mt-6 block text-[8px] text-white/35">
                Nugget
              </label>

              <select
                value={
                  selectedNugget
                }
                onChange={(
                  event,
                ) =>
                  setSelectedNugget(
                    event
                      .target
                      .value,
                  )
                }
                className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[9px] text-white/65 outline-none"
              >
                <option value="">
                  Select Nugget
                </option>

                {nuggets.map(
                  (nugget) => (
                    <option
                      key={
                        nugget.id
                      }
                      value={
                        nugget.id
                      }
                    >
                      #
                      {
                        nugget.number
                      }{" "}
                      —{" "}
                      {
                        nugget.title
                      }
                    </option>
                  ),
                )}
              </select>

              {/* DATE + TIME */}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[8px] text-white/35">
                    Date
                  </label>

                  <input
                    type="date"
                    value={
                      selectedDate
                    }
                    onChange={(
                      event,
                    ) =>
                      setSelectedDate(
                        event
                          .target
                          .value,
                      )
                    }
                    className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[9px] text-white/65 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[8px] text-white/35">
                    Time
                  </label>

                  <input
                    type="time"
                    value={
                      selectedTime
                    }
                    onChange={(
                      event,
                    ) =>
                      setSelectedTime(
                        event
                          .target
                          .value,
                      )
                    }
                    className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[9px] text-white/65 outline-none"
                  />
                </div>
              </div>

              <p className="mt-4 text-[8px] leading-4 text-white/25">
                This creates the
                content schedule.
                It does not
                automatically
                change a draft
                Nugget to
                Published.
              </p>

              <div className="mt-6 flex items-center gap-3">
                {editingItem && (
                  <button
                    type="button"
                    disabled={
                      saving
                    }
                    onClick={
                      removeSchedule
                    }
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-red-500/20 px-4 text-[9px] text-red-400 hover:bg-red-500/[0.05]"
                  >
                    <Trash2
                      size={
                        11
                      }
                    />

                    Remove
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setModalOpen(
                      false,
                    )
                  }
                  className="ml-auto h-9 rounded-md border border-white/10 px-4 text-[9px] text-white/40"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={
                    saveSchedule
                  }
                  className="h-9 rounded-md bg-[#C8A35A] px-5 text-[9px] font-semibold text-[#080808] disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingItem
                      ? "Save Changes"
                      : "Schedule"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminShell>
  );
}

function formatTime(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
  ).format(
    new Date(value),
  );
}

function formatScheduleDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en",
    {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(
    new Date(value),
  );
}