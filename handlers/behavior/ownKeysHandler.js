import track from "../../effect/track.js";
import { TrackOPType } from "../../utils.js";

export default function(target) {
    track(target, TrackOPType.ITERATE);
    return Reflect.ownKeys(target);
}