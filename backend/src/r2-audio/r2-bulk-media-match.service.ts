import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { db } from '../prisma/db';
import { R2AudioService } from './r2-audio.service';

export type R2MediaKind = 'nuggets' | 'images';
export type ApplyMediaMatch = { id: string; reference: string };
type MatchStatus = 'matched' | 'already_linked' | 'multiple' | 'not_found';

const MAX_R2_PAGES = 200;
const MAX_NUGGETS = 5000;
const MAX_APPLY = 500;

// Supports "BN 0109 ...", "Nugget 109 ..." and "0109 ...".
// Only consider a number at the START of the basename, never numbers in titles.
export function mediaNumberFromKey(key: string): number | null {
  const basename = key.split('/').pop() ?? '';
  const match = /^(?:(?:BN|NUGGETS?|BUSINESS[\s._-]*NUGGETS?)[\s._-]*)?0*(\d+)(?=[\s._-]|$)/i.exec(basename);
  if (!match) return null;
  const number = Number(match[1]);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function validateKind(kind: R2MediaKind): void {
  if (kind !== 'nuggets' && kind !== 'images') {
    throw new BadRequestException('Invalid R2 matching category');
  }
}

@Injectable()
export class R2BulkMediaMatchService {
  constructor(private readonly r2: R2AudioService) {}

  private async index(kind: R2MediaKind): Promise<Map<number, string[]>> {
    validateKind(kind);
    const index = new Map<number, string[]>();
    let token: string | undefined;
    const seenTokens = new Set<string>();
    let complete = false;

    for (let pageIndex = 0; pageIndex < MAX_R2_PAGES; pageIndex++) {
      const page = await this.r2.listFiles(kind, token);
      for (const file of page.files) {
        const number = mediaNumberFromKey(file.key);
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
      token = page.nextContinuationToken;
      seenTokens.add(token);
    }
    if (!complete) {
      throw new ConflictException('R2 scan incomplete. No Nuggets were modified.');
    }
    return index;
  }

  async matchByNumber(kind: R2MediaKind, number: number) {
    validateKind(kind);
    if (!Number.isSafeInteger(number) || number <= 0) {
      throw new BadRequestException('Invalid Nugget number');
    }
    const matches = (await this.index(kind)).get(number) ?? [];
    if (matches.length === 0) return { status: 'not_found' as const, matches };
    if (matches.length > 1) return { status: 'multiple' as const, matches };
    return { status: 'matched' as const, reference: matches[0], matches };
  }

  async preview(kind: R2MediaKind) {
    validateKind(kind);
    const nuggets = await db.orm.public.Nugget.all();
    if (nuggets.length > MAX_NUGGETS) {
      throw new BadRequestException('More than 5,000 Nuggets found. Please use smaller batches.');
    }
    const files = await this.index(kind);
    const rows = nuggets.slice().sort((a, b) => a.number - b.number).map((nugget) => {
      const links = files.get(nugget.number) ?? [];
      const alreadyLinked = kind === 'images' ? Boolean(nugget.image?.trim()) : Boolean(nugget.nuggetAudioUrl?.trim());
      const status: MatchStatus = alreadyLinked ? 'already_linked'
        : links.length === 0 ? 'not_found'
        : links.length === 1 ? 'matched' : 'multiple';
      return {
        id: nugget.id,
        number: nugget.number,
        title: nugget.title,
        status,
        reference: status === 'matched' ? links[0] : null,
        matches: status === 'multiple' ? links : [],
      };
    });
    return {
      kind,
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

  async apply(kind: R2MediaKind, matches: ApplyMediaMatch[]) {
    validateKind(kind);
    if (!Array.isArray(matches) || matches.length < 1 || matches.length > MAX_APPLY ||
        matches.some((item) =>
          !item || typeof item.id !== 'string' ||
          !/^[-a-zA-Z0-9_]{1,150}$/.test(item.id) ||
          typeof item.reference !== 'string' || item.reference.length > 1400 ||
          (kind === 'nuggets'
            ? !/^r2:\/\/nuggets\/.+\.mp3$/i.test(item.reference)
            : !item.reference.startsWith('/api/r2-image?key=')
          ),
        ) || new Set(matches.map((item) => item.id)).size !== matches.length
    ) {
      throw new BadRequestException('Provide 1–500 distinct, valid media matches.');
    }

    // Reindex before applying, then verify the current DB state under row locks.
    const index = await this.index(kind);
    return db.transaction(async (tx) => {
      let applied = 0;
      let alreadyLinked = 0;
      for (const requested of [...matches].sort((a, b) => a.id.localeCompare(b.id))) {
        const nugget = await tx.orm.public.Nugget.where({ id: requested.id }).forUpdate().first();
        if (!nugget) {
          throw new ConflictException('A Nugget was deleted after preview. Refresh and retry. Nothing changed.');
        }
        const assigned = kind === 'images' ? nugget.image : nugget.nuggetAudioUrl;
        if (assigned?.trim()) {
          alreadyLinked++;
          continue;
        }
        const candidates = index.get(nugget.number) ?? [];
        if (candidates.length !== 1 || candidates[0] !== requested.reference) {
          throw new ConflictException(
            `The ${kind} match for BN ${String(nugget.number).padStart(4, '0')} changed. Refresh preview. Nothing changed.`,
          );
        }
        if (kind === 'images') {
          await tx.orm.public.Nugget.where({ id: nugget.id }).update({ image: candidates[0] });
        } else {
          await tx.orm.public.Nugget.where({ id: nugget.id }).update({ nuggetAudioUrl: candidates[0] });
        }
        applied++;
      }
      return { applied, alreadyLinked };
    });
  }
}
