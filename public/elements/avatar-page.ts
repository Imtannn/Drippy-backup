import {Element, element, html, type ElementAttributes} from 'lume'
import '../app/drippy-scene.js'
import './bottom-sheet.js'
import './tabs.js'

const avatarThumb = new URL('../images/avatar-female-tmp.png', import.meta.url)

type AvatarPageAttributes = keyof {} // no attributes yet

@element('avatar-page')
export class AvatarPage extends Element {
	static readonly elementName = 'avatar-page'
	hasShadow = false

	template = () => html`
		<section id="panel">
			<div class="genders">
				<button class="female selected">Women</button>
				<button class="male">Men</button>
			</div>

			<div class="grid">
				<div class="block">
					<img src=${avatarThumb} alt="Female avatar" />
				</div>
				<div class="block">
					<img src=${avatarThumb} alt="Female avatar" />
				</div>
				<div class="block">
					<img src=${avatarThumb} alt="Female avatar" />
				</div>
				<div class="block">
					<img src=${avatarThumb} alt="Female avatar" />
				</div>
				<div class="block">
					<img src=${avatarThumb} alt="Female avatar" />
				</div>
				<div class="block">
					<img src=${avatarThumb} alt="Female avatar" />
				</div>
			</div>
		</section>
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'avatar-page': ElementAttributes<AvatarPage, AvatarPageAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'avatar-page': AvatarPage
	}
}
