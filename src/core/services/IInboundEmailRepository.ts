export type InboundEmailIntent =
  | 'comment_reply'
  | 'support'
  | 'report'
  | 'unsubscribe'
  | 'spam'
  | 'unknown'

export interface InboundAttachment {
  filename: string
  content: Buffer
  mimeType: string
}

export interface InboundEmailData {
  messageId: string
  fromEmail: string
  fromName: string | null
  toEmails: string[]
  subject: string
  textBody: string
  htmlBody: string | null
  attachments: InboundAttachment[]
  receivedAt: Date
  headers: Record<string, string>
}

export interface EmailClassification {
  intent: InboundEmailIntent
  confidence: number
  requiresHuman: boolean
  suggestedResponse: string | null
  extractedUserId: string | null
  extractedMangaSlug: string | null
  extractedCommentId: string | null
}

export interface InboundActionResult {
  action: 'replied' | 'forwarded' | 'processed' | 'ignored'
  intent: InboundEmailIntent
  confidence: number
  responseSent: boolean
  ticketCreated: boolean
  loggedId: string
}

export interface IInboundEmailRepository {
  classifyEmail(email: InboundEmailData): Promise<EmailClassification>
  processEmail(email: InboundEmailData, classification: EmailClassification): Promise<InboundActionResult>
  fetchEmailContent(providerMessageId: string): Promise<InboundEmailData | null>
}
