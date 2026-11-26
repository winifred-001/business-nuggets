import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
export class BulkContentDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5000)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(150, { each: true })
  @Matches(/^[a-zA-Z0-9_-]+$/, { each: true })
  ids!: string[];
  @IsIn(['delete', 'show', 'hide', 'publish', 'draft', 'feature', 'unfeature', 'gold', 'free'])
  action!:
    'delete' | 'show' | 'hide' | 'publish' | 'draft' | 'feature' | 'unfeature' | 'gold' | 'free';
}
