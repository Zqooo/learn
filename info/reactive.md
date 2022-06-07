✨reactive模块
实现数据代理，后续操作的是代理对象，通过代理的对象的get和set特性进行进一步操作

    🚩 问题：元数据重复代理，代理对象重复代理，深层代理

    🌍 解决思路：

    ⚽️ 创建reactiveMap表，已经代理的数据存放到表中，在代理前判断表中是否已经存放该数据，若存放，则表示该数据已经进行代理，无需重复代理，从表中取出代理对象进行返回

    ⚽️ 已代理数据在proxy.get中设置阀门(ReactiveFlags.IS_REACTIVE)，若目标数据已被代理，则访问该阀值时，会返回true（未代理的元数据身上没有该属性，只会返回undefined），通过阀值判断，确定是否继续进行对象代理
    
    ⚽️ effect取值时，proxy会经过get逻辑，取值时判断是否为对象，若为对象，则进一步进行数据代理（在代理过程中就有判断是否已经代理的逻辑

    🚩 代理配置拆分在baseHanlder模块中
    ⚽️ 在get中调用track函数进行依赖收集
    ⚽️ 在set中调用trigger函数通知effect调用
    
知识点学习：
    🚩 WeakMap
    Map，Map的key值可以被枚举，而枚举的原理则是通过一个数组存储对应的key值

    形成强引用，Map的key值被遍历数组所引用，导致key值在没有被引用时仍无法被回收

    而WeakMap的key值不可被枚举，底层没做枚举实现，key值在没任何引用时，能被回收，避免内存泄漏

    example: 
    let o1 = {a: 1}
    const wMap = new WeakMap()
    wMap.set(o1,{})
    // => 当o1设为null时，{a: 1}没有任何指针指向，能被垃圾回收机制系统处理
    wMap.has(o1) // undefined wMap中没有o1这个键

    🚩 配合ts使用class
    constructor(public fn){}
    =>
    constructor(fn){
        this.fn = fn
    }