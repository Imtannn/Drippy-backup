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
	private textureCache = new Map<string, CachedTexture>()
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
	 * Load fabric textures with UV-aware configuration
	 */
	async loadFabricTexturesWithUV(fabric: Fabric): Promise<TextureSet> {
		const config: TextureConfig = {
			repeat: [...this.defaultConfig.repeat],
			coef: fabric.coef || 1,
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
	applyTexturesToMaterial(material: any, textureSet: TextureSet) {
		// Apply textures
		material.map = textureSet.baseColor || null
		material.normalMap = textureSet.normal || null
		// material.displacementMap = textureSet.displacement || null
		material.roughnessMap = textureSet.roughness || null
		material.alphaMap = textureSet.alpha || null

		// Configure material properties
		if (textureSet.baseColor) textureSet.baseColor.colorSpace = THREE.SRGBColorSpace

		material.roughnessIntensity = 1
		material.transparent = true
		material.emissive = new THREE.Color(0x000000)
		material.emissiveIntensity = 0
		material.aoMapIntensity = 1
		material.side = THREE.DoubleSide
		material.normalScale = new THREE.Vector2(2, 2)
		material.blending = THREE.NormalBlending

		// Ensure GPU-side texture state updates
		if (material.map) material.map.needsUpdate = true
		if (material.normalMap) material.normalMap.needsUpdate = true
		// if (material.displacementMap) material.displacementMap.needsUpdate = true
		if (material.roughnessMap) material.roughnessMap.needsUpdate = true
		if (material.alphaMap) material.alphaMap.needsUpdate = true
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
