import type {
  IInboundEmailRepository,
  InboundEmailData,
  EmailClassification,
  InboundActionResult,
} from './IInboundEmailRepository'
import type { IAProvider } from './IAProvider'

export class InboundEmailService {
  constructor(
    private readonly inboundRepo: IInboundEmailRepository,
    private readonly aiProvider: IAProvider
  ) {}

  async handleInbound(email: InboundEmailData): Promise<InboundActionResult> {
    const classification = await this.inboundRepo.classifyEmail(email)

    if (classification.intent === 'spam' && classification.confidence > 0.8) {
      return this.inboundRepo.processEmail(email, classification)
    }

    return this.inboundRepo.processEmail(email, classification)
  }

  async handleWithAI(email: InboundEmailData): Promise<EmailClassification> {
    const aiResult = await this.aiProvider.classifyEmailIntent({
      subject: email.subject,
      body: email.textBody,
      fromEmail: email.fromEmail,
    })

    return {
      intent: aiResult.intent,
      confidence: aiResult.confidence,
      requiresHuman: aiResult.requiresHuman,
      suggestedResponse: aiResult.suggestedResponse ?? null,
      extractedUserId: aiResult.extractedEntities?.userId ?? null,
      extractedMangaSlug: aiResult.extractedEntities?.mangaSlug ?? null,
      extractedCommentId: aiResult.extractedEntities?.commentId ?? null,
    }
  }
}
