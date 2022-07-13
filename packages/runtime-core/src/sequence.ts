
/*
  [ a, b, c, d, e, f, g ]
  [ a, b, q, c, d, f, g ]
  
  uknown sequence
  [ c, d, e ]
  [ q, c, d ]

  在此序列中，c，d是不需要重新操作的节点
  
  但序列中，应该是取一段最长的且不断递增的节点序列个数

  
  ✨贪心算法
  从一个序列中找到最长递增子序列的个数 -> 再通过追溯，确定seq中哪些节点无需变动

  例: 2 3 1 5 6 8 7 9 4
  最长递增子节点序列(Destination queue -> dq)

  取出原序列的某一项，和dq的最后一项最比较
    1. 如果比最后一项大，直接最追加到尾部
    2. 如果比最后一项小，则找到序列中比他当前大的替换掉
      替换后对比前后的

    2 3
    1 3
    1 3 5
    1 3 5 6
    1 3 5 6 8
    1 3 5 6 7
    1 3 5 6 7 9
    1 3 4 6 7 9
*/

// 功能实现核心逻辑
function getSequence(arr){
  // 🚩 result 记录的是下标，0是arr中的第一位，默认arr中第一位是最小值
  let result = [0]
  // lastIndex 是result中的最后一项，在遍历过程中result一直在递增，每次都需要更新
  let lastIndex
  let len = arr.length
  let p = new Array(len).fill(0)
  let start
  let end
  let middle = 0
  for(let i = 0 ; i < len ; i++){
    // arrI 记录的是arr中的目标值
    let arrI = arr[i]
    // 若该值为0，则为新增节点，无需进行记录
    if(arrI !== 0){
      lastIndex = result[result.length - 1]
      // 若当前值比最大值还大，直接推入（✨ 走1的逻辑），并且跳出这次循环，不进行后续逻辑
      if(arr[lastIndex] < arrI){
        // lastIndex是result最末位
        p[i] = lastIndex
        result.push(i)  
        continue
      }
      // ✨进行二分计算

      // 获取头尾下标
      start = 0 
      end = result.length - 1
      while(start < end){
        // 二分，获取中间值，向下取整 （按位或一个0能向下取整）
        middle = ((start + end) / 2) | 0
        // result 取的是下标，arr取出目标值，判断具体目标值
        if(arr[result[middle]] < arrI){
          // [1, 2, 3, 4, 5, 7, 8]  6 
          // 若目标值比当前值小，则初始点往后推
          start = middle + 1
        } else {
          // 若目标值比当前值大，则末位点往前推
          end = middle
        }
      }
      // 在while中，start最后会等同于end，循环的终点是找到符合目标的数据
      if(arrI < arr[result[start]]) {
        // 替换后，要记录前一位的索引
        p[i] = result[start - 1]
        result[start] = i
      }
    }
  } 
  
  // 倒叙追溯 从小到大进行排序
  let i = result.length;
  // 先取到最后一位，然后往前追溯
  let last = result[i - 1]
  while(i-- > 0) {
    result[i] = last
    last = p[last]
  }
  return result
}

const a = getSequence([2, 3, 1, 5, 6, 8, 7, 9, 4])

/*
    arr(seq)  -> [2, 3, 1, 5, 6, 8, 7, 9, 4]
    
    通过贪心获取最长递增子序列个数 
    -> result(下标) [2, 1, 8 , 4, 6, 7] 
    -> 对应seq中的内容是  1 3 4 6 7 9
    
    ❗️ 贪心算法的主要目的是获取最长递增子序列的个数

    我们无法直接拿到贪心给出的索引顺序去确定哪些节点不用操作，而是要按照seq原本的位置去确定

    按索引追溯

    🚩 解析

    arr -> seq

    arrI 是arr序列的每个值，0是新增节点，无需考虑到排序中

    result记录的是下标✨，记录最长递增序列的下标，默认首位是arr的第一位

    lastIndex 是result的最末位，

    1.排除arrI 为 0 的情景， 只考虑新增节点的最长子序列排序
    
    2.对比当前值和末位的大小，是否进行直接推入的操作（arr[lastIndex] > arrI）
    
    3.若非直接推入操作，则进行二分查询，推断当前节点的插入位置
      通过头尾和中间值三个指针，对比每次中间值和当前值的大小，不断缩小范围(arr[result[middle] > arrI])
      找到目标位置后进行替换

    [2, 3, 1, 5, 6, 8, 7, 9, 4] 

    以此为例子 ->

    result -> [2, 1, 8, 4, 6, 7]
    
    4.进行倒叙追溯
    p -> 记录每一位的前位索引值(对应的是result)
    p -> [0, 0, undefined, 1, 3, 4, 4, 6, 1]

    追溯后
    result -> [ 0, 1, 3, 4, 6, 7 ]

    总结：
     1.贪心算法获取的是最长递增子序列的个数
     2.追溯是在确定最长递增子序列个数的前提下，确定seq的最长递增子序列，这个序列中的记录的索引，不需要被操作

     在diff中会根据result列表，确定需要操作位置的节点
     

  */  