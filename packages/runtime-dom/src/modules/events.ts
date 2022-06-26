function createInvoker(preValue) {
  const invoker = (e) => {
    invoker.value(e)
  }
  invoker.value = preValue
  return invoker
}

//  设置事件绑定属性
export function patchEvent(el, eventName, nextValue) {
  // 事件绑定列表
  /*
    函数的封箱操作，更改事件触发时调用的函数，改变的是封箱对象的value值
    invoker -> () => { (invoker.value = fn) }

    el._vei = {
      'onClick' = invoker,
      'Mounsedown' = invoker
    }
  */
  const invokers = el._vei || (el._vei = {})

  // 缓存列表中取出目标件事的记录数据，是否已缓存
  const existingInvoker = invokers[eventName]

  /*
    1.若目标事件有缓存，且当前节点为目标事件有进行新函数的赋值，则进行替换操作
      这样替换的是invoker中的value值
    2.反之，则是没缓存或者没新函数的赋值
      2_1 判断是否有新函数，在有新函数的情况下，直接进行invoker的初始化
      2_2 判断是否有existingInvoker的缓存，若有，则移除事件函数的绑定，且缓存清空
  */
  if (existingInvoker && nextValue) {
    existingInvoker.value = nextValue
  } else {
    // 截取事件名 onclick -> click
    // el.addEventListener('click', fn)
    const eName = eventName.slice(2)
    if (nextValue) {
      // 初始化赋值
      const invoker = createInvoker(nextValue)
      // el为目标时间绑定对应的函数
      el.addEventListener(eName, invoker)
      // 缓存当前值
      invokers[eventName] = invoker
    } else if(existingInvoker) {
      el.removeListener(eName, existingInvoker)
      invokers[eventName] = null
    }
  }
}  