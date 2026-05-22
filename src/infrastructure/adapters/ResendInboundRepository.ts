import type {
  IInboundEmailRepository,
  InboundEmailData,
  InboundAttachment,
  EmailClassification,
  InboundActionResult,
} from '@/core/services/IInboundEmailRepository'
import { prisma } from '@/lib/prisma'

interface ResendWebhookPayload {
  type: 'email.received'
  data: {
    from: string
    to: string[]
    subject: string
    html: string | null
    text: string
    attachments: Array<{
      filename: string
      content: string
      content_type: string
    }>
    headers: Record<string, string>
    message_id: string
    created_at: string
  }
}

export class ResendInboundRepository implements IInboundEmailRepository {
  async classifyEmail(_email: InboundEmailData): Promise<EmailClassification> {
    return {
      intent: 'unknown',
      confidence: 0,
      requiresHuman: true,
      suggestedResponse: null,
      extractedUserId: null,
      extractedMangaSlug: null,
      extractedCommentId: null,
    }
  }

  async processEmail(
    email: InboundEmailData,
    classification: EmailClassification
  ): Promise<InboundActionResult> {
    const record = await prisma.inboundEmail.create({
      data: {
        messageId: email.messageId,
        fromEmail: email.fromEmail,
        fromName: email.fromName,
        toEmail: email.toEmails.join(', '),
        subject: email.subject,
        textBody: email.textBody.slice(0, 10000),
        htmlBody: email.htmlBody?.slice(0, 50000) ?? null,
        intent: classification.intent,
        confidence: classification.confidence,
        action: 'processed',
        userId: classification.extractedUserId,
        metadata: JSON.stringify({
          extractedMangaSlug: classification.extractedMangaSlug,
          extractedCommentId: classification.extractedCommentId,
          suggestedResponse: classification.suggestedResponse,
        }),
      },
    })

    return {
      action: 'processed',
      intent: classification.intent,
      confidence: classification.confidence,
      responseSent: false,
      ticketCreated: false,
      loggedId: record.id,
    }
  }

  async fetchEmailContent(providerMessageId: string): Promise<InboundEmailData | null> {
    const record = await prisma.inboundEmail.findUnique({
      where: { messageId: providerMessageId },
    })
    if (!record) return null

    return {
      messageId: record.messageId,
      fromEmail: record.fromEmail,
      fromName: record.fromName,
      toEmails: record.toEmail.split(', '),
      subject: record.subject,
      textBody: record.textBody,
      htmlBody: record.htmlBody,
      attachments: [],
      receivedAt: record.createdAt,
      headers: {},
    }
  }

  parseWebhookPayload(payload: ResendWebhookPayload): InboundEmailData {
    const data = payload.data
    const fromParts = data.from.match(/^(?:"?([^"<]+)"?\s*)?<?([^>]+)>?$/) || [, , data.from]

    return {
      messageId: data.message_id,
      fromEmail: fromParts[2] || data.from,
      fromName: fromParts[1]?.trim() || null,
      toEmails: data.to,
      subject: data.subject,
      textBody: data.text,
      htmlBody: data.html,
      attachments: (data.attachments || []).map(
        (att): InboundAttachment => ({
          filename: att.filename,
          content: Buffer.from(att.content, 'base64'),
          mimeType: att.content_type,
        })
      ),
      receivedAt: new Date(data.created_at),
      headers: data.headers,
    }
  }
}
