import { isFunction } from "@vue/shared"
import { reactive } from "@vue/reactivity"

export function createComponentInstance(vnode) {
  // vnode 是组件为主体的虚拟节点，节点类型是VueComponent(组件对象的名称),
  // subTree 是该组件实际要渲染到页面的虚拟节点
  const instance = {
    data: null, //组件本身数据
    vnode,
    subTree: null,
    isMounted: false, // 组件是否挂载
    update: null, //组件的effect.run 方法
    render: null,
  }

  return instance
} 


export function setupComponent(instance) {
  
  // 取出组件节点中对应的属性
  let {type, props, chidlren} = instance.vnode

  let {data, render} = type
  
  if(data){
    if(!isFunction(data)){
      return console.warn(`The data option must be a function`)
    }

    instance.data = reactive(data.call({}))
  }

  instance.render = render
}


