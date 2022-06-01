import { isReactive, shallowReactive } from '../reactive'
import { effect } from '../effect'

describe('shallowReactive', () => {
  it('nesting object is not reactive', () => {
    const props = shallowReactive({ n: { foo: 1 } })
    expect(isReactive(props)).toBe(true)
    expect(isReactive(props.n)).toBe(false)
  })

  it('nesting objects do not trigger effect', () => {
    const props = shallowReactive({ n: { foo: 1 }, m: 2 })
    const fn = jest.fn((m, n) => {})
    effect(() => {
      fn(props.m, props.n.foo)
    })
    props.n.foo = 2
    expect(fn).toHaveBeenCalledTimes(1)
    props.m = 3
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
