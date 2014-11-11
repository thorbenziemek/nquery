var should = require('should');
var Parser = require(__dirname + '/../../lib/parser');

function inspect(obj) {
  //console.log(require('util').inspect(obj, false, 10, true));
}

describe('expression test',function(){

  describe('primary expr', function () {
    var ast;

    it('should parse numbers', function () {
      ast = Parser.parse('SELECT 1');
      ast.columns.should.eql([
        { expr: { type: 'number', value: 1 }, as: '' }
      ]);
    });

    it('should parse strings', function () {
      ast = Parser.parse('SELECT \'str\'');
      ast.columns.should.eql([
        { expr: { type: 'string', value: 'str' }, as: '' }
      ]);
    });

    it('should parse SQL keywords as columns', function () {
      ast = Parser.parse('SELECT `select`, "from" FROM t');
      ast.columns.should.eql([
        { expr: { type: 'column_ref', column: 'select', table : '' }, as: '' },
        { expr: { type: 'column_ref', column: 'from', table : '' }, as: '' }
      ]);
    });

    it('should parse boolean expressions', function () {
      ast = Parser.parse('SELECT true');
      ast.columns.should.eql([
        { expr: { type: 'bool', value: true }, as: '' }
      ]);
    });

    it('should parse function expressions w/o parameters', function () {
      ast = Parser.parse('SELECT rand()');
      ast.columns.should.eql([{
        expr: {
          type: 'function',
          name: 'rand',
          args: {
            type  : 'expr_list',
            value : []
          }
        },
        as: ''
      }]);
    });

    it('should parse function expressions with parameters', function () {
      ast = Parser.parse('SELECT fun(4)');
      ast.columns.should.eql([{
        expr: {
          type: 'function',
          name: 'fun',
          args: {
            type  : 'expr_list',
            value : [{ type: 'number', value: 4 }]
          }
        },
        as: ''
      }]);
    });

    it('should parse arithmetic expressions', function () {
      ast = Parser.parse('SELECT :id+1');
      ast.columns.should.eql([{
        expr: {
          type: 'binary_expr',
          operator: '+',
          left: { type: 'param', value: 'id' },
          right: { type: 'number', value: 1 }
        },
        as: ''
      }]);
    });

    it('should parse hbase column names', function () {
      ast = Parser.parse('SELECT cf1:name');
      ast.columns.should.eql([{ expr: { type: 'column_ref', table: '', column: 'cf1:name' }, as: '' }]);
    });

    it('should parse query parameters', function () {
      ast = Parser.parse('SELECT :select');
      ast.columns.should.eql([ { expr: { type: 'param', value: 'select' }, as: '' } ]);
    });

    it('should parse quoted column aliases', function () {
      ast = Parser.parse("SELECT col1 AS \"select\", col2 AS 'alias with spaces'");
      ast.columns.should.eql([
        { expr: { type: 'column_ref', table: '', column: 'col1' }, as: 'select' },
        { expr: { type: 'column_ref', table: '', column: 'col2' }, as: 'alias with spaces' }
      ]);
    });
  });

  it('aggr function test', function() {
    var sql, ast;

    sql = "SELECT count(distinct a.id), count(*), SUM(a.id)";
    ast = Parser.parse(sql);

    ast.columns.should.eql([ 
      { 
        expr: { 
          type: 'aggr_func',
          name: 'COUNT',
          args: {
            distinct: 'DISTINCT',
            expr: { 
              type: 'column_ref',
              table: 'a',
              column: 'id' 
            } 
          } 
        },
        as: '' 
      },
      { 
        expr: { 
          type: 'aggr_func',
          name: 'COUNT',
          args: {
            expr : { 
              type: 'star', value: '*' 
            } 
          }
        },
        as: '' 
      }, 
      { 
        expr: { 
          type: 'aggr_func',
          name: 'SUM',
          args: {
            expr : { 
              type  : 'column_ref',
              table : 'a',
              column: 'id' 
            } 
          }
        },
        as: '' 
      } 
    ]);

  });

  it('multiplicative expr test', function() {
    var sql, ast;

    sql = "SELECT (1*2/3 % fun(4))";
    ast = Parser.parse(sql);
    ast.columns.should.eql([{ 
      expr: { 
        type: 'binary_expr',
        operator: '%',
        left: { 
          type: 'binary_expr',
          operator: '/',
          left: { 
            type: 'binary_expr',
            operator: '*',
            left: { 
              type: 'number', 
              value: 1 
            },
            right: { 
              type: 'number',
              value: 2 
            } 
          },
          right: { 
            type: 'number',
            value: 3 
          } 
        },
        right: { 
          type: 'function',
          name: 'fun',
          args: {
            type  : 'expr_list',
            value : [ { type: 'number', value: 4 } ]
          }
        },
        paren: true 
      },
      as: '' 
    }]);

  });

  it('additive expr test', function() {
    var sql, ast;

    sql = "SELECT (1*2-3+4/5 + 3 % fun(4))";
    ast = Parser.parse(sql);
    ast.columns.should.eql([{ 
      expr:  { 
        type: 'binary_expr',
        operator: '+',
        left: { 
          type: 'binary_expr',
          operator: '+',
          left: {
            type: 'binary_expr',
            operator: '-',
            left: { 
              type: 'binary_expr',
              operator: '*',
              left: { 
                type: 'number', value: 1 
              },
              right: { 
                type: 'number', value: 2 
              } 
            },
            right: { 
              type: 'number', 
              value: 3 
            } 
          },
          right: { 
            type: 'binary_expr',
            operator: '/',
            left: { 
              type: 'number', value: 4 
            },
            right: { 
              type: 'number', value: 5 
            } 
          } 
        },
        right: { 
          type: 'binary_expr',
          operator: '%',
          left: { 
            type: 'number', value: 3 
          },
          right: { 
            type: 'function',
            name: 'fun',
            args: {
              type  : 'expr_list',
              value : [ { type: 'number', value: 4 } ]
            }
          } 
        },
        paren: true 
      },
      as: '' 
    }]);

  });

  it('arithmetic comparison  expr test', function() {
    var sql, ast;

    sql = "SELECT a FROM b WHERE c > 1+ 3 <= 2 != 1";
    ast = Parser.parse(sql);

    //inspect(ast.where);
    ast.where.should.eql({ 
      type: 'binary_expr',
      operator: '!=',
      left: { 
        type: 'binary_expr',
        operator: '<=',
        left: {
          type: 'binary_expr',
          operator: '>',
          left: { 
            type: 'column_ref',
            table: '',
            column: 'c' 
          },
          right: { 
            type: 'binary_expr',
            operator: '+',
            left: { type: 'number', value: 1 },
            right: { type: 'number', value: 3 } 
          } 
        },
        right: { type: 'number', value: 2 } 
      },
      right: { type: 'number', value: 1 }
    })

  });

  it('in comparison expr test', function() {
    var sql, ast;

    sql = "SELECT a FROM b WHERE c in(1, nUll,  3, 'str')";
    ast = Parser.parse(sql);
    
    ast.where.should.eql({ 
      type: 'binary_expr',
      operator: 'IN',
      left:{ 
        type: 'column_ref',
        table: '',
        column: 'c' 
      },
      right: {
        type  : 'expr_list',
        value : [
          { type: 'number', value: 1 }, 
          { type: 'null', value: null }, 
          { type: 'number', value:  3}, 
          { type: 'string', value: 'str' } 
        ] 
      }
    });

  });
  
  it('is comparison expr test', function() {
    var sql, ast;

    sql = "SELECT a FROM b WHERE c IS NULL";
    ast = Parser.parse(sql);
    
    ast.where.should.eql({ 
      type: 'binary_expr',
      operator: 'IS',
      left:{ 
        type: 'column_ref',
        table: '',
        column: 'c' 
      },
      right: { type: 'null', value: null } 
    });
  });
  
  it('like comparison expr test', function() {
    var sql, ast;

    sql = "SELECT a FROM b WHERE c lIke 'p'";
    ast = Parser.parse(sql);
    
    ast.where.should.eql({ 
      type: 'binary_expr',
      operator: 'LIKE',
      left:{ 
        type: 'column_ref',
        table: '',
        column: 'c' 
      },
      right: { type: 'string', value: 'p' } 
    });

  });

  it('between comparison expr test', function() {
    var sql, ast;
    sql = "SELECT a FROM b WHERE c between 1 and '5'";
    ast = Parser.parse(sql);

    ast.where.should.eql({ 
      type: 'binary_expr',
      operator: 'BETWEEN',
      left: { 
        type: 'column_ref',
        table: '',
        column: 'c' 
      },
      right: {
        type : 'expr_list',
        value : [
          { type: 'number', value: 1 },
          { type: 'string', value: '5' } 
        ] 
      }
    })
  });

  it('NOT expr test', function() {
    var sql, ast;
    sql = "SELECT a FROM b WHERE c = (! NOT  1 > 2)";
    ast = Parser.parse(sql);

    //inspect(ast.where);

    ast.where.should.eql({ 
      type: 'binary_expr',
      operator: '=',
      left: { 
        type: 'column_ref',
        table: '',
        column: 'c' 
      },
      right: { 
        type: 'unary_expr',
        operator: 'NOT',
        expr: { 
          type: 'unary_expr',
          operator: 'NOT',
          expr: { 
            type: 'binary_expr',
            operator: '>',
            left: {  type: 'number', value: 1},
            right: { type: 'number', value: 2 } 
          }
        },
        paren: true
      } 
    })

  });

  //priorty : `AND` < `NOT` < `Comaprison` 
  it('AND expr test', function() {
    var sql, ast;
    sql = "SELECT a FROM b WHERE NOT c > 0 And NOT a > 1 ";
    ast = Parser.parse(sql);

    //inspect(ast.where);

    ast.where.should.eql({ 
      type: 'binary_expr',
      operator: 'AND',
      left: { 
        type: 'unary_expr',
        operator: 'NOT',
        expr: { 
          type: 'binary_expr',
          operator: '>',
          left: { 
            type: 'column_ref',
            table: '',
            column: 'c' 
          },
          right: {
            type: 'number', value: 0 
          } 
        } 
      },
      right: { 
        type: 'unary_expr',
        operator: 'NOT',
        expr:{ 
          type: 'binary_expr',
          operator: '>',
          left: { 
            type: 'column_ref',
            table: '',
            column: 'a' 
          },
          right: { type: 'number', value: 1 } 
        } 
      } 
    })
  });

  it('OR expr test', function() {
    var sql, ast;

    sql = "SELECT a FROM b WHERE c = 0 OR d > 0 AND e < 0";
    ast = Parser.parse(sql);
    //inspect(ast.where);
    ast.where.should.eql({ 
      type: 'binary_expr',
      operator: 'OR',
      left: { 
        type: 'binary_expr',
        operator: '=',
        left: { 
          type: 'column_ref',
          table: '',
          column: 'c' 
        },
        right: { 
          type: 'number', value: 0 
        } 
      },
      right: { 
        type: 'binary_expr',
        operator: 'AND',
        left: { 
          type: 'binary_expr',
          operator: '>',
          left: { 
            type: 'column_ref',
            table: '',
            column: 'd' 
          },
          right: { 
            type: 'number', 
            value: 0 
          } 
        },
        right: { 
          type: 'binary_expr',
          operator: '<',
          left: { 
            type: 'column_ref',
            table: '',
            column: 'e' 
          },
          right: {
            type: 'number', 
            value: 0
          } 
        } 
      }
    });

    // priority : 'AND' > 'OR'
    sql = "SELECT a FROM b WHERE c = 0 AND d > 0 OR e < 0";
    ast = Parser.parse(sql);

    //inspect(ast.where);
    ast.where.should.eql({ 
      type: 'binary_expr',
      operator: 'OR',
      left: {
        type: 'binary_expr',
        operator: 'AND',
        left: { 
          type: 'binary_expr',
          operator: '=',
          left: { 
            type: 'column_ref',
            table: '',
            column: 'c' 
          },
          right: { 
            type: 'number', 
            value: 0 
          } 
        },
        right: { 
          type: 'binary_expr',
          operator: '>',
          left: {
            type: 'column_ref',
            table: '',
            column: 'd'
          },
          right: { 
            type: 'number', 
            value: 0 
          } 
        } 
      },
      right: { 
        type: 'binary_expr',
        operator: '<',
        left: { 
          type: 'column_ref',
          table: '',
          column: 'e' 
        },
        right: { 
          type: 'number', 
          value: 0 
        } 
      }
    });
  });

  describe('CASE/WHEN', function () {
    var sql, ast;

    it('should support basic case when', function () {
      sql = 'SELECT CASE WHEN a=1 THEN "one" WHEN a = 2 THEN "two" END FROM t';
      ast = Parser.parse(sql);

      ast.columns.should.eql([{
        expr: {
          type: 'case',
          expr: '',
          args: [{
            type: 'when',
            cond: {
              type: 'binary_expr',
              operator: '=',
              left: { type: 'column_ref', table: '', column: 'a' },
              right: { type: 'number', value: 1 }
            },
            result: { type: 'string', value: 'one' }
          }, {
            type: 'when',
            cond: {
              type: 'binary_expr',
              operator: '=',
              left: { type: 'column_ref', table: '', column: 'a' },
              right: { type: 'number', value: 2 }
            },
            result: { type: 'string', value: 'two' }
          }]
        },
        as: ''
      }]);
    });

    it('should support case conditions', function () {
      sql = 'SELECT CASE FUNC(a) WHEN 1 THEN "one" WHEN 2 THEN "two" END FROM t';
      ast = Parser.parse(sql);

      ast.columns.should.eql([{
        expr: {
          type: 'case',
          expr: {
            type: 'function',
            name: 'FUNC',
            args: {
              type: 'expr_list',
              value: [{ type: 'column_ref', table: '', column: 'a' }]
            }
          },
          args: [{
            type: 'when',
            cond: { type: 'number', value: 1 },
            result: { type: 'string', value: 'one' }
          }, {
            type: 'when',
            cond: { type: 'number', value: 2 },
            result: { type: 'string', value: 'two' }
          }]
        },
        as: ''
      }]);
    });

    it('should support case/when/else', function () {
      sql = 'SELECT CASE a WHEN 1 THEN "one" WHEN 2 THEN "two" ELSE FUNC(a) END CASE FROM t';
      ast = Parser.parse(sql);

      ast.columns.should.eql([{
        expr: {
          type: 'case',
          expr: { type: 'column_ref', table: '', column: 'a' },
          args: [{
            type: 'when',
            cond: { type: 'number', value: 1 },
            result: { type: 'string', value: 'one' }
          }, {
            type: 'when',
            cond: { type: 'number', value: 2 },
            result: { type: 'string', value: 'two' }
          }, {
            type: 'else',
            result: {
              type: 'function',
              name: 'FUNC',
              args: {
                type: 'expr_list',
                value: [{ type: 'column_ref', table: '', column: 'a' }]
              }
            }
          }]
        },
        as: ''
      }]);
    });
  });

});   

