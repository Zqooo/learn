import { patchAttr } from "./modules/attr"
import { patchClass } from "./modules/class"
import { patchEvent } from "./modules/events"
import { patchStyle } from "./modules/style"

// 设置属性时不同情况的不同操作，分别是： 类名 样式 事件 其他
export const patchProp = (el,key,preValue,nextValue) => {
  if(key === 'class'){
    patchClass(el,nextValue)
  } else if (key === 'style'){
    patchStyle(el,preValue,nextValue)
  } else if (/on[A-Z]/.test(key)){
    patchEvent(el,key,nextValue)
  } else {
    patchAttr(el, key, nextValue)
  }
}