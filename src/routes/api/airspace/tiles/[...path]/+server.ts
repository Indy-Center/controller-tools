import { error } from '@sveltejs/kit';

export async function GET({ params, url }) {
	try {
		const { path } = params;
		const apiKey = url.searchParams.get('apiKey');

		// Validate API key
		if (!apiKey) {
			throw error(401, 'API key required');
		}

		const fullUrl = `https://maps.openaip.net/tile/${path}?apiKey=${apiKey}`;
		console.log('Proxying request to:', fullUrl);

		const response = await fetch(fullUrl, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; AviationMap/1.0)',
				Accept: 'image/png,image/*;q=0.9',
				Referer: 'https://www.openaip.net/'
			}
		});

		if (!response.ok) {
			console.error('OpenAIP error:', response.status, response.statusText);
			throw error(response.status, 'Failed to fetch tile');
		}

		const contentType = response.headers.get('content-type');
		const contentLength = response.headers.get('content-length');

		const blob = await response.blob();
		console.log('Received response:', {
			status: response.status,
			contentType,
			contentLength,
			size: blob.size
		});

		return new Response(blob, {
			status: 200,
			headers: {
				'content-type': contentType || 'image/png',
				'content-length': contentLength || blob.size.toString(),
				'cache-control': 'public, max-age=3600'
			}
		});
	} catch (e) {
		console.error('Tile proxy error:', e);
		throw error(500, 'Failed to fetch tile');
	}
}
