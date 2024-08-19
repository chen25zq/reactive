import track from "../../effect/track.js";
import { TrackOPType } from "../../utils.js";

export default function(target, key) {
    // 判断对象是否有key属性，需要进行依赖收集
    track(target, TrackOPType.HAS, key);

    return Reflect.has(target, key);
}