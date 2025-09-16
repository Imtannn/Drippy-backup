import type {Element3D, GltfModel, Mesh} from 'lume'
import * as THREE from 'three'
import {
	batch,
	createEffect,
	createMemo,
	createSignal,
	getOwner,
	onCleanup,
	untrack,
	type Accessor,
	type Signal,
} from 'solid-js'
import {Easing} from '@tweenjs/tween.js'
import {effect} from './meteor-signals.js'

export async function svgTexture(
	plane: Mesh,
	img: HTMLImageElement,
	canvas: HTMLCanvasElement,
	width: number,
	height: number,
) {
	const ctx = canvas.getContext('2d')
	if (!ctx) throw new Error('Canvas already has a different context.')

	await Promise.all([imgLoaded(img)])

	canvas.width = width
	canvas.height = height
	ctx.drawImage(img, 0, 0, width, height)

	const tex = new THREE.CanvasTexture(canvas)
	tex.colorSpace = THREE.SRGBColorSpace
	;(plane.three.material as THREE.MeshPhysicalMaterial).map = tex
	;(plane.three.material as THREE.Material).needsUpdate = true
	plane.needsUpdate()
	setTimeout(() => {
		;(plane.three.material as THREE.Material).needsUpdate = true
		plane.needsUpdate()
	}, 2000)

	// If we remove the canvas before the above creation of CanvasTexture, the texture will not render. hmmmm.
	canvas.remove()

	img.remove()
}

export function imgLoaded(img: HTMLImageElement) {
	const p = new Promise<void>(res => {
		if (img.complete) res()
		else img.addEventListener('load', () => res())
	})
	return p
}

interface AnimateValueOptions {
	/** Duration of the animation in milliseconds. Defaults to 1000. */
	duration?: number

	/**
	 * The easing curve to use. The function
	 * accepts a value between 0 and 1 indicating start to finish time,
	 * and returns a value between 0 and 1 indicating start to finish
	 * position. You can pass any Tween.js Easing curve here, for
	 * example. Defaults to Tween.js Easing.Cubic.InOut
	 */
	curve?: (amount: number) => number

	/**
	 * A boolean signal that if provided, prevents the animation from
	 * starting until it is true. Toggling it back to false also stops the
	 * animation, setting back to true starts it again.
	 */
	start?: () => boolean
}

/**
 * Animates a signal from its current value to a target value.
 *
 * @param signal - The signal to animate.
 * @param targetValue - The target value to animate to.
 * @param options - An object containing optional parameters for the animation.
 * @param options.duration - The duration of the animation in milliseconds. Defaults to 1000.
 * @param options.curve - The easing curve to use for the animation. Defaults to Easing.Cubic.InOut.
 * @param options.start - A signal that controls when the animation starts. If provided, the animation will only start when this signal is true.
 */
export function animateSignalTo(
	signal: Signal<number>,
	targetValue: number,
	{duration = 1000, curve = Easing.Cubic.InOut, start}: AnimateValueOptions = {},
) {
	const [getValue, setValue] = signal
	const [done, setDone] = createSignal(false)
	const startValue = untrack(getValue)

	createEffect(() => {
		if (untrack(getValue) === targetValue) return setDone(true)

		if (start && !start()) return

		let frame = 0
		const startTime = performance.now()

		frame = requestAnimationFrame(function loop(time) {
			let val = getValue()

			const elapsed = time - startTime
			const elapsedPortion = elapsed / duration
			const amount = curve(elapsedPortion > 1 ? 1 : elapsedPortion)
			const valuePortion = amount * (targetValue - startValue)

			val = startValue + valuePortion
			setValue(val)

			if (val === targetValue) return setDone(true)

			frame = requestAnimationFrame(loop)
		})

		onCleanup(() => {
			cancelAnimationFrame(frame)
			setDone(false)
		})
	})

	return done
}

/** Return two signals for the width and height of an element. */
export function elementSize(el: Element | (() => Element | undefined | null)) {
	const [clientWidth, setClientWidth] = createSignal(0)
	const [clientHeight, setClientHeight] = createSignal(0)

	const element = createMemo(() => (typeof el === 'function' ? el() : el))

	createEffect(() => {
		const el = element()

		if (!el) {
			setClientWidth(0)
			setClientHeight(0)
			return
		}

		const observer = new ResizeObserver(() => {
			batch(() => {
				setClientWidth(el.clientWidth)
				setClientHeight(el.clientHeight)
			})
		})

		observer.observe(el)

		onCleanup(() => observer.disconnect())
	})

	return {clientWidth, clientHeight}
}

/** Make an Element3D be the size of the given element. */
export function fitContent(el3d: Element3D, el: Element, width = true, height = true) {
	const {clientWidth, clientHeight} = elementSize(el)
	createEffect(() => {
		if (width) el3d.size.x = clientWidth()
		if (height) el3d.size.y = clientHeight()
	})
}

export function fadePageOnNav(links: HTMLAnchorElement[]) {
	let clicked = false
	for (const link of links) {
		link.addEventListener('click', event => {
			if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return

			event.preventDefault()

			// Only do the face animation on first click (keep preventing default so that clicking during animation does nothing).
			if (clicked) return
			clicked = true
			document.body.classList.add('fadePageOut')
			document.body.addEventListener('transitionend', () => (location.href = link.href))
		})
	}
}

export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

/** Memoize the given keys of an object (the values should be functions). */
export function memoize<T extends object, K extends keyof T>(obj: T, ...keys: K[]) {
	// @ts-expect-error valid indexed access
	for (const key of keys) obj[key] = createMemo(obj[key])
}

/** Clone a CSSStyleSheet object. */
export function cloneCSSStyleSheet(sheet: CSSStyleSheet) {
	const newSheet = new CSSStyleSheet()
	const styletext = Array.from(sheet.cssRules)
		.map(rule => rule.cssText)
		.join(' ')
	newSheet.replaceSync(styletext)
	return newSheet
}

export function toSolidSignal<T>(meteorGetter: () => T) {
	const [get, set] = createSignal<T>(meteorGetter())
	// @ts-expect-error no handling of function values for now
	const comp = effect(() => set(meteorGetter()))
	if (getOwner()) onCleanup(() => comp.stop())
	return get
}

export function createMeteorEffect(fn: () => void) {
	const computation = effect(fn)
	if (getOwner()) onCleanup(() => computation.stop())
}

/**
 * Iterate all descendant elements of the given root element. Does not traverse
 * into ShadowRoots.
 */
export function* elements(node: Document | ShadowRoot | Element): Generator<Element, void, void> {
	if (node instanceof Element) yield node
	for (const child of Array.from(node.children)) yield* elements(child)
}

/**
 * Iterate all descendant elements of the given root element, including downward
 * in too ShadowRoots in 'shadow-including tree order' meaning an element, then
 * children of an element's shadowroot, then the element's children
 * (https://chromium.googlesource.com/chromium/src/+/HEAD/third_party/blink/renderer/core/dom/README.md).
 *
 * This is not the same as traversing the flat tree, i.e. the tree that is
 * rendered on screen after slotting nodes into destination shadow root slots
 * and ignoring any nodes that are not slotted (TODO: elementsFlat for that).
 */
export function* elementsDeep(node: Document | ShadowRoot | Element): Generator<Element, void, void> {
	// first visit the starting element
	if (node instanceof Element) yield node

	// then all of an element's shadowroot children
	if (node instanceof Element) {
		const root = roots.get(node)
		if (root) yield* elementsDeep(root)
	}

	// then all of the element's children
	for (const child of Array.from(node.children)) yield* elementsDeep(child)
}

const roots = new WeakMap<Element, ShadowRoot>()

// TODO how do we handle Declarative Shadow Root that have been created but
// attachShadow has not been previously called for them.
const attachShadow = globalThis.Element.prototype.attachShadow
globalThis.Element.prototype.attachShadow = function (init: ShadowRootInit) {
	const root = attachShadow.call(this, init)
	roots.set(this, root)
	return root
}

/**
 * Just like document.querySelector(), but it will traverse into all known ShadowRoots.
 *
 * This does a shadow-including tree traversal. TODO: a flat-tree search, querySelectorFlat.
 */
export function querySelectorDeep(root: Document | ShadowRoot, selector: string): Element | null {
	for (const el of elementsDeep(root)) {
		const result = roots.get(el)?.querySelector(selector)
		if (result) return result
	}

	return null
}

/** Traverse element ancestors of an node. */
export function* ancestorElements(el: Node): Generator<Element, void, void> {
	let parent: Node | null = el.parentElement

	while (parent) {
		yield parent as Element
		parent = parent.parentElement ?? (parent.getRootNode() as ShadowRoot)?.host
	}
}

type MaybeElement = Element | null | undefined

/**
 * Returns true if `b` is a descendant of `a`, including inside ShadowRoots.
 *
 * Note, a value of true does not mean that `b` is participating the composed
 * (flat) tree, as `b` may not be slotted into a slot in a ShadowRoot.
 */
export function hasDescendant(a: MaybeElement, b: MaybeElement): boolean {
	if (!a || !b) return false
	for (const parent of ancestorElements(b)) if (a === parent) return true
	return false
}

export async function preloadImage(image: string) {
	return new Promise<void>(resolve => {
		const img = new Image()
		img.src = image
		img.onload = () => {
			img.remove()
			resolve()
		}
	})
}

/**
 * Signal version of MutationObserver. Given an element and mutation observer
 * options, returns a signal that contains the latest set of MutationRecords,
 * initially empty.
 */
export function createMutationsSignal(target: Element, options: MutationObserverInit) {
	const [signal, setSignal] = createSignal<MutationRecord[]>([])

	const mo = new MutationObserver(records => setSignal(records))
	mo.observe(target, options)
	onCleanup(() => mo.disconnect())

	return signal
}

export function isMesh(obj: THREE.Object3D): obj is THREE.Mesh {
	return obj instanceof THREE.Mesh
}

/**
 * Iterate all Object3Ds in the tree, including the root.
 * @param root The root Object3D to start iterating from.
 * @param skip Optional Object3Ds to skip (including their descendants).
 */
export function* object3DsInTree(root: THREE.Object3D, ...skip: THREE.Object3D[]): Generator<THREE.Object3D> {
	if (skip.includes(root)) return
	yield root
	for (const child of root.children) yield* object3DsInTree(child, ...skip)
}

/**
 * Iterate all meshes in the tree, including the root.
 * @param root The root Object3D to start iterating from.
 * @param skip Optional Object3Ds to skip (including their descendants).
 */
export function* meshesInTree(root: THREE.Object3D, ...skip: THREE.Object3D[]): Generator<THREE.Mesh> {
	for (const obj of object3DsInTree(root, ...skip)) if (isMesh(obj)) yield obj
}

/**
 * Iterate all materials of a mesh.
 * @param mesh The mesh whose materials will be iterated.
 */
export function* materialsOfMesh(mesh: THREE.Mesh): Generator<THREE.Material> {
	if (Array.isArray(mesh.material)) yield* mesh.material
	else yield mesh.material
}

/**
 * Iterate all materials in the tree, including the root.
 * @param root The root Object3D to start iterating from.
 * @param skip Optional Object3Ds to skip (including their descendants).
 */
export function* materialsInTree(root: THREE.Object3D, ...skip: THREE.Object3D[]): Generator<THREE.Material> {
	for (const mesh of meshesInTree(root, ...skip)) yield* materialsOfMesh(mesh)
}

export function findInTree(root: THREE.Object3D, predicate: (obj: THREE.Object3D) => boolean): THREE.Object3D | null {
	for (const obj of object3DsInTree(root)) if (predicate(obj)) return obj
	return null
}

/**
 * Returns a signal that is true when the model is loaded, false otherwise.
 * @param model The GltfModel element to monitor for loading completion.
 */
export function onModelLoad(model: GltfModel) {
	// Having to do this dance with the MODEL_LOAD event is not great. We'll
	// clean this up with behaviors-as-child-elements, and ensure the state is
	// easy to access and signal-based.
	// Good example though, of how to map some none-signal pattern to a signal.

	const [loaded, setLoaded] = createSignal(false)

	createEffect(() => {
		// Wait until the gtf-model behavior instance is present on the model element.
		const gltfModelBehavior = model.behaviors.get('gltf-model') // signal
		if (!gltfModelBehavior) return

		// Now wait until the model is loaded.
		const threeModel = gltfModelBehavior.model
		if (threeModel) {
			setLoaded(true)
		} else {
			const modelLoad = () => {
				model.off('MODEL_LOAD', modelLoad)
				setLoaded(true)
			}

			model.on('MODEL_LOAD', modelLoad)
			onCleanup(() => model.off('MODEL_LOAD', modelLoad))
		}

		onCleanup(() => setLoaded(false))
	})

	return loaded
}

export function enableShadows(el: Element3D) {
	for (const child of meshesInTree(el.three)) {
		child.castShadow = true
		child.receiveShadow = true
	}

	el.needsUpdate()
}

export function enableShadowOnModelLoad(el: GltfModel) {
	const loaded = onModelLoad(el)

	createEffect(() => {
		if (!loaded()) return
		enableShadows(el)
	})
}

export function enableFrontsideRendering(el: Element3D) {
	for (const material of materialsInTree(el.three)) {
		material.side = THREE.FrontSide
		material.needsUpdate = true
	}

	el.needsUpdate()
}

export function enableFrontsideOnModelLoad(el: GltfModel) {
	const loaded = onModelLoad(el)

	createEffect(() => {
		if (!loaded()) return
		enableFrontsideRendering(el)
	})
}

export function setEnvMap(el: Element3D, env: string) {
	let cleaned = false

	if (!env) return

	for (let material of materialsInTree(el.three)) {
		const mat = material as THREE.MeshPhysicalMaterial

		mat.envMap = new THREE.TextureLoader().load(env, () => {
			if (cleaned) return
			mat.needsUpdate = true
			el.needsUpdate()
		})
		mat.envMap.mapping = THREE.EquirectangularReflectionMapping
		mat.envMap.colorSpace = THREE.SRGBColorSpace
		mat.envMapIntensity = 1.3
	}

	el.needsUpdate()

	onCleanup(() => (cleaned = true))
}

export function setEnvMapOnModelLoad(el: GltfModel, env: string) {
	// XXX For now this is disabled, and we're using the scene's env map
	// instead.  If we need to adjust the env map per model, we can re-enable
	// this.
	return

	const loaded = onModelLoad(el)

	createEffect(() => {
		if (!loaded()) return
		setEnvMap(el, env)
	})
}

/**
 * Set the visibility of all materials within an Element3D.
 * @param el The Element3D whose materials' visibility will be set.
 * @param visible A boolean indicating whether the materials should be visible or not.
 * @param skip Optional Element3Ds to skip (including their descendants).
 */
export function setMaterialsVisible(el: Element3D, visible: boolean, ...skip: Element3D[]) {
	for (const material of materialsInTree(el.three, ...skip.map(s => s.three))) {
		material.visible = visible
		material.needsUpdate = true
	}

	el.needsUpdate()
}

/**
 * Set the visibility of all materials within an Element3D when the model is loaded.
 * @param el The GltfModel whose materials' visibility will be set.
 * @param visible A boolean getter indicating whether the materials should be
 * visible or not. If it is a signal, the visibility will be updated whenever
 * the signal changes.
 * @param skip Optional Element3Ds to skip (including their descendants).
 */
export function setMaterialsVisibleOnModelLoad(el: GltfModel, visible: Accessor<boolean>, ...skip: Element3D[]) {
	const loaded = onModelLoad(el)

	createEffect(() => {
		if (!loaded()) return
		setMaterialsVisible(el, visible(), ...skip)
	})
}
