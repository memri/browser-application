require("./memri/extensions/common/string");
export * from './memri/model/RealmLocal';
export * from './memri/api/Authentication';
export * from './memri/storage/DatabaseController';
export * from './memri/model/Sync';
export * from './memri/model/Cache';
export * from './memri/model/CachePubSub';
export * from './memri/cvu/views/Views';
export * from './memri/cvu/views/Languages';
export * from './memri/model/Settings';
export * from './memri/model/SettingsPubSub';
export * from './memri/api/LocalSettings';
export * from './memri/model/schemaExtensions/Item';
export * from './memri/install/Installer';
export * from './memri/sessions/Session';
export * from './memri/sessions/Sessions';
export * from './memri/model/MainNavigation';
export * from './memri/api/IndexerAPI';
export * from './memri/api/PodAPI';
export * from './memri/context/MemriContext';
//export * from './playground/mockApi';
export * from './memri/cvu/views/Cascadable';
export * from './memri/api/Datasource';
export * from './memri/cvu/views/CascadableContextPane';
export * from './memri/cvu/views/CascadableDict';
export * from './memri/cvu/views/CascadableView';
export * from './memri/cvu/views/CascadingRendererConfig';
export * from './memri/cvu/parsers/cvu-parser/CVU';
export * from './memri/cvu/parsers/cvu-parser/CVULexer';
export * from './memri/cvu/parsers/cvu-parser/CVUParseErrors';
export * from './memri/cvu/parsers/cvu-parser/CVUParsedDefinition';
export * from './memri/cvu/parsers/cvu-parser/CVUParser';
export * from './memri/cvu/parsers/cvu-parser/CVUToString';
export * from './memri/cvu/parsers/cvu-parser/CVUValidator';
export * from './memri/cvu/parsers/expression-parser/ExprInterpreter';
export * from './memri/cvu/parsers/expression-parser/ExprLexer';
export * from './memri/cvu/parsers/expression-parser/ExprNodes';
export * from './memri/cvu/parsers/expression-parser/ExprParser';
export * from './memri/cvu/parsers/expression-parser/Expression';
export * from './memri/cvu/views/Action';
export * from './memri/cvu/views/ActionErrors';
export * from './memri/cvu/views/Colors';
export * from './memri/gui/cvuComponents/UINode';
export * from './memri/gui/cvuComponents/UINodeResolver';
export * from './memri/gui/cvuComponents/UIElementView';
export * from './memri/cvu/views/ViewDebugger';
export * from './memri/gui/renderers/Renderers';
export * from './memri/gui/util';
export * from './memri/model/InMemoryObjectCache';
export * from './memri/model/MemriDictionary';
export * from './memri/model/ResultSet';
export * from './memri/gui/cvuComponents/valueTypes/CVUColor';
export * from './memri/gui/cvuComponents/valueTypes/CVUFont';
export * from './memri/gui/cvuComponents/nodeTypes/CVU_Image';

//TODO: added for bundle @mkslanc

function importAll (r) {
    r.keys().forEach(key => r(key));
}

//for webpack fileloader @mkslanc
if (require.context) {
    importAll(require.context('./memri/Resources/demoAssets/', true, /\.(png|jpe?g|gif)$/i));
}
