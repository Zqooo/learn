import { isArray, isString } from "@vue/shared"

// 创建虚拟节点逻辑函数
export function createVNode(type, props = null, children = null){
  // vue3中对虚拟节点进行标记
  // 初始化shapeFlag状态值，有节点设置的状态下，如’h1‘'span'，初始化为1
  const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0
  
  // 对应真实节点
  const vNode = {
    __v_isVNode: true,
    type,
    props,
    children,
    key: props && props.key,
    el: null,
    shapeFlag
  }
  
  // 判断有没有子节点，若有，确定子节点类型
  //  h('h1', props, 'hello world')
  //  h('h1', props, hello,world)
  //  h('h1', props, [hello,world])
  //  children 只有两种形态 'hello'(text) [node,'hello'](array) 
  if(children) {
    let temp = 0
    if(isArray(children)){
      temp = ShapeFlags.ARRAY_CHILDREN
    } else {
      temp = ShapeFlags.TEXT_CHILDREN
    }
    vNode.shapeFlag |= temp
  }
  return vNode
}


/*
  ✨子节点集合中如果有文字，需要转成虚拟节点进行操作
      文本中不能直接使用某个类型的dom节点进行渲染，所以需要创建一个文本类型的唯一标识
  ✨这里和最容器中只有单一本文的逻辑不同，单一本文作为子节点，直接进行覆盖即可
    但如果子节点是个集合，其中还涉及了其他节点的渲染，节点的diff比较等
*/
// 文本转虚拟节点的标识（节点类型为Symbol('Text')）
export const Text = Symbol('Text')

//判断是否为相同的虚拟节点，在diff算法同级比较时进行
export function isSameVNode(v1, v2){
  return v1.type === v2.type && v1.key == v2.key
} 

// 判断是否为虚拟节点
export function isVNode(val){
  return !!val.__v_isVNode
}

/*
  ShapeFlags 
  为每种节点类型进行分类

  vue3中虚拟节点的标记逻辑： 
    shapeFlag: (虚拟节点 + 子虚拟节点)的映射位数
                通过位的或运算进行总节点位运算
                
    通过与运算，判断shapeFlag是否包含某个类型节点
              当对比值为0时，证明shapeFlag未包含该节点类型
    
  例如：
    VNode   ->     00000001
    VNodeChild ->  00000010
               ->  00000100
    
    VNode.ShapeFlag = 00000111 (9)
    
    const flag = VNode.ShapeFlag & ShapeFlags.ARRAY_CHILDREN 
    ->  00000111
    ->  00001000
    &-> 00000000
*/

export const enum ShapeFlags { // vue3提供的形状标识
  ELEMENT = 1,
  FUNCTIONAL_COMPONENT = 1 << 1,
  STATEFUL_COMPONENT = 1 << 2,
  TEXT_CHILDREN = 1 << 3,
  ARRAY_CHILDREN = 1 << 4,
  SLOTS_CHILDREN = 1 << 5,
  TELEPORT = 1 << 6,
  SUSPENSE = 1 << 7,
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
  COMPONENT_KEPT_ALIVE = 1 << 9,
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT
}
