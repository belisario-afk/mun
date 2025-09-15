import { describe, it, expect } from 'vitest';

function smooth(n: number, arr: number[]) {
  const s: number[] = [];
  let w: number[] = [];
  for (const v of arr) {
    w.push(v);
    if (w.length > n) w.shift();
    s.push(w.reduce((a, b) => a + b, 0) / w.length);
  }
  return s;
}

describe('Speed smoothing', () => {
  it('averages last N', () => {
    const out = smooth(3, [0, 3, 6, 9]);
    expect(out[3]).toBeCloseTo((3 + 6 + 9) / 3);
  });
});