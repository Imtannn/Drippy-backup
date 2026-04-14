import {batch, createSignal} from 'solid-js'
import {templateHelpers} from './TemplateHelpers.js'
import {store, updateGarmentsSelectionInUrl} from './store.js'
import type {SelectedGarments, TemplateMap} from '../types/types.js'

type GarmentSnapshot = {
	selectedTemplates: TemplateMap
	selectedGarments: SelectedGarments
}

const MAX_HISTORY = 50

const undoStack: GarmentSnapshot[] = []
const redoStack: GarmentSnapshot[] = []

const [undoStackLength, setUndoStackLength] = createSignal(0)
const [redoStackLength, setRedoStackLength] = createSignal(0)

export const canUndo = () => undoStackLength() > 0
export const canRedo = () => redoStackLength() > 0

/**
 * True while an undo/redo is being applied. Used to prevent loadParamsEffect
 * in drippy-app from re-loading garments from URL while we're restoring state.
 */
export let isRestoringHistory = false

function captureSnapshot(): GarmentSnapshot {
	return {
		selectedTemplates: {...store.selectedTemplates},
		selectedGarments: templateHelpers.cloneSelectedGarments(store.selectedGarments),
	}
}

/** Call this before any user action that mutates garment/template selection. */
export function pushHistory() {
	if (isRestoringHistory) return
	const snapshot = captureSnapshot()
	undoStack.push(snapshot)
	if (undoStack.length > MAX_HISTORY) undoStack.shift()
	redoStack.length = 0
	setUndoStackLength(undoStack.length)
	setRedoStackLength(0)
}

function applySnapshot(snapshot: GarmentSnapshot) {
	isRestoringHistory = true
	try {
		// Clear URL first so that loadParamsEffect doesn't re-load old garments
		// when selectedTemplates becomes empty (same pattern as clear-garments-button fix).
		updateGarmentsSelectionInUrl(snapshot.selectedGarments)
		batch(() => {
			store.selectedTemplates = snapshot.selectedTemplates
			store.selectedGarments = snapshot.selectedGarments
		})
	} finally {
		isRestoringHistory = false
	}
}

export function undo() {
	if (undoStack.length === 0) return
	redoStack.push(captureSnapshot())
	const snapshot = undoStack.pop()!
	setUndoStackLength(undoStack.length)
	setRedoStackLength(redoStack.length)
	applySnapshot(snapshot)
}

export function redo() {
	if (redoStack.length === 0) return
	undoStack.push(captureSnapshot())
	const snapshot = redoStack.pop()!
	setUndoStackLength(undoStack.length)
	setRedoStackLength(redoStack.length)
	applySnapshot(snapshot)
}

// Keyboard shortcuts: Ctrl/Cmd+Z → undo, Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y → redo
if (typeof document !== 'undefined') {
	document.addEventListener('keydown', (e: KeyboardEvent) => {
		const mod = e.ctrlKey || e.metaKey
		if (!mod) return

		if (e.key === 'z' && !e.shiftKey) {
			e.preventDefault()
			undo()
		} else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
			e.preventDefault()
			redo()
		}
	})
}
