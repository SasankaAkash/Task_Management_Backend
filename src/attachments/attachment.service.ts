import {
  BadGatewayException, BadRequestException, Injectable, NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';
import { SupabaseService } from '../supabase/supabase.service';

const BUCKET = 'task-attachments';

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  private async assertTaskOwner(taskId: string, userId: string) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, userId } });
    if (!task) throw new NotFoundException('Task not found');
  }

  async upload(userId: string, token: string, taskId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    await this.assertTaskOwner(taskId, userId);

    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${userId}/${taskId}/${randomUUID()}-${safeName}`;
    const client = this.supabase.getClient(token);

    const { error } = await client.storage
      .from(BUCKET)
      .upload(filePath, file.buffer, { contentType: file.mimetype });
    if (error) throw new BadGatewayException(error.message);

    try {
      return await this.prisma.taskAttachment.create({
        data: { taskId, userId, fileName: file.originalname, filePath },
      });
    } catch (e) {
      await client.storage.from(BUCKET).remove([filePath]); // don't leave orphan files
      throw e;
    }
  }

  async list(userId: string, token: string, taskId: string) {
    await this.assertTaskOwner(taskId, userId);
    const rows = await this.prisma.taskAttachment.findMany({
      where: { taskId, userId },
      orderBy: { createdAt: 'desc' },
    });
    const client = this.supabase.getClient(token);
    return Promise.all(
      rows.map(async (r) => {
        const { data } = await client.storage.from(BUCKET).createSignedUrl(r.filePath, 3600);
        return { id: r.id, fileName: r.fileName, createdAt: r.createdAt, url: data?.signedUrl ?? null };
      }),
    );
  }

  async remove(userId: string, token: string, taskId: string, attachmentId: string) {
    const att = await this.prisma.taskAttachment.findFirst({
      where: { id: attachmentId, taskId, userId },
    });
    if (!att) throw new NotFoundException('Attachment not found');

    const { error } = await this.supabase.getClient(token).storage
      .from(BUCKET).remove([att.filePath]);
    if (error) throw new BadGatewayException(error.message);

    await this.prisma.taskAttachment.delete({ where: { id: att.id } });
    return { success: true };
  }
}