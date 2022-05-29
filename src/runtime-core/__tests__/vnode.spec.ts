import { createVNode, isSameVNodeType, isVNode } from '../vnode'

describe('vnode', () => {
  it('create with just tag', () => {
    const vnode = createVNode('p')
    expect(vnode.type).toBe('p')
    expect(vnode.props).toBe(null)
  })

  it('create with tag and props', () => {
    const vnode1 = createVNode('p', {})
    expect(vnode1.type).toBe('p')
    expect(vnode1.props).toMatchObject({})
    const vnode2 = createVNode('div', { class: 'test' })
    expect(vnode2.type).toBe('div')
    expect(vnode2.props).toMatchObject({ class: 'test' })
  })

  it('create with tag, props and children', () => {
    const vnode = createVNode('p', {}, 'foo')
    expect(vnode.type).toBe('p')
    expect(vnode.props).toMatchObject({})
    expect(vnode.children).toBe('foo')
  })

  it('create with tag, props and array children', () => {
    const vnode = createVNode('p', {}, [createVNode('span')])
    expect(vnode.type).toBe('p')
    expect(vnode.props).toMatchObject({})
    expect(vnode.children).toMatchObject([createVNode('span')])
  })

  it('is vnode', () => {
    const vnode = createVNode('div')
    const data = {}
    expect(isVNode(vnode)).toBe(true)
    expect(isVNode(data)).toBe(false)
  })

  it('is same vnode', () => {
    const n1 = createVNode('div', { key: 1 })
    const n2 = createVNode('div', { key: 1 })
    expect(isSameVNodeType(n1, n2)).toBe(true)
    const n3 = createVNode('div', { key: 2 })
    expect(isSameVNodeType(n1, n3)).toBe(false)
    expect(isSameVNodeType(createVNode('a'), createVNode('a'))).toBe(true)
    expect(isSameVNodeType(createVNode('a'), createVNode('span'))).toBe(false)
  })
})
