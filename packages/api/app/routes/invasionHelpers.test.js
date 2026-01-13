import { describe, it, expect } from 'vitest';
import {
	getMaxInvasionDuration,
	MEGA_INVASION_COGS,
	NORMAL_INVASION_MAX_RATE,
} from './invasionHelpers.js';

describe('invasionHelpers', () => {
	describe('getMaxInvasionDuration', () => {
		it('returns 3 hours (10800s) for mega invasions', () => {
			const duration = getMaxInvasionDuration(MEGA_INVASION_COGS);
			expect(duration).toBe(10800);
		});

		it('returns scaled duration for normal invasions', () => {
			const total = 1000;
			const duration = getMaxInvasionDuration(total);
			expect(duration).toBe(total * NORMAL_INVASION_MAX_RATE);
		});
	});
});
