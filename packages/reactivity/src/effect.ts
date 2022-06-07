/* 
  effect 响应函数
  1.创建ReactiveEffect类，每调用一个effect，创建一个_effect实例，
  ····_effect用于更新视图
  ······proxy代理中，当代理数据被更改时，有使用对应数据的effect需再次调用更新视图

  track 依赖收集函数
  1.

*/

/* 
activeEffect => 用于记录当前操作的effect
  问题情境：调用effect时，可能会遇到一种情况
    1····effect(()=>{
    2····state.name = 1
    3····  effect(()=>{
    4····    state.age = 2
    5····  })
    6····  state.color = 'red'
    7····})

    此情景内，effect深度调用(3)时，activeEffect指向第二次调用的effect
    执行到5，结束第二次effect调用时，需要跳回第一次调用的effect
    否则state.color无法收集到该effect依赖

    解决方案： 
      使用try...finally语法，在try中执行的回调不结束前，不会执行finally语句内容
      在调用effect之前，将目前activeEffect存放到effect实例的parent属性上
      effect执行结束后，activeEffect重新指向上一层effect（finally）

*/
export let activeEffect = undefined

export class ReactiveEffect {
  // 停止依赖收集的标识
  public active = true;
  public parent = null;
  public deps = []; // 记录effect中关联了哪些属性，后续清除需使用
  constructor(public fn, public scheduler?) { }
  run() {
    // console.log(1);
    if (!this.active) {
      return this.fn()
    } else {
      try {
        // 将当前层级节点存放到即将被调用的effect实例.parenƒt上，用于执行结束后返回上层节点
        this.parent = activeEffect
        // 进入子节点
        activeEffect = this
        cleanEffect(this)
        return this.fn()
      } finally {
        // 当天effect节点执行结束后，返回上一层节点
        activeEffect = this.parent
        // 将自节点parent释放
        this.parent = null
      }
    }
  }
  stop() {
    if (this.active) {
      this.active = false
      cleanEffect(this)
    }
  }
}

export function effect(fn, options = {} as any) {
  const _effect = new ReactiveEffect(fn, options.scheduler)
  // 执行run，更新视图
  _effect.run()

  // const _dynamic_effect = _effect
  // return  _dynamic_effect

  // 将ReactiveEffect.prototype.run指向当前effect实例，并且赋值给runner
  const runner = _effect.run.bind(_effect)
  // 同时将effect实例赋值给runner对象上，可暴露到外界
  runner.effect = _effect
  return runner

  /*
    ReactiveEffect.prototype.run 是用于执行callBack的核心函数
    通过bind将run指向当前effect实例，赋值给runner暴露到外界，可手动进行视图渲染
    runner = ReactiveEffect.prototype.run(bind）
    同时将_effect实例作为runner的属性之一，将_effect暴露到外界，可调用_effect.stop 停止依赖收集
    
    ✨ 思考：
      此处逻辑，其实根据这种形式，也可以直接暴露effect实例本身
      const _dynamic_effect = _effect
      return _dynamic_effect
      🪐 验证通过，逻辑可行，外界可以通过 _dynamic_effect.stop / _dynamic_effect.run 进行相同效果的操作
  */

}

/* 
  WeakMap 功能类似于Map，无法转换成其他数据格式，键必须是对象
  Map，Map的key值可以被枚举，而枚举的原理则是通过一个数组存储对应的key值
    形成强引用，Map的key值被遍历数组所引用，导致key值在没有被引用时仍无法被回收
  而WeakMap的key值不可被枚举，底层没做枚举实现，key值在没任何引用时，能被回收，避免内存泄漏
  example: 
    let o1 = {a: 1}
    const wMap = new WeakMap()
    wMap.set(o1,{})
    // 当o1设为null时，{a: 1}没有任何指针指向，能被垃圾回收机制系统处理
    wMap.has(o1) // undefined wMap中没有o1这个键
*/

// 依赖收集函数 track
// targetMap 存放每个元数据的依赖关系表
// 使用weakMap，当目标对象没被引用，则能被垃圾回收
// ✨确定表结构层级: 
// targetMap_元数据关系依赖表(WeakMap) => 元数据(target)：具体数据关系依赖表（depsMap）
// depsMap_具体数据关系依赖表(Map) => 具体数据（key）：effect函数收集表（deps）
// deps_effect函数收集表(Set) => effect函数
const targetMap = new WeakMap()
export function track(target, key) {
  if (activeEffect) {
    // 判断targetMap中有没有存储此源数据的依赖关系表
    let depsMap = targetMap.get(target)
    // 若没有存储，则将创建一个新的Map表作为元数据的关系依赖表
    if (!depsMap) {
      // 更新表结构同时，将关系依赖表赋值给depsMap，以便后面操作
      targetMap.set(target, (depsMap = new Map()))
    }
    // 判断该元数据的关系依赖表中，是否存储了该key值的依赖关系表
    let deps = depsMap.get(key)
    if (!deps) {
      depsMap.set(key, (deps = new Set()))
    }
    trackEffects(deps)
  }
}

export function trackEffects(deps) {
  // 判断是否收集重复的effect函数，若没有，则收集
  const shouldTrack = !deps.has(activeEffect)
  if (shouldTrack) {
    deps.add(activeEffect)
    // effect实例上deps的作用： 记录用到了哪些属性
    activeEffect.deps.push(deps)
  }
}

/* 
  targetMap 表结构如下
  {
    元数据(target):  proxy[Map] 
  }

  target 表结构如下 ： {
    属性名(key):  effects[Set]
  }

  effects 结构如下
  [effect(ReactiveEffect实例)]

  视图响应函数 trigger
  当代理数据发生变化，提示对应依赖关系的effect进行视图更新

*/

export function trigger(target, key, value) {
  // 判断关系依赖表是否存在该元数据，若没有，则该元数据没依赖任何effect进行视图更新处理
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    // 不进行任何一个effect的执行
    return
  }
  let effects = depsMap.get(key)
  triggerEffects(effects)
}

export function triggerEffects(effects) {
  if (effects) {
    effects = new Set(effects)
    effects.forEach(effect => {
      if (effect !== activeEffect) {
        if (effect.scheduler) {
          effect.scheduler()
        } else {
          effect.run()
        }
      }
    })
  }
}

/* 
  --->  分支切换内容，
    场景
    effect(() => {document.body.innerHTML = state.flag ? state.name : state.age});
    setTimeout(() => {
      state.flag = false;
      setTimeout(() => {
          console.log('修改name，原则上不更新')
          state.name = 'zf'
      }, 1000);
    }, 1000)
    此场景下，flag在异步操作中已经被更改状态
    在flag: false的情景下,effect不会显示state.name
    此情况下，effect应该不被state.name产生依赖联系

    解决思路： 每次运行effect时，应该重新建立依赖关系，确保effect依赖关系的最新动态
    
    
*/
function cleanEffect(effect) {
  // 判断当前effect.deps是否有存储依赖
  let deps = effect.deps
  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect)
  }
  effect.deps.length = 0
}
