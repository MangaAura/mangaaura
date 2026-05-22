import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

/**
 * CSP Violation Report Endpoint
 *
 * Receives CSP violation reports from browsers via the `report-uri` directive.
 * Real violations are persisted to the database; extension noise is filtered.
 *
 * The browser sends a POST with Content-Type: application/csp-report
 * containing a JSON body: { "csp-report": { ... } }
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let report: Record<string, unknown> | null = null;

    if (contentType.includes('application/csp-report')) {
      const body = await request.json();
      report = body?.['csp-report'] ?? body;
    } else if (contentType.includes('application/json')) {
      report = await request.json();
    } else {
      try {
        report = await request.json();
      } catch {
        report = { raw: 'Unable to parse report body' };
      }
    }

    const blockedUri = String(report?.['blocked-uri'] ?? report?.blockedUri ?? 'unknown');

    // Filter out noise from browser extensions (chrome-extension://, moz-extension://, etc.)
    const isExtensionNoise =
      blockedUri.startsWith('chrome-extension://') ||
      blockedUri.startsWith('moz-extension://') ||
      blockedUri.startsWith('safari-extension://') ||
      blockedUri.startsWith('ms-browser-extension://');

    const rawLine = report?.['line-number'] ?? report?.lineNumber;
    const rawCol = report?.['column-number'] ?? report?.columnNumber;

    const sanitized = {
      blockedUri,
      violatedDirective: String(report?.['violated-directive'] ?? report?.violatedDirective ?? 'unknown'),
      documentUri: String(report?.['document-uri'] ?? report?.documentUri ?? 'unknown'),
      effectiveDirective: (report?.['effective-directive'] ?? report?.effectiveDirective) as string | undefined,
      originalPolicy: (report?.['original-policy'] ?? report?.originalPolicy) as string | undefined,
      scriptSample: (report?.['script-sample'] ?? report?.scriptSample) as string | undefined,
      sourceFile: (report?.['source-file'] ?? report?.sourceFile) as string | undefined,
      lineNumber: typeof rawLine === 'number' ? rawLine : undefined,
      columnNumber: typeof rawCol === 'number' ? rawCol : undefined,
      disposition: String(report?.disposition ?? 'enforce'),
      isExtensionNoise,
    };

    if (isExtensionNoise) {
      console.info(`[CSP-Report] Extension noise filtered: ${sanitized.violatedDirective} → ${sanitized.blockedUri}`);
    } else {
      // Persist real violations to database
      try {
        await prisma.cspReport.create({
          data: {
            blockedUri: sanitized.blockedUri,
            violatedDirective: sanitized.violatedDirective,
            documentUri: sanitized.documentUri,
            effectiveDirective: sanitized.effectiveDirective,
            originalPolicy: sanitized.originalPolicy,
            scriptSample: sanitized.scriptSample,
            sourceFile: sanitized.sourceFile,
            lineNumber: sanitized.lineNumber,
            columnNumber: sanitized.columnNumber,
            disposition: sanitized.disposition,
            isExtensionNoise: false,
          },
        });
        console.warn('[CSP-Report] Violation persisted:', sanitized.blockedUri, '→', sanitized.violatedDirective);
      } catch (dbError) {
        console.error('[CSP-Report] Failed to persist violation to database:', dbError);
      }
    }

    return NextResponse.json(
      { received: true },
      {
        status: 204,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('[CSP-Report] Failed to process report:', error);
    return NextResponse.json(
      { received: false, error: 'Failed to process report' },
      { status: 400 }
    );
  }
}

/**
 * Some older browsers send CSP reports via GET (non-standard).
 * We accept them gracefully.
 */
export async function GET() {
  return NextResponse.json(
    { message: 'CSP report endpoint — send POST with application/csp-report' },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}

/**
 * Preflight support for browsers that send CORS preflight
 * before the CSP report POST.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
