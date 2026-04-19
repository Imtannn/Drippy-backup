import * as THREE from 'three'
import type {Fabric} from '../types/fabric.js'
import {reportImageLoadFailure, reportImageLoadSuccess} from './network-monitor.js'

export interface TextureConfig {
	repeat: [number, number]
	coef: number
	offset: [number, number]
	rotate: number
}

export const DEFAULT_TEXTURE_CONFIG: TextureConfig = {
	repeat: [60 / 9, 60 / 9],
	coef: 1000,
	offset: [0, 0],
	rotate: 0,
}

// Prevent alpha-map fabrics from becoming overly see-through.
const ALPHA_MAP_OPACITY_FLOOR_TEST = 0.2
const ALPHA_OPACITY_FLOOR = 0.45

function applyAlphaOpacityFloor(material: THREE.MeshPhysicalMaterial, alphaFloor: number) {
	// Remap alpha from [0..1] -> [alphaFloor..1] so fabrics keep translucency
	// but never become excessively see-through.
	material.onBeforeCompile = shader => {
		shader.fragmentShader = shader.fragmentShader.replace(
			'#include <alphatest_fragment>',
			`
				diffuseColor.a = mix(${alphaFloor.toFixed(2)}, 1.0, diffuseColor.a);
				#include <alphatest_fragment>
			`,
		)
	}
	material.customProgramCacheKey = () => `alpha-floor-${alphaFloor.toFixed(2)}`
}

export interface TextureSet {
	baseColor?: THREE.Texture
	normal?: THREE.Texture
	displacement?: THREE.Texture
	roughness?: THREE.Texture
	alpha?: THREE.Texture
}

export interface CachedTexture {
	texture: THREE.Texture
	originalRepeat: [number, number]
	aspectRatio: number
}

class TextureManager {
	// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
	private textureCache = new Map<string, CachedTexture>()
	// FIXME stop using Maps unless they solve a problem such as a static cache or iteration speed
	private loadingPromises = new Map<string, Promise<CachedTexture | null>>()
	private defaultConfig: TextureConfig = DEFAULT_TEXTURE_CONFIG

	/**
	 * Create a base THREE.js texture from URL without any scaling applied
	 *
	 * TODO: Make this abortable, and on abort set src to empty string to stop
	 * loading. Then, instead of simply returning on isCanceled in
	 * #applyFabricToThreeObject while previous images are still loading, we can
	 * abort them for better performance.
	 * For example if the user clicks three materials, we don't want all three
	 * of them to load fully, just the last one.
	 */
	private async createBaseTexture(url: string): Promise<CachedTexture | null> {
		if (!url) return null

		return new Promise<CachedTexture | null>(resolve => {
			// Create image element directly for better CORS control
			const img = new Image()

			// Set crossOrigin BEFORE setting src
			img.crossOrigin = 'anonymous'

			img.onload = () => {
				try {
					// Report successful load to network monitor
					reportImageLoadSuccess()

					// Create texture from the loaded image
					const texture = new THREE.Texture(img)

					// Configure basic texture properties
					texture.needsUpdate = true
					texture.wrapS = THREE.RepeatWrapping
					texture.wrapT = THREE.RepeatWrapping
					texture.flipY = false

					// Configure for better quality
					texture.generateMipmaps = true
					texture.minFilter = THREE.LinearMipmapLinearFilter
					texture.magFilter = THREE.LinearFilter
					texture.format = THREE.RGBAFormat

					// Store metadata for later scaling
					const aspectRatio = img.width / img.height

					resolve({
						texture,
						originalRepeat: this.defaultConfig.repeat,
						aspectRatio,
					})
				} catch (error) {
					console.warn('Failed to create texture from image:', url, error)
					reportImageLoadFailure(url, error)
					resolve(null)
				}
			}

			img.onerror = error => {
				console.warn('Failed to load image:', url, error)
				reportImageLoadFailure(url, error)
				resolve(null) // Return null instead of rejecting to prevent Promise.all from failing
			}

			// Set src AFTER setting up crossOrigin and event handlers
			img.src = url
		})
	}

	/**
	 * Get base texture with caching (no config-specific scaling)
	 */
	private async getBaseTexture(url: string): Promise<CachedTexture | null> {
		if (!url) return null

		// Use URL only as cache key
		const cacheKey = `${url}`

		// Return cached texture if available
		if (this.textureCache.has(cacheKey)) return this.textureCache.get(cacheKey)!

		// Return existing loading promise if in progress
		if (this.loadingPromises.has(cacheKey)) return this.loadingPromises.get(cacheKey)!

		// Start loading and cache the promise
		const loadingPromise = this.createBaseTexture(url)
		this.loadingPromises.set(cacheKey, loadingPromise)

		try {
			const cachedTexture = await loadingPromise
			if (cachedTexture) this.textureCache.set(cacheKey, cachedTexture)

			return cachedTexture
		} finally {
			this.loadingPromises.delete(cacheKey)
		}
	}

	/**
	 * Clone and configure texture with specific scaling parameters
	 */
	private configureTexture(cachedTexture: CachedTexture, config: TextureConfig): THREE.Texture {
		// Clone the texture to avoid modifying the cached version
		const texture = cachedTexture.texture.clone()
		texture.needsUpdate = true

		// Apply offset and rotation
		if (config.offset) texture.offset.set(config.offset[0], config.offset[1])

		if (config.rotate) texture.rotation = config.rotate

		// Calculate repeat based on texture aspect ratio and coef
		let repeatX = config.repeat[0]
		let repeatY = config.repeat[1]

		if (config.coef) {
			repeatX /= config.coef
			repeatY /= config.coef
		}

		// Adjust for aspect ratio
		if (cachedTexture.aspectRatio > 1) repeatY /= cachedTexture.aspectRatio
		else repeatX *= cachedTexture.aspectRatio

		texture.repeat.set(repeatX, repeatY)

		return texture
	}

	/**
	 * Get texture with specific configuration applied
	 */
	async getTexture(url: string, config: TextureConfig): Promise<THREE.Texture | null> {
		const cachedTexture = await this.getBaseTexture(url)
		if (!cachedTexture) return null

		return this.configureTexture(cachedTexture, config)
	}

	/**
	 * Preload base fabric textures into cache (most efficient preloading)
	 */
	async preloadFabricBaseTextures(fabric: Fabric): Promise<(CachedTexture | null)[]> {
		// Just load base textures into cache, no configuration needed
		return await Promise.all([
			this.getBaseTexture(fabric.baseColor || ''),
			this.getBaseTexture(fabric.normal || ''),
			this.getBaseTexture(fabric.displacement || ''),
			this.getBaseTexture(fabric.roughness || ''),
			this.getBaseTexture(fabric.alpha || ''),
		])
	}
	/**
	 * Given a fabric definition, load a set of Three.js Texture objects.
	 */
	async loadFabricTextures(fabric: Fabric): Promise<TextureSet> {
		const config: TextureConfig = {
			repeat: [...this.defaultConfig.repeat],
			coef: fabric.coef || this.defaultConfig.coef,
			offset: [...this.defaultConfig.offset],
			rotate: this.defaultConfig.rotate,
		}

		if (fabric.scaleX) config.repeat[0] = 60 / fabric.scaleX

		if (fabric.scaleY) config.repeat[1] = 60 / fabric.scaleY

		if (fabric.offsetX) config.offset[0] = fabric.offsetX

		if (fabric.offsetY) config.offset[1] = fabric.offsetY

		if (fabric.rotate) config.rotate = fabric.rotate

		const [baseColor, normal, displacement, roughness, alpha] = await Promise.all([
			this.getTexture(fabric.baseColor || '', config),
			this.getTexture(fabric.normal || '', config),
			this.getTexture(fabric.displacement || '', config),
			this.getTexture(fabric.roughness || '', config),
			this.getTexture(fabric.alpha || '', config),
		])

		return {
			baseColor: baseColor || undefined,
			normal: normal || undefined,
			displacement: displacement || undefined,
			roughness: roughness || undefined,
			alpha: alpha || undefined,
		}
	}

	/**
	 * Apply texture set to THREE.js material
	 */
	applyTexturesToMaterial(material: THREE.MeshPhysicalMaterial, textureSet: TextureSet) {
		// Apply textures
		material.map = textureSet.baseColor || null
		material.normalMap = textureSet.normal || null
		material.roughnessMap = textureSet.roughness || null
		material.alphaMap = textureSet.alpha || null

		// Tune transparency behavior so alpha-map garments keep detail
		// without becoming excessively transparent.
		if (material.alphaMap) {
			// Respect original material intent. Some assets include alpha maps
			// that are not authored for full translucent rendering (e.g. shoes).
			// Only apply transparency tuning when the material is already marked
			// transparent by the source asset.
			if (material.transparent) {
				material.alphaTest = ALPHA_MAP_OPACITY_FLOOR_TEST
				// Do NOT force depthWrite here. THREE.js defaults to depthWrite=true so this
				// was redundant in the normal case, but it was also stomping the depthWrite=false
				// set by the jacket-overlap fix in drippy-scene.ts when fabric changes while a
				// jacket is equipped, which re-introduced Z-fighting on fabric swaps.
				material.opacity = 1
				applyAlphaOpacityFloor(material, ALPHA_OPACITY_FLOOR)
			}
		} else {
			// Keep existing transparency state for materials that rely on the
			// base color texture's embedded alpha channel (e.g. logo decals).
			material.alphaTest = 0
			material.opacity = 1
			material.onBeforeCompile = () => {}
			material.customProgramCacheKey = () => 'alpha-floor-none'
		}

		// Configure material properties
		// Base color is an sRGB image (authored in a color-managed tool).
		if (textureSet.baseColor) textureSet.baseColor.colorSpace = THREE.SRGBColorSpace
		// Normal, roughness, and alpha maps are data textures — not color images.
		// They must stay in linear space so THREE.js doesn't gamma-correct them,
		// which would distort lighting and surface detail.
		if (textureSet.normal) textureSet.normal.colorSpace = THREE.NoColorSpace
		if (textureSet.roughness) textureSet.roughness.colorSpace = THREE.NoColorSpace
		if (textureSet.alpha) textureSet.alpha.colorSpace = THREE.NoColorSpace

		// Ensure GPU-side texture state updates
		if (material.map) material.map.needsUpdate = true
		if (material.normalMap) material.normalMap.needsUpdate = true
		// if (material.displacementMap) material.displacementMap.needsUpdate = true
		if (material.roughnessMap) material.roughnessMap.needsUpdate = true
		if (material.alphaMap) material.alphaMap.needsUpdate = true
		material.needsUpdate = true
	}

	clearTexturesFromMaterial(material: THREE.MeshPhysicalMaterial) {
		// Clear textures
		material.map = null
		material.normalMap = null
		material.roughnessMap = null
		material.alphaMap = null
		material.alphaTest = 0
		material.opacity = 1
		material.onBeforeCompile = () => {}
		material.customProgramCacheKey = () => 'alpha-floor-none'

		material.needsUpdate = true
	}

	/**
	 * Clear cached textures to free memory
	 */
	clearCache() {
		// Dispose of textures
		for (const cachedTexture of this.textureCache.values()) cachedTexture.texture.dispose()

		this.textureCache.clear()
		this.loadingPromises.clear()
	}

	/**
	 * Get cache statistics for debugging
	 */
	getCacheStats() {
		return {
			cached: this.textureCache.size,
			loading: this.loadingPromises.size,
		}
	}
}

// Export singleton instance
export const textureManager = new TextureManager()
