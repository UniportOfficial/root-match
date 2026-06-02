async function main(): Promise<void> {
  console.log(
    'TODO W2-4 — implement seed pipeline (.sisyphus/plans/phase-1-w2.md §7.4)',
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
