import { isFunction } from "@vue/shared"
import { activeEffect, ReactiveEffect, trackEffects, triggerEffects } from "./effect";

export function computed(getterOrOptions) {
  const isGetter = isFunction(getterOrOptions)

  // 根据参数，确定getter和setter的内容
  let getter;
  let setter;
  const fn = () => {
    console.error(`readonly ,can't not changed`)
  }
  if (isGetter) {
    getter = getterOrOptions
    setter = fn
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions || fn
  }

  return new ComputedRefImpl(getter, setter)
}

class ComputedRefImpl {
  private _value;
  // dirty 脏数据标识，为true时，则表示计算属性依赖的数据被更改
  public dirty = true;
  public deps;
  /*
    计算属性的get函数
    对于ReactiveEffect子类对象的二次理解
    若effect作为核心逻辑函数，用于执行目标回调函数
    这个过程中，deps用于收集当前effect实例的相关依赖（哪些数据用到了当前effect，并且记录的是该数据的effects集合）
    track，收集依赖，
  */
  public effect;
  constructor(getter, public setter) {
    // 计算属性本身也是一个effect实例,创建effect实例
    this.effect = new ReactiveEffect(getter, () => {
      if(!this.dirty){
        this.dirty = true
        triggerEffects(this.deps)
      }
    })
  }
  get value() {
    // 正在运行的effect，引用了计算属性的数据，进行依赖收集
    if(activeEffect){
      trackEffects(this.deps || (this.deps = new Set()))
    }
    if (this.dirty) {
      this.dirty = false
      // 调用getter获取最新的数据
      this._value = this.effect.run()
    }
    return this._value
  }
  set value(newVal) {
    this.setter(newVal)
  }
}