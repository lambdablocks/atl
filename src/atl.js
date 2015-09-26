import _  from 'lodash'
import Rx from 'rx'

function atlCreate (spec) {
  var join;
  var ports = {};

  [].concat(spec.in, spec.out).
  map((port) => ports[port] = new Rx.Subject());

  if (_.isFunction(spec.do)) {
    var inputs = spec.in.map((port) => ports[port]);

    join = Rx.Observable.prototype.combineLatest.
    apply(inputs[0], [].concat(inputs.slice(1), function () {
      var values = _.zipObject(spec.in, arguments);
      spec.out.map((port) => Object.defineProperty(values, port, {
        set: ports[port].onNext.bind(ports[port]) 
      }));
      return spec.do.apply(values, [values]);
    }));
  }

  if (_.isObject(spec.inner) && _.isArray(spec.wire)) {
    var inner = _.extend({}, ports);

    var joins = _.reduce(spec.inner, (acc, innerSpec, innerName) => {
      var atl = atlResolve(innerSpec);
      inner[innerName] = atl.ports;
      return atl.join.forEach(function () {});
    }, []);

    var wires = spec.wire.map((wire) => {
      var from = _.get(inner, wire.from);
      var to = _.get(inner, wire.to);
      if (!(from && to)) {
        throw new Error("Could not wire: "+wire);
      }
      return from.map(function (v) { 
        to.onNext(v); 
        return v; 
      });
    });

    join = Rx.Observable.prototype.combineLatest.
    apply(wires[0], [].concat(wires.slice(1), function() {}));
  }

  return {join, ports};
}

function atlResolve(spec) {
  if (typeof spec === 'object') {
    return atlCreate(spec);
  }
}

function atl(spec) {
  var {join, ports} = atlResolve(spec);

  function gate(forEach) {
    join.forEach(forEach);
    return gate;
  };

  spec.in.map((port) => gate[port] = (v) => { ports[port].onNext(v); return gate; });
  spec.out.map((port) => gate[port] = (f) => { ports[port].subscribe(f); return gate; });

  return gate;
}

export default atl;