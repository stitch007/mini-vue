import { createVNode } from '../vnode'
import { h } from '../h'

describe('h', () => {
  it('type only', () => {
    expect(h('div')).toMatchObject(createVNode('div'))
  })

  it('type + props', () => {
    expect(h('div', { id: 'foo' })).toMatchObject(createVNode('div', { id: 'foo' }))
  })

  it('type + children', () => {
    expect(h('div', h('span'))).toMatchObject(createVNode('div', null, [createVNode('span')]))
  })

  it('type + array children', () => {
    expect(h('div', [h('span'), h('a')]))
      .toMatchObject(createVNode('div', null, [createVNode('span'), createVNode('a')]))
  })

  it('type + props + text children', () => {
    expect(h('div', { id: 'foo' }, 'hello'))
      .toMatchObject(createVNode('div', { id: 'foo' }, 'hello'))
  })

  it('type + props + array children', () => {
    expect( h('div', { id: 'foo' }, h('span', { id: 'bar' })))
      .toMatchObject(createVNode('div', { id: 'foo' }, [createVNode('span', { id: 'bar' })]))
  })
})
