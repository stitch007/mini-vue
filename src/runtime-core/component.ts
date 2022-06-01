import { proxyRefs, shallowReadonly } from '../reactivity'
import { initProps } from './componentProps'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'

let currentInstance = {}

export function getCurrentInstance(): any {
  return currentInstance
}

export function setCurrentInstance(instance) {
  currentInstance = instance
}

export function createComponentInstance(vnode, parent) {
  const instance = {
    type: vnode.type,
    vnode,
    proxy: null,
    isMounted: false,
    subTree: null,
    render: null,
    update: null,
    props: {},
    attrs: {}, // 存放 attrs 的数据
    ctx: {}, // context 对象
    setupState: {}, // setup 返回值
  }

  instance.ctx = {
    _: instance,
  }

  return instance
}

export function setupComponent(instance) {
  const { props } = instance.vnode
  initProps(instance, props || {})

  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance) {
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers)

  const { setup } = instance.type
  if (setup) {
    setCurrentInstance(instance)
    const setupContext = {
      attrs: instance.attrs,
      slots: instance.slots,
      emit: instance.emit,
    }
    // 调用 setup 函数
    console.log(instance.props)
    const setupResult = setup(shallowReadonly(instance.props), setupContext)
    setCurrentInstance(null)
    handleSetupResult(instance, setupResult)
  } else {
    finishComponentSetup(instance)
  }
}

function handleSetupResult(instance, setupResult) {
  // 如果是函数的话直接绑定到 instance.render 上
  // setup() {
  //   return () => h('div', 'hello')
  // }
  if (typeof setupResult === 'function') {
    instance.render = setupResult
  } else if (typeof setupResult === 'object') {
    // 使用 proxyRefs 就可以不用写 .value 了
    instance.setupState = proxyRefs(setupResult)
  }
  finishComponentSetup(instance)
}

function finishComponentSetup(instance) {
  instance.render = instance.type.render

  // TODO 编译 template
}

function createSetupContext(instance) {
  return {
    attrs: instance.attrs,
    slots: instance.slots,
    emit: instance.emit,
    expose: () => {},
  }
}
