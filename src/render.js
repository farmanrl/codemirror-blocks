function createFragment(htmlStr) {
  var frag = document.createDocumentFragment();
  var temp = document.createElement('div');
  temp.innerHTML = htmlStr;
  frag.appendChild(temp);
  return frag;
}

export var nodes = {
  unknown: require('./templates/unknown.handlebars'),
  expression: require('./templates/expression.handlebars'),
  functionDef: require('./templates/functionDef.handlebars'),
  variableDef: require('./templates/variableDef.handlebars'),
  struct: require('./templates/struct.handlebars'),
  literal: require('./templates/literal.handlebars'),
  comment: require('./templates/comment.handlebars'),
  blank: require('./templates/blank.handlebars')
};

var nodesInRenderOrder = [];

export function renderHTMLString(node) {
  if (nodes[node.type] === undefined) {
    throw new Error("Don't know how to render node: "+node.type);
  }
  var nodeEl = nodes[node.type]({node});
  nodesInRenderOrder.push(node);
  if (typeof nodeEl !== 'string') {
    console.warn("AST node renderers should return html strings. node:", node);
    var temp = document.createElement('div');
    temp.appendChild(nodeEl);
    return temp.innerHTML;
  }
  return nodeEl;
}

export function prepareTransition(ast, cm) {
  let scroller = cm.getScrollerElement();
  let {left: offsetLeft, top: offsetTop} = scroller.getBoundingClientRect();
  return ast.getLiterals().map(function({el: lit}) {
    if(lit.offsetWidth === 0 && lit.offsetHeight === 0) {
      return false;
    }
    let clone = lit.cloneNode(true);
    let {left: litLeft, top: litTop} = lit.getBoundingClientRect();
    clone.style.top = parseInt((litTop - offsetTop) + scroller.scrollTop) + "px";
    clone.style.left= parseInt((litLeft- offsetLeft)+ scroller.scrollLeft)+ "px";
    clone.style.position = "absolute";
    clone.style.animation = "none";
    scroller.appendChild(clone);
    return clone;
  });
}
export function renderTransition(clones, ast, cm) {
  for (let node of ast.rootNodes) { node.el.style.animationName = "fadein"; }
  let scroller = cm.getScrollerElement();
  let {left: offsetLeft, top: offsetTop} = scroller.getBoundingClientRect();
  ast.getLiterals().forEach(function({el: lit}, i) {
    if(!clones[i] || lit.offsetWidth === 0 && lit.offsetHeight === 0) {
      if(clones[i]) clones[i].remove();
      return;
    }
    let {left: litLeft, top: litTop} = lit.getBoundingClientRect();
    clones[i].style.top = parseInt((litTop - offsetTop) + scroller.scrollTop) + "px";
    clones[i].style.left= parseInt((litLeft- offsetLeft)+ scroller.scrollLeft)+ "px";
  });
  setTimeout(() => clones.forEach((c) => { if(c) c.remove(); }), 1000);
}

export default function render(rootNode, cm, options={}) {
  nodesInRenderOrder = [];
  var rootNodeFrag = createFragment(renderHTMLString(rootNode).replace(/>\s*</g,'><'));
  let hiddenTypes = null;
  if (options.hideNodesOfType) {
    hiddenTypes = new Set(options.hideNodesOfType);
  }
  for (let node of nodesInRenderOrder) {
    node.el = rootNodeFrag.getElementById(`block-node-${node.id}`);
    if (!node.el) {
      console.warn("!! Didn't find a dom node for node", node);
      continue;
    }
    node.el.draggable = true;
    if (hiddenTypes && hiddenTypes.has(node.type)) {
      node.el.classList.add('blocks-hidden');
    }
  }
  cm.markText(rootNode.from, rootNode.to, {replacedWith: rootNodeFrag.firstChild.firstChild});
  return rootNodeFrag;
}

//export function 