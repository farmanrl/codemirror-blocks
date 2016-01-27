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

// clone all literals for visible elements, and fix their position to
// match the existing literals
export function prepareTransition(ast, parent) {
  let {left: offsetLeft, top: offsetTop} = parent.getBoundingClientRect();
  let nodes = ast.getNodeArray();
  return nodes.map(function(node){
    if((node.el.offsetWidth === 0 && node.el.offsetHeight === 0)){
      return false;
    } else {
      let {left, top, width, height} = node.el.getBoundingClientRect();
      let clone = node.el.cloneNode(node.type==="literal"); // only deep copy literals
      if(node.type!=="literal") clone.className = "transition";
      clone.style.top = (top - offsetTop) + parent.scrollTop  + "px";
      clone.style.left= (left- offsetLeft)+ parent.scrollLeft + "px";
      clone.style.width     = width  + "px";
      clone.style.height    = height + "px";
      clone.style.display   = "inline-block";
      clone.style.position  = "absolute";
      clone.style.animation = "none";
      parent.appendChild(clone);
      return clone;
    }
  });
}

// find out where those literals are now, and move clones of visible
// literals to match the new ones. After 1sec, remove all clones
export function animateTransition(clones, ast, parent) {
  for (let node of ast.rootNodes) { node.el.style.animationName = "fadein"; }
  let {left: offsetLeft, top: offsetTop} = parent.getBoundingClientRect();
  let nodes = ast.getNodeArray();
  nodes.forEach(function(node, i){
    // Don't animate if we're going to or from an invisible node
    if(!clones[i] || (node.el.offsetWidth === 0 && node.el.offsetHeight === 0)) {
      if(clones[i]) clones[i].remove(); 
    } else {
      let {left, top, width, height} = node.el.getBoundingClientRect();
      clones[i].style.top  = (top - offsetTop) + parent.scrollTop + "px";
      clones[i].style.left = (left- offsetLeft)+ parent.scrollLeft+ "px";
      clones[i].style.width   = width  + "px";
      clones[i].style.height  = height + "px";
    }
  });
  // remove all the clones
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
  cm.markText(rootNode.from, rootNode.to, {replacedWith: rootNodeFrag.firstChild.firstChild, node: rootNode});
  return rootNodeFrag;
}

//export function 