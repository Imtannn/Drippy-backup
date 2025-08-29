import {createSignal, css, Element, element, For, html, Motor, onCleanup, Show, signal, untrack} from 'lume'
import * as THREE from 'three'
import '../elements/loading-indicator.js'
import '../elements/show-when.js'
import type {Block} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import './app-buttons.js'
import {store} from './store.js'

const femaleAvatar = new URL('../models/EM-Underwear.glb', import.meta.url)
const maleAvatar = new URL('../models/ANH-Underwear.glb', import.meta.url)

const scenes = [
	{
		name: 'bloom realms',
		description: 'One million roses',
		image: new URL('../images/doina-bg.webp', import.meta.url),
	},
]

@element
export class DrippyScene extends Element {
	static elementName = 'drippy-scene'

	@signal isDark = false
	@signal loadingBlocks: string[] = []
	@signal loadingMaterials: string[] = []
	@signal sceneUrl = ''

	// Cache for textures per URL so we don't reload repeatedly
	#textureCache = new Map<string, any>()

	async #getTexture(url: string, repete: [number, number], coef: number, offset: [number, number], rotate: number) {
		const key = `${url}-${repete[0]}-${repete[1]}-${coef}-${offset[0]}-${offset[1]}-${rotate}`
		if (this.#textureCache.has(key)) return this.#textureCache.get(key) as THREE.Texture

		const texture = await this.#createTexture(url, repete, coef, offset, rotate)
		if (!texture) return undefined
		this.#textureCache.set(key, texture)
		return texture
	}

	#extractMeshesFromObj(obj: THREE.Object3D): THREE.Mesh[] {
		const meshes: THREE.Mesh[] = []

		// Recursive function to traverse the scene graph
		const traverse = (node: THREE.Object3D) => {
			if (node instanceof THREE.Mesh) {
				meshes.push(node)
			}

			if (node.children?.length > 0) {
				node.children.forEach(child => traverse(child))
			}
		}

		// Start traversal from the root node of the GLTF scene
		traverse(obj)

		return meshes
	}

	#getCoef(arr: number[]) {
		const max = Math.max(...arr)
		return max > 1 ? 1000 : 1
	}

	// TODO: If the same fabric with same key is already fetching, wait for it to finish and use the same texture
	async #applyFabricToThreeObject(root: any, fabric: Fabric | null, cancelApply: () => boolean, blockId?: string) {
		if (!fabric || !root) return

		const loadingId = blockId || `${fabric._id}-${Date.now()}`
		this.loadingMaterials = [...untrack(() => this.loadingMaterials), loadingId]
		const repete: [number, number] = [60 / 19, 60 / 19]
		const offset: [number, number] = [0, 0]
		const rotate = 0
		const meshes = this.#extractMeshesFromObj(root)
		const arr = Array.from(meshes[0]?.geometry?.attributes?.uv?.array)
			.slice(0, 5)
			.map((el: any) => Math.abs(el))
		const coef = arr.length > 0 ? this.#getCoef(arr) : 1

		const [baseColorTex, normalTex, displacementTex, roughnessTex] = await Promise.all([
			this.#getTexture(fabric.baseColor || '', repete, coef, offset, rotate),
			this.#getTexture(fabric.normal || '', repete, coef, offset, rotate),
			this.#getTexture(fabric.displacement || '', repete, coef, offset, rotate),
			this.#getTexture(fabric.roughness || '', repete, coef, offset, rotate),
		])

		if (untrack(cancelApply)) {
			this.loadingMaterials = untrack(() => this.loadingMaterials).filter(id => id !== loadingId)
			return
		}

		// Configure textures
		if (baseColorTex) baseColorTex.colorSpace = THREE.SRGBColorSpace as any
		for (const tex of [baseColorTex, normalTex, displacementTex, roughnessTex]) {
			if (!tex) continue
			tex.wrapS = THREE.RepeatWrapping
			tex.wrapT = THREE.RepeatWrapping
		}

		const group = root.children?.[0] ?? root
		group.traverse?.((obj: any) => {
			if (obj?.isMesh && obj.material) {
				const material = obj.material
				material.map = baseColorTex
				material.normalMap = normalTex
				// material.displacementMap = displacementTex
				material.roughnessMap = roughnessTex
				// Ensure GPU-side texture state updates immediately
				if (material.map) material.map.needsUpdate = true
				if (material.normalMap) material.normalMap.needsUpdate = true
				if (material.roughnessMap) material.roughnessMap.needsUpdate = true
				// if (material.displacementMap) material.displacementMap.needsUpdate = true
				material.needsUpdate = true
			}
		})

		this.loadingMaterials = untrack(() => this.loadingMaterials).filter(id => id !== loadingId)
	}

	// Reset materials to default state (no textures)
	#resetMaterialsToDefault(root: any) {
		if (!root) return

		const group = root.children?.[0] ?? root
		group.traverse?.((obj: any) => {
			if (obj?.isMesh && obj.material) {
				const material = obj.material
				material.map = null
				material.normalMap = null
				material.roughnessMap = null
				// material.displacementMap = null
				material.needsUpdate = true
			}
		})
	}

	#renderTask = () => {
		if (!this.shadowRoot) return
		const models = Array.from(this.shadowRoot?.querySelectorAll('lume-gltf-model[data-cloth]') ?? []) as any[]
		for (const el of models) {
			el.needsUpdate?.()
			el.scene?.needsRender?.()
		}
	}

	async #createTexture(
		image: string | undefined,
		repeat: [number, number],
		coef?: number,
		offset?: [number, number],
		rotate?: number,
	): Promise<THREE.Texture | null> {
		return new Promise<THREE.Texture | null>((resolve, reject) => {
			if (!image) {
				resolve(null)
			} else {
				const loader = new THREE.TextureLoader()

				loader.load(
					this.#uncacheImage(image),
					(texture: any) => {
						texture.needsUpdate = true
						texture.wrapS = THREE.RepeatWrapping
						texture.wrapT = THREE.RepeatWrapping
						texture.flipY = false
						if (offset) {
							texture.offset.set(offset[0], offset[1])
						}
						if (rotate) {
							texture.rotation = rotate
						}

						// Calculate repeat based on the texture's aspect ratio
						const aspectRatio = texture.image.width / texture.image.height
						let repeatX = repeat[0]
						let repeatY = repeat[1]

						if (coef) {
							repeatX /= coef
							repeatY /= coef
						}

						// Adjust for aspect ratio
						if (aspectRatio > 1) {
							repeatY /= aspectRatio
						} else {
							repeatX *= aspectRatio
						}

						// Update texture repeat
						texture.repeat.set(repeatX, repeatY)

						// Optional: mipmapping for better performance and quality
						texture.generateMipmaps = true
						texture.minFilter = THREE.LinearMipmapLinearFilter
						texture.magFilter = THREE.LinearFilter
						texture.format = THREE.RGBAFormat
						resolve(texture)
					},
					undefined,
					err => {
						console.error('An error happened while loading the texture:', err)
						reject(null)
					},
				)
			}
		})
	}

	#uncacheImage(img: string) {
		try {
			const url = new URL(img)
			url.searchParams.set('v', new Date().getTime().toString())
			return url.toString()
		} catch (e) {
			return img
		}
	}

	connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			if (store.view === 'preview') {
				this.style.setProperty('--scene-transform', 'translateX(0)')
			} else {
				if (
					store.view === 'order' ||
					store.view === 'custom-measurement' ||
					store.view === 'success' ||
					store.view === 'share'
				) {
					this.style.setProperty('--scene-transform', 'translateX(-10rem)')
				} else {
					this.style.setProperty('--scene-transform', 'translateX(10rem)')
				}
			}
		})

		this.createEffect(() => {
			console.log('store.view', store.view)
			if (store.view === 'preview') {
				this.style.setProperty('--scene-desktop-transform', 'translateY(0)')
			} else {
				this.style.setProperty('--scene-desktop-transform', 'translateY(-100px)')
			}
		})

		this.createEffect(() => {
			if (store.selectedScene) {
				const scene = scenes.find(scene => scene.name === store.selectedScene)
				if (scene) {
					this.sceneUrl = scene.image.href
				}
			}
		})

		this.isDark = document.documentElement.dataset.theme === 'dark'

		const onThemeChange = () => (this.isDark = document.documentElement.dataset.theme === 'dark')

		this.createEffect(() => {
			const mo = new MutationObserver(onThemeChange)
			mo.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']})
			onCleanup(() => mo.disconnect())
		})

		// Track avatar loading state
		this.createEffect(() => {
			const avatar = this.shadowRoot?.querySelector('lume-gltf-model[data-avatar]') as any
			if (!avatar) return

			const behavior = avatar.behaviors?.get?.('gltf-model')
			const avatarId = 'avatar'

			if (!behavior?.model && avatar.three) {
				if (!untrack(() => this.loadingBlocks.includes(avatarId))) {
					this.loadingBlocks = [...untrack(() => this.loadingBlocks), avatarId]
				}

				const loaded = () => {
					this.loadingBlocks = untrack(() => this.loadingBlocks).filter(id => id !== avatarId)
				}
				avatar.on?.('MODEL_LOAD', loaded)
				onCleanup(() => {
					avatar.off?.('MODEL_LOAD', loaded)
				})
			}
		})

		// Track block loading state
		this.createEffect(() => {
			const blockCount = store.selectedBlocks.size

			if (blockCount === 0) {
				this.loadingBlocks = untrack(() => this.loadingBlocks).filter(id => id !== 'avatar')
				return
			}

			const models = Array.from(this.shadowRoot?.querySelectorAll('lume-gltf-model[data-cloth]') ?? []) as any[]

			for (const [index, el] of models.entries()) {
				const behavior = el.behaviors?.get?.('gltf-model')
				const blockId = `block-${index}`

				if (!behavior?.model && el.three) {
					if (!untrack(() => this.loadingBlocks.includes(blockId))) {
						this.loadingBlocks = [...untrack(() => this.loadingBlocks), blockId]
					}

					const loaded = () => {
						this.loadingBlocks = untrack(() => this.loadingBlocks).filter(id => id !== blockId)
					}

					el?.on?.('MODEL_LOAD', loaded)
					onCleanup(() => {
						el?.off?.('MODEL_LOAD', loaded)
					})
				}
			}
		})

		// Re-apply materials whenever the selected fabric changes or models mount
		this.createEffect(() => {
			const fabric = store.selectedFabric
			// Cause reactive re-run when the number of blocks changes
			const blockCount = store.selectedBlocks.size

			if (blockCount === 0) {
				// nothing to bind
				return
			}

			if (!fabric) {
				// Reset materials to default state (no textures)
				const models = Array.from(this.shadowRoot?.querySelectorAll('lume-gltf-model[data-cloth]') ?? []) as any[]

				for (const el of models) {
					const resetMaterial = () => {
						this.#resetMaterialsToDefault((el as any).three)
					}
					const behavior = el.behaviors?.get?.('gltf-model')
					if (!behavior?.model || !el.three) {
						el.on?.('MODEL_LOAD', resetMaterial)
					} else {
						resetMaterial()
					}
				}
				return
			}

			const [cancelApply, setCancelApply] = createSignal(false)
			const models = Array.from(this.shadowRoot?.querySelectorAll('lume-gltf-model[data-cloth]') ?? []) as any[]
			const handlers: Array<{el: any; fn: () => void}> = []

			for (const [index, el] of models.entries()) {
				const blockId = `material-${index}`
				const apply = () => {
					const isCanceled = untrack(cancelApply)
					if (!isCanceled) {
						this.#applyFabricToThreeObject((el as any).three, fabric, cancelApply, blockId)
					}
				}
				const behavior = el.behaviors?.get?.('gltf-model')
				if (!behavior?.model || !el.three) {
					el.on?.('MODEL_LOAD', apply)
					handlers.push({el, fn: apply})
				} else {
					apply()
				}
			}

			onCleanup(() => {
				setCancelApply(true)
				for (const {el, fn} of handlers) {
					el.off?.('MODEL_LOAD', fn)
				}
			})
		})

		// Force update the scene when the fabric changes
		Motor?.addRenderTask(this.#renderTask)

		/**
		 * TODO: FIX: This is causing errors, when click on another component (which is unrelated to the scene) onCleanUp is getting called
		 */
		// onCleanup(() => {
		// 	Motor?.removeRenderTask(this.#renderTask)
		// })
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		Motor?.removeRenderTask(this.#renderTask)
	}

	template = () => html`
		<show-when condition=${() => store.view === 'blocks' || store.view === 'avatar' || store.view === 'template'} content=${() => html`
			<app-buttons-left layout="bottom">
				<app-buttons-group>
					<loading-indicator
						is-visible=${() => this.loadingBlocks.length > 0 || this.loadingMaterials.length > 0}
					></loading-indicator>
				</app-buttons-group>
			</app-buttons-left>
		`}></show-when>

		<div id="lume-scene-container" style=${() => `background: url(${this.sceneUrl}) center bottom / cover no-repeat`}>
		<lume-scene webgl>
			<lume-ambient-light intensity="0.8" color="0xffffff"></lume-ambient-light>
			<lume-directional-light position="5 5 5"></lume-directional-light>
			<lume-directional-light position="-5 -5 -5"></lume-directional-light>

			<lume-camera-rig
				min-distance="1.5"
				max-distance="8"
				distance="4"
				dolly-speed="0.01"
				position="0 -1 0"
			></lume-camera-rig>

			<lume-box
				visible="false"
				cast-shadow="false"
				size="1 1 1"
				color="skyblue"
				roughness="0.3"
				metalness="0.7"
				mount-point="0.5 0.5 0.5"
			></lume-box>

			<lume-gltf-model
				src=${() =>
					store.selectedAvatar !== null
						? store.selectedAvatar === 'female'
							? femaleAvatar.href
							: maleAvatar.href
						: store.tempSelectedAvatar === 'female'
							? femaleAvatar.href
							: maleAvatar.href}

							data-avatar
			></lume-gltf-model>

			<${For} each=${() => Array.from(store.selectedBlocks.values())}>
				${(item: Block) => html` <lume-gltf-model data-cloth src=${item.modelFile}></lume-gltf-model> `}
			</>

			<${Show} when=${() => store.selectedBlocks.get('Sleeves')?.modelFile}>
				${() =>
					html`<lume-gltf-model
						data-cloth
						src=${() => store.selectedBlocks.get('Sleeves')?.modelFile}
						scale="-1 1 1"
					></lume-gltf-model>`}
			</>
			</lume-scene>
		</div>
	`

	css = css/*css*/ `
		:host {
			--scene-transform: translateX(0);
			--scene-desktop-transform: translateY(-100px);
			background: var(--appBackground);
		}

		:host {
			width: var(--appWidth);
			height: var(--appHeight);
			touch-action: none;
			position: relative;
		}

		#lume-scene-container {
			width: 100%;
			height: 100%;
			transition: transform var(--transitionFast);
		}

		lume-scene {
			transform: var(--scene-transform);
			transition: transform var(--transitionFast);
		}

		@media (max-width: 767px) {
			#lume-scene-container {
				transform: var(--scene-desktop-transform);
			}

			lume-scene {
				transform: translateX(0);
			}
		}
	`
}
