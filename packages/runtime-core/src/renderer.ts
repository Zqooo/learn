import { isNumber, isString } from "@vue/shared"
import { createVNode, isSameVNode, ShapeFlags, Text } from "./createVNode"

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
  function normalize(children, i) {

    if (isString(children[i]) || isNumber(children[i])) {
      children[i] = createVNode(Text, null, children[i])
    }
    return children[i]
  }

  // mountChildren是处理子节点为数组的逻辑函数
  function mountChildren(children, container) {

    /*
      集合中有两种情况 -> ['625',h(...)]
      1.文本，需要转变成虚拟节点 -> 这样才能递归调用虚拟节点的渲染逻辑函数
      2.虚拟节点，递归调用节点生成逻辑，逻辑函数拆分的复用思维
    */

    for (let i = 0; i < children.length; i++) {
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


  function patchProps(oldProps, newProps, el) {
    if (oldProps == null) oldProps = {}
    if (newProps == null) newProps = {}

    // 新节点有，则进行更新操作
    for (let key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key])
    }

    // 旧节点有，新节点无，也同时进行更新操作，但要把目标属性为null传入，才能进行
    for (let key in oldProps) {
      if (newProps[key] == null) {
        hostPatchProp(el, key, oldProps[key], null)
      }
    }
  }

  function mountElement(vnode, container, anchor) {

    let { type, children, shapeFlag, props } = vnode

    // 生成父节点
    // 将生成的真实节点记录到虚拟节点中
    let el = vnode.el = hostCreateElement(type)

    // props 节点身上的属性需要进行更新
    if (props) {
      // 更新属性
      patchProps(null, props, el)
    }

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

      mountChildren(children, el)
    }

    // 将父节点挂在到页面容器上
    hostInsert(el, container, anchor)

  }

  // 新节点为文本节点的处理逻辑
  function processText(n1, n2, container) {
    // n1 为 null时，为初始化渲染
    if (n1 == null) {
      hostInsert(n2.el = hostCreateTextNode(n2.children), container)
    }
  }


  // 目标节点的子节点为数组时进行清空
  // 因为旧节点（vnode）身上都有el记录对应的真实节点，直接通过unmount（hostRemove）进行卸载就行
  function unmountChildren(children) {
    children.forEach(child => {
      unmount(child)
    })
  }

  // diff算法逻辑函数
  function patchKeyedChildren(c1, c2, el) {

    /*
      两组节点的对比
      a b c d f e g
      a b c d f   s
      
      常规的diff算法是进行遍历，寻找相同节点复用
      
      优化后的逻辑是采用三指针进行对比

      ✨ 正序的指针都是从0开始，可以共用同一个
      i = 0

      ✨ 倒序的指针采用双指针（其实正序和倒序也可以反过来，但结束的位置不确定的前提下，以正序为主）
      e1 = c1.length 
      e2 = c2.length

    */

    let i = 0
    let e1 = c1.length - 1
    let e2 = c2.length - 1

    /*
      从首位开始对比 sync from start
      尾部指针不变， i 增长
      情景：
        a b c d 
        a b c d q w s
    */
    while (i <= e1 && i <= e2) {

      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVNode(n1, n2)) {
        // 如果有相同特性，进行patch渲染，patch是虚拟节点的渲染函数
        patch(n1, n2, el)
      } else {
        // 对比到不相同的节点，停止循环
        break
      }
      i++
    }

    /*
      从末尾开始对比 sync from end
      i 不变， 两个尾部指针缩减
      情景：
                a b c d
        s w f w a b c d
    */
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVNode(n1, n2)) {
        // 如果有相同特性，进行patch渲染，patch是虚拟节点的渲染函数
        patch(n1, n2, el)
      } else {
        // 对比到不相同的节点，停止循环
        break
      }
      e1--
      e2--
    }


    /*  
        ----- 经过sync from start && sync from end 之后，可复用节点已经挂载上去

        ✨ i大于e1为前提，新节点的数量比旧节点数量多

        i <= e2 条件解读
        无论是sync from start ｜ sync from end 
        指针都是从0 -> e2 靠近
          前者是i 从 0 到 cut 再从cut 到 e2
          后者是i不变， e2到cut，然后 i 从 0 到 cut

        这里是补充多出的节点在哪个位置进行插入 hostInsert的第三个参数控制节点插入位置
        
        关键是判断e2指针是否为末尾项
          [e2+1]若有值，e2在末尾项，则新节点在末位进行添加
            a b c d 
            a b c d q w 
          [e2+1]若无值，e2在首位项，则新节点在首位进行添加
                a b c d
            f w a b c d

    */
    if (i > e1) {
      /*
        i <= 2
        两条链
          sync from start  i: 0 -> cut then cut(i) -> e2.length-1
          sync from end    i: e2.length-1 -> cut then 0(i) -> cut 
      */
      if (i <= e2) {
        while (i <= e2) {

          // 判断e2是否为末尾项
          const nextPos = e2 + 1

          //  anchor为null的情况下，e2是末尾项，走的是sync from start
          //  anchor取到值的情况下，e2是非末尾项，走的是sync from end
          let anchor = c2.length <= nextPos ? null : c2[nextPos].el

          patch(null, c2[i], el, anchor)
          i++
        }
      }
    } else if (i > e2) {
      // ✨ i大于e2为前提，旧节点的数量比新节点数量多
      // 多出的节点进行卸载
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i])
          i++
        }
      }

    }


  }

  function patchChildren(n1, n2, el) {
    let c1 = n1.children
    let c2 = n2.children

    // 对比新旧节点shapeFlag
    const prevShapeFlag = n1.shapeFlag
    const shapeFlag = n2.shapeFlag

    /*
      逻辑思维：确定新旧的不同，决定对真实节点的子节点操作，节点的类型只有三种，空，数组，文本
      比较子节点的内容，比较新旧节点的内容，确定真实节点的操作内容

      新节点   旧节点     操作
      文本     数组      清空旧节点，设置文本
      文本     文本      文本直接覆盖
      文本     空        文本直接覆盖
      数组     数组      diff算法比较
      数组     文本      清空文本，进行挂载
      数组     空         进行遍历挂载
      空      数组        清空旧节点
      空      文本        清空文本
      空      空          无事发生
    */

    /*
      代码逻辑中进行了以下判断划分

      新节点   旧节点     操作
      文本     数组      清空旧节点，设置文本
      文本     文本      文本直接覆盖
      
      数组     数组      diff算法比较
      空      数组        清空旧节点

      数组     文本      清空文本，进行挂载
      空      文本        清空文本

      旧节点为空，这个情况下属于初始化节点渲染
      数组     空         进行遍历挂载
      文本     空        文本直接覆盖
      空       空          无事发生
    */
    // 按照逻辑推论，新节点为文本时
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 旧节点为数组时，清空旧节点，其他操作都是文本直接覆盖
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1)
      }
      if (c1 !== c2) {
        hostSetElementText(el, c2)
      }
    } else {

      // 在逻辑首层用了新节点进行筛选，在这一层，用旧节点进行筛选

      // 旧节点是数组的情况下
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {

        // 判断新节点的是数组还是空，若是数组，进行diff算法比较，反之是清空
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // diff算法比较
          patchKeyedChildren(c1, c2, el)
        } else {
          // 清空
          unmountChildren(c1)
        }

      } else {
        // 旧节点是文本的情景下,创建空文本节点，将之前的文本覆盖
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, '')
        }
        // 若新节点是个数组，则进行挂载操作，若新节点是空文本，则无需其他操作
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el)
        }
      }
    }

  }


  // 同级元素的节点比较
  function patchElement(n1, n2, container) {

    // 走到这一步，确定两个新旧虚拟节点有相同特性，n1在之前的逻辑中有真实节点的存在，n2直接copy出来复用即可
    let el = n2.el = n1.el

    // 节点拥有相同特性，则分别比较虚拟节点属性上的区别,进行更新
    let oldProps = n1.props
    let newProps = n2.props

    patchProps(oldProps, newProps, el)

    // 进行子节点的深层对比
    patchChildren(n1, n2, el)
  }

  // 在patch中已经进行新旧节点的相同特性比较，如果没有相同特性，直接平级替代，删除旧节点，将新的虚拟节点渲染挂载
  function processElement(n1, n2, container, anchor) {
    // n1为null的情景下，为初始挂载
    if (n1 == null) {
      mountElement(n2, container, anchor)
    } else {
      //  比较元素
      patchElement(n1, n2, container)
    }
  }

  // 节点卸载函数
  function unmount(n1) {
    hostRemove(n1.el)
  }

  /*
    节点渲染的逻辑函数，patch的存在主要是为了diff算法
      n1 缓存的虚拟节点
      n2 新的虚拟节点
      判断n1是否为null
        为null的情况下，则是初始化节点，直接挂载
        不为null的情况下，则是更新节点，进行diff算法的节点比较，再进行挂载
  */
  function patch(n1, n2, container, anchor = null) {
    // 判断是否有旧节点，若有，判断新旧节点是否有相同特性
    // 如果没有相同特性，则卸载旧节点，在后续的逻辑中，新节点则进行初始化渲染的过程
    // 如果有相同特性，则不卸载旧节点，在后续逻辑中，有新旧节点对比的过程
    if (n1 && !isSameVNode(n1, n2)) {
      unmount(n1)
      n1 = null
    }

    // 优化逻辑
    let { type, shapeFlag } = n2
    switch (type) {
      case Text:
        processText(n1, n2, container)
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor)
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
      unmount(container.vnode)
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