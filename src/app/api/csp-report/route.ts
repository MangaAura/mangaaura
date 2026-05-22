import { NextRequest, NextResponse } from 'next/server';

/**
 * CSP Violation Report Endpoint
 *
 * Receives CSP violation reports from browsers via the `report-uri` directive.
 * Violations are logged for monitoring without exposing sensitive data.
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
      // Some browsers send plain text or other formats — attempt to parse anyway
      try {
        report = await request.json();
      } catch {
        report = { raw: 'Unable to parse report body' };
      }
    }

    // Log only relevant fields (sanitize to avoid logging PII)
    const sanitized = {
      blockedUri: report?.['blocked-uri'] ?? report?.blockedUri ?? 'unknown',
      violatedDirective: report?.['violated-directive'] ?? report?.violatedDirective ?? 'unknown',
      documentUri: report?.['document-uri'] ?? report?.documentUri ?? 'unknown',
      effectiveDirective: report?.['effective-directive'] ?? report?.effectiveDirective ?? undefined,
      originalPolicy: report?.['original-policy'] ?? report?.originalPolicy ?? undefined,
      scriptSample: report?.['script-sample'] ?? report?.scriptSample ?? undefined,
      sourceFile: report?.['source-file'] ?? report?.sourceFile ?? undefined,
      lineNumber: report?.['line-number'] ?? report?.lineNumber ?? undefined,
      columnNumber: report?.['column-number'] ?? report?.columnNumber ?? undefined,
      disposition: report?.disposition ?? 'enforce',
      timestamp: new Date().toISOString(),
    };

    // Filter out noise from browser extensions (chrome-extension://, moz-extension://, etc.)
    const blockedUri = String(sanitized.blockedUri);
    const isExtensionNoise =
      blockedUri.startsWith('chrome-extension://') ||
      blockedUri.startsWith('moz-extension://') ||
      blockedUri.startsWith('safari-extension://') ||
      blockedUri.startsWith('ms-browser-extension://');

    if (isExtensionNoise) {
      // Silently acknowledge but don't log extension noise at warn level
      console.info(`[CSP-Report] Extension noise ignored: ${sanitized.violatedDirective} → ${sanitized.blockedUri}`);
    } else {
      console.warn('[CSP-Report] Violation:', JSON.stringify(sanitized));
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
