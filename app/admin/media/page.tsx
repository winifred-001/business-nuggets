"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Check,
  Folder,
  ImageIcon,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import AdminShell from "@/components/AdminShell";

import {
  API_URL,
} from "@/lib/api";

type MediaFolder = {
  id: number;
  name: string;
  createdAt?: string;
};

type MediaAsset = {
  id: number;

  filename: string;
  originalName: string;

  mimeType: string;

  size: number;

  width:
    | number
    | null;

  height:
    | number
    | null;

  folderId:
    | number
    | null;

  url: string;

  createdAt: string;
};

type LibraryResponse = {
  assets: MediaAsset[];

  folders: MediaFolder[];

  storage: {
    usedBytes: number;
    limitBytes: number;
  };
};

export default function AdminMediaPage() {
  const [
    assets,
    setAssets,
  ] =
    useState<MediaAsset[]>(
      [],
    );

  const [
    folders,
    setFolders,
  ] =
    useState<
      MediaFolder[]
    >([]);

  const [
    storage,
    setStorage,
  ] = useState({
    usedBytes: 0,
    limitBytes: 0,
  });

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    uploading,
    setUploading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    activeFolderId,
    setActiveFolderId,
  ] = useState<
    number | null
  >(null);

  const [
    folderModalOpen,
    setFolderModalOpen,
  ] =
    useState(false);

  const [
    folderName,
    setFolderName,
  ] = useState("");

  const fileInputRef =
    useRef<HTMLInputElement>(
      null,
    );

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
     LOAD LIBRARY
  ========================================= */

  useEffect(() => {
    loadLibrary();
  }, []);

  async function loadLibrary() {
    const token =
      getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/admin/media`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const data:
        LibraryResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          "Could not load media library.",
        );
      }

      setAssets(
        data.assets ||
          [],
      );

      setFolders(
        data.folders ||
          [],
      );

      setStorage(
        data.storage || {
          usedBytes: 0,
          limitBytes: 0,
        },
      );
    } catch (
      err
    ) {
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
     FILTER
  ========================================= */

  const visibleAssets =
    useMemo(() => {
      if (
        activeFolderId ===
        null
      ) {
        return assets;
      }

      return assets.filter(
        (asset) =>
          asset.folderId ===
          activeFolderId,
      );
    }, [
      assets,
      activeFolderId,
    ]);

  /* =========================================
     IMAGE DIMENSIONS
  ========================================= */

  function getImageDimensions(
    file: File,
  ) {
    return new Promise<{
      width: number;
      height: number;
    }>(
      (
        resolve,
        reject,
      ) => {
        const url =
          URL.createObjectURL(
            file,
          );

        const image =
          new Image();

        image.onload = () => {
          resolve({
            width:
              image.naturalWidth,

            height:
              image.naturalHeight,
          });

          URL.revokeObjectURL(
            url,
          );
        };

        image.onerror =
          () => {
            URL.revokeObjectURL(
              url,
            );

            reject(
              new Error(
                "Could not read image dimensions",
              ),
            );
          };

        image.src =
          url;
      },
    );
  }

  /* =========================================
     UPLOAD
  ========================================= */

  async function handleUpload(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target
        .files?.[0];

    if (!file) {
      return;
    }

    const token =
      getToken();

    if (!token) {
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const {
        width,
        height,
      } =
        await getImageDimensions(
          file,
        );

      const formData =
        new FormData();

      formData.append(
        "file",
        file,
      );

      formData.append(
        "width",
        String(width),
      );

      formData.append(
        "height",
        String(
          height,
        ),
      );

      if (
        activeFolderId !==
        null
      ) {
        formData.append(
          "folderId",
          String(
            activeFolderId,
          ),
        );
      }

      const response =
        await fetch(
          `${API_URL}/admin/media/upload`,
          {
            method:
              "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            body:
              formData,
          },
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        setError(
          data.message ||
            "Upload failed.",
        );

        return;
      }

      setSuccess(
        "Image uploaded successfully.",
      );

      await loadLibrary();
    } catch {
      setError(
        "Could not upload image.",
      );
    } finally {
      setUploading(false);

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }
    }
  }

  /* =========================================
     CREATE FOLDER
  ========================================= */

  async function createFolder() {
    if (
      !folderName.trim()
    ) {
      setError(
        "Enter a folder name.",
      );

      return;
    }

    const token =
      getToken();

    if (!token) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/admin/media/folders`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                name:
                  folderName.trim(),
              }),
          },
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        setError(
          data.message ||
            "Could not create folder.",
        );

        return;
      }

      setFolderModalOpen(
        false,
      );

      setFolderName("");

      setSuccess(
        "Folder created.",
      );

      await loadLibrary();
    } catch {
      setError(
        "Could not connect to the server.",
      );
    }
  }

  /* =========================================
     DELETE MEDIA
  ========================================= */

  async function deleteAsset(
    asset: MediaAsset,
  ) {
    const confirmed =
      window.confirm(
        `Delete "${asset.originalName}"?`,
      );

    if (!confirmed) {
      return;
    }

    const token =
      getToken();

    if (!token) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/admin/media/${asset.id}`,
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
          "Could not delete media.",
        );

        return;
      }

      setSuccess(
        "Media deleted.",
      );

      await loadLibrary();
    } catch {
      setError(
        "Could not connect to the server.",
      );
    }
  }

  /* =========================================
     STORAGE
  ========================================= */

  const storagePercent =
    storage.limitBytes >
    0
      ? Math.min(
          100,
          (storage.usedBytes /
            storage.limitBytes) *
            100,
        )
      : 0;

  return (
    <AdminShell>
      <main className="px-4 py-6 sm:px-6 lg:px-7">
        {/* HEADER */}

        <section className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-[32px]">
              Media Library
            </h1>

            <p className="mt-2 text-[10px] text-white/35">
              Images and assets
              used across web and
              mobile.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() =>
                setFolderModalOpen(
                  true,
                )
              }
              className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 px-4 text-[9px] text-white/55 transition hover:border-[#C8A35A]/30"
            >
              <Folder
                size={
                  12
                }
              />

              New Folder
            </button>

            <button
              type="button"
              disabled={
                uploading
              }
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="inline-flex h-9 items-center gap-2 rounded-md bg-[#C8A35A] px-4 text-[9px] font-semibold text-[#080808] transition hover:bg-[#E0C48A] disabled:opacity-50"
            >
              <Upload
                size={
                  12
                }
              />

              {uploading
                ? "Uploading..."
                : "Upload"}
            </button>

            <input
              ref={
                fileInputRef
              }
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={
                handleUpload
              }
              className="hidden"
            />
          </div>
        </section>

        {/* MESSAGE */}

        {error && (
          <div className="mt-5 rounded-md border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-[10px] text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3">
            <Check
              size={12}
              className="text-emerald-400"
            />

            <span className="text-[10px] text-emerald-400">
              {success}
            </span>
          </div>
        )}

        {/* FOLDERS */}

        {folders.length >
          0 && (
          <section className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setActiveFolderId(
                  null,
                )
              }
              className={`rounded-md border px-3 py-2 text-[8px] ${
                activeFolderId ===
                null
                  ? "border-[#C8A35A]/40 bg-[#C8A35A]/10 text-[#E0C48A]"
                  : "border-white/10 text-white/35"
              }`}
            >
              All Media
            </button>

            {folders.map(
              (folder) => (
                <button
                  key={
                    folder.id
                  }
                  type="button"
                  onClick={() =>
                    setActiveFolderId(
                      folder.id,
                    )
                  }
                  className={`rounded-md border px-3 py-2 text-[8px] ${
                    activeFolderId ===
                    folder.id
                      ? "border-[#C8A35A]/40 bg-[#C8A35A]/10 text-[#E0C48A]"
                      : "border-white/10 text-white/35"
                  }`}
                >
                  {
                    folder.name
                  }
                </button>
              ),
            )}
          </section>
        )}

        {/* GRID */}

        {loading ? (
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({
              length: 8,
            }).map(
              (
                _,
                index,
              ) => (
                <div
                  key={
                    index
                  }
                  className="h-[180px] animate-pulse rounded-[10px] border border-white/10 bg-[#111111]"
                />
              ),
            )}
          </section>
        ) : (
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleAssets.map(
              (asset) => (
                <article
                  key={
                    asset.id
                  }
                  className="group overflow-hidden rounded-[10px] border border-white/10 bg-[#111111]"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-[#17130A]">
                    <img
                      src={`${API_URL}${asset.url}`}
                      alt={
                        asset.originalName
                      }
                      className="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        deleteAsset(
                          asset,
                        )
                      }
                      className="absolute right-2 top-2 hidden h-7 w-7 items-center justify-center rounded-md bg-black/70 text-red-400 group-hover:flex"
                      aria-label="Delete image"
                    >
                      <Trash2
                        size={
                          12
                        }
                      />
                    </button>
                  </div>

                  <div className="p-3">
                    <p className="truncate text-[9px] text-white/65">
                      {
                        asset.originalName
                      }
                    </p>

                    <p className="mt-1 text-[7px] text-white/25">
                      {asset.width &&
                      asset.height
                        ? `${asset.width}×${asset.height} · `
                        : ""}
                      {formatBytes(
                        asset.size,
                      )}
                    </p>
                  </div>
                </article>
              ),
            )}
          </section>
        )}

        {!loading &&
          visibleAssets.length ===
            0 && (
            <div className="mt-6 rounded-[10px] border border-white/10 bg-[#111111] py-14 text-center">
              <ImageIcon
                size={24}
                className="mx-auto text-white/15"
              />

              <p className="mt-3 text-[10px] text-white/30">
                No media in this
                folder yet.
              </p>
            </div>
          )}

        {/* STORAGE */}

        <section className="mt-6 max-w-[340px]">
          <p className="text-[8px] text-white/30">
            Storage used:{" "}
            {formatBytes(
              storage.usedBytes,
            )}{" "}
            of{" "}
            {formatBytes(
              storage.limitBytes,
            )}
          </p>

          <div className="mt-2 h-[4px] overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full bg-[#C8A35A]"
              style={{
                width:
                  `${storagePercent}%`,
              }}
            />
          </div>
        </section>

        {/* NEW FOLDER MODAL */}

        {folderModalOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-5">
            <div className="w-full max-w-[420px] rounded-[10px] border border-white/10 bg-[#111111] p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-[24px]">
                  New Folder
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setFolderModalOpen(
                      false,
                    )
                  }
                  className="text-white/30 hover:text-white"
                >
                  <X
                    size={
                      16
                    }
                  />
                </button>
              </div>

              <label className="mt-6 block text-[8px] text-white/35">
                Folder Name
              </label>

              <input
                value={
                  folderName
                }
                onChange={(
                  event,
                ) =>
                  setFolderName(
                    event
                      .target
                      .value,
                  )
                }
                placeholder="Nugget Covers"
                className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#080808] px-3 text-[10px] text-white outline-none placeholder:text-white/20"
              />

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFolderModalOpen(
                      false,
                    )
                  }
                  className="h-9 rounded-md border border-white/10 px-4 text-[9px] text-white/40"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    createFolder
                  }
                  className="h-9 rounded-md bg-[#C8A35A] px-5 text-[9px] font-semibold text-[#080808]"
                >
                  Create Folder
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminShell>
  );
}

function formatBytes(
  bytes: number,
) {
  if (!bytes) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
  ];

  const index =
    Math.min(
      units.length -
        1,

      Math.floor(
        Math.log(bytes) /
          Math.log(
            1024,
          ),
      ),
    );

  const value =
    bytes /
    Math.pow(
      1024,
      index,
    );

  return `${value.toFixed(
    index === 0
      ? 0
      : 1,
  )} ${units[index]}`;
}