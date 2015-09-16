(function () {

  var PORT_WIDTH = 20;
  var PORT_OFFSET = 10;
  var PORT_FULL_WIDTH = PORT_WIDTH + PORT_OFFSET + PORT_OFFSET;

  var canvas = Snap(document.querySelector('[atl-canvas]'));


  function createGate(name, inputs, outputs, options, attr) {
    options = R.merge({
      x: 50,
      y: 50,
      height: 30,
      width: Math.max(PORT_FULL_WIDTH * inputs.length, PORT_FULL_WIDTH * outputs.length),
    }, options || {});

    var fo = canvas.el('foreignObject', options);
    var template = document.querySelector('[atl-gate]');
    var clone = Snap(document.importNode(template.content, true));
    clone.appendTo(fo);

    var gate = canvas.rect(options.x, options.y, options.width, options.height);
    gate.attr({fill: 'white'});

    var group = canvas.group(gate, fo);
    group.addClass(name);
    group.drag();
  }

  var and = createGate('and', ['a', 'b'], ['q'])
  


})();