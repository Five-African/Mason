(function(global) {
  function Environment(parent) {
    this.vars = Object.create(parent ? parent.vars : null);
    this.parent = parent;
  }
  Environment.prototype = {
    extend: function() {
      return new Environment(this);
    },
    lookup: function(name) {
      var scope = this;
      while (scope) {
        if (Object.prototype.hasOwnProperty.call(scope.vars, name))
          return scope;
        scope = scope.parent;
      }
    },
    get: function(name) {
      if (name in this.vars)
        return this.vars[name];
      throw new Error("Undefined variable " + name);
    },
    set: function(name, value) {
      var scope = this.lookup(name);
      if (!scope && this.parent)
        throw new Error("Undefined variable " + name);
      if (/[a-z]/.test(name))
        return (scope || this).vars[name] = value;
      else
        throw new Error("Cannot assign constant " + name);
    },
    def: function(name, value) {
      return this.vars[name] = value;
    }
  };

  global.Mason = global.Mason || {};
  global.Mason.Environment = Environment;
})(window);
