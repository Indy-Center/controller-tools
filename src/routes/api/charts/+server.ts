import { error } from '@sveltejs/kit';

// Cache for charts - key is URL, value is {buffer, timestamp}
const chartCache = new Map<string, { buffer: ArrayBuffer; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const GET = async ({ url }) => {
	try {
		const pdfUrl = url.searchParams.get('url');

		if (!pdfUrl) {
			throw error(400, 'PDF URL is required');
		}

		// Check memory cache first
		const cached = chartCache.get(pdfUrl);
		const now = Date.now();

		if (cached && now - cached.timestamp < CACHE_DURATION) {
			return new Response(cached.buffer, {
				headers: {
					'Content-Type': 'application/pdf',
					'Content-Length': cached.buffer.byteLength.toString(),
					'Cache-Control': 'public, max-age=86400',
					ETag: `"${cached.timestamp}"`
				}
			});
		}

		const response = await fetch(pdfUrl);

		if (!response.ok) {
			throw error(response.status, 'Failed to fetch PDF');
		}

		const pdfBuffer = await response.arrayBuffer();

		// Update cache
		chartCache.set(pdfUrl, {
			buffer: pdfBuffer,
			timestamp: now
		});

		// Clean up old cache entries if cache is too large
		if (chartCache.size > 100) {
			const oldestKey = Array.from(chartCache.entries()).sort(
				([, a], [, b]) => a.timestamp - b.timestamp
			)[0][0];
			chartCache.delete(oldestKey);
		}

		return new Response(pdfBuffer, {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Length': pdfBuffer.byteLength.toString(),
				'Cache-Control': 'public, max-age=86400',
				ETag: `"${now}"`
			}
		});
	} catch (e) {
		console.error('PDF fetch error:', e);
		throw error(500, 'Failed to fetch PDF');
	}
};
