import { describe, it, expect } from 'vitest';
import { generateCodeVerifier, generateCodeChallenge } from '../../src/audio/spotify/pkce';

describe('PKCE', () => {
  it('generates a verifier and challenge', async () => {
    const v = await generateCodeVerifier(64);
    expect(v).toHaveLength(64);
    const c = await generateCodeChallenge(v);
    expect(typeof c).toBe('string');
    expect(c.length).toBeGreaterThan(40);
  });
});