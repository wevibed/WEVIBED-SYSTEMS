// Tiny argument parser: --key value, --flag, and bare words collected in _.
export function parseArgs(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) out[key] = true;
      else {
        out[key] = next;
        i += 1;
      }
    } else out._.push(a);
  }
  return out;
}

export function selectTargets(args, listTargets, resolveTarget) {
  if (args.all) return listTargets();
  return [resolveTarget({ client: args.client, starter: args.starter })];
}
