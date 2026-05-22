-- CreateTable
CREATE TABLE "CspReport" (
    "id" TEXT NOT NULL,
    "blockedUri" TEXT NOT NULL,
    "violatedDirective" TEXT NOT NULL,
    "documentUri" TEXT NOT NULL,
    "effectiveDirective" TEXT,
    "originalPolicy" TEXT,
    "scriptSample" TEXT,
    "sourceFile" TEXT,
    "lineNumber" INTEGER,
    "columnNumber" INTEGER,
    "disposition" TEXT NOT NULL DEFAULT 'enforce',
    "isExtensionNoise" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CspReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CspReport_violatedDirective_idx" ON "CspReport"("violatedDirective");

-- CreateIndex
CREATE INDEX "CspReport_isExtensionNoise_idx" ON "CspReport"("isExtensionNoise");

-- CreateIndex
CREATE INDEX "CspReport_createdAt_idx" ON "CspReport"("createdAt");

-- CreateIndex
CREATE INDEX "CspReport_disposition_idx" ON "CspReport"("disposition");
