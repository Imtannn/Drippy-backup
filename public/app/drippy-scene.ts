import {html, Element, element, css, signal, onCleanup, For, Motor} from 'lume'
import type {Texture} from 'three'
import {store} from './store.js'
import type {Block} from '../types/block.js'
import type {Fabric} from '../types/fabric.js'

const femaleAvatar = new URL('../models/EM-Female.glb', import.meta.url)

@element
export class DrippyScene extends Element {
	static elementName = 'drippy-scene'

	@signal isDark = false

	// Cache for textures per URL so we don't reload repeatedly
	#textureCache = new Map<string, any>()

	async #getTexture(url: string, repete: [number, number], coef: number, offset: [number, number], rotate: number) {
		if (this.#textureCache.has(url)) return this.#textureCache.get(url) as Texture

		const texture = await this.#createTexture(url, repete, coef, offset, rotate)
		if (!texture) return undefined
		this.#textureCache.set(url, texture)
		return texture
	}

	async #applyFabricToThreeObject(root: any, fabric: Fabric | null) {
		if (!fabric || !root) return
		const [{SRGBColorSpace, RepeatWrapping}] = await Promise.all([import('three')])
		const repete: [number, number] = [60 / 19, 60 / 19]
		const offset: [number, number] = [0, 0]
		const rotate = 0
		const coef = 1000

		const [baseColorTex, normalTex, displacementTex, roughnessTex] = await Promise.all([
			this.#getTexture(fabric.baseColor, repete, coef, offset, rotate),
			this.#getTexture(fabric.normal, repete, coef, offset, rotate),
			this.#getTexture(fabric.displacement, repete, coef, offset, rotate),
			this.#getTexture(fabric.roughness, repete, coef, offset, rotate),
		])

		// Configure textures
		if (baseColorTex) baseColorTex.colorSpace = SRGBColorSpace as any
		for (const tex of [baseColorTex, normalTex, displacementTex, roughnessTex]) {
			if (!tex) continue
			tex.wrapS = RepeatWrapping
			tex.wrapT = RepeatWrapping
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
	): Promise<Texture | null> {
		const {TextureLoader, RepeatWrapping} = await import('three')
		const {LinearMipmapLinearFilter, LinearFilter, RGBAFormat} = await import('three')
		return new Promise<Texture | null>((resolve, reject) => {
			if (!image) {
				resolve(null)
			} else {
				const loader = new TextureLoader()

				loader.load(
					this.#uncacheImage(image),
					(texture: any) => {
						texture.needsUpdate = true
						texture.wrapS = RepeatWrapping
						texture.wrapT = RepeatWrapping
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
						texture.minFilter = LinearMipmapLinearFilter
						texture.magFilter = LinearFilter
						texture.format = RGBAFormat
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

		this.isDark = document.documentElement.dataset.theme === 'dark'

		const onThemeChange = () => (this.isDark = document.documentElement.dataset.theme === 'dark')

		this.createEffect(() => {
			const mo = new MutationObserver(onThemeChange)
			mo.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']})
			onCleanup(() => mo.disconnect())
		})

		// Re-apply materials whenever the selected fabric changes or models mount
		this.createEffect(() => {
			const fabric = store.selectedFabric
			// Cause reactive re-run when the number of blocks changes
			if (store.selectedBlocks.size === 0) {
				// nothing to bind
				return
			}

			const models = Array.from(this.shadowRoot?.querySelectorAll('lume-gltf-model[data-cloth]') ?? []) as any[]
			const handlers: Array<{el: any; fn: () => void}> = []

			for (const el of models) {
				const apply = () => {
					this.#applyFabricToThreeObject((el as any).three, fabric)
				}
				const behavior = el.behaviors?.get?.('gltf-model')
				if (behavior?.model || el.three) apply()
				else {
					el.on?.('MODEL_LOAD', apply)
					handlers.push({el, fn: apply})
				}
			}

			onCleanup(() => {
				for (const {el, fn} of handlers) el.off?.('MODEL_LOAD', fn)
			})
		})

		// Force update the scene when the fabric changes
		Motor?.addRenderTask(this.#renderTask)
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		Motor?.removeRenderTask(this.#renderTask)
	}

	template = () => html`
		<lume-scene webgl>
			<lume-point-light position="500 -500 500" intensity="2000"></lume-point-light>
			<lume-point-light position="-500 500 -500" intensity="2000"></lume-point-light>
			<lume-point-light position="500 -500 -500" intensity="2000"></lume-point-light>
			<lume-point-light position="-500 500 500" intensity="2000"></lume-point-light>

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

			<lume-gltf-model src=${femaleAvatar.href}></lume-gltf-model>

			<${For} each=${() => Array.from(store.selectedBlocks.values())}>
				${(item: Block) => html`
					<lume-gltf-model data-cloth src=${() => item.modelFile.href}></lume-gltf-model>
					${item.category === 'Sleeves'
						? html`<lume-gltf-model data-cloth src=${() => item.modelFile.href} scale="-1 1 1"></lume-gltf-model>`
						: ''}
				`}
			</>
		</lume-scene>
	`

	css = css/*css*/ `
		:host {
			width: 600px;
			height: 400px;

			touch-action: none;
		}
	`
}
