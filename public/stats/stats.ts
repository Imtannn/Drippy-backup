import {html} from 'lume'
import '../routes.js' // track page visits
import '../elements/login-ui.js'
import '../elements/theme-switch.js'
import {store} from '../app/store.js'

document.body.append(
	html`
		<div id="statsUI" class=${() => (store.isAdmin ? '' : 'hidden')}>
			<h2>Unique page visits, unauthed (total: ${() => store.visits.reduce((n, v) => n + v.visits, 0)}):</h2>
			<p>
				These visits are gated with client-side local storage, so if a user clears their storage or uses incognito mode,
				they will be counted multiple times. It's not perfect. When a user does not clear their storage, they will only
				be counted once per unique page.
			</p>

			${() =>
				[...store.visits]
					.sort((a, b) => b.visits - a.visits)
					.map(v => html` <div><b>${v.origin}${v.route}:</b> &#32; ${v.visits}</div> `)}

			<h2>Signed up users (total: ${() => store.usersCount})</h2>
		</div>
	` as Node,
)

// Hide the loading cover
const loadingCover = document.getElementById('loadingCover')
loadingCover?.classList.add('invisible')
loadingCover?.addEventListener('transitionend', () => loadingCover.remove())
