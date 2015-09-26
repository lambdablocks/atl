import _  from 'lodash'
import Rx from 'rx'

function atlCreate (env, spec) {
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
      var atl = env.resolve(innerSpec);
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

  return {join, ports, spec};
}

function atlResolve(env, spec) {
  if (typeof spec === 'object') {
    return env.create(spec);
  } else if (env.names[spec]) {
    return env.names[spec];
  }
}

function atlDef(env, name, spec) {
  return env.names[name] = env.resolve(spec);
}

function atlGate(env, spec) {
  var {join, ports, spec} = env.resolve(spec);

  function gate(forEach) {
    join.forEach(forEach);
    return gate;
  };

  spec.in.map((port) => gate[port] = (v) => { ports[port].onNext(v); return gate; });
  spec.out.map((port) => gate[port] = (f) => { ports[port].subscribe(f); return gate; });

  return gate;
}

function atlEnv(env) {
  env.gate = _.bind(atlGate, null, env);
  env.resolve = _.bind(atlResolve, null, env);
  env.create = _.bind(atlCreate, null, env);
  env.gate.def = _.bind(atlDef, null, env);
  return env;
}

export default function atl() {
  return atlEnv({names: {}}).gate;
}

