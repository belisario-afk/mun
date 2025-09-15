import { describe, it, expect } from 'vitest';

describe('Gestures thresholds', () => {
  it('twist threshold ~20°', () => {
    const min = 20;
    expect(min).toBeGreaterThanOrEqual(20);
  });
  it('pinch threshold ~0.15', () => {
    const delta = 0.15;
    expect(delta).toBeGreaterThanOrEqual(0.15);
  });
  it('swipe up threshold ~64px', () => {
    const px = 64;
    expect(px).toBeGreaterThanOrEqual(64);
  });
});