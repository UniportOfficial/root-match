/**
 * Schema snapshot guard — detects accidental schema.prisma drift.
 * Sub-step 2 per .sisyphus/plans/phase-1-w2.md §7.1.3.
 *
 * HOW TO UPDATE:
 *   1. After intentional schema changes run:
 *        node -e "const {createHash}=require('crypto'),{readFileSync}=require('fs');
 *                 console.log(createHash('sha256').update(readFileSync('prisma/schema.prisma')).digest('hex'))"
 *      from apps/api/
 *   2. Paste the output as EXPECTED_CHECKSUM below.
 */

import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

const EXPECTED_CHECKSUM =
  '6e09a736ffc5ee780337c05dd8545d829af323fd22a233d0351095e87afb1ac4';

describe('schema.prisma snapshot guard', () => {
  it('schema checksum matches committed value (prevents accidental drift)', () => {
    const schemaPath = join(__dirname, '..', 'prisma', 'schema.prisma');
    const content = readFileSync(schemaPath);
    const actual = createHash('sha256').update(content).digest('hex');

    expect(actual).toBe(EXPECTED_CHECKSUM);
  });
});
