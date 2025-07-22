import amqp, { Channel, ChannelModel } from 'amqplib';
import { envConfig, RabbitMqConfigType } from '../../settings/env-config';
import { winstonLogger } from '../../logger/winston.logger';
import { Logger } from 'winston';

export class RabbitMqService {
  private connection: ChannelModel;
  private channel: Channel;
  private rabbitMqConfig: RabbitMqConfigType;
  private readonly logger: Logger = winstonLogger(RabbitMqService.name);

  constructor() {
    this.rabbitMqConfig = envConfig.rabbitMqConfig;
  }

  async connect(): Promise<void> {
    this.connection = await amqp.connect(this.rabbitMqConfig.hostUrl);
    this.channel = await this.connection.createChannel();
    this.logger.info('RabbitMQ successfully connected');
  }

  async createQueue(queueName: string): Promise<void> {
    await this.channel.assertQueue(queueName, { durable: true });
  }

  async sendToQueue<T>(queueName: string, message: T): Promise<void> {
    const msgBuffer = Buffer.from(JSON.stringify(message));
    this.channel.sendToQueue(queueName, msgBuffer, { persistent: true });
  }

  async close(): Promise<void> {
    await this.channel.close();
    await this.connection.close();
    this.logger.info('RabbitMQ connection closed');
  }
}
