export const nodeOps = {
  // 把元素child插到父元素parent的子元素anchor之前
  // 如果没有anchor，那么就相当于parent.appendChild(child)
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor ?? null)
  },
  // 删除child元素
  remove: (child) => {
    const parent = child.parentNode
    if (parent) {
      parent.removeChild(child)
    }
  },
  createElement: (tag) => document.createElement(tag),
  createText: (text) => document.createTextNode(text),
  createComment: (text) => document.createComment(text),
  // 设置节点的内容
  setText: (node, text) => {
    node.nodeValue = text
  },
  // 设置元素的文本
  // <div>设置我</div>
  setElementText: (el, text) => {
    el.textContent = text
  },
  // 获取父节点
  parentNode: (node) => node.parentNode,
  // 获取下一个兄弟节点
  nextSibling: (node) => node.nextSibling,
  // 元素选择器
  querySelector: selector => document.querySelector(selector),
}
