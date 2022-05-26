import { createDep, Dep } from './dep'

export type EffectScheduler = (...args: any[]) => any

export interface ReactiveEffectRunner<T = any> {
  (): T
  effect: ReactiveEffect
}

export interface ReactiveEffectOptions {
  scheduler?: EffectScheduler
  onStop?: () => void
}

let shouldTrack = true
let activeEffect: ReactiveEffect | undefined
// { target: Map<key, Dep> }
const targetMap = new WeakMap<any, Map<any, Dep>>()

export class ReactiveEffect<T = any> {
  active = true
  // 这里记录effect被哪些东东依赖了，方便清理
  deps: Dep[] = []
  parent: ReactiveEffect | undefined = undefined

  public onStop?: () => void

  constructor(public fn: () => T, public scheduler: EffectScheduler | null = null) {}

  run() {
    // 没active不用收集依赖
    if (!this.active) {
      this.fn()
    }

    // 开始收集依赖
    try {
      // effect(() => {
      //   state.bar // e1
      //   effect(() => {}) // e2
      //   state.foo // 如果没有记下parent的话，e1 = undefined，这样就收集不到依赖了
      // })
      // 这里用parent记录下父节点
      this.parent = activeEffect
      activeEffect = this

      // const data = reactive({
      //   flag: true,
      //   message1: 'message1',
      //   message2: 'message2',
      // })
      // effect(() => {
      //   console.log(data.flag ? data.message1 : data.message2)
      // })
      // data.flag = false
      // data.message1 = 'message111'
      // 需要的效果时修改message1时不会再重新执行effect
      // 只需每次run时都重新收集依赖
      cleanupEffect(this)
      return this.fn()
    } finally {
      activeEffect = this.parent
      this.parent = undefined
    }
  }

  stop() {
    if (this.active) {
      cleanupEffect(this)
      this.onStop && this.onStop()
      this.active = false
    }
  }
}

export function effect<T = any>(fn: () => T, options: ReactiveEffectOptions = {}) {
  const _effect = new ReactiveEffect(fn)
  Object.assign(_effect, options)
  _effect.run()

  // 把run方法返回，可以让用户选择在什么时候调用
  const runner = _effect.run.bind(_effect) as ReactiveEffectRunner
  // 用于stop
  runner.effect = _effect
  return runner
}

export function stop(runner: ReactiveEffectRunner) {
  runner.effect.stop()
}

// 响应式对象在get的时候会调用
export function track(target: object, key: unknown) {
  if (isTracking()) {
    // 不存在的话就要新建
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }
    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = createDep()))
    }

    trackEffects(dep)
  }
}

export function trackEffects(dep: Dep) {
  // 在dep中添加effect 在effect的deps中添加dep
  if (!dep.has(activeEffect!)) {
    dep.add(activeEffect!)
    // track完才会把activeEffect置为undefined
    activeEffect!.deps.push(dep)
  }
}

// 响应式对象在set的时候会调用
export function trigger(target: object, key: unknown) {
  const deps: (Dep | undefined)[] = []
  const effects: ReactiveEffect[] = []

  const depsMap = targetMap.get(target)
  if (!depsMap) {
    return
  }

  deps.push(depsMap.get(key))
  deps.forEach((dep) => {
    dep && effects.push(...dep)
  })

  triggerEffect(createDep(effects))
}

export function triggerEffect(dep: Dep) {
  // 执行所有effect
  dep.forEach((effect) => {
    // 防止死循环
    if (effect !== activeEffect) {
      if (effect.scheduler) {
        effect.scheduler()
      } else {
        effect.run()
      }
    }
  })
}

export function isTracking() {
  return shouldTrack && activeEffect !== undefined
}

function cleanupEffect(effect: ReactiveEffect) {
  effect.deps.forEach((dep) => {
    dep.delete(effect)
  })
  effect.deps.length = 0
}
