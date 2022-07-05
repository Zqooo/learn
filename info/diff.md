在vnode&render.md中，只停在模板渲染的层面，后续的diff算法比较在patch实现，在这边进行续写

✨ diff算法
  1.用户在操作dom节点时，少有将子节点和父节点互换的操作，所以在vue中没有考虑整棵树完整对比的逻辑，性能会很差
  2.diff算法采用同级节点对比
    结合第一点举例， a -> a1,a2  |  a1 -> a,a2 
    如果进行整棵树的遍历对比，可以看出父节点a和子节点a1互换，再进行节点复用，但这样做反而消耗更多性能
    vue2和vue3的diff算法是同级比较，当 a 和 a1 不同的时候，直接将a替换成a1 ，不做对比
  
  3.vue2中，两次更新过程中，如果节点前后没变化，仍然会同级逐层对比
    vue3中对此情景进行了优化 -> 靶向更新
    会进行将动态节点存在数组中，静态节点不用进行对比，动态节点进行对比


✨ diff整理流程简述
  render渲染器
   -> patch节点渲染函数（新节点挂载/旧节点对比渲染）
    1.判断挂载的容器上是否已经有虚拟节点标识
      若有，则和新虚拟节点进行相同特性判断(isSameVNode)，确定是否卸载旧节点
    2.判断该节点类型
      Text  -> processText
      other -> processElement
   -> processElement 节点挂载逻辑处理函数
    判断当是否有旧节点
      在patch中走isSameVNode函数，若有相同特性，则保留，若没有，则卸载
      无保留旧虚拟节点 -> mountElement 执行直接挂载节点函数
      有保留旧虚拟节点 -> patchElement 执行diff对比更新函数
   -> patchElement 节点对比挂载函数(diff核心逻辑函数)
      1.更新当前节点的属性 patchProps
      2.子节点深层对比函数 patchChildren
   -> patchChildren
      根据shapeFlag判断新旧节点的数据类型，进行对应操作
      分别是 
        旧数组 新数组/新文本/新空
        旧文本 新数组/新文本/新空
        旧空   新数组/新文本/新空
      第三组在processText/processElement 已经直接进行挂载，主要是处理前两组的情景
      
      1.情景一 新文本 旧文本/旧数组 
        -> 旧数组中的节点依次卸载 unmountChildren(for & unmount(child))
        -> 判断旧文本和新文本是否相等
        通过hostSetElementText 将新文本覆盖到父节点的文本节点中
      2.情景二 旧数组 
        2-1 新数组 走diff 💡
        2-1 新空 旧数组中的节点依次卸载 unmountChildren(for & unmount(child))
      3.情景三 旧文本 创建空文本节点直接进行覆盖
        3-1 新数组 遍历挂载新节点
        3-2 新空   无需任何操作

💡 diff算法比较

  🚩 1.常规序列的比较 
  三指针推动 i e1 e2
  e1和e2为新旧节点的末尾项，i为首位索引
  sync from start 
    从首尾向末尾推动(i -> e1/e2)
  sync from start 
    从末尾向首位推动(e1/e2 -> i)
  两个过程中，节点有相同特性则直接走patch挂载
  当新旧节点不相等时停止遍历，指针往前推一位(i++/e1--,e2--)，停留在不同项
  
  🚩 2.常规序列下溢出节点的增删

  简单列举新旧节点的两种情景
  情景一: 新节点比旧节点多
  a b c d e    &    b c d e f 
  a b c d e f     a b c d e f
  
  情景二: 旧节点比新节点多
  a b c d e f  &  a b c d e f 
  a b c d           b c d e f
  （不做详细分析，根据start or end 的逻辑，就可以看到i和e1/e2对比的差别）
  判断i所在的位置，
  1. i>e1的条件下，是新节点比旧节点多
    则当前是i到e2的距离，循环距离值，进行新节点的挂载
    
    anchor 新节点插入的位置
    insertBefore(el, container, anchor) 往anchor节点前进行新节点的插入/移动
    判断e2是否为末尾项:
      e2 + 1 若超出子元素长度，则为末尾项，anchor 为null
      e2 + 1 若没超子元素长度，则非末尾项，anchor 为插入点
    走patch逻辑 新行新节点挂载
  2. i>e2的条件下，是旧节点比新节点多
    则当前是i到e1的距离，循环距离值，进行旧节点的卸载

  🚩 3. uknown sequence
  经过前两步，已经将前后常规序列节点取出，剩下的是未知序列节点

  场景简单举例 ---- part1
  a b(s1) c d e(e1) f g
  a b(s2) q c d(e2) f g
  需要四指针进行对比，分别是s1，s2，e1，e2
    
  vue2中是新节点去旧节点中寻找复用，vue3是新节点去新节点中判断自身的归属
  分两步进行
  1. 通过Map创建新节点映射表(s2 -> e2)
      遍历旧节点数组，在映射表中查询自身是否存在，
      不存在，卸载
      存在，patch渲染(走对比更新逻辑)

  2. to sequenced node 摆正节点序列
  
    前提： 在第一步中，不存在的旧节点已经卸载，存在的旧节点已经更新状态，但未更正位置
    
    通过insertBefore API的特点，新增节点可以进行插入，存在的节点可以更正位置

    toBePatched: e2 - s2 + 1 
    toBePatched 是 unknown sequence 未知队列的长度（下面简称us，是新节点的未知序列片段）
    
    到 to sequenced node 环节，s1已经推动到us前，直接到未知序列的末位，逐步往前更正
    
    从末位开始摆正逻辑，通过 part1 可看，摆正过程是对 unknown sequence的末位进行插入，找到f，将e更正到f前

    取出us的最末位与下一位进行判断
      若他的下一位超出新节点本身的长度，则anchor(锚)不需要存值，直接查到
      若他的下一位有值，则以下一位作为anchor(锚)进行插入/更正位置

      anchor为null的场景
      a b c d e
      a b q c d

    判断当前us的末位有没有携带真实节点
      若没有，则是新增节点，走patch新增逻辑
      若有，则是在uknown sequence第一环节中已经复用渲染的节点，通过hostInsert进行位置更正
    
  
    
    
    
      
