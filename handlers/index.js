import getHandler from "./behavior/getHandler.js";
import setHandler from "./behavior/setHandler.js";
import deleteHandler from "./behavior/deleteHandler.js";
import hasHandler from "./behavior/hasHandler.js";
import ownKeysHandler from "./behavior/ownKeysHandler.js";

export default {
    get: getHandler,
    set: setHandler,
    deleteProperty: deleteHandler, // 删除属性 delete rst.a;
    has: hasHandler, // 判断对象是否拥有某个属性 "a" in rst;
    ownKeys: ownKeysHandler // 遍历 for (let key in rst) {}
}