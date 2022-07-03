在vnode&render.md中，只停在模板渲染的层面，后续的diff算法比较在patch实现，在这边进行续写

✨ diff算法
  1.用户在操作dom节点时，少有将子节点和父节点互换的操作，所以在vue中没有考虑整棵树完整对比的逻辑，性能会很差
  2.diff算法采用同级节点对比
    结合第一点举例， a -> a1,a2  |  a1 -> a,a2 
    如果进行整棵树的遍历对比，可以看出父节点a和子节点a1互换，再进行节点复用，但这样做反而消耗更多性能
    vue2和vue3的diff算法是同级比较，当 a 和 a1 不同的时候，直接将a替换成a1 ，不做对比
  
  4.vue2中，两次更新过程中，如果节点前后没变化，仍然会同级逐层对比
    vue3中对此情景进行了优化 -> 靶向更新
    会进行将动态节点存在数组中，静态节点不用进行对比，动态节点进行对比



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
