export function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const p = 0.3989422804014327 * Math.exp(-x * x / 2) * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x >= 0 ? 1 - p : p;
}
export function normalQuantile(p: number): number {
  let lo = -9, hi = 9;
  for (let i = 0; i < 70; i++) { const mid = (lo + hi) / 2; if (normalCDF(mid) < p) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
export function power(n: number, effect: number, alpha: number): number {
  const z = normalQuantile(1 - alpha / 2), delta = effect * Math.sqrt(n / 2);
  return 1 - normalCDF(z - delta) + normalCDF(-z - delta);
}
export function requiredN(effect: number, alpha: number, target: number): number {
  let lo = 2, hi = 100000;
  while (lo < hi) { const mid = Math.floor((lo + hi) / 2); if (power(mid, effect, alpha) >= target) hi = mid; else lo = mid + 1; }
  return lo;
}
export function survival(t: number, median: number, hr = 1): number { return Math.exp(-Math.LN2 / median * hr * t); }
