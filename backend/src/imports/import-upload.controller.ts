import {
  BadRequestException,
  Controller,
  Param,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createHash } from 'node:crypto';
import { AdminGuard } from '../auth/admin.guard';
import {
  AdminPermissionGuard,
  RequireAdminPermission,
} from '../auth/admin-permission.guard';
import { AdminIpAllowListGuard } from '../admin/admin-ip-allow-list.guard';
import { AdminAuditInterceptor } from '../audit-logs/admin-audit.interceptor';
import { TopicsService } from '../topics/topics.service';
import { ImportTicketGuard } from './import-ticket';
import { readImportFile } from './import-file';
import { IMPORT_LIMIT } from './import-limits';
import { importHierarchy } from './hierarchy-import';

/** Direct upload avoids the hosting proxy's body-size ceiling. Tickets cannot authenticate other API routes. */
@Controller('admin-imports')
@UseGuards(
  ImportTicketGuard,
  AdminGuard,
  AdminPermissionGuard,
  AdminIpAllowListGuard,
)
@UseInterceptors(AdminAuditInterceptor)
export class ImportUploadController {
  constructor(private readonly topics: TopicsService) {}
  @Post(':kind/:stage')
  @RequireAdminPermission('manageNuggets')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: IMPORT_LIMIT, files: 1 } }),
  )
  async upload(
    @Param('kind') kind: 'topics' | 'nuggets',
    @Param('stage') stage: 'preview' | 'commit',
    @UploadedFile() file: Express.Multer.File,
    @Request() request: any,
  ) {
    const ticket = request.importTicket;
    if (
      !file ||
      file.buffer.length !== ticket.size ||
      createHash('sha256').update(file.buffer).digest('hex') !== ticket.sha256
    )
      throw new BadRequestException(
        'The uploaded file changed. Choose the file and preview again.',
      );
    return importHierarchy(
      await readImportFile(file),
      stage === 'preview',
      kind,
      this.topics,
    );
  }
}
