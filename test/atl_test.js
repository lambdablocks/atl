import _ from 'lodash';
import {assert} from 'chai';
import Atl from '../src/atl';

describe('atl', function () {

  var atl;
  beforeEach(function() {
    atl = Atl();
  });

  it('creates a one input gate', function (done) {
    const double = atl({
      in: ['a'],
      out: ['b'],
      do: function () { this.b = this.a * 2; }
    });

    double(done)
    .b(_.bind(assert.equal, assert, 6))
    .a(3);
  })

  it('creates a two input gate', function(done) {
    const add = atl({
      in: ['a', 'b'],
      out: ['c'],
      do: function () { this.c = this.a + this.b; }
    });

    add(done)
    .c(_.bind(assert.equal, assert, 3))
    .a(1)
    .b(2);
  });

  it('wires inner gates', function (done) {
    const fun = atl({
      in: ['a', 'b'],
      out: ['c'],
      inner: {
        double: {
          in: ['a'],
          out: ['b'],
          do: function () { this.b = this.a * 2; }
        },
        triple: {
          in: ['a'],
          out: ['b'],
          do: function () { this.b = this.a * 3; }
        },
        add: {
          in: ['a', 'b'],
          out: ['c'],
          do: function () { this.c = this.a + this.b; }
        }
      },
      wire: [
        {from: 'a', to: 'double.a'},
        {from: 'b', to: 'triple.a'},
        {from: 'double.b', to: 'add.a'},
        {from: 'triple.b', to: 'add.b'},
        {from: 'add.c', to: 'c'}
      ]
    });

    fun(done)
    .c(_.bind(assert.equal, assert, 13))
    .a(2)
    .b(3);
  });


  it('can define a gate to a name', function (done) {
    atl.def('double', {
      in: ['a'],
      out: ['b'],
      do: function () { this.b = this.a * 2; }
    });

    atl('double')(done)
    .b(_.bind(assert.equal, assert, 6))
    .a(3);
  });

  it('has names isolated per Atl instance', function (done) {
    atl.def('double', {
      in: ['a'],
      out: ['b'],
      do: function () { this.b = this.a * 2; }
    });
    assert.ok(atl('double'));
    assert.notOk(Atl()('double'), 'should not be present on other env');
    done();
  });

  it('can wire predefined gates', function (done) {
    atl.def('double', {
      in: ['a'],
      out: ['b'],
      do: function () { this.b = this.a * 2; }
    });

    var pass = atl({
      in: ['a'],
      out: ['b'],
      inner: { x: 'double' },
      wire: [
        {from: 'a', to: 'x.a'},
        {from: 'x.b', to: 'b'}
      ]
    });

    pass(done)
    .b(_.bind(assert.equal, assert, 10))
    .a(5);
  });

  // Maybe(x) = None | Just(x)
  // hacer un if con guards
  // un array, cons?

  it('can implement a sameWord component', function (done) {

    atl.def('split', {
      in: ['a'],
      out: ['c'],
      do: function () {
        this.c = this.a.split(' ');
      }
    });

    atl.def('sort', {
      in: ['a'],
      out: ['b'],
      do: function () {
        this.b = this.a.sort();
      }
    });


    atl.def('===', {
      in: ['a', 'b'],
      out: ['c'],
      do: function () {
        this.c = _.isEqual(this.a, this.b);
      }
    });

    var sameWord = atl({
      in: ['a', 'b'],
      out: ['c'],
      inner: {
        split1: 'split',
        split2: 'split',
        sort1: 'sort',
        sort2: 'sort',
        eq: '==='
      },
      wire: [
        {from: 'a', to: 'split1.a'},
        {from: 'b', to: 'split2.a'},
        {from: 'split1.c', to: 'sort1.a'},
        {from: 'split2.c', to: 'sort2.a'},
        {from: 'sort1.b', to: 'eq.a'},
        {from: 'sort2.b', to: 'eq.b'},
        {from: 'eq.c', to: 'c'}
      ]
    });

    sameWord(done)
    .c(_.bind(assert.ok, assert))
    .a('hola')
    .b('hola');
  });

});
