/*
  
  h的底层是调用createVNode（创建虚拟节点的逻辑函数）
  而传进的参数，通过h中的逻辑处理，达到重载的效果

  略微穷举h传参的几种情况
    1.元素 内容
      h('h1', 'hello world')
    2.元素 属性 内容
      h('h1', {style: {color : 'red'}}, 123)
    3.元素 属性 多个儿子
      h('h1', {style: {color : 'red'}}, h('h1', 'hhh'),h('h1', 'hhh'))
    4.元素 儿子/元素
      h('h1', h('h1', 'hhh'))
    5.元素 空属性 多个儿子
      h('h1', null, h('h1', 'hhh'), h('h1', 'hhh'))
*/

import { isArray, isObject } from "@vue/shared"
import { createVNode, isVNode } from "./createVNode"

export function h(type, propsOrChildren, children){
  // 获取参数长度
  const l = arguments.length

  // 参数长度为2的情况下，传的第二个参数，可能是子节点或属性
  if(l === 2){
    /*
        判断第二个参数是对象的情况下，有两种可能
          一种是 属性(对象)  h('h1',{style: {color : 'red'})
          一种是子节点(文本字符串/单一节点)/子节点集合(数组) 
          h('h1','hhh'), h('h1',h('h1','hhh')), h('h1',[hh,hhh])
    */
    if(isObject(propsOrChildren) && !isArray(propsOrChildren)){
      // 为对象且 的情况下，有两种可能，单个虚拟节点，属性
      if(isVNode(propsOrChildren)){
        return createVNode(type, null, [propsOrChildren])
      } else {
        return createVNode(type, propsOrChildren)
      }
    } else {
      return createVNode(type, null, propsOrChildren)
    }
  } else {
    // 传入的参数超过两个时，主要是对children参数的处理

    // 如果参数为三个时，将子节点封装到数组中
    if(l === 3 && isVNode(children) ){
      children = [children]
    } else if( l > 3 ){
      // 若参数超过三个，则将截取前两个参数后的内容，封装到数组中，至此对createVNode的重载功能完毕
      // ✨ 通过h函数，对参数进行操作，达成createVNode函数的重载功能
      children = Array.from(arguments).slice(2)
    }
    return createVNode(type, propsOrChildren, children)
  }
}