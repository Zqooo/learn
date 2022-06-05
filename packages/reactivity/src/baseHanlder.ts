import { isObject } from "@vue/shared"
import { reactive } from "./reactive"
import { track, trigger } from "./effect"

// 创建一个枚举对象，作为是否重复的标记
export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

// proxy代理配置
export const baseHanlder = {
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    }
    track(target, key)
    let res = Reflect.get(target, key, receiver)
    if(isObject(res)){
      return reactive(res)
    }
    return res
  },
  set(target, key, value, receiver) {
    // 数据不是被更改为相同值时进入
    let oldValue = target[key]
    if (oldValue !== value) {
      let result = Reflect.set(target, key, value, receiver)
      // 当响应式数据发生变动时，提醒对应数据的effect进行视图更新
      trigger(target, key, value)
      return result
    }
  }
}


