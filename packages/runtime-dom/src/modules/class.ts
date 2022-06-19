/*
  给属性打补丁
  例如 
  {style:{color:'red'}} -> {style:{color:'red',fontSize:12}}
  这个过程不会进行全量删除再赋值的操作（❌ delete all attrs -> add all newAttrs）
  而是对比属性不同，对有差异的数据进行增删改操作 （ contrast -> add fontSize ）
*/

export function patchClass(el,nextValue){
  // 若节点设置的class的新值为空，则直接移除节点的class属性，反之，则进行赋值
  if(nextValue == null){
    el.removeAttribute('calss')
  } else {
    el.className = nextValue
  }
}