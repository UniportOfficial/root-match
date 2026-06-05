-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "document_id" TEXT,
    "contract_id" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_payload_hash_key" ON "webhook_events"("payload_hash");

-- CreateIndex
CREATE INDEX "webhook_events_document_id_idx" ON "webhook_events"("document_id");

-- CreateIndex
CREATE INDEX "webhook_events_contract_id_idx" ON "webhook_events"("contract_id");

-- CreateIndex
CREATE INDEX "webhook_events_received_at_idx" ON "webhook_events"("received_at");
