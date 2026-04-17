// Tiny polyfill for Promise.withResolvers.

export {}

if (!Promise.withResolvers) {
	Promise.withResolvers = function <T>() {
		let resolve!: (value: T) => void
		let reject!: (reason?: unknown) => void
		const promise = new Promise<T>((res, rej) => ((resolve = res), (reject = rej)))
		return {promise, resolve, reject}
	}
}

declare global {
	interface PromiseConstructor {
		withResolvers<T>(): {
			promise: Promise<T>
			resolve: (value: T) => void
			reject: (reason?: unknown) => void
		}
	}
}
