✨watch模块
  ___原代码中，监控属性不在reactive中
监控函数

🚩watch函数(source,cb)
  =>

  source 监控目标

  cb 监控目标发生变化时执行的逻辑函数

  =>

  ⚽️ get 用于访问目标数据的包装函数: () => proxy.xxx

    get的目的是进行目标数据的访问，以达到建立双向依赖的关系

    若传进watch的source参数本身是对目标数据进行访问的函数，则直接使用

    若source是个具体数据，则进行封装

    若source是个响应式数据，则进行递归，对每个具体数据进行封装

    （当然，若目标数据不是响应式数据，双方压根无法形成依赖收集，在手写中不考虑这种情况）

  ⚽️ oldValue 记录该数据旧值
    在调用watch时，会直接调用effect.run 先获取一次监控数据的数据值

  ⚽️ effect 以get为核心逻辑的ReactiveEffect实例，但跟计算属性一样，关键在于scheluder的逻辑使用

      🌈 监视目标数据后，通过ReactiveEffect创建实例，调用run方法获取该数据的值(旧值)-> oldValue

      在调用run的同时，该ReactiveEffect实例和目标数据建立双向依赖关系，当目标数据发生变动时，会调用对应watch的ReactiveEffect实例的scheluder方法

  ⚽️ cleanup 用于记录用户onCleanup中的函数

  ⚽️ onCleanup函数 

    在监控过程中，过程执行函数(cb)内若是调用了onCleanup，onCleanup内的函数，会在记录在cleanup上，在下次执行cb时，会调用cleanup

  ⚽️ scheluder 监控时去执行对应操作的逻辑函数

      判断用户监控数据变动时，cleanup是否有记录内容，若有，则先调用该函数
      调用effect.run 获取最新数据
      调用cb
      更新oldValue的值，将监控数据当前的值赋值给oldValue，下次发生改变时，oldValue仍作为更改前的数据
      
  🚩traversal函数
  
  将传进来的参数进行递归，当目标数据为非对象时，直接返回给外层，进行函数封装

  用Set进行优化，目标数据一旦处理过，直接add，防止重复操作，而直接作为traversal的参数传入，相当于放在公共环境中，对同一个set进行操作。


      
    
  
  
  
  

  
  
