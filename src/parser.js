(function(global) {
  function InputStream(input) {
    var pos = 0, line = 1, col = 0;
    return {
      next  : next,
      peek  : peek,
      eof   : eof,
      croak : croak
    };
    function next() {
      var ch = input.charAt(pos++);
      if (ch == "\n") {
        line++;
        col = 0;
      } else {
        col++;
      }
      return ch;
    }
    function peek() {
      return input.charAt(pos);
    }
    function eof() {
      return peek() == "";
    }
    function croak(msg) {
      throw new Error(msg + " (" + line + ":" + col + ")");
    }
  }

  function TokenStream(input) {
    var current = null;
    var keywords = " IF ELSE THEN FUNC TRUE FALSE DO END ";
    return {
      next  : next,
      peek  : peek,
      eof   : eof,
      croak : input.croak
    };
    function is_keyword(x) {
      return keywords.indexOf(" " + x + " ") >= 0;
    }
    function is_digit(ch) {
      return /[0-9]/i.test(ch);
    }
    function is_id_start(ch) {
      return /[a-z_\$]/i.test(ch);
    }
    function is_id(ch) {
      return is_id_start(ch) || "_$0123456789".indexOf(ch) >= 0;
    }
    function is_op_char(ch) {
      return "+-*/%=&|<>!".indexOf(ch) >= 0;
    }
    function is_punc(ch) {
      return ",(){}[]".indexOf(ch) >= 0;
    }
    function is_separator(ch) {
      return "\n".indexOf(ch) >= 0;
    }
    function is_whitespace(ch) {
      return " \t".indexOf(ch) >= 0;
    }
    function read_while(predicate) {
      var str = "";
      while(!input.eof() && predicate(input.peek()))
        str += input.next();
      return str;
    }
    function read_number() {
      var has_dot = false;
      var number = read_while(function(ch) {
        if (ch == ".") {
          if (has_dot) return false;
          has_dot = true;
          return true;
        }
        return is_digit(ch);
      });
      return { type: "num", value: parseFloat(number) };
    }
    function read_ident() {
      var id = read_while(is_id);
      return {
        type:  is_keyword(id) ? "kw" : "var",
        value: id
      };
    }
    function read_escaped(end) {
      var escaped = false, str = "";
      input.next();
      while (!input.eof()) {
        var ch = input.next();
        if (escaped) {
          str += ch;
          escaped = false;
        } else if (ch == "\\") {
          escaped = true;
        } else if (ch == end) {
          break;
        } else {
          str += ch;
        }
      }
      return str;
    }
    function read_string() {
      return { type: "str", value: read_escaped('"') };
    }
    function skip_separator() {
      read_while(function(ch) {
        return is_whitespace(ch) || is_separator(ch);
      });
    }
    function skip_comment() {
      read_while(function(ch) { return ch != "\n" });
      input.next();
    }
    function read_next() {
      read_while(is_whitespace);
      if (input.eof()) return null;
      var ch = input.peek();
      if (ch == "#") {
        skip_comment();
        return read_next();
      }
      if (ch == '"') return read_string();
      if (is_digit(ch)) return read_number();
      if (is_id_start(ch)) return read_ident();
      if (is_punc(ch)) return {
        type  : "punc",
        value : input.next()
      };
      if (is_op_char(ch)) return {
        type  : "op",
        value : read_while(is_op_char)
      };
      if (is_separator(ch)) {
        skip_separator();
        return {
          type  : "separator"
        };
      }
      input.croak("Can't handle character: " + ch);
    }
    function peek() {
      return current || (current = read_next());
    }
    function next() {
      var tok = current;
      current = null;
      return tok || read_next();
    }
    function eof() {
      return peek() == null;
    }
  }

  var FALSE = { type: "bool", value: false };
  function parse(input) {
    var PRECEDENCE = {
      "=": 1,
      "||": 2,
      "&&": 3,
      "<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
      "+": 10, "-": 10,
      "*": 20, "/": 20, "%": 20,
    };
    return parse_toplevel();
    function is_punc(ch) {
      var tok = input.peek();
      return tok && tok.type == "punc" && (!ch || tok.value == ch) && tok;
    }
    function is_kw(kw) {
      var tok = input.peek();
      return tok && tok.type == "kw" && (!kw || tok.value == kw) && tok;
    }
    function is_op(op) {
      var tok = input.peek();
      return tok && tok.type == "op" && (!op || tok.value == op) && tok;
    }
    function is_separator() {
      var tok = input.peek();
      return tok && tok.type == "separator";
    }
    function skip_punc(ch) {
      if (is_punc(ch)) input.next();
      else input.croak("Expecting punctuation: \"" + ch + "\"");
    }
    function skip_kw(kw) {
      if (is_kw(kw)) input.next();
      else input.croak("Expecting keyword: \"" + kw + "\"");
    }
    function skip_op(op) {
      if (is_op(op)) input.next();
      else input.croak("Expecting operator: \"" + op + "\"");
    }
    function skip_separator() {
      if (is_separator()) input.next();
      else input.croak("Expecting line break");
    }
    function unexpected() {
      input.croak("Unexpected token: " + JSON.stringify(input.peek()));
    }
    function maybe_binary(left, my_prec) {
      var tok = is_op();
      if (tok) {
        var his_prec = PRECEDENCE[tok.value];
          if (his_prec > my_prec) {
            input.next();
            return maybe_binary({
              type     : tok.value == "=" ? "assign" : "binary",
              operator : tok.value,
              left     : left,
              right    : maybe_binary(parse_atom(), his_prec)
            }, my_prec);
          }
      }
      return left;
    }
    function parse_param(parser, ignore_kw) {
      var a = [], first = true;
      while (!input.eof()) {
        if (is_kw("DO") || is_separator()) break;
        if (first) first = false; else skip_punc(",");
        if (is_kw("DO") || is_separator()) break;
        a.push(parser());
      }
      if (!ignore_kw && is_kw("DO")) {
        a.push(parse_prog());
      }
      return a;
    }
    function delimited(start, stop, separator, parser) {
      var a = [], first = true;
      skip_kw(start);
      if (is_separator()) skip_separator();
      while (!input.eof()) {
        if (is_kw(stop)) break;
        if (first) first = false;
        else {
          if (separator == "\n") skip_separator();
          else skip_punc(separator);
        }
        if (is_kw(stop)) break;
        a.push(parser());
      }
      if (is_separator()) skip_separator();
      skip_kw(stop);
      return a;
    }
    function delimited_if(separator, parser) {
      var a = [], first = true;
      while (!input.eof()) {
        if (is_kw('ELSE') || is_kw('END')) break;
        if (first) first = false;
        else {
          if (separator == "\n") skip_separator();
          else skip_punc(separator);
        }
        if (is_kw('ELSE') || is_kw('END')) break;
        a.push(parser());
      }
      return a;
    }
    function parse_call(func) {
      return {
        type: "call",
        func: func,
        args: parse_param(parse_expression),
      };
    }
    function parse_varname() {
      var name = input.next();
      if (name.type != "var") input.croak("Expecting variable name");
      return name.value;
    }
    function parse_if() {
      skip_kw("IF");
      var cond = parse_expression();
      skip_kw("THEN");
      if (is_separator()) skip_separator();
      var then = parse_if_prog();
      var ret = {
        type: "if",
        cond: cond,
        then: then,
      };
      if (is_kw("ELSE")) {
        input.next();
        if (is_separator()) skip_separator();
        ret.else = parse_if_prog();
      }
      skip_kw("END");
      return ret;
    }
    function parse_func() {
      return {
        type: "func",
        vars: parse_param(parse_varname, true),
        body: parse_prog()
      };
    }
    function parse_bool() {
      return {
        type  : "bool",
        value : input.next().value == "TRUE"
      };
    }
    function maybe_call(expr) {
      expr = expr();
      return (expr.type == "var" && !is_op() && !is_separator() && (!is_kw() || is_kw("DO")) && !input.eof()) ? parse_call(expr) : expr;
    }
    function parse_atom() {
      return maybe_call(function(){
        if (is_punc("(")) {
          input.next();
          var exp = parse_expression();
          skip_punc(")");
          return exp;
        }
        if (is_kw("DO")) return parse_prog();
        if (is_kw("IF")) return parse_if();
        if (is_kw("TRUE") || is_kw("FALSE")) return parse_bool();
        if (is_kw("FUNC")) {
          input.next();
          return parse_func();
        }
        var tok = input.next();
        if (tok.type == "var" || tok.type == "num" || tok.type == "str")
          return tok;
        unexpected();
      });
    }
    function parse_toplevel() {
      var prog = [];
      while (!input.eof()) {
        prog.push(parse_expression());
        if (!input.eof()) skip_separator();
      }
      return { type: "prog", prog: prog };
    }
    function parse_prog() {
      var prog = delimited("DO", "END", "\n", parse_expression);
      if (prog.length == 0) return FALSE;
      if (prog.length == 1) return prog[0];
      return { type: "prog", prog: prog };
    }
    function parse_if_prog() {
      var prog = delimited_if("\n", parse_expression);
      if (prog.length == 0) return FALSE;
      if (prog.length == 1) return prog[0];
      return { type: "prog", prog: prog };
    }
    function parse_expression() {
      return maybe_call(function(){
        return maybe_binary(parse_atom(), 0);
      });
    }
  }

  global.Mason = global.Mason || {};
  global.Mason.AST = function(code) {
    return parse(TokenStream(InputStream(code)));
  };
})(window);
