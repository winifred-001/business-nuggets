import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { SessionsService } from '../auth/sessions.service';
import { IsIn, IsInt, IsString, Matches, Max, Min } from 'class-validator';
import { IMPORT_LIMIT } from './import-limits';

export class ImportTicketDto {
  @IsIn(['topics', 'nuggets']) kind!: 'topics' | 'nuggets';
  @IsIn(['preview', 'commit']) stage!: 'preview' | 'commit';
  @IsInt() @Min(1) @Max(IMPORT_LIMIT) size!: number;
  @IsString() @Matches(/^[a-f0-9]{64}$/) sha256!: string;
}
type Ticket = ImportTicketDto & {
  sub: number;
  sessionId: number;
  expiresAt: number;
};
function signature(payload: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret)
    throw new UnauthorizedException('Import signing is unavailable.');
  return createHmac('sha256', secret)
    .update(`business-nuggets-import-v1:${payload}`)
    .digest('base64url');
}
export function issueImportTicket(
  input: ImportTicketDto,
  user: { sub: number; sessionId: number },
) {
  const payload = Buffer.from(
    JSON.stringify({
      ...input,
      sub: user.sub,
      sessionId: user.sessionId,
      expiresAt: Date.now() + 5 * 60 * 1000,
    } satisfies Ticket),
  ).toString('base64url');
  return { ticket: `${payload}.${signature(payload)}` };
}
export function verifyImportTicket(token: string): Ticket {
  try {
    if (token.length > 2000) throw new Error();
    const [payload, supplied, extra] = token.split('.');
    if (!payload || !supplied || extra) throw new Error();
    const expected = signature(payload);
    if (
      supplied.length !== expected.length ||
      !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
    )
      throw new Error();
    const data = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as Ticket;
    if (
      !Number.isInteger(data.sub) ||
      data.sub < 1 ||
      !Number.isInteger(data.sessionId) ||
      data.sessionId < 1 ||
      !Number.isFinite(data.expiresAt) ||
      data.expiresAt < Date.now() ||
      data.expiresAt > Date.now() + 5 * 60 * 1000 ||
      !['topics', 'nuggets'].includes(data.kind) ||
      !['preview', 'commit'].includes(data.stage) ||
      !Number.isInteger(data.size) ||
      data.size < 1 ||
      data.size > IMPORT_LIMIT ||
      !/^[a-f0-9]{64}$/.test(data.sha256)
    )
      throw new Error();
    return data;
  } catch {
    throw new UnauthorizedException(
      'Import authorization expired or is invalid. Preview the file again.',
    );
  }
}
@Injectable()
export class ImportTicketGuard implements CanActivate {
  constructor(private readonly sessions: SessionsService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const header = String(request.headers.authorization || '');
    if (!header.startsWith('Bearer '))
      throw new UnauthorizedException('Import authorization is required.');
    const data = verifyImportTicket(header.slice(7));
    if (
      data.kind !== request.params.kind ||
      data.stage !== request.params.stage
    )
      throw new UnauthorizedException(
        'Import authorization does not match this operation.',
      );
    await this.sessions.validateSession(data.sessionId, data.sub);
    const user = await this.sessions.getAuthenticatedUser(data.sub);
    request.user = { ...user, sub: user.id, sessionId: data.sessionId };
    request.importTicket = data;
    return true;
  }
}
