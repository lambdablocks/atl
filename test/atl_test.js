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

});