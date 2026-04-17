import {disposeObjectTree, type Element3D, type GltfModel, type Mesh} from 'lume'
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
import * as THREE from 'three'

import {Easing} from '@tweenjs/tween.js'
import {textureManager, type TextureSet} from './app/TextureManager.js'
import {effect} from './meteor-signals.js'
import type {Fabric} from './types/fabric.js'
import type {Collection} from './types/types.js'

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
 * Keep two signals in sync with each other.
 * @param a - First signal value
 * @param setA - Setter for the first signal
 * @param b - Second signal value
 * @param setB - Setter for the second signal
 */
export function syncSignals<T>(a: () => T, setA: (val: T) => void, b: () => T, setB: (val: T) => void) {
	createEffect(() => {
		// Any time a changes, update b
		a()
		untrack(() => a() !== b() && setB(a()))
	})
	createEffect(() => {
		// Any time b changes, update a
		b()
		untrack(() => a() !== b() && setA(b()))
	})
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

/**
 * Just like document.querySelectorAll(), but it will traverse into all known ShadowRoots.
 *
 * This does a shadow-including tree traversal and returns all matching elements.
 */
export function querySelectorAllDeep(root: Document | ShadowRoot, selector: string): Element[] {
	const results: Element[] = []

	for (const el of elementsDeep(root)) {
		const nodeList = roots.get(el)?.querySelectorAll(selector)
		if (nodeList) results.push(...Array.from(nodeList))
	}

	return results
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
export function createMutationsSignal(target: Document | ShadowRoot | Element, options: MutationObserverInit) {
	const [signal, setSignal] = createSignal<MutationRecord[]>([])

	const mo = new MutationObserver(records => setSignal(records))
	mo.observe(target, options)
	onCleanup(() => mo.disconnect())

	return signal
}

/**
 * Signal version of querySelectorAll. Given a root element and selector,
 * returns a signal that contains the latest NodeList of matching elements.  The
 * NodeList is updated whenever mutations in the root subtree occur that may
 * affect the matching set.
 *
 * @param root The root element to query within.
 * @param selector The CSS selector to match elements.
 * @returns A signal containing the NodeList of matching elements.
 */
export function querySelectorAllSignal(
	root: Document | ShadowRoot | Element,
	selector: string,
): Accessor<NodeListOf<Element>> {
	const mutations = createMutationsSignal(root, {childList: true, subtree: true})

	const nodeList = createMemo(() => {
		mutations()
		return root.querySelectorAll(selector)
	})

	return nodeList
}

export function createMediaSignal(query: string): Accessor<boolean> {
	const mm = window.matchMedia(query)
	const [matches, setMatches] = createSignal(mm.matches)

	const listener = (event: MediaQueryListEvent) => setMatches(event.matches)
	mm.addEventListener('change', listener)
	onCleanup(() => mm.removeEventListener('change', listener))

	return matches
}

export const isDesktop = createMediaSignal('(min-width: 768px)')

export function isMesh(obj: THREE.Object3D): obj is THREE.Mesh {
	return obj instanceof THREE.Mesh
}

export function isLine(obj: THREE.Object3D): obj is THREE.Line | THREE.LineSegments {
	return obj instanceof THREE.Line || obj instanceof THREE.LineSegments
}

export function isRenderable(obj: THREE.Object3D): obj is THREE.Mesh | THREE.Line | THREE.LineSegments {
	return isMesh(obj) || isLine(obj)
}

export function isLight(obj: THREE.Object3D): obj is THREE.Light {
	return obj instanceof THREE.Light
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
 * Iterate the nodes of multiple trees that have the same structure, in
 * parallel.  It throws an error if the tree structures do not match. The
 * throwing behavior is loose for speed, it does not throw in all cases.
 *
 * @param roots The root Object3Ds of the trees to iterate. Each tree must have
 * the same structure.
 */
export function* nodesOfTrees(...roots: THREE.Object3D[]): Generator<THREE.Object3D[]> {
	if (!roots[0]) return
	yield roots
	for (let i = 0, l = roots[0].children.length; i < l; i++)
		yield* nodesOfTrees(...roots.map(r => r.children[i] ?? thro(new Error('Mismatching tree structures'))))
}

/**
 * This is for throwing errors in non-statement locations (f.e. expressions,
 * such as a ternary, etc).
 */
export function thro(error: Error): never {
	throw error
}

/**
 * Iterate all meshes in the tree, including the root.
 * @param root The root Object3D to start iterating from.
 * @param skip Optional Object3Ds to skip (including their descendants).
 */
export function* meshesInTree(root: THREE.Object3D, ...skip: THREE.Object3D[]): Generator<THREE.Mesh> {
	for (const obj of object3DsInTree(root, ...skip)) if (isMesh(obj)) yield obj
}

export function* linesInTree(
	root: THREE.Object3D,
	...skip: THREE.Object3D[]
): Generator<THREE.Line | THREE.LineSegments> {
	for (const obj of object3DsInTree(root, ...skip)) if (isLine(obj)) yield obj
}

export function* renderablesInTree(
	root: THREE.Object3D,
	...skip: THREE.Object3D[]
): Generator<THREE.Mesh | THREE.Line | THREE.LineSegments> {
	for (const obj of object3DsInTree(root, ...skip)) if (isRenderable(obj)) yield obj
}

/**
 * Iterate all lights in the tree, including the root.
 * @param root The root Object3D to start iterating from.
 * @param skip Optional Object3Ds to skip (including their descendants).
 */
export function* lightsInTree(root: THREE.Object3D, ...skip: THREE.Object3D[]): Generator<THREE.Light> {
	for (const obj of object3DsInTree(root, ...skip)) if (isLight(obj)) yield obj
}

/**
 * Iterate all materials of a mesh.
 * @param mesh The mesh whose materials will be iterated.
 */
export function* materialsOfRenderable(mesh: THREE.Mesh | THREE.Line | THREE.LineSegments): Generator<THREE.Material> {
	if (Array.isArray(mesh.material)) yield* mesh.material
	else yield mesh.material
}

/**
 * Iterate all materials in the tree, including the root.
 * @param root The root Object3D to start iterating from.
 * @param skip Optional Object3Ds to skip (including their descendants).
 */
export function* materialsInTree(root: THREE.Object3D, ...skip: THREE.Object3D[]): Generator<THREE.Material> {
	for (const mesh of renderablesInTree(root, ...skip)) yield* materialsOfRenderable(mesh)
}

export function findInTree(root: THREE.Object3D, predicate: (obj: THREE.Object3D) => boolean): THREE.Object3D | null {
	for (const obj of object3DsInTree(root)) if (predicate(obj)) return obj
	return null
}

/**
 * Gets the first skinned mesh that contains the avatar's skeleton. To be used in the mixer to make
 * sure the right armature is used.
 */
export function getArmatureObject(avatarRoot: THREE.Object3D) {
	// The avatar will have the object in its Threejs tree. We're currently identifying
	// the avatar skeleton by if the parent object's name has "body_" in it.
	// An alternative is to find the garment's skeleton (if present), and ignore that
	// when traversing the avatar's Threejs tree. Although, this would probably be
	// heavy on performance since it has to search the the garment's tree once to find
	// the skeleton, then the avatar's tree to find the avatar's skeleton (while
	// ignoring the garment's), and then the garment's tree again to actually swap
	// (or create) the skeleton.

	// If there's an issue because of an avatar not having a skinned mesh named "body_", just
	// do the above method instead.
	return findInTree(avatarRoot, (obj: THREE.Object3D) => {
		return obj instanceof THREE.SkinnedMesh && !!obj.skeleton && obj.name.indexOf('body_') == 0
	}) as THREE.SkinnedMesh | null
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

		const src = createMemo(() => gltfModelBehavior.src)

		let skipFirstRun = true
		createEffect(() => {
			// Any time the src changes, we are no longer loaded (the MODEL_LOAD
			// event will set it back to true). Use a memo because if it's the same value as before,
			// we don't want to set loaded to false again (the model will not reload, also uses a memo).
			src()
			if (skipFirstRun) return (skipFirstRun = false)
			setLoaded(false)
		})

		// Set initially true if the model is already loaded.
		const threeModel = gltfModelBehavior.model
		if (threeModel) setLoaded(true)

		// Set loaded any time a new model is loaded.
		const modelLoad = () => setLoaded(true)
		model.on('MODEL_LOAD', modelLoad)

		onCleanup(() => {
			model.off('MODEL_LOAD', modelLoad)
			setLoaded(false)
		})
	})

	return loaded
}

/**
 * Run an effect function when the model is loaded. Any dependencies used in the
 * function trigger re-run. Any onCleanups will be called when the given model
 * goes back into loading state before running the effect function again after
 * next load.
 */
export function whenModelLoaded(el: GltfModel, effectFn: () => void) {
	whenTrue(onModelLoad(el), effectFn)
}

/**
 * Run an effect function when the given boolean getter is true. Any dependencies
 * used in the function trigger re-run. Any onCleanups will be called when the
 * getter goes back to false before running the effect function again after it
 * goes back to true.
 */
export function whenTrue(getter: Accessor<boolean>, effectFn: () => void) {
	createEffect(() => {
		if (!getter()) return
		effectFn()
	})
}

export function enableShadows(el: Element3D) {
	for (const child of meshesInTree(el.three)) {
		child.castShadow = true
		child.receiveShadow = true
	}

	for (const child of lightsInTree(el.three)) {
		child.castShadow = true
		child.receiveShadow = true
		child.shadow!.bias = -0.0001
	}

	el.needsUpdate()
}

export function enableShadowOnModelLoad(el: GltfModel) {
	whenModelLoaded(el, () => enableShadows(el))
}

export function enableFrontsideRendering(el: Element3D) {
	for (const material of materialsInTree(el.three)) {
		material.side = THREE.FrontSide
		material.needsUpdate = true
	}

	el.needsUpdate()
}

export function enableFrontsideOnModelLoad(el: GltfModel) {
	whenModelLoaded(el, () => enableFrontsideRendering(el))
}

export function setEnvMap(el: Element3D, env: Accessor<string | THREE.Texture | null>, intensity = () => 1) {
	createEffect(() => {
		let cleaned = false
		const en = env()

		if (!en) return

		for (const material of materialsInTree(el.three)) {
			const mat = material as THREE.MeshPhysicalMaterial

			mat.envMap =
				typeof en === 'string'
					? new THREE.TextureLoader().load(en, () => {
							if (cleaned) return
							mat.needsUpdate = true
							el.needsUpdate()
						})
					: en
			mat.envMap.mapping = THREE.EquirectangularReflectionMapping
			mat.envMap.colorSpace = THREE.SRGBColorSpace
			mat.envMapIntensity = 1
			mat.needsUpdate = true
			createEffect(() => {
				mat.envMapIntensity = intensity()
			})
		}

		el.needsUpdate()

		onCleanup(() => (cleaned = true))
	})
}

export function setEnvMapOnModelLoad(el: GltfModel, env: Accessor<string | THREE.Texture | null>, intensity = () => 1) {
	whenModelLoaded(el, () => setEnvMap(el, env, intensity))
}

/**
 * Set the visibility of all materials within an Element3D.
 * @param el The Element3D whose materials' visibility will be set.
 * @param visible A boolean indicating whether the materials should be visible or not.
 * @param skip Optional Element3Ds to skip (including their descendants).
 */
export function setMaterialsVisible(el: Element3D, visible: boolean, ...skip: Element3D[]) {
	for (const material of materialsInTree(el.three, ...skip.map(s => s.three)))
		material.visible = visible

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
	whenModelLoaded(el, () => setMaterialsVisible(el, visible(), ...skip))
}

export function showSkeletonHelper(el: GltfModel, show: () => boolean) {
	whenModelLoaded(el, () => {
		if (!show()) return
		if (!el.scene) return

		const helper = new THREE.SkeletonHelper(el.three)
		// helper.material.linewidth = 2
		const scene = el.scene
		scene.three.add(helper)
		scene.needsUpdate()

		onCleanup(() => {
			disposeObjectTree(helper)
			scene.needsUpdate()
		})
	})
}

/**
 * Calculate bounding box for visible garment models of a specific category
 * @param category - The template category to get bounding box for
 * @param lumeScene - The lume scene element
 * @returns THREE.Box3 - Bounding box containing all visible garments of the category
 */
type ClothModelElement = Element & {
	three?: THREE.Object3D
	getAttribute(name: string): string | null
}

type LumeSceneLike = Element & {
	glRenderer?: THREE.WebGLRenderer
	_glRenderer?: THREE.WebGLRenderer
	renderer?: THREE.WebGLRenderer
	three?: THREE.Scene
	querySelector(selectors: string): (Element & {three?: THREE.Object3D}) | null
	querySelectorAll(selectors: string): NodeListOf<Element>
}

type DrippySceneLike = Element & {
	avatarModel?: {three: THREE.Object3D}
}

function calculateGarmentBoundingBox(category: string, lumeScene: LumeSceneLike): THREE.Box3 {
	const boundingBox = new THREE.Box3()

	// Get all garment models for this category
	const clothModels = lumeScene.querySelectorAll('lume-gltf-model[data-cloth]')

	clothModels.forEach(modelEl => {
		const model = modelEl as ClothModelElement
		const modelId = model.getAttribute('id') || ''
		const shouldInclude = modelId.includes(category + '-')

		if (shouldInclude && model.three && model.three.visible) {
			// Calculate bounding box for this model
			const modelBox = new THREE.Box3()

			// Traverse all meshes in the model
			for (const mesh of meshesInTree(model.three)) {
				if (mesh.geometry) {
					// Ensure geometry has bounding box
					mesh.geometry.computeBoundingBox()
					if (mesh.geometry.boundingBox) {
						// Transform the bounding box by the mesh's world matrix
						const transformedBox = mesh.geometry.boundingBox.clone()
						mesh.updateWorldMatrix(true, false)
						transformedBox.applyMatrix4(mesh.matrixWorld)
						modelBox.union(transformedBox)
					}
				}
			}

			// Union with the overall bounding box
			boundingBox.union(modelBox)
		}
	})

	// If no models found, return a default bounding box
	if (boundingBox.isEmpty())
		boundingBox.setFromCenterAndSize(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.5, 1, 0.5))

	return boundingBox
}

/**
 * Calculate optimal camera position based on bounding box
 * @param boundingBox - The bounding box of the target objects
 * @param fov - Camera field of view in degrees
 * @returns Object with position and lookAt vectors
 */
function calculateCameraFromBoundingBox(boundingBox: THREE.Box3, fov: number = 50) {
	const center = boundingBox.getCenter(new THREE.Vector3())
	const size = boundingBox.getSize(new THREE.Vector3())

	// Calculate distance needed to fit the object in view
	const maxDim = Math.max(size.x, size.y)
	const fovRadians = (fov * Math.PI) / 180
	const distance = maxDim / (2 * Math.tan(fovRadians / 2))

	// Add some padding (20% extra distance)
	const paddedDistance = distance * 1.2

	// Position camera in front of the center
	const cameraPosition = new THREE.Vector3(center.x, center.y, center.z + paddedDistance)

	return {
		position: cameraPosition,
		lookAt: center,
	}
}

/**
 * Capture a screenshot of a specific garment category from the Lume scene
 * @param category - The template category to capture (Shirt, Pants, etc.)
 * @returns Promise<string> - Base64 data URL of the screenshot
 */
export async function captureGarmentScreenshot(category: string): Promise<string> {
	const drippyScene = querySelectorDeep(document, 'drippy-scene') as DrippySceneLike | null
	if (!drippyScene) return ''

	const lumeScene = querySelectorDeep(document, 'lume-scene') as LumeSceneLike | null
	if (!lumeScene) return ''

	const clothModels = querySelectorAllDeep(document, 'lume-gltf-model[data-cloth]')
	const visibilityStates: {obj: THREE.Object3D; originalVisible: boolean}[] = []

	// Collect all objects and their visibility states
	clothModels.forEach(modelEl => {
		const model = modelEl as ClothModelElement
		const modelId = model.getAttribute('id') || ''
		const shouldKeep = modelId.includes(category + '-')

		if (!shouldKeep && model.three) visibilityStates.push({obj: model.three, originalVisible: model.three.visible})
	})

	// Use drippy-scene's avatarModel property to collect avatar parts
	if (drippyScene && drippyScene.avatarModel) {
		drippyScene.avatarModel.three.children.forEach(child => {
			const childName = child.name || ''
			const isGarment = childName.includes('LUME-ELEMENT3D')

			if (!isGarment) visibilityStates.push({obj: child, originalVisible: child.visible})
		})
	}

	// Collect scene/background
	const sceneModel = lumeScene.querySelector('#scene') as (Element & {three?: THREE.Object3D}) | null
	if (sceneModel?.three) visibilityStates.push({obj: sceneModel.three, originalVisible: sceneModel.three.visible})

	// Collect shoes and any other non-cloth models
	const allOtherModels = lumeScene.querySelectorAll('lume-gltf-model:not([data-cloth])')
	allOtherModels.forEach(modelEl => {
		const model = modelEl as ClothModelElement
		const modelId = model.getAttribute('id') || 'unnamed'
		if (model.three && modelId !== 'avatar' && modelId !== 'scene')
			visibilityStates.push({obj: model.three, originalVisible: model.three.visible})
	})

	// Calculate camera position for the garment (without modifying the live scene)
	const boundingBox = calculateGarmentBoundingBox(category, lumeScene)
	const {position, lookAt} = calculateCameraFromBoundingBox(boundingBox, 50)

	// Get main renderer to copy settings from
	const mainRenderer = lumeScene.glRenderer || lumeScene._glRenderer || lumeScene.renderer
	if (!mainRenderer) return ''

	const threeScene = lumeScene.three
	if (!threeScene) return ''

	// Create offscreen canvas for screenshot
	const screenshotSize = 512
	const offscreenCanvas = document.createElement('canvas')
	offscreenCanvas.width = screenshotSize
	offscreenCanvas.height = screenshotSize

	// Create offscreen renderer with same settings as main renderer
	const offscreenRenderer = new THREE.WebGLRenderer({
		canvas: offscreenCanvas,
		alpha: true,
		preserveDrawingBuffer: true,
		antialias: true,
	})

	// Copy rendering settings from main renderer
	offscreenRenderer.shadowMap.enabled = mainRenderer.shadowMap.enabled
	offscreenRenderer.shadowMap.type = mainRenderer.shadowMap.type
	offscreenRenderer.toneMapping = mainRenderer.toneMapping
	offscreenRenderer.toneMappingExposure = mainRenderer.toneMappingExposure
	offscreenRenderer.outputColorSpace = mainRenderer.outputColorSpace

	// Set clean background for product shots
	offscreenRenderer.setClearColor(0xf5f5f5, 1.0)

	// Create a dedicated camera for the screenshot (never affects the live scene)
	const screenshotCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
	screenshotCamera.position.copy(position)
	screenshotCamera.lookAt(lookAt)
	screenshotCamera.updateMatrixWorld(true)

	// Hide objects ONLY right before screenshot (minimal visibility duration)
	visibilityStates.forEach(({obj}) => {
		obj.visible = false
	})

	// Render to offscreen canvas immediately
	offscreenRenderer.render(threeScene, screenshotCamera)
	const screenshot = offscreenCanvas.toDataURL('image/png')

	// Restore visibility states immediately
	visibilityStates.forEach(({obj, originalVisible}) => {
		obj.visible = originalVisible
	})

	// Cleanup offscreen renderer
	offscreenRenderer.dispose()

	return screenshot
}

/**
 * Returns true if `object` has an ancestor with the given name.
 * @param object - The object to check.
 * @param targetName - The name of the ancestor to check for.
 * @returns True if `object` has an ancestor with the given name, false otherwise.
 */
export function hasAncestorWithName(object: THREE.Object3D, targetName: string): boolean {
	let current = object

	while (current) {
		if (
			current.name.toLowerCase() === targetName.toLowerCase() ||
			current.userData?.name?.toLowerCase() === targetName.toLowerCase()
		)
			return true

		current = current.parent as THREE.Object3D
	}
	return false
}

/** Format price without currency symbol */
export function formatNumber(amount: number, countryCode: string = 'eu') {
	const formatter = new Intl.NumberFormat(countryCode, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
		style: 'currency',
		currency: 'EUR',
	})

	return formatter.format(amount)
}

/**
 * Check if two arrays are equal in terms of length and elements.
 * @param a - First array to compare.
 * @param b - Second array to compare.
 * @returns True if arrays are equal, false otherwise.
 */
export function arrayEquals<T>(a: T[], b: T[]) {
	if (!Array.isArray(a) || !Array.isArray(b)) return false
	if (a.length !== b.length) return false
	for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
	return true
}

/**
 * Space/Scene/Collection utility functions
 */

/**
 * Check if a space has multiple collections (like the drippy space).
 * @param space - The space to check.
 * @returns True if space has more than one collection.
 */
export function spaceHasMultipleCollections(space: {collections: string[]} | null | undefined): boolean {
	return (space?.collections?.length ?? 0) > 1
}

/**
 * Get collections for a space.
 * @param space - The space to get collections from.
 * @returns Array of collection slugs.
 */
// TODO helpers like these belong next to the data models they operate on
export function getSpaceCollectionSlugs(space: {collections: string[]} | null | undefined): string[] {
	return space?.collections ?? []
}

/**
 * Get a collection by its slug.
 * @param collections - The array of collections to search in.
 * @param slug - The collection slug to find.
 * @returns The collection object or undefined.
 */
export function getCollectionBySlug(collections: Collection[], slug: string): Collection | undefined {
	return collections.find(c => c.slug === slug)
}

/**
 * Get scenes for a space.
 * @param space - The space to get scenes from.
 * @returns Array of scene slugs.
 */
export function getSpaceScenes(space: {scenes: string[]} | null | undefined): string[] {
	return space?.scenes ?? []
}

/**
 * Get the default scene for a space.
 * @param space - The space to get the default scene from.
 * @returns The default scene slug or null.
 */
export function getSpaceDefaultScene(space: {defaultScene: string} | null | undefined): string | null {
	return space?.defaultScene ?? null
}

/**
 * Get the primary collection slug for a space (the first collection).
 * @param space - The space to get the collection from.
 * @returns The primary collection slug or null.
 */
export function getSpacePrimaryCollection(space: {collections: string[]} | null | undefined): string | null {
	return space?.collections?.[0] ?? null
}

/**
 * Get a scene by its slug from the scenes array.
 * @param scenes - The array of scenes to search in.
 * @param slug - The scene slug to find.
 * @returns The scene object or undefined.
 */
export function getSceneBySlug<T extends {slug: string}>(scenes: T[], slug: string | null | undefined): T | undefined {
	if (!slug) return undefined
	return scenes.find(scene => scene.slug === slug)
}

/**
 * Get the thumbnail for a space.
 * @param space - The space to get the thumbnail from.
 * @returns The thumbnail URL or empty string.
 */
export function getSpaceThumbnail(space: {thumbnail?: string} | null | undefined): string {
	return space?.thumbnail ?? ''
}

/**
 * Fabric texture loading utilities
 */

export type FabricTextureState = {
	texture: Accessor<TextureSet | null>
	loading: Accessor<boolean>
	error: Accessor<Error | null>
}

/** Configuration for texture retry behavior */
export interface FabricTextureRetryConfig {
	maxRetries?: number
	retryDelay?: number
}

/**
 * Creates reactive signals for fabric texture loading with automatic retry logic.
 * Converts async texture loading into reactive signals with proper cleanup.
 */
export function createFabricTexture(
	fabric: Accessor<Fabric | undefined>,
	retryConfig: FabricTextureRetryConfig = {},
): FabricTextureState {
	const {maxRetries = 3, retryDelay = 1000} = retryConfig

	const [texture, setTexture] = createSignal<TextureSet | null>(null)
	const [loading, setLoading] = createSignal(false)
	const [error, setError] = createSignal<Error | null>(null)

	function reset() {
		setTexture(null)
		setLoading(false)
		setError(null)
	}

	createEffect(() => {
		const currentFabric = fabric()

		if (!currentFabric) {
			reset()
			return
		}

		let canceled = false
		let retryCount = 0

		const loadTexture = async () => {
			setLoading(true)
			setError(null)

			try {
				const textureSet = await textureManager.loadFabricTextures(currentFabric)

				if (canceled) return

				setTexture(textureSet)
				setLoading(false)
			} catch (err) {
				if (canceled) return

				const error = err instanceof Error ? err : new Error(String(err))

				if (retryCount < maxRetries) {
					retryCount++
					setTimeout(() => {
						if (!canceled) loadTexture()
					}, retryDelay)
				} else {
					setError(error)
					setLoading(false)
				}
			}
		}

		loadTexture()

		onCleanup(() => {
			canceled = true
			reset()

			const currentTexture = texture()
			if (currentTexture) {
				currentTexture.baseColor?.dispose()
				currentTexture.normal?.dispose()
				currentTexture.displacement?.dispose()
				currentTexture.roughness?.dispose()
				currentTexture.alpha?.dispose()
			}
		})
	})

	return {texture, loading, error}
}

/**
 * The fast way to remove an item from an array when item order
 * doesn't matter. Avoids shifting all items after the removed one.
 */
export function removeItemUnsorted(array: unknown[], item: unknown) {
	const index = array.indexOf(item)
	if (index === -1) return
	array[index] = array[array.length - 1]
	array.pop()
}

/** Maps an object type to an array of its entries, excluding entries with undefined values. */
type EntriesNoUndefined<O> = Array<
	{
		[K in keyof O]-?: undefined extends O[K]
			? Exclude<O[K], undefined> extends never
				? never
				: [K, Exclude<O[K], undefined>]
			: [K, O[K]]
	}[keyof O]
>

/**
 * A version of Object.entries with a more helpful type. Note this only works
 * with own keys, and skips entries with undefined values. Use null if you want
 * to keep an entry but indicate absence.
 *
 * Example:
 *   entries({n: 1, a: '123', b: undefined})
 *   // => Array<["n" | "a", number | string]>
 */
export function entries<O extends Record<PropertyKey, unknown>>(obj: O) {
	return Object.entries(obj).filter(([, v]) => v !== undefined) as EntriesNoUndefined<O>
}

/**
 * A version of Object.values with a more helpful type. Note this only works
 * with own keys, and skips entries with undefined values. Use null if you want
 * to keep an entry but indicate absence.
 *
 * Example:
 *   values({n: 1, a: '123', b: undefined})
 *   // => Array<[number | string]>
 */
export function values<O extends Record<PropertyKey, unknown>>(obj: O) {
	return Object.values(obj).filter(v => v !== undefined) as Array<Exclude<O[keyof O], undefined>>
}

/**
 * Like Map.size, but for objects (only own keys).
 */
export function size(obj: Record<PropertyKey, unknown>) {
	return Object.keys(obj).length
}
