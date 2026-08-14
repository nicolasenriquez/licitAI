import crypto from 'crypto';

import { Logger } from '@nestjs/common';

import { Command, CommandRunner, Option } from 'nest-commander';

import {
  MERCADO_PUBLICO_SUPPORTED_JOB_NAMES_TEXT,
  type MercadoPublicoJobName,
  isMercadoPublicoJobName,
} from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import {
  MercadoPublicoJob,
  type MercadoPublicoJobData,
} from 'src/engine/core-modules/mercado-publico/jobs/mercado-publico.job';
import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';

type MercadoPublicoRunCommandOptions = {
  jobName: MercadoPublicoJobName;
  payload?: Record<string, unknown>;
};

@Command({
  name: 'mercado-publico:run',
  description:
    'Enqueue an internal Mercado Publico ingestion backbone job for manual phase-1 execution',
})
export class MercadoPublicoRunCommand extends CommandRunner {
  private readonly logger = new Logger(MercadoPublicoRunCommand.name);

  constructor(
    @InjectMessageQueue(MessageQueue.mercadoPublicoQueue)
    private readonly messageQueueService: MessageQueueService,
    private readonly mercadoPublicoConfigService: MercadoPublicoConfigService,
  ) {
    super();
  }

  async run(
    _passedParam: string[],
    options: MercadoPublicoRunCommandOptions,
  ): Promise<void> {
    const payload = options.payload ?? {};
    const settings = this.mercadoPublicoConfigService.getSettings();

    await this.messageQueueService.add<MercadoPublicoJobData>(
      MercadoPublicoJob.name,
      {
        jobName: options.jobName,
        payload,
        executionKey: crypto.randomUUID(),
        requestedAt: new Date().toISOString(),
        requestedBy: 'command',
      },
      {
        retryLimit: settings.httpMaxRetries,
        backoff: {
          type: 'fixed',
          delay: settings.httpRetryBackoffMs,
        },
      },
    );

    this.logger.log(
      `Enqueued Mercado Publico job "${options.jobName}" with payload keys: ${Object.keys(payload).join(', ') || 'none'}`,
    );
  }

  @Option({
    flags: '-j, --job-name <job_name>',
    description: `Mercado Publico job to enqueue. Supported: ${MERCADO_PUBLICO_SUPPORTED_JOB_NAMES_TEXT}`,
    required: true,
  })
  parseJobName(value: string): MercadoPublicoJobName {
    if (!isMercadoPublicoJobName(value)) {
      throw new Error(
        `Unsupported Mercado Publico job "${value}". Supported jobs: ${MERCADO_PUBLICO_SUPPORTED_JOB_NAMES_TEXT}`,
      );
    }

    return value;
  }

  @Option({
    flags: '-p, --payload [json_payload]',
    description:
      'Optional JSON object payload forwarded to the Mercado Publico job orchestrator',
    required: false,
  })
  parsePayload(value: string): Record<string, unknown> {
    const parsedValue = JSON.parse(value) as unknown;

    if (
      typeof parsedValue !== 'object' ||
      parsedValue === null ||
      Array.isArray(parsedValue)
    ) {
      throw new Error('Mercado Publico payload must be a JSON object');
    }

    return parsedValue as Record<string, unknown>;
  }
}
