✨ 先说用法 -> render(h('h1'),{style:{color:'red'}},app)
  
✨ api 
    1. createVNode 创建虚拟节点函数
    2. h 创建虚拟节点的js重载函数
    3. createRenderer 创建自定义模板渲染函数
    4. render 模板渲染函数，参数是虚拟节点

✨ -> createVNode 虚拟节点创建的逻辑函数
    虚拟节点有一下几个特点
    VNode = {
      _v__isVnode   ->    是否为虚拟节点标记
      type          ->    为什么类型的节点，如h1，span
      el            ->    记录真实节点
      children      ->    子节点
      props         ->    属性
      key           ->    ❌
      shapeFlag     ->    二进制类型标记（映射了当前节点以及子节点所有类型的二进制总和）
    }

✨ -> ShapeFlags vue3的二进制类型标记
    enum ShapeFlags = {
      ELMENT : 1,
      FUNCTIONAL_COMPONENT = 1 << 1,
      STATEFUL_COMPOMENT = 1 << 2,
      TEXT_CHILDREN = 1 << 3,
      ARRAY_CHILDREN = 1 << 4,
      SLOTS_CHILDEEN = 1 << 5,
      TELEPORT = 1 << 6,
      SUSPENSE = 1 << 7,
      COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
      COMPONENT_KEPT_ALIVE = 1 << 9,
      COMPOMENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT
    }

    每个类型的目标都被标记了某个二进制的位数
    
    通过或运算，VNode中的shapeFlag记录了自身及子节点类型的总和
    -> 判断children的节点类型，Array/text 确定当前虚拟节点的shapeFlag数值
    shapeFlag = ShapeFlags.ELMENT ｜ ShapeFlags.TEXT_CHILDREN / ShapeFlags.ARRAY_CHILDREN
    
    通过与计算，VNode可以分辨出包含了哪些类型的子节点,为1则包含该类型
    children = VNode.shapeFlag & ShapeFlags.TEXT_CHILDREN = 1/0

  
✨ -> h createVNode的重载函数
    h的底层是使用createVNode函数，通过传进行来的参数，确定如何进行传参
    
    确定createVNode用法
    createVNode(type, props = null, children = null)
    
    分析情况:
      1.两个传参 h(type, propsOrChild)
        判断第二个参数的类型，确定是子节点还是属性
        createVNode(type, propsOrChild)
        createVNode(type, null, propsOrChild)
      2.三个及以上的传参 h(type, propsOrChild, children ) / h(type, propsOrChild, children, ...)
        需要确定传给createVNode的children
        createVNode(type, propsOrChild, children)
        createVNode(type, propsOrChild, Array.from(argements).slice(2))
    
    分析过程及代码实现：

    let l = arguments.length 
    if(l == 2){
      if(isObject(propsOrChild) && !isArray(propsOrChild)){
        if(isVNode(propsOrChild)){
          return createVNode(type, null, [propsOrChild])
        } else {
          return createVNode(type, propsOrChild)
        }
      } else {
        return createVNode(type, null, propsOrChild)
      }
    }else {
      🚩 vue3的h函数，并没有处理第二个参数为非属性的逻辑
      if(l == 3 && isVNode(children)){
        children = [children]
      } else if (l > 3) {
        children = Array.from(arguments).slice(2) 
      }
      return createVNode(type, propsOrChild, children)
    }
    

✨ -> createRenderer 创建渲染器函数
  createRenderer中会返回一个render函数，通过render函数，传入虚拟节点以及挂载容器，实现页面渲染
  
  确定createRenderer的用法，createRenderer(options) 

  如果用vue3种内置的render，其实就是用了内置的配置生成渲染器
  exprot function render(vnode, container){
    const { render } = createRenderer(renderOptions)
    return render(vnode, container)
  }

  用户也可以通过自己编写的渲染器配置，生成自己的渲染器，进行页面渲染
  🚩 vue3主要是适配浏览器,用户可以直接通过createRenderer去制定个性化平台的渲染器
  const {render} = createRenderer({
    createElement(){
      ...
    }
  })
  
  🚩 vue3中renderOptions的配置(runmtime-dom)
  renderOptions = {patchProp, ...nodeOps}
  nodeOps, 平台渲染的操作api
  patchProp, 节点属性操作的api 

  🚩export const nodeOps = {
    createElement(type){
      return document.createElement(type)
    },
    createTextNode(text){
      return document.createTextNode(text)
    },
    insert(element,container,anchor){
      container.insertBefore(element,anchor)
    },
    remove(child){
      const parent = child.parentNode
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
    setText(element,text){
      element.nodeValue = text
    },
    setElementText(element, text){
      element.textContent = text
    }
  }

  🚩patchProp 修改属性函数
    patchProp(el, key, preValue, nextValue)
    - patchClass 
    - patchStyle
    - patchEvent
    - patchAttr

    🌟export function patchProp(el , key , preValue, nextValue){
      if(key === 'class'){
        patchClass(el, nextValue)
      } else if(key === 'style'){
        patchStyle(el, preValue, nextVaule)
      } else if(/on[A-Z]/.test(key)){
        patchEvent(el, key, nextValue)
      } else {
        patchAttr(el, key, nextValue)
      }
    }

    🌟export function patchClass(el, nextValue){
      if(nextValue === null){
        el.removeAttrbute('class')
      } else {
        el.className = nextValue
      }
    }

    style的替换 -> 补丁替换
    -> preValue
    style:{
      color: 'red',
      font-size: '16px'
    }
    -> nextValue
    style:{
      color: 'bule',
      background-color: 'pink'
    }
    -> add
    style:{
      color: 'bule',
      font-size: '16px',
      background-color: 'pink'
    }
    -> delete
    style:{
      color:'bule',
      background-color:'pink'
    }
    🌟export function patchStyle(el, preValue, nextValue){
      const style = el.style
      for(let key in nextValue){
        stylep[key] = nextValue[key]
      }
      
      if(preValue){
        for(let key in preValue){
          if(nextValue[key] == null){
            style[key] = null
          }
        }
      }
    }
    <!-- 事件绑定 -->
    ❓ 记得去源码中看这一块事件多个绑定的相关逻辑

    ✨ 事件绑定逻辑也有用到封箱操作，用于值的缓存，
    function createInvoker(preValue){
      let invoker = (e) => { invoker.value(e) }
      invoker.value = preValue
      return invoker
    }

    🌟export function patchEvent(el, eventName, value){
      <!-- 取出缓存表 -->
      const invokers = el._vei || (el._vei = {})
      <!-- 取出缓存数据 -->
      const existingInvoker = invokers[eventName]

      
      <!-- 进行判断操作 -->
      if(existingInvoker && nextValue){
        existingInvoker.value = nextValue
      } else {
        const eName = eventName.slice(2)
        if(nextValue){
          const invoker = invokers[eventName] = createInvoker(nextValue)
          el.addEventListener(eName, invoker)
        } else if (existingInvoker) {
          el,removeLisnener(eName, existingInvoker)
          invokers[eventName] = null
        }
      }
    }

    <!-- 其他属性绑定 -->
    🌟export function patchAttr(el, key, nextValue){
      if(nextValue == null){
        el.removeAttribute(key)
      } else {
        el.setAttribute(key, nextValue)
      }
    }


    
  ✨ 解析createRenderer函数的内容

  确定用法:
    const { render } = createRenderer(renderOptions)

    export function createRenderer(options){
      <!-- 将options中的方法解构出来并重命名 -->
      let {
        createElement: hostCreateElement,
        createTextNode: hostCreateTextNode,
        insert: hostInsert,
        removeChild: hostRemoveChild,
        parentNode: hostParentNode,
        qeurySelector: hostQuerySelector,
        nextSibling: hostNextSibling,
        setText: hostSetText,
        setElementText: hostSetElementText,
        patchProp : hostPatchProp
      } = options
      
      -----------------------------------------------
      ✨函数的设计从下往上


      🚩子节点格式化处理函数
      <!-- 这里的格式化，是指某个虚拟节点A的children为数组时，需要遍历A.children 进行新一轮的patch挂载，但A.children中有文本或节点，需要将文本转变成节点 -->
      function normalize(children, i){
        if(isString(children[i]) || isNumber(children[i])){
          children[i] = createVNode(Text, null, children[i])
        }

        return children[i]
      }

      ------------

      🚩 文本节点的创建标记
      export const Text = Symbol('text')

      ------------

      🚩子节点为数组的处理挂载函数
      function mountChildren(children, container){
        <!-- children 接收到的是数组， -->
        <!-- 🌟子节点中有文本或虚拟子节点，这里的实现逻辑也是将虚拟节点转换为真实节点挂载在容器的过程，也就是patch的递归复用 -->
        
        <!-- 循环数组，将子节点格式化操作函数抽离-->
        for(let key in children){
          child = normalize(children , i )
        }
        
        patch(null, child, container)
      }


      🚩 创建节点并进行挂载的函数
      function mountElement(vnode, container){
        回忆vnode的数据格式
        {
          type,
          props,
          children,
          shapeFlag,
          el,
          key,
          _v__isVNode
        }
        let {type , children, shapeFlag, props } = vnode
        
        <!-- 创建当前虚拟节点为真实节点 -->
        <!-- 需要将真实节点记录到虚拟节点中 -->
        let el = vnode.el = hostCreateElement(type)

        <!-- 创建子节点并挂载到当前的父节点上 -->
        <!-- 判断子节点的类型，进行不同处理 -->
        <!-- 通过shapeFlag判断vnode中children是数组还是文本 -->

        <!-- 子节点的挂载过程，也是从虚拟节点转变真实节点挂载的过程 -->

        <!-- 🌟若子节点是文本节点，直接设置文本即可 -->
        if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
          hostSetElementText(container, children)
        }

        if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){
          mountChildren(children, el)
        }
        
        <!-- 等vnode中生成一个完成的dom节点后，再将整个挂载到父节点上 -->
        hostInsert(el, children)
        
      }

      🚩 分别将文本节点和常规节点的渲染逻辑抽离出来

      function processText(n1, n2, container){
        <!-- 如果是文本节点，则进行文本的 -->
        <!-- n1为null，初始化挂载 -->
        if(n1 == null){
          <!-- 将文本创建成文本节点，进行挂载  -->
          <!-- 一个节点中，子节点可能有多个，不能单独的进行contentText的渲染，应该是将文本转成节点，再将文本节点挂载到父节点上 -->
          <!-- processText的操作是将父节点中的某个已经转换成节点的文本节点，挂载到父节点上 -->
          hostInsert(n2.el = hostCreateTextNode(n2.children), container )
        }
      }

      
      function processElement(n1, n2, container){
        <!-- 如果节点是非文本子节点，则进行正常的挂载 -->
        if(n1 == null){
          mountElement(n2, container)
        }
      }

      🚩🚩 patch 
      n1 旧节点，记录在container上
      n2 新节点，是穿进render的vnode
      container 是当前虚拟节点转变成真实节点后的挂载目标

      🌟 -> new version
      <!-- patch改进成可递归使用的版本， -->
      function patch(n1, n2, container){
        let { type, shapeFlag } = n2
        switch(type){
          case Text:
            processText(n1, n2, container)
            break;
          default:
          <!-- 判断当前节点是否常规的子节点，若是文本转换的Text节点，则无法进入执行语句 -->
            if(shapeFlag & ShapeFlags.ELEMENT){
              processElement(n1, n2, container)
            }
        }
      }

      🌟 -> old version
      function patch(n1, n2, container){
        if(n1 == null){
          <!-- 初步渲染 -->
          mountElement(n2,container)
        }
      }


      🚩<!-- 返回一个render函数, -->
      明确render的用法:
      render(vnode, container)

      function render(vnode, container){
        <!-- 判断是挂载元素还是卸载元素 -->
        if(vnode == null){
          ❌<!-- 卸载元素 -->
        } else {
          <!-- patch函数的目的是为了diff算法，函数封装，将每个逻辑抽离出来，实现代码的整洁 -->
          patch(container.vnode || null, vnode, container)
          container.vnode = vnode
        }
      }
      return {render}
    }

  
  
  
  
  
  


      
    

  

