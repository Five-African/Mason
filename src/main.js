(function(global) {
  var Mason = global.Mason = global.Mason || {};

  Mason.Execute = function(code) {
    var env = new Mason.Environment();
    env.def("AUTHOR", "Gizeta");
    env.def("TEAM", "Five African");
    env.def("PRINT", function(msg) {
      console.log(msg);
      return msg;
    });
    var ast = Mason.AST(code);
    return Mason.Evaluate(ast, env);
  };
})(window);
