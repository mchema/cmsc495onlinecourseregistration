import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    js.configs.recommended,
    {
        files: ['backend/**/*.{js,mjs,cjs}', 'scripts/**/*.{js,mjs,cjs}'],
        languageOptions: {
            globals: globals.node,
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
    },
]);
