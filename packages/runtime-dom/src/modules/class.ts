// 设置类名属性

export function patchClass(el,nextValue){
  // 若节点设置的class的新值为空，则直接移除节点的class属性，反之，则进行赋值
  if(nextValue == null){
    el.removeAttribute('class')
  } else {
    el.className = nextValue
  }
}