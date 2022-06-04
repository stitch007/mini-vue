import { proxyRefs, shallowReadonly } from '../reactivity'
import { initProps } from './componentProps'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'
import { emit } from './componentEmits'
import { initSlots } from './componentSlots'
import { isFunction, isObject } from '../shared'

export const enum LifecycleHooks {
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
  BEFORE_UNMOUNT = 'bum',
  UNMOUNTED = 'um',
}

let currentInstance = {}

export function getCurrentInstance(): any {
  return currentInstance
}

export function setCurrentInstance(instance) {
  currentInstance = instance
}

export function createComponentInstance(vnode, parent) {
  const instance = {
    vnode,
    type: vnode.type,
    subTree: null, // vnode
    ctx: {}, // context 对象
    props: {}, // 存放 props 的数据
    attrs: {}, // 存放 attrs 的数据
    slots: {}, // 插槽
    next: null,
    inheritAttrs: vnode.type.inheritAttrs, // 是否让孩子节点继承 attrs
    parent,
    update: () => {}, // 调用 update 触发更新
    setupState: {}, // setup 返回值
    propsOptions: vnode.type.props || {}, // { props: { hello: { type: String, default: 'world' }}}
    proxy: null, // instance.render.call(instance.proxy)
    provides: parent ? parent.provides : {}, //  继承 parent.provides 的属性
    render: null, // 组件的渲染函数
    emit: null, // 发射事件
    exposed: {}, // 暴露的东西
    isMounted: false,
    bm: null, // beforeMounted
    m: null, //mounted
    bu: null, // beforeUpdate
    u: null, // updated
    um: null, // unmount
    bum: null, // beforeUnmount
  }

  instance.ctx = {
    _: instance,
  }
  instance.emit = emit.bind(null, instance) as any

  return instance
}

export function setupComponent(instance) {
  const { props, children } = instance.vnode
  initProps(instance, props || {})
  initSlots(instance, children)

  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance) {
  // 待会作为 render 函数的 this
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers)

  const { setup } = instance.type
  if (setup) {
    // setup(props, { attrs, emit, slots, expose }) {}
    const setupContext = createSetupContext(instance)

    // 设置完后能在 setup 函数中 getCurrentInstance
    setCurrentInstance(instance)
    // 调用 setup 函数
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
  if (isFunction(setupResult)) {
    instance.render = setupResult
  } else if (isObject(setupResult)) {
    // 使用 proxyRefs 就可以不用写 .value 了
    instance.setupState = proxyRefs(setupResult)
  }
  finishComponentSetup(instance)
}

function finishComponentSetup(instance) {
  if (!instance.render) {
    instance.render = instance.type.render
  }

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
