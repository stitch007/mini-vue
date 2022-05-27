import { effect } from '../effect'
import { reactive } from '../reactive'
import { isRef, ref, unref, proxyRefs, shallowRef, toRefs } from '../ref'

describe('ref', () => {
  it('should be reactive', () => {
    const a = ref(1)
    let dummy
    let calls = 0
    effect(() => {
      calls++
      dummy = a.value
    })
    expect(calls).toBe(1)
    expect(dummy).toBe(1)
    a.value = 2
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
    // same value should not trigger
    a.value = 2
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
  })

  it('should make nested properties reactive', () => {
    const a = ref({
      count: 1,
    })
    let dummy
    effect(() => {
      dummy = a.value.count
    })
    expect(dummy).toBe(1)
    a.value.count = 2
    expect(dummy).toBe(2)
  })

  it('proxyRefs', () => {
    const user = {
      age: ref(10),
      name: 'xiaohong',
    }
    const proxyUser = proxyRefs(user)
    expect(user.age.value).toBe(10)
    expect(proxyUser.age).toBe(10)
    expect(proxyUser.name).toBe('xiaohong');

    (proxyUser as any).age = 20
    expect(proxyUser.age).toBe(20)
    expect(user.age.value).toBe(20)

    proxyUser.age = ref(10)
    expect(proxyUser.age).toBe(10)
    expect(user.age.value).toBe(10)
  })

  it('isRef', () => {
    const a = ref(1)
    const user = reactive({
      age: 1,
    })
    expect(isRef(a)).toBe(true)
    expect(isRef(1)).toBe(false)
    expect(isRef(user)).toBe(false)
  })

  it('unref', () => {
    const a = ref(1)
    expect(unref(a)).toBe(1)
    expect(unref(1)).toBe(1)
  })

  it('shallowRef', () => {
    const data1 = shallowRef({ a: { b: 1 } })
    const data2 = ref({ a: { b: 1 } })
    let dummy1 = 0
    let dummy2 = 0
    effect(() => {
      dummy1 = data1.value.a.b
    })
    effect(() => {
      dummy2 = data2.value.a.b
    })
    expect(dummy1).toBe(1)
    expect(dummy2).toBe(1)
    data1.value.a.b = 2
    data2.value.a.b = 2
    expect(dummy1).toBe(1)
    expect(dummy2).toBe(2)
  })

  it('toRefs', () => {
    const data = reactive({ a: 1, b: 2 })
    const { a, b } = toRefs(data)
    let dummy = 0
    effect(() => {
      dummy = a.value + b.value
    })
    expect(dummy).toBe(3)
    a.value = 2
    b.value = 4
    expect(dummy).toBe(6)
  })
})
