import 'babel-polyfill';
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';
import 'codemirror/addon/edit/closebrackets.js';
import CodeMirrorBlocks from '../src/blocks';
import WeschemeParser from '../src/parsers/wescheme';

require('./example-page.less');

var cm = CodeMirror.fromTextArea(
  document.getElementById("code"),
  {theme:'3024-day',
   autoCloseBrackets: true}
);

var cm2 = CodeMirror.fromTextArea(
  document.getElementById('code2'),
  {theme:'3024-day',
   autoCloseBrackets: true}
);

var code = require('./ast-test.rkt');
//var code = require('./cow-game.rkt');
//var code = "(sum (+   (- 1 2)  3)\n (*  3  4)\n (/ 5 6))\n(product 5 6 7)"
cm.setValue(code);
cm2.swapDoc(cm.getDoc().linkedDoc({sharedHist: true}));

var blocks = new CodeMirrorBlocks(
  cm2,
  new WeschemeParser(),
  {
    renderOptions: {
      hideNodesOfType: ['comment','functionDef','variableDef','struct']
    },
    toolbar: document.getElementById('toolbar'),
    willInsertNode(sourceNodeText, sourceNode, destination) {
      let line = cm2.getLine(destination.line);
      let prev = line[destination.ch - 1] || '\n';
      let next = line[destination.ch] || '\n';
      sourceNodeText = sourceNodeText.trim();
      if (!/\s|[\(\[\{]/.test(prev)) {
        sourceNodeText = ' ' + sourceNodeText;
      }
      if (!/\s|[\)\]\}]/.test(next)) {
        sourceNodeText += ' ';
      }
      return sourceNodeText;
    }
  }
);
blocks.setBlockMode(true);
