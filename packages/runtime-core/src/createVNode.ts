// 创建虚拟节点逻辑函数
export function createVNode(type, props = null, children = null){
  
  // 对应真实节点
  const vNode = {
    type,
    props,
    children,
    key: props && props.key,
    el: null
  }
  console.log(type, props, children);
  
}
