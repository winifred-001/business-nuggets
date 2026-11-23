
import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";

import {
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "../prisma/db";

export type R2MediaKind = "nuggets" | "image";

export type R2MediaMatch = {
  id: string;
  value: string;
};

const MAX_PAGES = 200;
const MAX_NUGGETS = 5000;
const MAX_APPLY = 500;

function numberFromKey(key: string): number | null {
  const filename = key.split("/").pop() ?? "";

  const match = /^BN[\s._-]+0*(\d+)(?=[\s._-]|$)/i.exec(
    filename,
  );

  if (!match) return null;

  const number = Number(match[1]);

  return Number.isSafeInteger(number) && number > 0
    ? number
    : null;
}

@Injectable()
export class R2MediaService {
  private storage?: S3Client;

  private client() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new ServiceUnavailableException(
        "R2 credentials are not configured",
      );
    }

    this.storage ??= new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    return this.storage;
  }

  private bucket(kind: R2MediaKind): string {
    const name =
      kind === "image"
        ? process.env.R2_IMAGE_BUCKET
        : process.env.R2_NUGGETS_BUCKET;

    if (!name) {
      throw new ServiceUnavailableException(
        `R2 ${kind} bucket is not configured`,
      );
    }

    return name;
  }

  private checkKind(kind: R2MediaKind): void {
    if (kind !== "image" && kind !== "nuggets") {
      throw new BadRequestException("Invalid R2 media kind");
    }
  }

  private validKey(
    kind: R2MediaKind,
    key: string,
  ): boolean {
    return (
      typeof key === "string" &&
      key.length > 0 &&
      Buffer.byteLength(key, "utf8") <= 1024 &&
      !key.startsWith("/") &&
      !/[\x00-\x1f\x7f\\]/.test(key) &&
      !key
        .split("/")
        .some(
          (part) =>
            !part || part === "." || part === "..",
        ) &&
      (kind === "image"
        ? /\.(?:webp|png|jpe?g|gif)$/i
        : /\.mp3$/i
      ).test(key)
    );
  }

  publicImageUrl(key: string): string {
    if (!this.validKey("image", key)) {
      throw new BadRequestException(
        "Invalid R2 image key",
      );
    }

    const frontend = process.env.FRONTEND_URL;

    if (!frontend) {
      throw new ServiceUnavailableException(
        "FRONTEND_URL is not configured",
      );
    }

    const url = new URL("/api/r2-image", frontend);
    url.searchParams.set("key", key);

    return url.toString();
  }

  private savedValue(
    kind: R2MediaKind,
    key: string,
  ): string {
    return kind === "image"
      ? this.publicImageUrl(key)
      : `r2://nuggets/${key}`;
  }

  private async listPage(
    kind: R2MediaKind,
    token?: string,
    prefix?: string,
    maxKeys = 100,
  ) {
    this.checkKind(kind);

    if (token && token.length > 4096) {
      throw new BadRequestException(
        "Invalid R2 pagination token",
      );
    }

    try {
      return await this.client().send(
        new ListObjectsV2Command({
          Bucket: this.bucket(kind),
          MaxKeys: maxKeys,
          ...(prefix ? { Prefix: prefix } : {}),
          ...(token
            ? { ContinuationToken: token }
            : {}),
        }),
      );
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      const cause = error as Error & {
        $metadata?: { httpStatusCode?: number };
      };

      console.error("R2 media listing failed", {
        kind,
        name: cause.name,
        message: cause.message,
        status: cause.$metadata?.httpStatusCode,
      });

      throw new BadGatewayException(
        "Could not list files in R2",
      );
    }
  }

  async listFiles(
    kind: R2MediaKind,
    token?: string,
  ) {
    const page = await this.listPage(kind, token);

    const files = (page.Contents ?? [])
      .filter(
        (item) =>
          !!item.Key &&
          this.validKey(kind, item.Key) &&
          (item.Size ?? 0) > 0,
      )
      .map((item) => {
        const key = item.Key as string;

        return {
          key,
          name: key.split("/").pop() ?? key,
          size: item.Size ?? 0,
          reference: `r2://${kind}/${key}`,
          ...(kind === "image"
            ? { url: this.publicImageUrl(key) }
            : {}),
        };
      });

    return {
      files,
      nextContinuationToken: page.IsTruncated
        ? page.NextContinuationToken ?? null
        : null,
    };
  }

  async matchByNumber(
    kind: R2MediaKind,
    number: number,
  ) {
    this.checkKind(kind);

    if (
      !Number.isSafeInteger(number) ||
      number < 1
    ) {
      throw new BadRequestException(
        "Invalid Nugget number",
      );
    }

    const prefix = `BN ${String(number).padStart(4, "0")}`;
    const matches: string[] = [];

    let token: string | undefined;
    let complete = false;

    const seen = new Set<string>();

    for (let page = 0; page < MAX_PAGES; page++) {
      const result = await this.listPage(
        kind,
        token,
        prefix,
        1000,
      );

      for (const item of result.Contents ?? []) {
        if (
          !item.Key ||
          !this.validKey(kind, item.Key) ||
          (item.Size ?? 0) <= 0
        ) {
          continue;
        }

        if (numberFromKey(item.Key) !== number) {
          continue;
        }

        matches.push(
          this.savedValue(kind, item.Key),
        );
      }

      if (matches.length > 1) {
        return {
          status: "multiple",
          matches,
          value: null,
        };
      }

      if (!result.IsTruncated) {
        complete = true;
        break;
      }

      const next = result.NextContinuationToken;

      if (!next || seen.has(next)) {
        throw new ConflictException(
          "Incomplete R2 listing. Retry the match.",
        );
      }

      seen.add(next);
      token = next;
    }

    if (!complete) {
      throw new ConflictException(
        "R2 listing was incomplete. Retry the match.",
      );
    }

    return matches.length === 1
      ? {
          status: "matched",
          matches,
          value: matches[0],
        }
      : {
          status: "not_found",
          matches: [],
          value: null,
        };
  }

  private async index(kind: R2MediaKind) {
    this.checkKind(kind);

    const index = new Map<number, string[]>();

    let token: string | undefined;
    const seen = new Set<string>();
    let complete = false;

    for (let page = 0; page < MAX_PAGES; page++) {
      const result = await this.listPage(
        kind,
        token,
        undefined,
        1000,
      );

      for (const item of result.Contents ?? []) {
        if (
          !item.Key ||
          !this.validKey(kind, item.Key) ||
          (item.Size ?? 0) <= 0
        ) {
          continue;
        }

        const number = numberFromKey(item.Key);

        if (number === null) {
          continue;
        }

        const values = index.get(number) ?? [];

        values.push(
          this.savedValue(kind, item.Key),
        );

        index.set(number, values);
      }

      if (!result.IsTruncated) {
        complete = true;
        break;
      }

      const next = result.NextContinuationToken;

      if (!next || seen.has(next)) {
        throw new ConflictException(
          "R2 returned an incomplete listing.",
        );
      }

      seen.add(next);
      token = next;
    }

    if (!complete) {
      throw new ConflictException(
        "Too many R2 objects for a complete safe scan.",
      );
    }

    return index;
  }

  async preview(kind: R2MediaKind) {
    this.checkKind(kind);

    const nuggets =
      await db.orm.public.Nugget.all();

    if (nuggets.length > MAX_NUGGETS) {
      throw new BadRequestException(
        "More than 5,000 Nuggets. Use smaller batches.",
      );
    }

    const index = await this.index(kind);

    const rows = nuggets
      .slice()
      .sort((a, b) => a.number - b.number)
      .map((nugget) => {
        const existing =
          kind === "image"
            ? nugget.image
            : nugget.nuggetAudioUrl;

        const matches =
          index.get(nugget.number) ?? [];

        const status = existing?.trim()
          ? "already_linked"
          : matches.length === 0
            ? "not_found"
            : matches.length === 1
              ? "matched"
              : "multiple";

        return {
          id: nugget.id,
          number: nugget.number,
          title: nugget.title,
          status,
          value:
            status === "matched"
              ? matches[0]
              : null,
          matches:
            status === "multiple"
              ? matches
              : [],
        };
      });

    return {
      rows,
      summary: {
        total: rows.length,
        matched: rows.filter(
          (row) => row.status === "matched",
        ).length,
        alreadyLinked: rows.filter(
          (row) => row.status === "already_linked",
        ).length,
        multiple: rows.filter(
          (row) => row.status === "multiple",
        ).length,
        notFound: rows.filter(
          (row) => row.status === "not_found",
        ).length,
      },
      maxApplyPerRequest: MAX_APPLY,
    };
  }

  async apply(
    kind: R2MediaKind,
    matches: R2MediaMatch[],
  ) {
    this.checkKind(kind);

    if (
      !Array.isArray(matches) ||
      matches.length < 1 ||
      matches.length > MAX_APPLY ||
      matches.some(
        (item) =>
          !item ||
          typeof item.id !== "string" ||
          !/^[-a-zA-Z0-9_]{1,150}$/.test(
            item.id,
          ) ||
          typeof item.value !== "string" ||
          item.value.length > 2200 ||
          !item.value,
      ) ||
      new Set(
        matches.map((item) => item.id),
      ).size !== matches.length
    ) {
      throw new BadRequestException(
        "Provide 1–500 valid distinct matches",
      );
    }

    // Scan again before writing to the database.
    const index = await this.index(kind);

    return db.transaction(async (tx) => {
      let applied = 0;
      let alreadyLinked = 0;

      const ordered = [...matches].sort(
        (a, b) => a.id.localeCompare(b.id),
      );

      for (const requested of ordered) {
        const nugget =
          await tx.orm.public.Nugget
            .where({ id: requested.id })
            .forUpdate()
            .first();

        if (!nugget) {
          throw new ConflictException(
            "Nugget removed. Nothing was changed. Refresh preview.",
          );
        }

        const existing =
          kind === "image"
            ? nugget.image
            : nugget.nuggetAudioUrl;

        if (existing?.trim()) {
          alreadyLinked++;
          continue;
        }

        const candidates =
          index.get(nugget.number) ?? [];

        if (
          candidates.length !== 1 ||
          candidates[0] !== requested.value
        ) {
          throw new ConflictException(
            "R2 match changed. Nothing was changed. Refresh preview.",
          );
        }

        if (kind === "image") {
          await tx.orm.public.Nugget
            .where({ id: nugget.id })
            .update({
              image: candidates[0],
            });
        } else {
          await tx.orm.public.Nugget
            .where({ id: nugget.id })
            .update({
              nuggetAudioUrl: candidates[0],
            });
        }

        applied++;
      }

      return {
        applied,
        alreadyLinked,
      };
    });
  }

  async signedImageUrl(
    key: string,
  ): Promise<string> {
    if (!this.validKey("image", key)) {
      throw new BadRequestException(
        "Invalid R2 image key",
      );
    }

    return getSignedUrl(
      this.client(),
      new GetObjectCommand({
        Bucket: this.bucket("image"),
        Key: key,
      }),
      { expiresIn: 300 },
    );
  }
}
