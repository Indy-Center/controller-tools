import { error } from '@sveltejs/kit';

export const GET = async ({ url }) => {
	try {
		const pdfUrl = url.searchParams.get('url');

		if (!pdfUrl) {
			throw error(400, 'PDF URL is required');
		}

		const response = await fetch(pdfUrl);

		if (!response.ok) {
			throw error(response.status, 'Failed to fetch PDF');
		}

		const pdfBuffer = await response.arrayBuffer();

		return new Response(pdfBuffer, {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Length': pdfBuffer.byteLength.toString()
			}
		});
	} catch (e) {
		console.error('PDF fetch error:', e);
		throw error(500, 'Failed to fetch PDF');
	}
};
