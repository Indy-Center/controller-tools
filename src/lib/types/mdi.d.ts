import * as mdi from '@mdi/js';

// Helper types to extract mdi icons and convert them to kebab case
type KebabCase<S extends string> = S extends `${infer First}${infer Rest}`
	? First extends Uppercase<First>
		? `${Lowercase<First>}${KebabCaseInner<Rest>}`
		: KebabCaseInner<S>
	: S;

type KebabCaseInner<S extends string> = S extends `${infer First}${infer Second}${infer Rest}`
	? Second extends Uppercase<Second>
		? `${First}-${Lowercase<Second>}${KebabCaseInner<Rest>}`
		: `${First}${KebabCaseInner<`${Second}${Rest}`>}`
	: S;

export type MdiIconName = KebabCase<keyof typeof mdi extends `mdi${infer Name}` ? Name : never>;
