// Helper to normalize flower names to snake_case keys for image lookup
export function flowerKey(name: string): string {
	return name
		.toLowerCase()
		.replace(/['`]/g, '') // remove apostrophes
		.replace(/[^a-z0-9]+/g, '_') // non-alphanum to _
		.replace(/^_+|_+$/g, ''); // trim underscores
}
