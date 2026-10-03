import assert from 'node:assert/strict';
import { normalCDF, normalQuantile, power, requiredN, survival } from '../src/lib/statistics.ts';
assert.ok(Math.abs(normalCDF(0) - .5) < 1e-7);
assert.ok(Math.abs(normalQuantile(.975) - 1.9599639845) < 2e-6);
assert.ok(Math.abs(power(100, 0, .05) - .05) < 1e-7);
assert.ok(Math.abs(power(100, .4, .05) - .80743042) < 2e-6);
assert.equal(requiredN(.4, .05, .8), 99);
assert.ok(power(99, .4, .05) >= .8 && power(98, .4, .05) < .8);
for (const alpha of [.01, .05, .1]) for (const effect of [.1, .4, 1]) {
 assert.ok(power(200, effect, alpha) > power(100, effect, alpha));
 for (const target of [.8, .9]) {
  const n = requiredN(effect, alpha, target);
  assert.ok(power(n, effect, alpha) >= target && power(n - 1, effect, alpha) < target);
 }
}
assert.equal(survival(0, 12, .68), 1);
assert.ok(Math.abs(survival(12, 12) - .5) < 1e-12);
assert.ok(Math.abs(survival(12 / .68, 12, .68) - .5) < 1e-12);
assert.ok(survival(24, 12, .68) > survival(24, 12));
console.log('PASS: normal quantile, two-sided power, minimal integer sample size, survival function.');
