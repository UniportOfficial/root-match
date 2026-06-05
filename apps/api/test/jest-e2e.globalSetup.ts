import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const apiRoot = join(__dirname, '..');

function runPrisma(args: string[]): void {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      execFileSync('pnpm', ['exec', 'prisma', ...args], {
        // NOSONAR S4036 — trusted CI dev command, args are constant string literals
        cwd: apiRoot,
        stdio: 'inherit',
        env: process.env,
      });
      return;
    } catch (error) {
      if (attempt === 3) {
        throw error;
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2_000);
    }
  }
}

/**
 * Jest globalSetup for e2e suite.
 *
 * Runs ONCE before any spec. Guarantees every run starts from a known
 * baseline: schema applied, seed data present. Replaces destructive
 * migrate-reset calls previously embedded in individual specs
 * (seed.e2e-spec.ts, users.e2e-spec.ts).
 *
 * Trade-offs (recorded by design review):
 * - Shared Neon DB: concurrent runs by multiple devs/CI still risky.
 *   Mitigation: route CI to an isolated e2e DB when feasible.
 * - migrate reset is destructive but predictable: removes residual state
 *   from previous runs (e.g. test-created contracts) without per-suite cleanup.
 */
export default async function (): Promise<void> {
  runPrisma(['migrate', 'reset', '--force', '--skip-seed']);
  runPrisma(['db', 'seed']);
}
