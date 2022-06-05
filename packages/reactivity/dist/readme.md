🪐🪐🪐V3响应式拆解🪐🪐🪐

✨reactive模块
  实现数据代理，后续操作的是代理对象，通过代理的对象的get和set特性进行进一步操作
  🚩 问题：元数据重复代理，代理对象重复代理，深层代理
  🌍 解决思路：
    ⚽️ 创建reactiveMap表，已经代理的数据存放到表中，在代理前判断表中是否已经存放该数据，若存放，则表示该数据已经进行代理，无需重复代理，从表中取出代理对象进行返回
    ⚽️ 已代理数据在proxy.get中设置阀门(ReactiveFlags.IS_REACTIVE)，若目标数据已被代理，则访问该阀值时，会返回true（未代理的元数据身上没有该属性，只会返回undefined），通过阀值判断，确定是否继续进行对象代理
    ⚽️ effect取值时，proxy会经过get逻辑，取值时判断是否为对象，若为对象，则进一步进行数据代理（在代理过程中就有判断是否已经代理的逻辑）
    
✨effect模块
  逻辑调用函数，进行视图更新
    ✨ => ReactiveEffect（面对对象操作）
      🌍 每个effect都是这个类下的实例，这样每个effect都有属于自己的属性池，进行扩展操作
      -----
      子类方法（创建实例对象传进来的参数）
      🚩fn,effect对应的视图更新函数
      🚩（options）scheduler，调度函数
        当effect中传入scheduler时，不走默认的视图更新逻辑，而是执行传进来的scheduler函数，用户可以在该函数中手动执行effect实例上的方法，扩展逻辑链
      -----
      🚩deps，用于收集effect中对应引用了哪些数据
        ⚽️ 在cleanEffect中，通过deps去将所有依赖关系清除
          ·deps存放的是代理对象上，属性对应的Set[]
          example：
            reactiveMap:{
              proxy:{ 
                flag:[effect1,effect2,...]
                name:[effect14,effect24,...]
              }
            }
          effect.deps = [proxy[flag],proxy[name]]
          🌟 在任何存在依赖关系的表中，去除当前effect，
            清除完毕后，将当前effect的deps清空，完成双向依赖的清除
      🚩parent，在effect深层调用时，记录上一层effect实例
      🚩run()中执行子类对象上回调函数，同时可以扩展执行逻辑链
        🌍 try finally 处理effect嵌套时，actvieEffect指向丢失问题
          example:
          effect(()=>{
            proxy.name = 1;
            effect(()=>{
              proxy.name = 2
            })
            proxy.age = 18
          })
        effect1被调用
          activeEffect指向effect1,此时更新依赖数据表中proxy.name的内容
          [->effect1]
        effect2被调用
          activeEffect指向effect2,此时更新依赖数据表中proxy.name的内容 [effect1->effect2]  
        🌟 actvieEffect需重新指向effect1，否则proxy.age无法记录 effect1

        配合try...finally ，try中的代码没执行完，即回调没执行完，不会执行finally中的代码
        ····进try时，会将activeEffect指向当前effect
        ····完成该回调的逻辑后，会在finally中将activeEffect指回上一层的effect
      🚩active，用于控制依赖收集的阀门，若active为false，则停止依赖收集，进不到run的逻辑
      🚩stop()中调用cleanEffect清除依赖关系，将active改为false，停止依赖收集
      
    ✨ => effect
      🚩生成ReactiveEffect子类，通过 .run()执行回调函数
      🚩effect函数会返回一个值runner
        ⚽️ v3中通过 _effect.run.bind() 将ReactiveEffect中的原型方法run取出(同时通过bind指向当前的effect实例对象)
        ⚽️ 再将effect实例赋值给runner.effect
      effect返回的runner有两个作用：
        1.直接runner()手动渲染视图 
        2.能获取到当前effect实例，调用effect上的其他原型方法，如runner.effect.stop 停止依赖收集
    ✨ => actvieEffect
      🚩标记当前执行的effect（effect被调用，activeEffect指向被调用的effect）
        ---具体引用:
        ⚽️ track为被引用数据做依赖收集时，能判断当前effect是否已被收集
        ⚽️ trigger提醒更新数据的effects队列执行时，判断被执行的effect是不是当前被调用的effect，防止死循环
          场景举例：effect(example)被执行 example中更改了a数据
                    触发set -> trigger(执行effects) -> 又执行同一个effect -> ...
                  在trigger中循环effects队列，执行effect时，判断是不是同一个effect，若是，则不执行，避免死循环
    ✨ => reactiveMap 元数据依赖关系表（哪个effect依赖哪些数据）
      🚩reactiveMap = {obj:{name:[effect1,effect2,...]}}
    ✨ => track 依赖收集函数
      effect在调用时，引用了哪些数据（detailData）
        track就会在reactiveMap中的detailData(当前数据)对应的Set[]寻找当前effect，若没有，则将effect添加进去
        同时将detailData(当前数据)的Set[]存放到effect实例上deps中，用于cleanEffect的清除
    ✨ => trigger effect执行通知函数
        在reactiveMap中找到detailData(当前数据)，循环遍历effects，执行使用detailData的所有effect
        🚩 effects = new Set(effects)
        遍历effect所存放的表格(effects)之前，需要将当前Set表映射出一个新的Set表，再进行遍历清除操作,否则在ReactiveEffect.prototype.run中，先清除依赖关系，又重新收集依赖，会导致死循环，
        要的效果是：清除旧依赖数据，收集新依赖数据
    ✨ => cleanEffect 依赖清除函数
        🚩 effect中可能会出现该场景:
          proxy.flag(boolean) ? proxy.name : proxy.age
        异步中boolean的状态被改变，则effect中使用的数据也在name和age之间进行切换
        即每次effect被调用前，都应该清除该effect的所有依赖，再执行回调，会重新建立最新的依赖关系
        example：
        state 1🌛 effect(()=>{ proxy.flag(true) ? proxy.name : proxy.age })
        reactiveMap:{
          proxy:{
            flag:[effect]
            name:[effect]
          }
        }
        此时异步中，proxy.flag = false -> proxy.set -> trigger
        通知flag的所有effect执行，更新视图
        ⬇️
        state 2🌛 effect(()=>{ proxy.flag(false) ? proxy.name : proxy.age })
        在_effect.run执行中，若不清除之前的依赖关系，则出现这种情况
        reactiveMap:{
          proxy:{
            flag:[effect]
            name:[effect]
            age:[effect]
          }
        }
        effect中flag: false的情况下，没读取proxy.name,但name仍保存依赖关系
        当proxy.name更新，触发proxy.set，调用trigger会再进行多余的effect执行操作
        🌍 解决思路：
        遍历effect.deps进行依赖清除逻辑，先在所有拥有当前effect的数据中，删除effect，再清空当前effect本身的deps，解决双向依赖关系
