import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { db } from '../prisma/db';
import { R2AudioService } from './r2-audio.service';

export type R2SongMatchRow = {
  id: string;
  number: number;
  title: string;
  status: 'matched' | 'already_linked' | 'multiple' | 'not_found';
  reference: string | null;
  matches: string[];
};

export type ApplyR2SongMatch = { id: string; reference: string };

const MAX_R2_PAGES = 200;
const MAX_NUGGETS = 5000;
const MAX_APPLY = 500;

// Match only the BN number at the START of the filename. Reject cases
// such as BN 01090 for nugget 109, and do not infer numbers from titles.
export function songNumberFromKey(key: string): number | null {
  const filename = key.split('/').pop() ?? '';
  const match = /^BN[\s._-]+0*(\d+)(?=[\s._-]|$)/i.exec(filename);
  if (!match) return null;
  const number = Number(match[1]);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

@Injectable()
export class R2BulkSongMatchService {
  constructor(private readonly r2Audio: R2AudioService) {}

  // Read the entire song bucket using the existing authenticated R2 client.
  // Never trust a partial scan: later pages could contain duplicate songs.
  private async indexSongs(): Promise<Map<number, string[]>> {
    const index = new Map<number, string[]>();
    let token: string | undefined;
    const seenTokens = new Set<string>();
    let complete = false;

    for (let pageNumber = 0; pageNumber < MAX_R2_PAGES; pageNumber++) {
      const page = await this.r2Audio.listFiles('song', token);

      for (const file of page.files) {
        const number = songNumberFromKey(file.key);
        if (number === null) continue;
        const matches = index.get(number) ?? [];
        matches.push(file.reference);
        index.set(number, matches);
      }

      if (!page.nextContinuationToken) {
        complete = true;
        break;
      }

      if (seenTokens.has(page.nextContinuationToken)) {
        throw new ConflictException('R2 returned a repeated page. Please retry.');
      }

      seenTokens.add(page.nextContinuationToken);
      token = page.nextContinuationToken;
    }

    if (!complete) {
      throw new ConflictException(
        'There are too many R2 files for a safe complete scan. No Nuggets were changed.',
      );
    }

    return index;
  }

  async preview() {
    const nuggets = await db.orm.public.Nugget.all();
    if (nuggets.length > MAX_NUGGETS) {
      throw new BadRequestException(
        'More than 5,000 Nuggets found. Use smaller batches before running bulk matching.',
      );
    }

    const songs = await this.indexSongs();
    const rows: R2SongMatchRow[] = nuggets
      .slice()
      .sort((a, b) => a.number - b.number)
      .map((nugget) => {
        const matches = songs.get(nugget.number) ?? [];
        const status: R2SongMatchRow['status'] = nugget.audioUrl?.trim()
          ? 'already_linked'
          : matches.length === 0
            ? 'not_found'
            : matches.length === 1
              ? 'matched'
              : 'multiple';

        return {
          id: nugget.id,
          number: nugget.number,
          title: nugget.title,
          status,
          reference: status === 'matched' ? matches[0] : null,
          matches: status === 'multiple' ? matches : [],
        };
      });

    return {
      rows,
      summary: {
        total: rows.length,
        matched: rows.filter((row) => row.status === 'matched').length,
        alreadyLinked: rows.filter((row) => row.status === 'already_linked').length,
        multiple: rows.filter((row) => row.status === 'multiple').length,
        notFound: rows.filter((row) => row.status === 'not_found').length,
      },
      maxApplyPerRequest: MAX_APPLY,
    };
  }

  async apply(matches: ApplyR2SongMatch[]) {
    if (
      !Array.isArray(matches) ||
      matches.length < 1 ||
      matches.length > MAX_APPLY ||
      matches.some(
        (match) =>
          !match ||
          typeof match.id !== 'string' ||
          !/^[-a-zA-Z0-9_]{1,150}$/.test(match.id) ||
          typeof match.reference !== 'string' ||
          !/^r2:\/\/song\/.+\.mp3$/i.test(match.reference),
      ) ||
      new Set(matches.map((match) => match.id)).size !== matches.length
    ) {
      throw new BadRequestException('Provide 1–500 distinct, valid Nugget matches.');
    }

    // Re-scan on apply; never trust a reference provided by the browser.
    const songs = await this.indexSongs();

    // Lock the selected records and re-check their current value. If any
    // candidate changed, roll back the entire batch instead of guessing.
    return db.transaction(async (tx) => {
      let applied = 0;
      let alreadyLinked = 0;

      for (const requested of [...matches].sort((a, b) => a.id.localeCompare(b.id))) {
        const nugget = await tx.orm.public.Nugget
          .where({ id: requested.id })
          .forUpdate()
          .first();

        if (!nugget) {
          throw new ConflictException(
            'A Nugget was removed after the preview. Refresh and retry. Nothing was changed.',
          );
        }

        if (nugget.audioUrl?.trim()) {
          alreadyLinked++;
          continue;
        }

        const candidates = songs.get(nugget.number) ?? [];
        if (candidates.length !== 1 || candidates[0] !== requested.reference) {
          throw new ConflictException(
            `The song match for BN ${String(nugget.number).padStart(4, '0')} changed. Refresh the preview. Nothing was changed.`,
          );
        }

        await tx.orm.public.Nugget
          .where({ id: nugget.id })
          .update({ audioUrl: candidates[0] });
        applied++;
      }

      return { applied, alreadyLinked };
    });
  }
}
