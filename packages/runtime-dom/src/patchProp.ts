import { patchClass } from "./patch-prop/patchClass"
import { patchStyle } from "./patch-prop/patchStyle"

export const patchProp = (el,key,preValue,nextValue) => {
  if(key === 'class'){
    patchClass(el,nextValue)
  }
  if(key === 'style'){
    patchStyle(el,preValue,nextValue)
  }
}