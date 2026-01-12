// @ts-check
import eslint from '@eslint/js'
import {defineConfig} from 'eslint/config'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier/flat'

export default defineConfig(
	eslint.configs.recommended,
	tseslint.configs.recommended,
	eslintConfigPrettier,

	// Ignore JS output files, we write TS
	{ignores: ['**/*.js', '**/*.mjs', '**/*.cjs', '.meteor/**']},

	{
		rules: {
			curly: ['error', 'multi-or-nest'],
			'@typescript-eslint/no-namespace': ['error', {allowDeclarations: true}],

			// FIXME Re-enable these and fix errors. Too many errors means we write too much sloppy. :(
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},
)
