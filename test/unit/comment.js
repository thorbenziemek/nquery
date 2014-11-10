var Parser = require('./../../lib/parser');

describe('comment test', function () {

  it('should remove block comments from SQL', function () {
    var sql, ast;

    sql = 'SELECT * /* some comment */ FROM t';
    ast = Parser.parse(sql);

    ast.should.be.eql({
      type: 'select',
      distinct: '',
      columns: '*',
      from: [{ db: '', table: 't', as: '' }],
      where: '',
      groupby: '',
      orderby: '',
      limit: ''
    });
  });

  it('should remove line comments from SQL', function () {
    var sql, ast;

    sql = "SELECT * FROM -- some comment \n t";
    ast = Parser.parse(sql);

    ast.should.be.eql({
      type: 'select',
      distinct: '',
      columns: '*',
      from: [{ db: '', table: 't', as: '' }],
      where: '',
      groupby: '',
      orderby: '',
      limit: ''
    });
  });
});
