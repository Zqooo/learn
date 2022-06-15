✨ref模块

实现目标数据的响应式处理

👉 区别1： reactive是对复杂数据类型的响应式处理，而ref是对数据进行封箱操作，通过.value的方式进行访问和设置，若目标数据本身也是复杂数据类型，ref底层也是用了reactive进行响应式代理

🚩 toReactive函数

  判断是否为对象，若是，则调用reactive进行响应式处理，若不是，原则返回，作为RefImpl实例的更新值

🚩 ref函数
  
  return new RefImpl()
  返回封箱后的响应式数据，该数据可以通过.value访问数据

🚩 RefImpl类

  parameter
    rawValue，RefImpl实例的缓存值，在通过扩展的逻辑中，可以确定是否更新在_value上（RefImpl中作为新旧值的判断，而ComputedImpl中，作为脏数据更新的判断）

  -----

  _value      目标数据
  deps        依赖该数据的effects
  __v_isRef   封箱数据标识，若是ref同类型数据，都可以.value访问数据，如computed
  
  -----

  get value 函数
  
  调用trackEffects函数进行双向依赖收集
  返回目标数据

  set value 函数

  判断传进的newValue与缓存值rawValue是否相等，若相等，没必要更新，若不想等，则进行更新

  判断是否为对象，若是，则进行reactive的响应式处理

  更新rawValue的缓存数据，调用triggerEffects触发所有依赖当前封箱数据  
  
🚩 toRef函数（ObjectRefImpl不详解，直接看代码）
  return new ObjectRefImpl()
  
  reactive将object数据进行响应式处理，通过访问代理对象才能触发响应式逻辑

  toRef，可以将代理数据的某一个属性进行一次封箱操作
  ObjectRefImpl类中通过Object.definedProperty，在访问封箱对象的value值时，去访问代理数据的对应属性

  
🚩 toRefs函数（不详解，直接看代码）

  把整个代理对象的每一个属性进行toRef操作，再以集合的形式返回

🚩 proxyRefs函数

  无论是computed，ref，都是对目标属性进行一层封箱操作（Object.definedProperty特性），用户可以通过.value进行目标的访问和设置

  proxyRefs是再通过一次数据代理，在访问目标数据时，通过目标身上的__v_isRef标识判断是否为封箱对象，若是，则底层直接将.value后的数据返回，若不是，原值返回

  简结：proxyRefs通过数据代理，在访问目标数据时，进行拆箱操作

知识点学习：

🚩 class种通过get value/ set value 编译后其实就是 Object.definedProperty