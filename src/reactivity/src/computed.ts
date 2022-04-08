import { createDep } from "./dep";
import { ReactiveEffect } from "./effect";
import { trackRefValue, triggerRefValue } from "./ref";


/**
 * conputed同时依赖别人，别人也依赖他
 */
export class ComputedRefImpl {
  public dep: any; /**用来收集别人依赖他的 */
  public effect: ReactiveEffect;

  private _dirty: boolean;
  private _value

  constructor(getter) {
    this._dirty = true;
    this.dep = createDep();
    /**
     * 这里同时触发ref或者reactive的依赖收集，同时也实现自己触发更新的函数，当ref数据更新时，会触发triggerRefValue
     */
    this.effect = new ReactiveEffect(getter, () => {
      // scheduler
      // 只要触发了这个函数说明响应式对象的值发生改变了
      // 那么就解锁，后续在调用 get 的时候就会重新执行，所以会得到最新的值
      if (this._dirty) return;

      this._dirty = true;
      triggerRefValue(this);
    });
  }

  /**
   * 当好几个地方使用computed时，实际上只实例化一次，这就是computed的缓存，不会触发多次ref数据的依赖收集，但是computed本身的被依赖肯定会多次收集，否则无法正常更新。
   */
  get value() {
    // 收集依赖
    trackRefValue(this);
    // 锁上，只可以调用一次
    // 当数据改变的时候才会解锁
    // 这里就是缓存实现的核心
    // 解锁是在 scheduler 里面做的
    if (this._dirty) {
      this._dirty = false;
      // 这里执行 run 的话，就是执行用户传入的 fn
      this._value = this.effect.run();
    }

    return this._value;
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter);
}
