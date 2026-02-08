import { describe, it, expect } from 'vitest';
import { getGagDamage, getGagAccuracy } from './gagDamage';

describe('gagDamage', () => {
	describe('getGagDamage', () => {
		it('returns null for Lure track', () => {
			expect(getGagDamage('Lure', 1, 0, 20)).toBeNull();
		});

		it('returns null for invalid level', () => {
			expect(getGagDamage('Throw', 0, 0, 10)).toBeNull();
			expect(getGagDamage('Throw', 8, 0, 10)).toBeNull();
		});

		it('returns damage info for valid gag', () => {
			const result = getGagDamage('Throw', 1, 0, 10);
			expect(result).not.toBeNull();
			expect(result?.start).toBe(4);
			expect(result?.max).toBe(6);
		});

		it('applies organic bonus', () => {
			const base = getGagDamage('Throw', 7, 10000, null, false);
			const organic = getGagDamage('Throw', 7, 10000, null, true);
			expect(organic?.value).toBeGreaterThan(base?.value ?? 0);
		});
	});

	describe('getGagAccuracy', () => {
		it('returns null for Trap track', () => {
			expect(getGagAccuracy('Trap', 1)).toBeNull();
		});

		it('returns base accuracy for Sound', () => {
			const result = getGagAccuracy('Sound', 1);
			expect(result?.base).toBe(95);
		});

		it('returns organic bonus for Lure', () => {
			const result = getGagAccuracy('Lure', 1, true);
			expect(result?.organic).toBe(70); // 60 + 10
		});
	});
});
