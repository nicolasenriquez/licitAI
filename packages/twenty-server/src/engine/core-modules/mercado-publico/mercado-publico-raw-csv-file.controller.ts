import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { type Response } from 'express';

import { MercadoPublicoRawCsvFileReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-raw-csv-file-read.service';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@Controller('mercado-publico/raw-csv-files')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard, NoPermissionGuard)
export class MercadoPublicoRawCsvFileController {
  constructor(
    private readonly mercadoPublicoRawCsvFileReadService: MercadoPublicoRawCsvFileReadService,
  ) {}

  @Get(':rawCsvFileId')
  async download(
    @Param('rawCsvFileId') rawCsvFileId: string,
    @Res() response: Response,
  ): Promise<void> {
    const file =
      await this.mercadoPublicoRawCsvFileReadService.open(rawCsvFileId);

    response.setHeader('Content-Type', 'application/octet-stream');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.attachment(file.fileName);
    file.stream.pipe(response);
  }
}
