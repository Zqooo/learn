
/*
  [ a, b, c, d, e, f, g ]
  [ a, b, q, c, d, f, g ]
  
  uknown sequence
  [ c, d, e ]
  [ q, c, d ]

  在此序列中，c，d是不需要重新操作的节点
  
  但序列中，应该是取一段最长的且不断递增的节点序列个数

  
  ✨贪心算法
  从一个序列中找到最长递增子序列的个数

  例: 2 3 7 6 8 4 9 5
  最长递增子节点序列(Destination queue -> dq)
  
  取出原序列的某一项，和dq的最后一项最比较
    1. 如果比最后一项大，直接最追加到尾部
    2. 如果比最后一项小，则找到序列中比他当前大的替换掉
      替换后对比前后的

    2 3
    2 3 7
    2 3 6
    2 3 6 8
    2 3 4 8 9 
    2 3 4 5 9



  [ 0, 3, 4 ]
    
*/

// 功能实现核心逻辑
function getSequence(arr){
  // 🚩 result 记录的是下标，0是arr中的第一位，默认arr中第一位是最小值
  let result = [0]
  // lastIndex 是result中的最后一项，在遍历过程中result一直在递增，每次都需要更新
  let lastIndex
  let len = arr.length
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
        result[start] = i
      }
    }

    return result
  } 
  
}
