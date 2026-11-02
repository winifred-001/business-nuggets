import { Module } from "@nestjs/common";

import { ScriptureVersesService } from "./scripture-verses.service";
import { ScriptureService } from "./scripture.service";

@Module({
  providers: [
    ScriptureService,
    ScriptureVersesService,
  ],

  exports: [
    ScriptureService,
    ScriptureVersesService,
  ],
})
export class ScriptureModule {}