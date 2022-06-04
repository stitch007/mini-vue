import { createVNode } from './vnode'

export function createAppAPI(render) {
  return (rootComponent, rootProps) => {
    let isMounted = false

    const app = {
      _component: rootComponent,
      _props: rootProps,
      _context: null,
      _container: null,
      mount(container) {
        if (!isMounted) {
          const vnode = createVNode(rootComponent)
          render(vnode, container)
          app._container = container
          isMounted = true
        }
      },
      use() {},
      directive() {},
      unmount() {},
      component() {},
      mixin() {},
      install() {},
    }

    return app
  }
}
