import {numberAttribute, element, type ElementAttributes} from '@lume/element'
import {createEffect, onCleanup} from 'solid-js'
import {RectAreaLight as ThreeRectAreaLight} from 'three/src/lights/RectAreaLight.js'
import {RectAreaLightHelper} from 'three/examples/jsm/helpers/RectAreaLightHelper.js'
import {RectAreaLightUniformsLib} from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
// import {Motor} from 'lume/dist/core/Motor.js'
import {Light, type LightAttributes} from 'lume/dist/lights/Light.js'
import {autoDefineElements} from 'lume/dist/LumeConfig.js'
import {materialsInTree} from '../utils.js'

RectAreaLightUniformsLib.init()

export type RectAreaLightAttributes = LightAttributes

// TODO @element jsdoc tag

/**
 * @element lume-rect-area-light
 * @class RectAreaLight -
 *
 * Element: `<lume-rect-area-light>`
 *
 * An element that illuminates objects near it with a rectangular light source.
 *
 * @extends LightWithShadow
 */
export
@element('lume-rect-area-light', autoDefineElements)
class RectAreaLight extends Light {
	/**
	 * @property {number} intensity -
	 *
	 * `attribute`
	 *
	 * Default: `1`
	 */
	@numberAttribute override intensity = 1

	override connectedCallback() {
		super.connectedCallback()

		this.createEffect(() => {
			if (!this.debug) return
			if (!this.scene) return

			const helper = new RectAreaLightHelper(this.three, this.color)
			this.scene.three.add(helper)

			for (const material of materialsInTree(helper)) {
				material.transparent = true
				material.opacity = 0
			}

			createEffect(() => {
				this.three.width = this.size.x
				this.three.height = this.size.y
				this.needsUpdate()
			})

			// const task = Motor.addRenderTask(() => helper.update())

			onCleanup(() => {
				helper.dispose()
				this.scene!.three.remove(helper)
				// Motor.removeRenderTask(task)
			})
		})
	}

	override makeThreeObject3d() {
		return new ThreeRectAreaLight()
	}
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'lume-rect-area-light': ElementAttributes<RectAreaLight, RectAreaLightAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'lume-rect-area-light': RectAreaLight
	}
}
