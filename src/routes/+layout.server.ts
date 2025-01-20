export function load({ locals }: any) {
	return {
		user: locals.user,
		buildNumber: process.env.BUILD_NUMBER || 'development'
	};
}
