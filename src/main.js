(function(global) {
  var Mason = global.Mason = global.Mason || {};

  Mason.Execute = function(code, env) {
    env = env || new Mason.Environment();
    var ast = Mason.AST(code);
    return Mason.Evaluate(ast, env);
  };
})(window);
