import track from "../../effect/track.js";
import { TrackOPType, isObject } from "../../utils.js";
import { reactive } from "../../reactive.js";

export default function(target, key) {
    console.log(`拦截到了${key}的读取行为, 将值返回`);
    // 针对读取行为，要做依赖收集
    track(target, TrackOPType.GET, key);

    const result = Reflect.get(target, key);    
    // 获取到的成员可能是对象，需要递归处理，转换成响应式对象
    if (isObject(result)) {
        return reactive(result);
    }
    return result;
}
