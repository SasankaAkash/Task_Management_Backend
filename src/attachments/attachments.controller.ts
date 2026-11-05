import {
  Controller, Delete, Get, Param, ParseUUIDPipe, Post, Req,
  UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { AttachmentsService } from './attachments.service';
// import your existing auth guard here
import { AuthGuard } from '../auth/auth.guard'; 

@ApiBearerAuth()
@Controller({ path: 'tasks/:taskId/attachments', version: '1' })
@UseGuards(/* YourAuthGuard */)
export class AttachmentsController {
  constructor(private readonly service: AttachmentsService) {}

  private token(req: any): string {
    return (req.headers.authorization ?? '').replace('Bearer ', '');
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  upload(
    @Req() req: any,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.upload(req.user.id, this.token(req), taskId, file);
  }

  @Get()
  list(@Req() req: any, @Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.service.list(req.user.id, this.token(req), taskId);
  }

  @Delete(':attachmentId')
  remove(
    @Req() req: any,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
  ) {
    return this.service.remove(req.user.id, this.token(req), taskId, attachmentId);
  }
}