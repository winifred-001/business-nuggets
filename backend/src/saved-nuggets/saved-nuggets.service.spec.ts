import { Test, TestingModule } from '@nestjs/testing';
import { SavedNuggetsService } from './saved-nuggets.service';

describe('SavedNuggetsService', () => {
  let service: SavedNuggetsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SavedNuggetsService],
    }).compile();

    service = module.get<SavedNuggetsService>(SavedNuggetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
