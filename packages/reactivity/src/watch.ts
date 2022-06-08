import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./baseHanlder";


export function watch(source,cb){
  let get;
  // 传入的数据只有两种进行处理： 1，整个代理对象 2，具体的代理数据
  // 判断是否为代理对象（响应式数据）
  if(isReactive(source)){
    // 将对象中每个数据转换成一个单独访问的函数
    // 递归整个对象，将每个数据返回出来
    get = () => traversal(source)
  } else if(isFunction(source)){
    get = source
  }
  let oldValue
  let cleanup
  const onCleanup = (fn) => {
    cleanup = fn
  }
  const job = () => {
    cleanup && cleanup()
    const newValue = effect.run()
    cb(newValue,oldValue,onCleanup)
    oldValue = newValue
  }
  let scheluder = job
  const effect = new ReactiveEffect(get,scheluder)
  oldValue = effect.run()
}

function traversal(value, set = new Set()){
  if(!isObject(value)){
    return value
  }
  if(set.has(value)){
    return value
  }
  set.add(value)
  for (const key in value) {
    traversal(value[key],set)
  }

  return value
}