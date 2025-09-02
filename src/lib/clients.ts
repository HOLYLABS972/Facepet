// lib/clients.ts
import { Client as QStashClient } from '@upstash/qstash';
import { Client as WorkflowClient } from '@upstash/workflow';

export const workflowClient = new WorkflowClient({
  baseUrl: process.env.QSTASH_URL!,
  token: process.env.QSTASH_TOKEN!
});

export const qstashClient = new QStashClient({
  token: process.env.QSTASH_TOKEN!
});
