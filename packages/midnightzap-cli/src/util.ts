const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const wrap = (code: string) => (s: string) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);

export const c = {
  bold: wrap("1"),
  dim: wrap("2"),
  green: wrap("32"),
  red: wrap("31"),
  cyan: wrap("36"),
  yellow: wrap("33"),
  magenta: wrap("35"),
};

export function step(msg: string) {
  console.log(`${c.cyan("›")} ${msg}`);
}
export function ok(msg: string) {
  console.log(`${c.green("✓")} ${msg}`);
}
export function warn(msg: string) {
  console.log(`${c.yellow("!")} ${msg}`);
}
export function fail(msg: string): never {
  console.error(`${c.red("✗")} ${msg}`);
  process.exit(1);
}

/** LCS of two string arrays → indices kept in each. */
function lcs(a: string[], b: string[]): [number, number][] {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const pairs: [number, number][] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      pairs.push([i, j]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return pairs;
}

/** Compact hunked diff — shows only changed regions with a little context. */
export function unifiedDiff(before: string, after: string, path: string): string {
  const a = before.split("\n");
  const b = after.split("\n");
  const keep = lcs(a, b);
  const keptA = new Set(keep.map(([x]) => x));
  const keptB = new Set(keep.map(([, y]) => y));

  type Row = { t: " " | "-" | "+"; s: string };
  const rows: Row[] = [];
  let i = 0;
  let j = 0;
  for (const [ai, bj] of [...keep, [a.length, b.length] as [number, number]]) {
    while (i < ai) rows.push({ t: "-", s: a[i++] });
    while (j < bj) rows.push({ t: "+", s: b[j++] });
    if (ai < a.length) {
      rows.push({ t: " ", s: a[ai] });
      i = ai + 1;
      j = bj + 1;
    }
  }
  void keptA;
  void keptB;

  // group into hunks around changes with 2 lines of context
  const ctx = 2;
  const changed = rows.map((r) => r.t !== " ");
  const show = changed.map((_, k) =>
    changed.slice(Math.max(0, k - ctx), k + ctx + 1).some(Boolean)
  );
  const out: string[] = [c.bold(path)];
  let printedGap = false;
  rows.forEach((r, k) => {
    if (!show[k]) {
      if (!printedGap) out.push(c.dim("  ⋯"));
      printedGap = true;
      return;
    }
    printedGap = false;
    if (r.t === "-") out.push(c.red(`- ${r.s}`));
    else if (r.t === "+") out.push(c.green(`+ ${r.s}`));
    else out.push(c.dim(`  ${r.s}`));
  });
  return out.join("\n");
}
