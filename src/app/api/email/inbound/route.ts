import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { ResendInboundRepository } from '@/infrastructure/adapters/ResendInboundRepository'
import { getInboundEmailQueue } from '@/infrastructure/queue/InboundEmailQueue'
import type { InboundEmailData } from '@/core/services/IInboundEmailRepository'

const webhookSchema = z.object({
  type: z.literal('email.received'),
  data: z.object({
    from: z.string(),
    to: z.array(z.string()),
    subject: z.string(),
    html: z.string().nullable(),
    text: z.string(),
    attachments: z.array(z.object({
      filename: z.string(),
      content: z.string(),
      content_type: z.string(),
    })).optional().default([]),
    headers: z.record(z.string(), z.string()).optional().default({}),
    message_id: z.string(),
    created_at: z.string(),
  }),
})

const inboundRepo = new ResendInboundRepository()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = webhookSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid webhook payload', details: parsed.error.flatten() }, { status: 400 })
    }

    const email: InboundEmailData = inboundRepo.parseWebhookPayload(parsed.data as any)
    const queue = getInboundEmailQueue()
    await queue.addClassifyJob(email)

    return NextResponse.json({ success: true, message: 'Email received and queued for processing' })
  } catch (error) {
    console.error('[InboundEmail] Error processing webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
