import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';
import { ConfidenceTier, type Prisma } from '@prisma/client';
import { prisma } from '../src/prisma/prisma.client';

const CSV_PATH = resolve(
  __dirname,
  '../../../docs/datasets/ppuri/ppuri_company_master_mvp.csv',
);
const CHUNK_SIZE = 500;

const TIER_FROM_CSV: Record<string, ConfidenceTier> = {
  A_certified_root: ConfidenceTier.A_CERTIFIED_ROOT,
  B_local_strong_inside: ConfidenceTier.B_LOCAL_STRONG_INSIDE,
  C_borderline_inside: ConfidenceTier.C_BORDERLINE_INSIDE,
  D_low_confidence: ConfidenceTier.D_LOW_CONFIDENCE,
};

const SHORT_TIER: Record<string, ConfidenceTier> = {
  A: ConfidenceTier.A_CERTIFIED_ROOT,
  B: ConfidenceTier.B_LOCAL_STRONG_INSIDE,
  C: ConfidenceTier.C_BORDERLINE_INSIDE,
  D: ConfidenceTier.D_LOW_CONFIDENCE,
};

interface CliArgs {
  dryRun: boolean;
  tiers: Set<ConfidenceTier>;
}

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const tierIdx = args.indexOf('--tier');
  const tierValue = tierIdx >= 0 ? args[tierIdx + 1] : undefined;

  if (tierValue) {
    const tiers = new Set<ConfidenceTier>();
    for (const token of tierValue.split(',')) {
      const tier = SHORT_TIER[token.trim().toUpperCase()];
      if (!tier) {
        throw new Error(
          `Unknown tier short code: '${token}' (expected A|B|C|D)`,
        );
      }
      tiers.add(tier);
    }
    return { dryRun, tiers };
  }

  return {
    dryRun,
    tiers: new Set([
      ConfidenceTier.A_CERTIFIED_ROOT,
      ConfidenceTier.B_LOCAL_STRONG_INSIDE,
    ]),
  };
}

function emptyToNull(value: string | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function parseFloatOrNull(value: string | undefined): number | null {
  const trimmed = emptyToNull(value);
  if (trimmed == null) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function rowToCreateInput(
  row: Record<string, string>,
): Prisma.CompanyCreateManyInput | null {
  const externalId = emptyToNull(row.company_id);
  if (!externalId) return null;

  const name = emptyToNull(row.name_raw) ?? emptyToNull(row.name_norm);
  if (!name) return null;

  const tier = TIER_FROM_CSV[row.confidence_tier];
  if (!tier) return null;

  return {
    externalId,
    name,
    industry: emptyToNull(row.industry_code),
    region: emptyToNull(row.region),
    confidenceTier: tier,
    processHint: emptyToNull(row.process_hint),
    address: emptyToNull(row.address_raw),
    lat: parseFloatOrNull(row.lat),
    lng: parseFloatOrNull(row.lng),
    kakaoId: emptyToNull(row.kakao_id),
    representative: emptyToNull(row.representative),
    contactPhone: emptyToNull(row.phone),
    sourceTypes:
      emptyToNull(row.source_types)?.split('|').filter(Boolean) ?? [],
  };
}

async function main(): Promise<void> {
  const { dryRun, tiers } = parseArgs(process.argv);

  if (!existsSync(CSV_PATH)) {
    throw new Error(
      `CSV not found at ${CSV_PATH}. The Ppuri dataset is .gitignored; place it locally before running.`,
    );
  }

  const tierList = [...tiers].sort().join(', ');
  console.log(`[seed-ppuri] tier filter: ${tierList}`);
  console.log(`[seed-ppuri] reading: ${CSV_PATH}`);

  const buffer = readFileSync(CSV_PATH);
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  }) as Record<string, string>[];

  console.log(`[seed-ppuri] csv rows: ${records.length}`);

  const candidates: Prisma.CompanyCreateManyInput[] = [];
  let skippedTier = 0;
  let skippedInvalid = 0;

  for (const row of records) {
    const tier = TIER_FROM_CSV[row.confidence_tier];
    if (!tier || !tiers.has(tier)) {
      skippedTier++;
      continue;
    }
    const input = rowToCreateInput(row);
    if (!input) {
      skippedInvalid++;
      continue;
    }
    candidates.push(input);
  }

  console.log(
    `[seed-ppuri] candidates: ${candidates.length} (skipped tier=${skippedTier}, invalid=${skippedInvalid})`,
  );

  if (dryRun) {
    console.log('[seed-ppuri] --dry-run: skipping DB write');
    return;
  }

  let inserted = 0;
  const chunkCount = Math.ceil(candidates.length / CHUNK_SIZE);

  for (let i = 0; i < candidates.length; i += CHUNK_SIZE) {
    const chunk = candidates.slice(i, i + CHUNK_SIZE);
    const result = await prisma.company.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    inserted += result.count;
    const chunkIndex = Math.floor(i / CHUNK_SIZE) + 1;
    console.log(
      `[seed-ppuri] chunk ${chunkIndex}/${chunkCount}: +${result.count} (cumulative ${inserted})`,
    );
  }

  console.log(
    `[seed-ppuri] done. inserted=${inserted}, candidates=${candidates.length}`,
  );
}

main()
  .catch((err: unknown) => {
    console.error('[seed-ppuri] FAIL:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
