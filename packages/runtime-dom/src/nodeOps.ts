//  nodeOps 提供节点操作api，vue3中还有做兼容性处理，这里只进行主要逻辑模拟，不进行复刻
export const nodeOps = {
  createElement(tagName){
    return document.createElement(tagName)
  },
  createTextNode(text){
    return document.createTextNode(text)
  },
  insert(element,container,anchor){
    container.insertBefore(element,anchor)
  },
  remove(child){
    const parent = child.parentNode;
    if(parent){
      parent.removeChild(child)
    }
  },
  querySelector(selectors){
    return document.querySelector(selectors)
  },
  parentNode(child){
    return child.parentNode
  },
  nextSibling(child){
    return child.nextSibling
  },
  setText(element, text){
    element.nodeValue = text
  },
  setElementText(element, text){
    element.textContent = text
  }
}