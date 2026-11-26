
import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { NuggetsModule } from "./nuggets.module";
import { NuggetsController } from "./nuggets.controller";

describe("NuggetsModule dependency wiring", () => {
  it("resolves NuggetsController with R2AudioService", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [NuggetsModule],
    }).compile();

    expect(
      moduleRef.get(NuggetsController, { strict: false }),
    ).toBeDefined();

    await moduleRef.close();
  });
});
