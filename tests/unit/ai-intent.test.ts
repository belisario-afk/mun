import { describe, it, expect } from 'vitest';
import { intentFromText } from '../../src/ai/intents/intentParser';

describe('AI Intent Parser', () => {
  it('switches to radio', () => {
    const res = intentFromText('switch to radio');
    expect(res.intent).toBe('set_source');
    expect(res.args.source).toBe('radio');
  });
  it('status report', () => {
    const res = intentFromText('status report');
    expect(res.intent).toBe('status_report');
  });
});