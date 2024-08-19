import trigger from "../../effect/trigger.js";
import { TriggerOPType } from "../../utils.js";

export default function(target, key) {

    // 先判断是否有对应的属性才能删除
    const hasKey = target.hasOwnProperty(key);
    // 进行删除行为
    const rst = Reflect.deleteProperty(target, key);
    // 先判断是否有对应的属性才能触发更新
    if (hasKey && rst) {
        trigger(target, TriggerOPType.DELETE, key);
    }
    return rst;
}