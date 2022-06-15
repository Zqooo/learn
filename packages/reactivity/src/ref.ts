import { isObject } from "@vue/shared"
import { trackEffects, triggerEffects } from "./effect"
import { reactive } from "./reactive"

// 对传进来的数据进行装箱，通过.value的方式进行访问和修改
export function ref(value){
  return new RefImpl(value)
}

export function toRef(object, key){
  return new ObjectRefImpl(object, key)
}

export function proxyRefs(object){
  const proxy = new Proxy(object,{
    get(target,key,receiver){
      let r = Reflect.get(target,key,receiver)
      return  r.__v_isRef ? r.value : r
    },
    set(target, key, value, receiver){
      if(target[key].__v_isRef){
        target[key].value = value
        return true
      }
      return Reflect.set(target,key,value,receiver)
    }
  })

  return proxy
}

class ObjectRefImpl{
  public __v_isRef = true
  constructor(public object, public key){}
  get value(){
    return this.object[this.key]
  }
  set value(newValue){
    this.object[this.key] = newValue
  }
}

export function toRefs(object){
  const result = {}
  for(let key in object){
    result[key] = toRef(object, key)
  }
  return result
}

// 若目标数据是对象，则用reactive进行代理，成为响应式数据，访问对象内的数据逻辑与reactive一致
// 而ref与computed一样，本身value被访问和修改时，会进行依赖收集和逻辑更新
function toReactive(value){
  return isObject(value) ? reactive(value) : value
}

class RefImpl{
  private _value
  private deps
  public __v_isRef = true
  constructor(public rawValue){
    this._value = toReactive(rawValue)
  }
  get value(){
    trackEffects(this.deps || (this.deps = new Set))
    return this._value
  }
  set value(newValue){
    if(newValue != this.rawValue){
      this._value = toReactive(newValue)
      this.rawValue = newValue
      triggerEffects(this.deps)
    }
  }
}