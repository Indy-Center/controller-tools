export function load({ locals }: any) {
	return {
		user: locals.user,
		controllerInfo: locals.controllerInfo,
		buildNumber: process.env.BUILD_NUMBER || 'development'
	};
}
