/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/first-match";
exports.ids = ["vendor-chunks/first-match"];
exports.modules = {

/***/ "(ssr)/./node_modules/first-match/index.js":
/*!*******************************************!*\
  !*** ./node_modules/first-match/index.js ***!
  \*******************************************/
/***/ ((module) => {

eval("function truthy(d) {\n  return d\n};\n\nfunction first(array, callback, context) {\n  var callback = callback || truthy\n    , context = context || array\n    , value\n\n  for (var i = 0, l = array.length; i < l; i += 1) {\n    if (value = callback.call(context, array[i], i)) return array[i]\n  }\n};\n\nmodule.exports = first//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvZmlyc3QtbWF0Y2gvaW5kZXguanMiLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG9DQUFvQyxPQUFPO0FBQzNDO0FBQ0E7QUFDQTs7QUFFQSIsInNvdXJjZXMiOlsid2VicGFjazovL2xpdmlvLWRhc2hib2FyZC8uL25vZGVfbW9kdWxlcy9maXJzdC1tYXRjaC9pbmRleC5qcz9kNzliIl0sInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIHRydXRoeShkKSB7XG4gIHJldHVybiBkXG59O1xuXG5mdW5jdGlvbiBmaXJzdChhcnJheSwgY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgdmFyIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgdHJ1dGh5XG4gICAgLCBjb250ZXh0ID0gY29udGV4dCB8fCBhcnJheVxuICAgICwgdmFsdWVcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IGFycmF5Lmxlbmd0aDsgaSA8IGw7IGkgKz0gMSkge1xuICAgIGlmICh2YWx1ZSA9IGNhbGxiYWNrLmNhbGwoY29udGV4dCwgYXJyYXlbaV0sIGkpKSByZXR1cm4gYXJyYXlbaV1cbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmaXJzdCJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/first-match/index.js\n");

/***/ })

};
;