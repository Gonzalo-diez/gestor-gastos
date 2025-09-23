import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, Body, Req, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { AccessJwtGuard } from '../auth/guards/access-jwt.guard';
import { ImportsService } from './imports.service';
import { PreviewDto } from './dto/preview.dto';
import { ConfirmDto } from './dto/confirm.dto';
import type { Express } from 'express';

const allowed = new Set([
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

@UseGuards(AccessJwtGuard)
@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('preview')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const ok = allowed.has(file.mimetype);
        cb(ok ? null : new BadRequestException('Formato no soportado'), ok);
    },
  }))
  preview(@Req() req: any, @UploadedFile() file: Express.Multer.File, @Body() dto: PreviewDto) {
    if (!file?.buffer) throw new BadRequestException('Archivo requerido');
    return this.importsService.preview(req.user.sub, file, dto);
  }

  @Post('confirm')
  confirm(@Req() req: any, @Body() dto: ConfirmDto) {
    return this.importsService.confirm(req.user.sub, dto);
  }
}