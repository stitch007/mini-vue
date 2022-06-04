import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'
import { extend, isString } from '../shared'
import { createRenderer } from '../runtime-core/renderer'

let renderer

function ensureRenderer() {
  return renderer || (renderer = createRenderer(extend(nodeOps, { patchProp })))
}

export function createApp(rootComponent, rootProps = null) {
  const createApp = ensureRenderer().createApp
  const app = createApp(rootComponent, rootProps)
  const mount = app.mount
  app.mount = (container) => {
    if (isString(container)) {
      container = nodeOps.querySelector(container)
    }
    container.innerHTML = ''
    mount(container)
  }
  return app
}

export * from '../runtime-core'
