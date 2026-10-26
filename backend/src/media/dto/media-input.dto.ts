import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class SignMediaUploadDto {
  @IsString() @Length(1, 255) originalName: string;
  @IsIn([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/wave',
  ])
  mimeType: string;
  @IsInt() @Min(1) @Max(50 * 1024 * 1024) size: number;
  @IsOptional() @IsInt() @Min(1) folderId?: number;
}
export class CompleteMediaUploadDto {
  @IsString() @Length(1, 4096) token: string;
}
export class SaveMediaUrlDto {
  @IsString() @Length(1, 255) @Matches(/\S/) name: string;
  @IsUrl({ protocols: ['https'], require_protocol: true, disallow_auth: true })
  @Length(1, 2048)
  url: string;
  @IsIn([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'audio/mpeg',
    'audio/wav',
    'audio/mp4',
    'audio/ogg',
    'audio/flac',
  ])
  mimeType: string;
  @IsOptional() @IsInt() @Min(1) folderId?: number;
}
