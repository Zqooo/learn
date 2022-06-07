✨computed模块
计算属性

🚩computed的调用有两种方式
  ⚽️ 传入一个函数
  computed(()=>{
    return proxy.a + proxy.b
  })

  ⚽️ 传入一个配置对象
  computed({
    get(){
      return proxy.a + proxy.b
    }
    set(){
      console.log(123)
    }
  })

🚩 computed函数
  传值: getterOrOptions
  通过isFunction 进行传值判断，确定getter和setter对应的函数
  返回一个ComputedRefImpl实例

🚩 ComputedRefImpl 类

  ⚽️ _value 私有属性，用于自身操作，外界无法读取和操作该实例属性

      用于记录getter的返回值，起到缓存作用

  ⚽️ dirty 脏数据标识，为true需要重新调用getter获取最新数据，为false，使用缓存_value

      当计算属性中getter依赖的数据发生变化，dirty为true，使用computed时会重新获取最新的数据

  ⚽️ deps 依赖收集表 记录哪些effect依赖当前计算属性

      当计算属性依赖的数据更新时，会调用effect的scheduler函数，将dirty改为true，通过deps通知所有
      依赖当前计算属性的effect更新逻辑

  ⚽️ effect getter为核心的ReactiveEffect实例

    通过调用effect.run 获取getter中的最新数据

    🌈 当计算属性依赖的数据发生变化时，目标计算属性会触发trigger函数，调用当前ComputedRefImpl实例身上的effect方法，将dirty状态改为true，开启脏数据标识开关，同时通知所有依赖当前计算属性的effect进行逻辑更新。

    🌈 依赖当前计算属性的目标effect执行，会引用计算属性的value值，触发ComputedRefImpl实例上的get函数,get函数中重新收集依赖，并且判断是脏数据状态，重新调用以getter为核心的effect方法，获取最新的数据
  -----

  ⚽️ set value()

    当目标effect对计算属性的value进行修改时，会触发value的set方法，对应调用传进来的setter函数

  ⚽️ get value()

    当目标effect对计算属性的value进行取值时，会触发value的get方法

      🌈 判断目标effect的存在性，进行依赖收集，将目标effect收集到当前ComputedRefImpl实例的deps中
      
      🌈 判断当前是否为脏数据，若是脏数据，则重新收集依赖，并将dirty改为false，表示数据是最新数据
  
  
  

  
  
