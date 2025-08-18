import {Element, element, html, signal, type ElementAttributes} from 'lume'
import {For} from 'solid-js'
import '../app/drippy-scene.js'
import {store} from '../app/store.js'
import type {Block} from '../types/block.js'
import './bottom-sheet.js'
import './tabs.js'

const blocks: Block[] = [
	{
		_id: '1',
		thumb: new URL('../images/piece_1.png', import.meta.url),
		modelFile: new URL('../models/Bodice 228.gltf', import.meta.url),
		blockName: 'Bodice 228',
		avatar: 'Female',
		category: 'Bodice',
	},
	{
		_id: '2',
		thumb: new URL('../images/piece_2.png', import.meta.url),
		modelFile: new URL('../models/Bodice 350.gltf', import.meta.url),
		blockName: 'Bodice 350',
		avatar: 'Female',
		category: 'Bodice',
	},
	{
		_id: '3',
		thumb: new URL('../images/piece_3.png', import.meta.url),
		modelFile: new URL('../models/skirt-168.gltf', import.meta.url),
		blockName: 'skirt168',
		avatar: 'Female',
		category: 'Skirt',
	},
	{
		_id: '4',
		thumb: new URL('../images/piece_4.png', import.meta.url),
		modelFile: new URL('../models/Bodice 358.gltf', import.meta.url),
		blockName: 'Bodice 358',
		avatar: 'Female',
		category: 'Bodice',
	},
	{
		_id: '6',
		thumb: new URL('../images/piece_6.png', import.meta.url),
		modelFile: new URL('../models/Skirt 351.gltf', import.meta.url),
		blockName: 'Skirt 351',
		avatar: 'Female',
		category: 'Skirt',
	},
	{
		_id: '7',
		thumb: new URL('../images/piece_1.png', import.meta.url),
		modelFile: new URL('../models/Sleeves 399.gltf', import.meta.url),
		blockName: 'Sleeves 399',
		avatar: 'Female',
		category: 'Sleeves',
	},
]

type BlocksPageAttributes = keyof {} // no attributes yet

@element('blocks-page')
export class BlocksPage extends Element {
	static readonly elementName = 'blocks-page'
	hasShadow = false

	@signal selectedTab = 'blocks'
	@signal selectedCategory: Block['category'] = 'Bodice'

	template = () =>
		html`
            <bottom-sheet>

                <tabs-provider
                    default-value=${() => this.selectedTab}
                    ontabchange=${(e: CustomEvent) => {
											console.log('onchange', e)
											this.selectedTab = e.detail.value
										}}
                >
                    <div class="tabs-container">
                        <tabs-list>
                            <tabs-trigger selected-value="blocks">Blocks</tabs-trigger>
                            <tabs-trigger selected-value="fabrics">Fabrics</tabs-trigger>
                            <tabs-trigger selected-value="accessories">Accessories</tabs-trigger>
                        </tabs-list>
                    </div>

                    <div class="divider"></div>

                    <div class="tabs-content-container">
                        <tabs-content selected-value="blocks">
                            <div class="category-tabs">
                                <button class="category-tab" classList=${() => ({active: this.selectedCategory === 'Bodice'})} onclick=${() => (this.selectedCategory = 'Bodice')}>Bodice</button>
                                <button class="category-tab" classList=${() => ({active: this.selectedCategory === 'Skirt'})} onclick=${() => (this.selectedCategory = 'Skirt')}>Skirt</button>
                                <button class="category-tab" classList=${() => ({active: this.selectedCategory === 'Sleeves'})} onclick=${() => (this.selectedCategory = 'Sleeves')}>Sleeves</button>
                            </div>
                            <div class="items-grid">
                                <${For} each=${() => blocks.filter(block => block.category === this.selectedCategory)}>
                                ${(block: (typeof blocks)[number]) => html`
																	<div
																		class="item-card"
																		classList=${() => ({
																			active: store.selectedBlocks.get(block.category)?._id === block._id,
																		})}
																		onclick=${() => {
																			store.setSelectedBlocks = block
																		}}
																	>
																		<div class="item-preview">
																			<img class="item-thumb" src=${() => block.thumb} alt=${() => block.blockName} />
																		</div>
																	</div>
																`}
                                </>
                            </div>
                        </tabs-content>

                        <tabs-content selected-value="fabrics">
                            <div class="items-grid">
                                <div class="item-card">
                                    <div class="item-preview fabric"></div>
                                </div>
                                <div class="item-card">
                                    <div class="item-preview fabric"></div>
                                </div>
                                <div class="item-card">
                                    <div class="item-preview fabric"></div>
                                </div>
                            </div>
                        </tabs-content>

                        <tabs-content selected-value="accessories">
                            <div class="items-grid">
                                <div class="item-card">
                                    <div class="item-preview accessory"></div>
                                </div>
                                <div class="item-card">
                                    <div class="item-preview accessory"></div>
                                </div>
                            </div>
                        </tabs-content>
                    </div>
                </tabs-provider>
            </bottom-sheet>
        `
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'blocks-page': ElementAttributes<BlocksPage, BlocksPageAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'blocks-page': BlocksPage
	}
}
