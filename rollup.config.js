import packageJson from './package.json'
import typescript from '@rollup/plugin-typescript'
import sourceMaps from 'rollup-plugin-sourcemaps'

export default {
  input: './src/index.ts',
  plugins: [
    typescript(),
    sourceMaps()
  ],
  output: [
    {
      format: 'cjs',
      file: packageJson.main,
      sourcemap: true
    },
    {
      name: 'vue',
      format: 'es',
      file: packageJson.module,
      sourcemap: true
    }
  ]
}
