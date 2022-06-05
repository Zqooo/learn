import { isObject } from '@vue/shared'
import { baseHanlder, ReactiveFlags } from './baseHanlder'

/* 
  reactive 代理函数
  1.创建通过proxy实现数据代理，当访问代理对象时，能通过出发get或者set进行进一步操作
  2.页面初始化，每个effect会调用已被代理的数据，通过get收集对应依赖关系

*/
const reactiveMap = new WeakMap() //key(元数据) => value(代理对象)
export function reactive(target) {
  if (!isObject(target)) {
    return target
  }

  /* 
    防止重复代理
    1.创建已进行代理的元数据收集表，再进行代理前判断下是否有该元数据
    2.若被代理的数据本身也是代理对象，则直接退出
      通过代理对象本身特性，访问作为标记的目标属性，若有正确返回值，则证明该数据为代理对象
  */

  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target
  }
  const existing = reactiveMap.has(target)
  if (existing) {
    return reactiveMap.get(target)
  }
  /* 
    proxy(target,handler)
    => target 代理目标  handler 代理配置
    => handler = {} 
    => handlerOptions => get/set/delete/has
      => handlier = {
        get(target,key,receiver){
          return target[key]
        },
        set(target,key,value,receiver){
          target[key] = value
        }
      }
    const obj = {
      a: 1,
      b: '2',
      innerObj : {
        c: '1'
      }
    }
    const state = new Proxy(obj, handler)
  */

  const proxy = new Proxy(target, baseHanlder)

  // 代理后，将代理内容存放到已代理元数据收集表
  reactiveMap.set(target, proxy)
  return proxy
}