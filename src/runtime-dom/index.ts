import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'
import { extend } from '../shared'
import { createRenderer } from '../runtime-core/renderer'

let renderer

function ensureRenderer() {
  return renderer || (renderer = createRenderer(extend(nodeOps, { patchProp })))
}

export function createApp() {
  return ensureRenderer()
}

export * from '../runtime-core'
