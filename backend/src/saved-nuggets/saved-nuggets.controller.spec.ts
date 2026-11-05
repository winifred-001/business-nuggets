import { Test, TestingModule } from '@nestjs/testing';
import { SavedNuggetsController } from './saved-nuggets.controller';

describe('SavedNuggetsController', () => {
  let controller: SavedNuggetsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SavedNuggetsController],
    }).compile();

    controller = module.get<SavedNuggetsController>(SavedNuggetsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
