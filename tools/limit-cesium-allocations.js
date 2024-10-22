/*
   This rule checks that specific Cesium classes are not created
   inside functions. A scratch module-level variable should be used instead
   (where applicable).

   To disable this rule, use:
   // eslint-disable-next-line limit-cesium-allocations
 */

function isCesiumIdentifier(obj) {
  return obj.type === "Identifier"
    && obj.name === "Cesium";
}

var targetIdentifiers = ["Cartesian3", "Cartesian2", "Matrix3", "Quaternion"];

function checkIdentifier(obj) {
  if (obj.type === "Identifier"
    && targetIdentifiers.indexOf(obj.name) >= 0) {
    return obj.name;
  }
}

// VariableDeclarator, VariableDeclaration, Program (isTopLevel)

function checkNewMemberExpression(node) {
  if (node.callee.type === "MemberExpression"
    && isCesiumIdentifier(node.callee.object)) {
    return checkIdentifier(node.callee.property);
  }
}

function checkNewIdentifierExpression(node) {
  if (node.callee.type === "Identifier") {
    return checkIdentifier(node.callee);
  }
}

function isPartOfTopLevelVariableDeclaration(node) {
  return isTopLevelVariableDeclaration(node) || (node.parent && isTopLevelVariableDeclaration(node.parent));
}

function isTopLevelVariableDeclaration(node) {
  return node.type === "VariableDeclarator"
    && node.parent.type === "VariableDeclaration"
    && node.parent.parent.type === "Program";
}

module.exports = function (context) {
  return {
    NewExpression: function (node) {
      var targetIdentifier = checkNewMemberExpression(node) || checkNewIdentifierExpression(node);
      if (targetIdentifier) {
        if (!isPartOfTopLevelVariableDeclaration(node.parent)) {
          context.report(node, "Don't create a new instance of " + targetIdentifier + " inside function.")
        }
      }
    }
  }
};
