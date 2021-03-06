/*
  给属性打补丁
  例如 
  {style:{color:'red'}} -> {style:{color:'red',fontSize:12}}
  这个过程不会进行全量删除再赋值的操作（❌ delete all attrs -> add all newAttrs）
  而是对比属性不同，对有差异的数据进行增删改操作 （ contrast -> add fontSize ）
*/

/*
  对比更新思路解析: 
  nodeVal: [a: 1, b: 2]
  newVal: [a: 2,c: 2]
  preVal: deepClone NodeVal

  newVal >> nodeVal: [a: 2 ,b: 2 ,c: 2]
  preVal contrast newVal >> newVal haven't b  >> remove b >> [a: 2,c: 2]

  而全量更新思路：
  nodeVal delete all data >> []
  newVal >> nodeVal: [a: 2, c: 2]
*/  


// 设置样式属性
export function patchStyle(el, preValue, nextValue){
  if(preValue == null) preValue = {}
  if(nextValue == null) nextValue = {}
  // 拿到节点的style属性
  const style = el.style
  // 遍历节点的style新值，直接更新到节点中去
  for(let key in nextValue){
    style[key] = nextValue[key]
  }
  // 判断节点的style是否有旧值，如果有，则进行遍历，判断旧值的样式是否在新值中存在，如果不存在，则设置为null
  if(preValue){
    for(let key in preValue){
      if(nextValue[key] == null){
        style[key] = null
      }
    }
  }
}