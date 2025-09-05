import {
	createEffect,
	css,
	Element,
	element,
	For,
	GltfModel,
	html,
	Index,
	Motor,
	onCleanup,
	Scene,
	Show,
	signal,
	untrack,
} from 'lume'
import type {Accessor} from 'solid-js'
import * as THREE from 'three'
import {spaces} from '../consts/spaces.js'
import '../elements/loading-indicator.js'
import '../elements/logic/show-when.js'
import type {Block, BlockCategory} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'
import type {TemplateCategory} from '../types/template.js'
import './app-buttons.js'
import {store} from './store.js'

const femaleAvatar = new URL('../models/EM-MoiDien.glb', import.meta.url)
const maleAvatar = new URL('../models/ANH-Underwear.glb', import.meta.url)

type RenderBlock = {block: Block; templateCategory: TemplateCategory; id: string}

@element
export class DrippyScene extends Element {
	static elementName = 'drippy-scene'

	@signal isDark = false
	@signal loadingBlocks: string[] = []
	@signal loadingMaterials: string[] = []
	@signal sceneUrl = ''
	@signal renderBlocks: RenderBlock[] = []

	// Cache for textures per URL so we don't reload repeatedly
	#textureCache = new Map<string, any>()

	@signal private backgroundModel: GltfModel | null = null

	@signal private lumeScene: Scene | null = null

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
	async #applyFabricToThreeObject(root: any, fabric: Fabric | null, isCanceled: () => boolean, blockId?: string) {
		if (!fabric || !root) return

		const loadingId = blockId || `${fabric._id}-${Date.now()}`
		this.loadingMaterials = [...untrack(() => this.loadingMaterials), loadingId]
		const repete: [number, number] = [60 / 3, 60 / 3]
		const offset: [number, number] = [1, 1]
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

		if (isCanceled()) {
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
				material.roughnessIntensity = 1
				material.transparent = true
				material.emissive = new THREE.Color(0x000000)
				material.emissiveIntensity = 0
				material.aoMapIntensity = 1
				material.side = THREE.DoubleSide
				material.normalScale = new THREE.Vector2(2, 2)
				material.blending = THREE.NormalBlending
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
		const models = Array.from(this.shadowRoot.querySelectorAll('lume-gltf-model[data-cloth]') ?? []) as any[]
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
			if (store.view === 'preview') {
				this.style.setProperty('--scene-desktop-transform', 'translateY(0)')
			} else {
				this.style.setProperty('--scene-desktop-transform', 'translateY(-100px)')
			}
		})

		this.createEffect(() => {
			if (store.selectedSpace) {
				const space = spaces.find(space => space.name === store.selectedSpace?.name)
				if (space) {
					this.sceneUrl = space.image.href
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
			if (!store.selectedAvatar || !store.tempSelectedAvatar || !store.isShowAvatar) return
			const avatar = this.shadowRoot?.querySelector('lume-gltf-model[data-avatar]') as any
			if (!avatar) return

			const behavior = avatar.behaviors?.get?.('gltf-model')
			const avatarId = 'avatar'

			if (!behavior?.model && avatar.three) {
				if (!untrack(() => this.loadingBlocks.includes(avatarId))) {
					this.loadingBlocks = [...untrack(() => this.loadingBlocks), avatarId]
				}

				if (!untrack(() => store.isDrippySceneLoading.includes(avatarId))) {
					store.addIsDrippySceneLoading = avatarId
				}

				const loaded = () => {
					this.loadingBlocks = untrack(() => this.loadingBlocks).filter(id => id !== avatarId)
					store.removeIsDrippySceneLoading = avatarId
				}

				avatar.on?.('MODEL_LOAD', loaded)
				onCleanup(() => {
					avatar.off?.('MODEL_LOAD', loaded)
				})

				enableShadowOnModelLoad(avatar)
			}
		})

		// Track scene loading state
		this.createEffect(() => {
			if (!store.selectedSpace || !store.isShowScene) return
			const scene = this.backgroundModel
			if (!scene) return

			const behavior = scene.behaviors?.get?.('gltf-model')
			const sceneId = 'scene'

			if (!behavior?.model && scene.three) {
				if (!untrack(() => this.loadingBlocks.includes(sceneId))) {
					this.loadingBlocks = [...untrack(() => this.loadingBlocks), sceneId]
				}
				if (!untrack(() => store.isDrippySceneLoading.includes(sceneId))) {
					store.addIsDrippySceneLoading = sceneId
				}
			}

			const loaded = () => {
				this.loadingBlocks = untrack(() => this.loadingBlocks).filter(id => id !== sceneId)
				store.removeIsDrippySceneLoading = sceneId
			}

			scene.on?.('MODEL_LOAD', loaded)
			onCleanup(() => {
				scene.off?.('MODEL_LOAD', loaded)
			})
		})

		// Track block loading state
		this.createEffect(() => {
			const totalBlockCount = this.renderBlocks.length

			if (totalBlockCount === 0) {
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

		// This will cache render blocks by ID. This is a quick fix to make the
		// <For> re-use the same objects to avoid reloading GLTF models.
		const renderBlockCache = new Map<string, RenderBlock>()

		function getRenderBlock(id: string, block: Block, templateCategory: TemplateCategory) {
			let renderBlock = renderBlockCache.get(id)
			if (!renderBlock) renderBlockCache.set(id, (renderBlock = {block, templateCategory, id}))
			return renderBlock
		}

		this.createEffect(() => {
			const blocks = Array.from(store.selectedBlocks.values()).flatMap(blocks => Array.from(blocks.values()))
			this.renderBlocks = blocks.flatMap(block => {
				if (block.category === 'Sleeves') {
					const id = `${block.templateCategory}-${block.category}-${block._id}`
					let renderBlock = getRenderBlock(id, block, block.templateCategory)

					const idMirror = `${id}-mirror`
					let renderBlockMirror = getRenderBlock(idMirror, block, block.templateCategory)

					return [renderBlock, renderBlockMirror]
				}

				const id = `${block.templateCategory}-${block.category}-${block._id}`
				let renderBlock = getRenderBlock(id, block, block.templateCategory)

				return renderBlock
			})
		})

		// Re-apply materials whenever the selected fabrics change or models mount
		this.createEffect(async () => {
			const selectedFabrics = store.selectedFabrics
			// Add a delay of 100ms to ensure the lume-gltf-model are in the DOM
			await new Promise(resolve => setTimeout(resolve, 100))

			// Cause reactive re-run when the number of blocks changes
			if (this.renderBlocks.length === 0) {
				// nothing to bind
				return
			}

			let shouldCancel = false
			const isCanceled = () => shouldCancel

			const models = Array.from(this.shadowRoot?.querySelectorAll('lume-gltf-model[data-cloth]') ?? []) as any[]
			const handlers: Array<{el: any; fn: () => void}> = []

			// Process each model using its data-blockid to find the correct fabric
			for (const el of models) {
				const blockId = el.getAttribute('id')
				if (!blockId) continue

				// Parse blockId to extract template category, block category, and block ID
				// Format: "TemplateCategory-BlockCategory-BlockId" or "TemplateCategory-BlockCategory-BlockId-mirror"
				const isMirror = blockId.endsWith('-mirror')
				const baseBlockId = isMirror ? blockId.slice(0, -7) : blockId // Remove "-mirror" if present
				const parts = baseBlockId.split('-')

				if (parts.length < 3) continue

				const templateCategory = parts[0] as TemplateCategory
				const blockCategory = parts[1] as BlockCategory

				// Find the fabric for this block
				const templateFabrics = selectedFabrics.get(templateCategory)
				const fabric = templateFabrics?.get(blockCategory)
				const loadingId = `material-${blockId}`

				const applyOrReset = () => {
					if (isCanceled()) return

					if (fabric) {
						this.#applyFabricToThreeObject((el as any).three, fabric, isCanceled, loadingId)
					} else {
						// Reset to default material if no fabric selected for this block category
						this.#resetMaterialsToDefault((el as any).three)
					}
				}

				const behavior = el.behaviors?.get?.('gltf-model')
				if (!behavior?.model || !el.three) {
					el.on?.('MODEL_LOAD', applyOrReset)
					handlers.push({el, fn: applyOrReset})
				} else {
					applyOrReset()
				}
			}

			onCleanup(() => {
				shouldCancel = true
				for (const {el, fn} of handlers) {
					el.off?.('MODEL_LOAD', fn)
				}
			})
		})

		this.createEffect(() => {
			// Force update the scene when the fabric changes
			Motor?.addRenderTask(this.#renderTask)
			onCleanup(() => Motor?.removeRenderTask(this.#renderTask))
		})

		this.createEffect(() => {
			if (!this.backgroundModel) return
			enableShadowOnModelLoad(this.backgroundModel)
			enableFrontsideOnlyRenderLoad(this.backgroundModel)
		})

		this.createEffect(() => {
			if (!this.lumeScene) return
			this.lumeScene.glRenderer!.toneMapping = THREE.ACESFilmicToneMapping
		})
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		Motor?.removeRenderTask(this.#renderTask)
	}

	template = () => {
		const shadowBias = -0.0005
		const shadowNormalBias = /*0.005*/ 0
		const shadowCameraSize = 5
		const shadowMapSize = 1024
		const penumbra = 0.25
		const spotAngle = 30
		const shadowRadius = 4

		return html`
			<show-when condition=${() => store.view === 'blocks' || store.view === 'avatar' || store.view === 'template'} content=${() => html`
				<app-buttons-left layout="bottom">
					<app-buttons-group>
						<loading-indicator
							is-visible=${() => this.loadingBlocks.length > 0 || this.loadingMaterials.length > 0}
						></loading-indicator>
					</app-buttons-group>
				</app-buttons-left>
			`}></show-when>

			<div id="lume-scene-container">
				<lume-scene
					ref=${(el: Scene) => (this.lumeScene = el)}
					id="drippy-scene"
					webgl
					perspective="2200"
					physically-correct-lights
					shadow-mode="vsm"
				>
					<lume-element3d align-point="0.5 0.5 0.5">
						<lume-ambient-light intensity="0.7" color="white"></lume-ambient-light>

						<lume-spot-light
							target="#avatar"
							position="5 -5 1"
							intensity="3"
							shadow-camera-top="${-shadowCameraSize}"
							shadow-camera-bottom="${shadowCameraSize}"
							shadow-camera-left="${-shadowCameraSize}"
							shadow-camera-right="${shadowCameraSize}"
							shadow-map-width="${shadowMapSize}"
							shadow-map-height="${shadowMapSize}"
							shadow-bias="${shadowBias}"
							shadow-normal-bias="${shadowNormalBias}"
							penumbra="${penumbra}"
							angle="${spotAngle}"
							shadow-radius="${shadowRadius}"
						>

							<!-- <lume-sphere size="1 1 1" color="deeppink" has="basic-material"
								mount-point="0.5 0.5 0.5"
								cast-shadow="false"
							></lume-sphere> -->

						</lume-spot-light>

						<lume-spot-light
							target="#avatar"
							position="-5 -5 1"
							intensity="3"
							shadow-camera-top="${-shadowCameraSize}"
							shadow-camera-bottom="${shadowCameraSize}"
							shadow-camera-left="${-shadowCameraSize}"
							shadow-camera-right="${shadowCameraSize}"
							shadow-map-width="${shadowMapSize}"
							shadow-map-height="${shadowMapSize}"
							shadow-bias="${shadowBias}"
							shadow-normal-bias="${shadowNormalBias}"
							penumbra="${penumbra}"
							angle="${spotAngle}"
							shadow-radius="${shadowRadius}"
						>

							<!-- <lume-sphere size="1 1 1" color="deeppink" has="basic-material"
								mount-point="0.5 0.5 0.5"
								cast-shadow="false"
							></lume-sphere> -->

						</lume-spot-light>

						<lume-spot-light
							target="#avatar"
							position="0 -5 5"
							intensity="3"
							shadow-camera-top="${-shadowCameraSize}"
							shadow-camera-bottom="${shadowCameraSize}"
							shadow-camera-left="${-shadowCameraSize}"
							shadow-camera-right="${shadowCameraSize}"
							shadow-map-width="${shadowMapSize}"
							shadow-map-height="${shadowMapSize}"
							shadow-bias="${shadowBias}"
							shadow-normal-bias="${shadowNormalBias}"
							penumbra="${penumbra}"
							angle="${spotAngle}"
							shadow-radius="${shadowRadius}"
						>

							<!-- <lume-sphere size="1 1 1" color="deeppink" has="basic-material"
								mount-point="0.5 0.5 0.5"
								cast-shadow="false"
							></lume-sphere> -->

						</lume-spot-light>

						<lume-camera-rig
							min-distance="2"
							max-distance="15"
							distance="9"
							dolly-speed="0.01"
							position="0 -1 0"
						></lume-camera-rig>

						<${Show} when=${() => store.isShowAvatar}>
							<lume-gltf-model
								id="avatar"
								src=${() =>
									store.selectedAvatar !== null
										? store.selectedAvatar === 'female'
											? femaleAvatar.href
											: maleAvatar.href
										: store.tempSelectedAvatar === 'female'
											? femaleAvatar.href
											: maleAvatar.href}
								scale="1 1 1"
								data-avatar
							></lume-gltf-model>
						</>

						<${Show} when=${() => store.isShowScene}>
							<lume-gltf-model
								ref=${(el: GltfModel) => (this.backgroundModel = el)}
								id="scene"
								src=${() => store.selectedSpace?.scene.href ?? ''}
							></lume-gltf-model>
						</>

						<${Index} each=${() => store.selectedSpace?.includedModelFiles}>
							${(item: Accessor<URL>) => html`
								<lume-gltf-model ref=${enableShadowOnModelLoad} src=${() => item().href}></lume-gltf-model>
							`}
						</>

						<${For} each=${() => this.renderBlocks}>
							${(item: RenderBlock, index: Accessor<number>) => html`
								<lume-gltf-model
									ref=${enableShadowOnModelLoad}
									id=${item.id}
									data-index=${index()}
									data-cloth
									src=${item.block.modelFile}
									scale=${item.id.endsWith('-mirror') ? '-1 1 1' : '1 1 1'}
								></lume-gltf-model>
							`}
						</>
					</lume-element3d>
				</lume-scene>
			</div>
		`
	}

	css = css/*css*/ `
		:host {
			--scene-transform: translateX(0);
			--scene-desktop-transform: translateY(-100px);
			background: var(--appBackground);
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

function isMesh(obj: THREE.Object3D): obj is THREE.Mesh {
	return obj instanceof THREE.Mesh
}

const enableFrontsideOnlyRenderLoad = (obj: GltfModel) => {
	createEffect(() => {
		const onFrontSideRender = () => enableFrontsideRendering(obj.three)
		obj.on('MODEL_LOAD', onFrontSideRender)
		onCleanup(() => obj.off('MODEL_LOAD', onFrontSideRender))
	})
}

function enableFrontsideRendering(obj: THREE.Object3D) {
	obj.traverse((child: THREE.Object3D) => {
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
}

const enableShadowOnModelLoad = (el: GltfModel) => {
	createEffect(() => {
		const onload = () => enableShadows(el.three)
		el.on('MODEL_LOAD', onload)
		onCleanup(() => el.off('MODEL_LOAD', onload))
	})
}

function enableShadows(obj: THREE.Object3D) {
	obj.traverse((child: THREE.Object3D) => {
		if (!isMesh(child)) return
		child.castShadow = true
		child.receiveShadow = true
	})
}
