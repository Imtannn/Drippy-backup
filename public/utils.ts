import {Easing} from '@tweenjs/tween.js'
import type {Element3D, GltfModel, Mesh} from 'lume'
import {batch, createEffect, createMemo, createSignal, getOwner, onCleanup, untrack, type Signal} from 'solid-js'
import * as THREE from 'three'
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

export function enableShadowOnModelLoad(el: GltfModel) {
	const loaded = onModelLoad(el)

	createEffect(() => {
		if (!loaded()) return
		enableShadows(el)
	})
}

export function enableShadows(el: Element3D) {
	el.three.traverse((child: THREE.Object3D) => {
		if (!isMesh(child)) return
		child.castShadow = true
		child.receiveShadow = true
	})

	el.needsUpdate()
}

export function enableFrontsideRendering(el: Element3D) {
	el.three.traverse((child: THREE.Object3D) => {
		if (!isMesh(child)) return
		if (child.material instanceof THREE.Material) {
			child.material.side = THREE.FrontSide
			child.material.needsUpdate = true
		} else {
			child.material.map(material => {
				material.side = THREE.FrontSide
				material.needsUpdate = true
			})
		}
	})

	el.needsUpdate()
}

export function enableFrontsideOnModelLoad(el: GltfModel) {
	const loaded = onModelLoad(el)

	createEffect(() => {
		if (!loaded()) return
		enableFrontsideRendering(el)
	})
}

export function* meshesInTree(root: THREE.Object3D): Generator<THREE.Mesh> {
	if (root instanceof THREE.Mesh) {
		yield root
	}

	for (const child of root.children) {
		yield* meshesInTree(child)
	}
}

/**
 * Capture a screenshot of a specific garment category from the Lume scene
 * @param category - The template category to capture (Shirt, Pants, etc.)
 * @returns Promise<string> - Base64 data URL of the screenshot
 */
export async function captureGarmentScreenshot(category: string): Promise<string> {
	// Find the drippy-app element
	const app = document.querySelector('drippy-app') as any
	if (!app?.shadowRoot) return ''

	// Get the drippy-scene
	const scene = app.shadowRoot.querySelector('drippy-scene') as any
	if (!scene?.shadowRoot) return ''

	// Get the lume-scene
	const lumeScene = scene.shadowRoot.querySelector('lume-scene') as any
	if (!lumeScene?.shadowRoot) return ''

	// Get all garment models (cloth items) - they're direct children of lume-scene
	const clothModels = lumeScene.querySelectorAll('lume-gltf-model[data-cloth]')

	// Simple approach: hide all garments except the target category (no scaling)
	const modelsToHide: any[] = []

	clothModels.forEach((model: any) => {
		const modelId = model.getAttribute('id') || ''
		const shouldKeep = modelId.startsWith(category + '-')

		if (!shouldKeep) {
			// Hide the Three.js object instead of CSS display
			if (model.three) {
				model.three.visible = false
				modelsToHide.push(model)
			}
		}
	})

	// Hide scene and other elements
	const otherModelsToHide: any[] = []

	// Use drippy-scene's avatarModel property to hide avatar
	const drippyScene = scene as any

	if (drippyScene && drippyScene.avatarModel) {
		// Selectively hide only avatar body (not garments)
		let hiddenAvatarParts: any[] = []

		drippyScene.avatarModel.three.children.forEach((child: any) => {
			const childName = child.name || ''
			const isGarment =
				childName.includes('LUME-GLTF-MODEL#') &&
				(childName.toLowerCase().includes('shirt') ||
					childName.toLowerCase().includes('pants') ||
					childName.toLowerCase().includes('accessories'))

			if (!isGarment) {
				// This is avatar body - hide it
				child.visible = false
				hiddenAvatarParts.push(child)
			}
		})

		if (hiddenAvatarParts.length > 0) {
			otherModelsToHide.push({restore: 'avatarParts', parts: hiddenAvatarParts})
			// Wait for the change to take effect
			await new Promise(resolve => requestAnimationFrame(resolve))
		}
	}

	// Hide scene/background
	const sceneModel = lumeScene.querySelector('#scene')
	if (sceneModel?.three) {
		sceneModel.three.visible = false
		otherModelsToHide.push(sceneModel)
	}

	// Hide shoes and any other non-cloth models
	const allOtherModels = lumeScene.querySelectorAll('lume-gltf-model:not([data-cloth])')
	allOtherModels.forEach((model: any) => {
		const modelId = model.getAttribute('id') || 'unnamed'
		if (model.three && modelId !== 'avatar' && modelId !== 'scene') {
			model.three.visible = false
			otherModelsToHide.push(model)
		}
	})

	// Create a new lume-perspective-camera for screenshot
	const screenshotCamera = document.createElement('lume-perspective-camera')

	// Set camera attributes based on garment type - using smaller values since Lume transforms them
	screenshotCamera.setAttribute('fov', '50')
	screenshotCamera.setAttribute('near', '0.1')
	screenshotCamera.setAttribute('far', '1000')
	if (category === 'Shirt' || category === 'Dress') {
		screenshotCamera.setAttribute('position', '0 -1.1 0.5')
		screenshotCamera.setAttribute('look-at', '0 -0.3 0')
	} else if (category === 'Pants' || category === 'Skirt') {
		screenshotCamera.setAttribute('position', '0 -0.6 0.5')
		screenshotCamera.setAttribute('look-at', '0 -0.8 0')
	} else {
		screenshotCamera.setAttribute('position', '0 0 0.7')
		screenshotCamera.setAttribute('look-at', '0 0 0')
	}

	// Add camera to scene and make it active
	lumeScene.appendChild(screenshotCamera)
	screenshotCamera.setAttribute('active', 'true')

	// Wait for camera to be positioned and activated
	await new Promise(resolve => requestAnimationFrame(resolve))

	// Directly manipulate the Three.js camera object to override Lume transforms
	const threeCamera = (screenshotCamera as any).three
	if (threeCamera) {
		// Set position directly on Three.js camera - adjust Y position to frame garments properly
		if (category === 'Shirt' || category === 'Dress') {
			threeCamera.position.set(0, 1.2, 1)
			threeCamera.lookAt(0, 0, 0)
		} else if (category === 'Pants' || category === 'Skirt') {
			threeCamera.position.set(0, 0.7, 1)
			threeCamera.lookAt(0, -0.3, 0)
		} else {
			threeCamera.position.set(0, 0.4, 1) // Closer for default view
			threeCamera.lookAt(0, 0, 0) // Look at center
		}

		// Reset rotation to look straight ahead
		threeCamera.rotation.set(0, 0, 0) // Reset rotation to look straight
		threeCamera.updateMatrix()
		threeCamera.updateMatrixWorld(true)

		// Wait another frame for the direct position change
		await new Promise(resolve => requestAnimationFrame(resolve))
	}

	// Add delay to ensure 3D scene is rendered after scaling
	await new Promise(resolve => setTimeout(resolve, 100))

	// Get canvas and renderer
	const canvas = lumeScene.shadowRoot.querySelector('canvas')
	if (!canvas) {
		return ''
	}

	const renderer = lumeScene.glRenderer || lumeScene._glRenderer || lumeScene.renderer
	let screenshot = ''

	if (renderer) {
		const threeScene = lumeScene.three || renderer.scene
		const threeCamera = (screenshotCamera as any).three || lumeScene.camera?.three || lumeScene.three?.camera

		if (threeScene && threeCamera) {
			// Set a clean light background for product shots
			const originalBackground = renderer.getClearColor(new THREE.Color())
			const originalAlpha = renderer.getClearAlpha()
			renderer.setClearColor(0xf5f5f5, 1.0) // Light gray background

			renderer.render(threeScene, threeCamera)
			screenshot = renderer.domElement.toDataURL('image/png')

			// Restore original background
			renderer.setClearColor(originalBackground, originalAlpha)
		}
	}

	if (!screenshot) {
		screenshot = canvas.toDataURL('image/png')
	}

	// Restore hidden models
	modelsToHide.forEach(model => {
		if (model.three) {
			model.three.visible = true
		}
	})

	// Restore avatar and scene
	otherModelsToHide.forEach(model => {
		if (model.restore === 'avatarParts') {
			model.parts.forEach((part: any) => {
				part.visible = true
			})
		} else {
			if (model.three) {
				model.three.visible = true
			}
		}
	})

	// Remove screenshot camera and revert to main camera
	screenshotCamera.removeAttribute('active')
	lumeScene.removeChild(screenshotCamera)

	return screenshot
}
