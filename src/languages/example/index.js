import ExampleParser from './ExampleParser';
import CodeMirrorBlocks from '../../blocks';

require('./style.less');
export default CodeMirrorBlocks.languages.addLanguage(
  {
    id: 'example',
    name: 'Example',
    description: 'An example language that illustrates how to add support for new languages',
    getParser() {
      return new ExampleParser();
    },
    getRenderOptions() {
      return {
        extraRenderers: {
          literal: require('./templates/literal.handlebars'),
        },
      };
    },
  });
