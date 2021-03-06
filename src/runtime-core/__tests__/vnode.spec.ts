import { createVNode, isSameVNodeType, isVNode } from '../vnode'
import { ShapeFlags } from '../../shared'

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

  it('shape flag', () => {
    const text = createVNode('div', null, 'text')
    const array = createVNode('div', null, [createVNode('span'), createVNode('a')])
    const slot = createVNode('div', null, { default: () => createVNode('div', null, 'slot') })
    const component = createVNode({
        setup() {
        },
        render: () => createVNode('div')
      }, null, {
        default: () => createVNode('div', null, 'slot')
      }
    )
    expect(!!(text.shapeFlag & ShapeFlags.ELEMENT)).toBe(true)
    expect(!!(array.shapeFlag & ShapeFlags.ARRAY_CHILDREN)).toBe(true)
    expect(!!(slot.shapeFlag & ShapeFlags.SLOTS_CHILDREN)).toBe(false)
    expect(!!(component.shapeFlag & ShapeFlags.STATEFUL_COMPONENT)).toBe(true)
    expect(!!(component.shapeFlag & ShapeFlags.SLOTS_CHILDREN)).toBe(true)
  })
})
