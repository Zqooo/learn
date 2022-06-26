import { isNumber, isString } from "@vue/shared"
import { createVNode, ShapeFlags, Text } from "./createVNode"

export function createRenderer(options) {
  // 取出配置中的数据，进行重命名
  let {
    createElement: hostCreateElement,
    createTextNode: hostCreateTextNode,
    insert: hostInsert,
    remove: hostRemove,
    querySelector: hostQuerySelector,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    setText: hostSetText,
    setElementText: hostSetElementText,
    patchProp: hostPatchProp
  } = options


  // 对子节点集合中的文本内容进行虚拟节点封装
  function normalize(children, i){
    
    if(isString(children[i]) || isNumber(children[i])){
      children[i] = createVNode(Text, null, children[i])
    }
    return children[i] 
  }

  // mountChildren是处理子节点为数组的逻辑函数
  function mountChildre(children, container) {
    
    /*
      集合中有两种情况 -> ['625',h(...)]
      1.文本，需要转变成虚拟节点 -> 这样才能递归调用虚拟节点的渲染逻辑函数
      2.虚拟节点，递归调用节点生成逻辑，逻辑函数拆分的复用思维
    */
    
    for (let i = 0; i < children.length ; i++){
      // 子节点格式化逻辑函数
      let child = normalize(children, i)
      

    /*
      ✨ 有趣而优雅就在于设计和封装好逻辑的地方
        patch是整体的虚拟节点生成和挂载逻辑函数
        在这里子节点的操作，又是将外层节点作为容器，进行渲染过程
    */
      // 递归调用虚拟节点的渲染逻辑函数
      // 🚩 目前这里是初始化节点渲染，不需要考虑其他
      patch(null, child, container)
    }
  } 


  function mountElement(vnode, container) {

    let { type, children, shapeFlag, props } = vnode

    // 生成父节点
    // 将生成的真实节点记录到虚拟节点中
    let el = vnode.el = hostCreateElement(type)

    /*
      父节点渲染过程中，进行子节点的渲染
        1.若子节点是文本，则直接通过hostSetElementText写入文本内容
        1.若子节点是数组，则将子节点的渲染逻辑提取出，单独进行处理（优雅函数书写）
      判断子节点类型 -> shapeFlag
    */
    // 生成子节点，并将子节点填写到父节点容器中
    // 判断子节点类型,使用shapeFlag进行判断
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children)
    }
    // 当子节点是个数组类型的集合时，抽离逻辑进行单独封装
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      
      mountChildre(children, el)
    }

    // 将父节点挂在到页面容器上
    hostInsert(el, container)

  }

  // 新节点为文本节点的处理逻辑
  function processText(n1, n2, container){
    // n1 为 null时，为初始化渲染
    if(n1 == null){
      hostInsert(n2.el = hostCreateTextNode(n2.children),container)
    }
  }

  function processElement(n1, n2, container){
    if(n1 == null){
      mountElement(n2,container)
    }
  }

  /*
    节点渲染的逻辑函数，patch的存在主要是为了diff算法
      n1 缓存的虚拟节点
      n2 新的虚拟节点
      判断n1是否为null
        为null的情况下，则是初始化节点，直接挂载
        不为null的情况下，则是更新节点，进行diff算法的节点比较，再进行挂载
  */
  function patch(n1, n2, container) {
    let {type, shapeFlag} = n2
    switch(type){
      case Text: 
        processText(n1, n2, container)
        break;
      default:
        if(shapeFlag & ShapeFlags.ELEMENT){
          processElement(n1, n2, container)
        }
    }
    // if (n1 == null) {
    //   /*
    //     render(h('span','111'), app)
    //     h -> vndoe
    //       -> {
    //         type: 'h1',
    //         children: '111'
    //         props: null
    //         el: null,
    //         shapeFlag: 9
    //       }
    //   */
    //   // ✨ n1为null时，进行节点的挂载，将节点渲染到页面上
    //   mountElement(n2, container)
    // }
  }

  function render(vnode, container) {
    
    // 模板渲染中，节点为空，则卸载对应节点
    if (vnode == null) {
      // 卸载元素
    } else {
      // 初始化或更新元素
      // patch中进行初始化或更新节点逻辑，patch的封装目的之一是为了diff算法的比较
      patch(container.vnode || null, vnode, container)
      // 每次渲染(更新或初始化)后将最新的虚拟节点数据缓存在容器上
      container.vnode = vnode
    }
  }
  return { render }
}