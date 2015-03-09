var should = require('should');
var Parser = require('../../lib/parser');

function inspect(obj) {
  //console.log(require('util').inspect(obj, false, 10, true));  
}

describe('create view test',function(){
  
  it('parses a simple CREATE VIEW', function() {
    var sql, ast;

    sql = "CREATE VIEW myView AS SELECT DISTINCT a FROM b WHERE c = 0 GROUP BY d ORDER BY e";
    ast = Parser.parse(sql);

    ast.type.should.eql('create view')
    ast.select.type.should.eql('select')
  });

  it('parses CREATE VIEW with DEFINER', function() {
    var sql, ast;

    sql = "CREATE DEFINER=CURRENT_USER() ALGORITHM=TEMPTABLE VIEW myView AS SELECT DISTINCT a FROM b WHERE c = 0 GROUP BY d ORDER BY e";
    ast = Parser.parse(sql);

    ast.type.should.eql('create view')
    ast.opts.definer.should.eql('CURRENT_USER()')
    ast.opts.algorithm.should.eql('TEMPTABLE')
    ast.select.type.should.eql('select')
  });


});
