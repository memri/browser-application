"use strict";
import {contextJs} from "../install";
import {debugHistory} from "../memri/cvu/views/ViewDebugger";
import {realm} from "../memri/storage/DatabaseController";
var defaults = require("../memri/cvu/cvulist");

contextJs.installer.installLocalAuthForLocalInstallation(contextJs, true, (error) => {
    error && error.map(($0) => debugHistory.error(`${$0}`))
})

function getDefaultViewContents(defaultsCVU) {
    let viewContents= [];
    for (let cvu in defaultsCVU) {
        viewContents.push(defaultsCVU[cvu]);
    }
    return viewContents.join("\n").replace(/\r/g,"");
}

var all = {}
var selectors = {}
var propertiesByName = {}
function parse() {
    Object.keys(defaults).forEach(function(name) {
        var ast = parseCVU(defaults[name])
        ast.dict = all[name] = {};
        ast.traverseTopDown('Rule(Selector(x), y)', function(arg) {
            var root = arg.y.parent.parent
            var selector = arg.x + ""
            
            
            var value;
            if (arg.y.cons == "Dict" || arg.y.cons == "List") {
                value = arg.y.dict || (arg.y.dict = {})
            } else {
                value = arg.y.toString()
            }
            if (root.dict) {
                root.dict[selector] = value;
            }
            selector = selector.replace(/"/g, "")
            if (!/^[A-Z]/.test(selector)) {
                if (!selectors[selector]) selectors[selector] = []
                if (!types.UIElement[selector])
                    selectors[selector].push(value)
            }
        })
    })
}
console.log("CVU:");
console.log(realm.objects("CVUStoredDefinition"));

var mockdata = realm.objects("CVUStoredDefinition");
/*var mockdata = [{
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346473.996,
    "dateModified": 1594303347248.548,
    "definition": "[session = all-indexers] {\n    [view] {\n        title: \"All Indexers\"\n\n        [datasource = pod] {\n            query: \"Indexer\"\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "all-indexers",
    "selector": "[session = all-indexers]",
    "starred": false,
    "type": "session",
    "uid": 1000000804,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346481.964,
    "dateModified": 1594303347253.412,
    "definition": "Indexer {\n    contextButtons: star schedule\n    defaultRenderer: \"generalEditor\"\n    editActionButton: toggleEditMode\n    filterButtons: [\n        openView {\n            arguments: {\n                view: {\n                    defaultRenderer: \"timeline\"\n\n                    [datasource = pod] {\n                        query: \"AuditItem appliesTo:{.id}\"\n                        sortAscending: true\n                        sortProperty: \"dateCreated\"\n                    }\n\n                    [renderer = timeline] {\n                        timeProperty: \"dateCreated\"\n                    }\n                }\n            }\n            icon: \"increase.indent\"\n            title: \"Show Timeline\"\n        }\n        showContextPane\n    ]\n    navigateItems: [\n        openView {\n            arguments: {\n                view: {\n                    defaultRenderer: \"timeline\"\n\n                    [datasource = pod] {\n                        query: \"AuditItem appliesTo:{.id}\"\n                        sortAscending: true\n                        sortProperty: \"dateCreated\"\n                    }\n\n                    [renderer = timeline] {\n                        timeProperty: \"dateCreated\"\n                    }\n                }\n            }\n            title: \"Timeline of this indexer\"\n        }\n        openViewByName {\n            arguments: {\n                viewArguments: {\n                    include: \"all-indexers\"\n                }\n                name: \"filter-starred\"\n            }\n            title: \"Starred indexer\"\n        }\n        openViewByName {\n            name: \"all-indexers\"\n            title: \"All indexers\"\n        }\n    ]\n    title: \"{.name}\"\n}",
    "deleted": false,
    "domain": "defaults",
    "selector": "Indexer",
    "starred": false,
    "type": "view",
    "uid": 1000000806,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346525.8413,
    "dateModified": 1594303347294.0027,
    "definition": "Indexer[] {\n    defaultRenderer: \"list\"\n    emptyResultText: \"There are no Indexers\"\n    filterButtons: showStarred toggleFilterPanel\n    name: \"all-indexers\"\n    sortFields: \"name\" \"dateModified\" \"dateAccessed\" \"dateCreated\"\n    title: \"All Indexers\"\n\n    [datasource = pod] {\n        query: \"Indexer\"\n        sortAscending: false\n        sortProperty: \"dateModified\"\n    }\n\n    [renderer = list] {\n        press: addItem {\n            arguments: {\n                template: {\n                    name: {{.name}}\n                    indexer: {{.}}\n                    _type: \"IndexerRun\"\n                }\n            }\n        }\n\n        HStack {\n            alignment: center\n\n            VStack {\n                maxWidth: 90\n                maxHeight: 120\n\n                Image {\n                    systemName: {{.icon}}\n                    show: {{.icon}}\n                    padding: 20 0 0 0\n                    maxWidth: 80\n                    maxHeight: 120\n                    font: 30\n                    color: #d64f4f\n                }\n\n                Image {\n                    show: {{!.icon and .bundleImage}}\n                    resizable: \"fit\"\n                    minWidth: 50\n                    maxWidth: 50\n                    minHeight: 50\n                    maxHeight: 50\n                    color: #2480d6\n                    bundleImage: {{.bundleImage}}\n                }\n            }\n\n            VStack {\n                rowInset: 12 20 -12 20\n                alignment: left\n\n                HStack {\n                    Text {\n                        text: \"{.name}\"\n                        padding: 0 0 3 0\n                        font: 18 semibold\n                        color: #333333\n                    }\n\n                    Text {\n                        text: \"   (Local)\"\n                        show: {{.runDestination=\"ios\"}}\n                    }\n                }\n\n                HStack {\n                    Text {\n                        text: \"{.itemDescription}\"\n                        removeWhiteSpace: true\n                        padding: 0 20 0 0\n                        maxChar: 100\n                        font: 14 regular\n                        color: #555555\n                    }\n\n                    Button {\n                        press: [\n                            \"import\"\n                            {\n                                arguments: {\n                                    importer: {{.}}\n                                }\n                            }\n                        ]\n\n                        VStack {\n                            cornerradius: 8\n                            background: #a1bdc9\n\n                            Text {\n                                text: \"INFO\"\n                                padding: 5 8 5 8\n                                font: 16 semibold\n                                color: #ffffff\n                            }\n                        }\n                    }\n                }\n\n                Text {\n                    text: \"{.dateModified}\"\n                    padding: 8 0 5 0\n                    font: 11 regular\n                    color: #888888\n                }\n            }\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "selector": "Indexer[]",
    "starred": false,
    "type": "view",
    "uid": 1000000808,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346529.575,
    "dateModified": 1594303347295.984,
    "definition": "[session = all-sessionviews] {\n    [view] {\n        title: \"All Views\"\n\n        [datasource = pod] {\n            query: \"SessionView\"\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "all-sessionviews",
    "selector": "[session = all-sessionviews]",
    "starred": false,
    "type": "session",
    "uid": 1000000810,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346533.428,
    "dateModified": 1594303347297.708,
    "definition": "[view = views-in-current-session] {\n    title: \"Views in current session\"\n\n    [datasource = pod] {\n        query: \"SessionView AND ANY allEdges.targetItemID = {session.uid}\"\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "views-in-current-session",
    "selector": "[view = views-in-current-session]",
    "starred": false,
    "type": "view",
    "uid": 1000000812,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346541.095,
    "dateModified": 1594303347303.654,
    "definition": "SessionView[] {\n    defaultRenderer: \"list\"\n    editActionButton: toggleEditMode\n    emptyResultText: \"No views in this session\"\n    filterButtons: showStarred toggleFilterPanel\n    name: \"all-sessionviews\"\n    title: \"All Session Views\"\n\n    [datasource = pod] {\n        query: \"sessionview\"\n        sortAscending: false\n        sortProperty: \"dateAccessed\"\n    }\n\n    [renderer = list] {\n        VStack {\n            rowInset: 12 20 -12 20\n            alignment: left\n\n            HStack {\n                alignment: top\n\n                Text {\n                    text: \"{.computedTitle()}\"\n                    padding: 0 0 3 0\n                    font: 18 semibold\n                    color: #333333\n                }\n\n                Spacer\n\n\n                Text {\n                    text: \"{.dateAccessed}\"\n                    padding: 8 0 5 0\n                    font: 11 regular\n                    color: #888888\n                }\n            }\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "selector": "SessionView[]",
    "starred": false,
    "type": "view",
    "uid": 1000000814,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346545.01,
    "dateModified": 1594303347305.5051,
    "definition": "[color = background] {\n    dark: #ff0000\n    light: #330000\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "background",
    "selector": "[color = background]",
    "starred": false,
    "type": "color",
    "uid": 1000000816,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346548.42,
    "dateModified": 1594303347307.24,
    "definition": "[color = highlight] {\n    dark: #ffffff\n    light: #000000\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "highlight",
    "selector": "[color = highlight]",
    "starred": false,
    "type": "color",
    "uid": 1000000818,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346552.011,
    "dateModified": 1594303347308.958,
    "definition": "[style = my-label-text] {\n    border: \"background\" 1\n    color: \"highlight\"\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "my-label-text",
    "selector": "[style = my-label-text]",
    "starred": false,
    "type": "style",
    "uid": 1000000820,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346555.11,
    "dateModified": 1594303347311.0671,
    "definition": "[style = active] {\n    background: \"background\"\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "active",
    "selector": "[style = active]",
    "starred": false,
    "type": "style",
    "uid": 1000000822,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346558.3147,
    "dateModified": 1594303347312.774,
    "definition": "[session = *] {\n    [view] {\n        title: \"Everything\"\n\n        [datasource = pod] {\n            query: \"*\"\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "*",
    "selector": "[session = *]",
    "starred": false,
    "type": "session",
    "uid": 1000000824,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346561.469,
    "dateModified": 1594303347314.414,
    "definition": "* {\n    searchHint: \"Search\"\n}",
    "deleted": false,
    "domain": "defaults",
    "selector": "*",
    "starred": false,
    "type": "view",
    "uid": 1000000826,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346569.6511,
    "dateModified": 1594303347320.014,
    "definition": "*[] {\n    searchHint: \"Search\"\n    sortFields: \"dateCreated\" \"dateModified\" \"dateAccessed\"\n\n    [renderer = generalEditor] {\n        EditorRow {\n            padding: 5 36 5 36\n            nopadding: true\n\n            HStack {\n                alignment: center\n\n                MemriButton\n\n\n                Spacer\n\n\n                Button {\n                    show: {{!readOnly}}\n                    press: unlink {\n                        arguments: {\n                            subject: {{subject}}\n                            edgeType: {{name}}\n                        }\n                    }\n\n                    Image {\n                        systemName: \"minus.circle.fill\"\n                        color: #ff0000\n                    }\n                }\n            }\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "selector": "*[]",
    "starred": false,
    "type": "view",
    "uid": 1000000828,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346574.158,
    "dateModified": 1594303347322.136,
    "definition": ".choose-item-by-query {\n    actionButton: addItem {\n        arguments: {\n            type: {{type}}\n        }\n    }\n    defaultRenderer: {{ renderer or \"list\" }}\n    editActionButton: toggleEditMode\n    editMode: true\n    title: {{ title or \"Choose a {type}\" }}\n    userstate: {\n        selection: {{ selection }}\n    }\n\n    [datasource = pod] {\n        query: \"{query}\"\n    }\n\n    [renderer = list] {\n        press: [\n            link {\n                arguments: {\n                    subject: {{subject}}\n                    edgeType: {{edgeType}}\n                    distinct: {{distinct}}\n                }\n            }\n            closePopup\n        ]\n    }\n\n[renderer = thumbnail] {\n        press: [\n            link {\n                arguments: {\n                    subject: {{subject}}\n                    edgeType: {{edgeType}}\n                    distinct: {{distinct}}\n                }\n            }\n            closePopup\n        ]\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "choose-item-by-query",
    "selector": ".choose-item-by-query",
    "starred": false,
    "type": "view",
    "uid": 1000000830,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346589.042,
    "dateModified": 1594303347323.84,
    "definition": ".all-items-with-label {\n    defaultRenderer: \"list\"\n    title: \"Items with label {name}\"\n\n    [datasource = pod] {\n        query: \"* AND ANY labels.uid = {uid}\"\n    }\n\n    [renderer = list] {\n        ItemCell {\n            rendererNames: \"list\" \"thumbnail\"\n            arguments: {{variables}}\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "all-items-with-label",
    "selector": ".all-items-with-label",
    "starred": false,
    "type": "view",
    "uid": 1000000832,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346592.765,
    "dateModified": 1594303347325.576,
    "definition": "[session = all-photos] {\n    [view] {\n        title: \"All Photos\"\n\n        [datasource = pod] {\n            query: \"Photo\"\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "all-photos",
    "selector": "[session = all-photos]",
    "starred": false,
    "type": "session",
    "uid": 1000000834,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346596.6948,
    "dateModified": 1594303347327.6528,
    "definition": "Photo {\n    defaultRenderer: \"thumbnail\"\n    editActionButton: toggleEditMode\n    emptyResultText: \"No photo found\"\n    filterButtons: showStarred toggleFilterPanel\n    title: \"Photo\"\n\n    [datasource = pod] {\n        query: \"photo\"\n        sortAscending: false\n        sortProperty: \"dateModified\"\n    }\n\n    [renderer = thumbnail] {\n        column: 1\n        edgeInset: 0 0 0 0\n        spacing: 1\n\n        Image {\n            resizable: \"fill\"\n            image: {{.file}}\n            background: #aaaaaa\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "selector": "Photo",
    "starred": false,
    "type": "view",
    "uid": 1000000836,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346600.672,
    "dateModified": 1594303347329.4912,
    "definition": "Photo[] {\n    defaultRenderer: \"thumbnail\"\n    editActionButton: toggleEditMode\n    emptyResultText: \"There are no photos here yet\"\n    filterButtons: showStarred toggleFilterPanel\n    title: \"All Photos\"\n\n    [datasource = pod] {\n        query: \"Photo\"\n        sortAscending: false\n        sortProperty: \"dateModified\"\n    }\n\n    [renderer = thumbnail] {\n        edgeInset: 0 0 0 0\n        spacing: 1\n\n        Image {\n            resizable: \"fill\"\n            image: {{.file}}\n            background: #aaaaaa\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "selector": "Photo[]",
    "starred": false,
    "type": "view",
    "uid": 1000000838,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346604.319,
    "dateModified": 1594303347331.577,
    "definition": ".filter-starred {\n    inherit: {{view}}\n    title: \"Starred\"\n\n    [datasource = pod] {\n        query: \"{view.datasource.query} AND starred = true\"\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "filter-starred",
    "selector": ".filter-starred",
    "starred": false,
    "type": "view",
    "uid": 1000000840,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346607.719,
    "dateModified": 1594303347333.223,
    "definition": "[renderer = thumbnail] {\n    longPress: noop\n    press: openView\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "thumbnail",
    "selector": "[renderer = thumbnail]",
    "starred": false,
    "type": "renderer",
    "uid": 1000000842,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346611.407,
    "dateModified": 1594303347334.954,
    "definition": "[session = all-countries] {\n    [view] {\n        title: \"All Countries\"\n\n        [datasource = pod] {\n            query: \"Country\"\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "all-countries",
    "selector": "[session = all-countries]",
    "starred": false,
    "type": "session",
    "uid": 1000000844,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346616.8408,
    "dateModified": 1594303347338.1208,
    "definition": "Country[] {\n    defaultRenderer: \"list\"\n    filterButtons: showStarred toggleFilterPanel\n    name: \"all-countries\"\n\n    [renderer = list] {\n        VStack {\n            padding: 0 20 0 20\n            alignment: left\n\n            Text {\n                text: \"{.computedTitle()}\"\n                padding: 10 0 10 0\n            }\n        }\n    }\n\n[renderer = generalEditor] {\n        EditorRow {\n            title: \"{title}\"\n\n            Text {\n                text: {{.name}}\n                show: {{readOnly}}\n            }\n\n            Picker {\n                value: {{.}}\n                title: \"Select a country\"\n                show: {{!readOnly}}\n                optionsFromQuery: \"country\"\n                empty: \"Country\"\n                default: {{me.address[primary = true].country}}\n            }\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "selector": "Country[]",
    "starred": false,
    "type": "view",
    "uid": 1000000846,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346620.473,
    "dateModified": 1594303347339.8389,
    "definition": "[session = all-addresses] {\n    [view] {\n        title: \"All Addresses\"\n\n        [datasource = pod] {\n            query: \"Address\"\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "all-addresses",
    "selector": "[session = all-addresses]",
    "starred": false,
    "type": "session",
    "uid": 1000000848,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346641.623,
    "dateModified": 1594303347358.078,
    "definition": "Address[] {\n    defaultRenderer: \"list\"\n    filterButtons: showStarred toggleFilterPanel\n\n    [renderer = list] {\n        HStack {\n            Text {\n                text: \"{.computedTitle()}\"\n                padding: 0 0 10 0\n                font: 16\n            }\n\n            Spacer\n\n\n            Map {\n                margin: 0 0 10 0\n                maxWidth: 150\n                minHeight: 150\n                maxHeight: 150\n                border: #dddddd 1\n                cornerRadius: 10\n                addressKey: \"self\"\n            }\n        }\n    }\n\n[renderer = map] {\n        addressKey: \"self\"\n    }\n\n[renderer = generalEditor] {\n        EditorRow {\n            title: \"{edge.label or edge.type}\"\n            nopadding: {{!readOnly}}\n\n            HStack {\n                show: {{readOnly}}\n\n                Text {\n                    text: \"{.computedTitle()}\"\n                    padding: 0 0 10 0\n                    font: 16\n                }\n\n                Spacer\n\n\n                Map {\n                    margin: 0 0 10 0\n                    maxWidth: 150\n                    minHeight: 150\n                    maxHeight: 150\n                    border: #dddddd 1\n                    cornerRadius: 10\n                    addressKey: \"self\"\n                }\n            }\n\n            HStack {\n                show: {{!readOnly}}\n\n                EditorLabel {\n                    title: \"{edge.label or edge.type}\"\n                    hierarchy: \"Address\"\n                    edge: {{edge}}\n                }\n\n                VStack {\n                    Textfield {\n                        value: {{.street}}\n                        rows: 2\n                        hint: \"Street\"\n                    }\n\n                    Textfield {\n                        value: {{.city}}\n                        hint: \"City\"\n                    }\n\n                    HStack {\n                        Textfield {\n                            value: {{.state}}\n                            hint: \"State\"\n                        }\n\n                        Textfield {\n                            value: {{.postalCode}}\n                            hint: \"Zip\"\n                        }\n                    }\n\n                    Picker {\n                        value: {{.country}}\n                        title: \"Select a country\"\n                        query: \"Country\"\n                        emptyValue: \"Country\"\n                        defaultValue: \"{me.address[primary = true].country}\"\n                    }\n                }\n            }\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "selector": "Address[]",
    "starred": false,
    "type": "view",
    "uid": 1000000850,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346671.5542,
    "dateModified": 1594303347383.656,
    "definition": "Address {\n    contextButtons: star schedule\n    defaultRenderer: \"generalEditor\"\n    editActionButton: toggleEditMode\n    title: \"Address\"\n\n    [renderer = generalEditor] {\n        layout: [\n            {\n                section: \"location\"\n            }\n            {\n                section: \"labels\"\n            }\n            {\n                section: \"address\"\n                fields: \"street\" \"city\" \"state\" \"postalCode\" \"country\"\n            }\n            {\n                section: \"other\"\n                fields: \"*\"\n            }\n            {\n                section: \"dates\"\n            }\n        ]\n        \n        country: {\n            VStack {\n                Text {\n                    text: \"{.country.name}\"\n                    show: {{readOnly}}\n                }\n\n                Picker {\n                    value: {{.country}}\n                    show: {{!readOnly}}\n                    empty: \"Country\"\n                    defaultValue: {{me.address[primary = true].country}}\n\n                    [datasource = pod] {\n                        query: \"Country\"\n                        sortProperty: \"name\"\n                    }\n                }\n            }\n        }\n        \n        labels: {\n            VStack {\n                padding: 10 36 10 36\n\n                Text {\n                    text: \"no labels yet\"\n                    show: {{ !.label }}\n                }\n\n                FlowStack {\n                    list: {{ .label[] }}\n\n                    Button {\n                        press: openViewByName {\n                            arguments: {\n                                viewArguments: {\n                                    uid: {{.uid}}\n                                    name: \"{.name}\"\n                                }\n                                name: \"all-items-with-label\"\n                            }\n                        }\n\n                        VStack {\n                            cornerRadius: 5\n                            background: {{.color}}\n\n                            Text {\n                                text: \"{.computedTitle()}\"\n                                padding: 5 8 5 8\n                                font: 16 semibold\n                                color: #ffffff\n                            }\n                        }\n                    }\n                }\n            }\n        }\n        \n        location: {\n            showTitle: false\n\n            Map {\n                minHeight: 150\n                maxHeight: 150\n                addressKey: \"self\"\n            }\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "selector": "Address",
    "starred": false,
    "type": "view",
    "uid": 1000000852,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346675.595,
    "dateModified": 1594303347385.582,
    "definition": "[session = all-labels] {\n    [view] {\n        title: \"All Labels\"\n\n        [datasource = pod] {\n            query: \"Label\"\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "all-labels",
    "selector": "[session = all-labels]",
    "starred": false,
    "type": "session",
    "uid": 1000000854,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346690.025,
    "dateModified": 1594303347397.835,
    "definition": "Label[] {\n    actionButton: addItem {\n        arguments: {\n            type: \"label\"\n            name: \"new label\"\n        }\n    }\n    defaultRenderer: \"thumbnail\"\n    editActionButton: toggleEditMode\n    emptyResultText: \"You have not added any labels yet\"\n    filterButtons: showStarred toggleFilterPanel\n    name: \"all-labels\"\n    title: \"All Labels\"\n\n    [datasource = pod] {\n        query: \"label\"\n        sortAscending: true\n        sortProperty: \"dateCreated\"\n    }\n\n    [renderer = list] {\n        VStack {\n            rowInset: 7 20 -7 20\n\n            HStack {\n                padding: 5 0 5 0\n                alignment: center\n\n                VStack {\n                    spacing: 5\n                    alignment: left\n\n                    Text {\n                        text: \"{.name}\"\n                        bold: true\n                    }\n\n                    Text {\n                        text: \"{.comment}\"\n                        removeWhiteSpace: true\n                        maxChar: 100\n                    }\n                }\n\n                Spacer\n\n\n                RoundedRectangle {\n                    padding: 0 10 0 0\n                    maxWidth: 25\n                    maxHeight: 25\n                    align: center\n                    color: {{.color}}\n                }\n            }\n        }\n    }\n\n[renderer = thumbnail] {\n        edgeInset: 10\n        spacing: 10\n\n        VStack {\n            VStack {\n                spacing: 5\n                alignment: center\n\n                HStack {\n                    cornerRadius: 5\n                    color: #ffffff\n                    background: {{.color}}\n\n                    Spacer\n\n\n                    Text {\n                        text: \"{.name}\"\n                        padding: 3 0 3 0\n                        bold: true\n                    }\n\n                    Spacer\n\n                }\n\n                Text {\n                    text: \"{.comment}\"\n                    removeWhiteSpace: true\n                    maxChar: 100\n                    font: 10\n                    alignment: left\n                }\n            }\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "selector": "Label[]",
    "starred": false,
    "type": "view",
    "uid": 1000000856,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346694.496,
    "dateModified": 1594303347399.8142,
    "definition": "[session = all-sessions] {\n    [view] {\n        title: \"All Sessions\"\n\n        [datasource = pod] {\n            query: \"Session\"\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "all-sessions",
    "selector": "[session = all-sessions]",
    "starred": false,
    "type": "session",
    "uid": 1000000858,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346712.1711,
    "dateModified": 1594303347415.056,
    "definition": "Session[] {\n    defaultRenderer: \"thumbnail\"\n    editActionButton: toggleEditMode\n    emptyResultText: \"There are no sessions here yet\"\n    filterButtons: showStarred toggleFilterPanel\n    name: \"all-sessions\"\n    sortFields: \"title\" \"dateModified\" \"dateAccessed\" \"dateCreated\"\n    title: \"All Sessions\"\n\n    [datasource = pod] {\n        query: \"session\"\n        sortAscending: false\n        sortProperty: \"dateAccessed\"\n    }\n\n    [renderer = list] {\n        press: openSession\n\n        VStack {\n            rowInset: 12 20 -12 20\n            alignment: left\n\n            HStack {\n                VStack {\n                    Text {\n                        text: \"Name: {.name}\"\n                        padding: 5 0 0 0\n                        font: 18 semibold\n                        color: #333333\n                    }\n\n                    Text {\n                        text: \"Accessed: {.dateModified}\"\n                        padding: 5 0 5 0\n                        font: 11 regular\n                        color: #888888\n                    }\n                }\n\n                Spacer\n\n\n                Image {\n                    resizable: \"fill\"\n                    padding: -5 0 0 0\n                    image: {{.screenshot}}\n                    maxWidth: 150\n                    maxHeight: 150\n                    border: #cccccc 1\n                    cornerRadius: 10\n                }\n            }\n        }\n    }\n\n[renderer = thumbnail] {\n        columns: 2\n        edgeInset: 10\n        press: openSession\n        spacing: 20 10\n\n        VStack {\n            padding: 0 0 5 0\n            minWidth: 10\n            alignment: center\n\n            Image {\n                resizable: \"fill\"\n                image: {{.screenshot}}\n                maxHeight: 180\n                border: #cccccc 1\n                cornerRadius: 10\n            }\n\n            Text {\n                text: \"{.name}\"\n                padding: 5 0 0 0\n                maxChar: 100\n                font: 12 semibold\n                color: #333333\n            }\n\n            Text {\n                text: \"{.dateModified}\"\n                padding: 3 0 0 0\n                font: 9 regular\n                color: #888888\n            }\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "selector": "Session[]",
    "starred": false,
    "type": "view",
    "uid": 1000000860,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346716.3413,
    "dateModified": 1594303347417.2612,
    "definition": "[renderer = map] {\n    press: openView\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "map",
    "selector": "[renderer = map]",
    "starred": false,
    "type": "renderer",
    "uid": 1000000862,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346720.381,
    "dateModified": 1594303347419.171,
    "definition": "[renderer = list] {\n    longPress: noop\n    press: openView\n    slideLeftActions: delete\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "list",
    "selector": "[renderer = list]",
    "starred": false,
    "type": "renderer",
    "uid": 1000000864,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346724.144,
    "dateModified": 1594303347421.155,
    "definition": "[session = all-people] {\n    [view] {\n        title: \"All People\"\n\n        [datasource = pod] {\n            query: \"Person\"\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "all-people",
    "selector": "[session = all-people]",
    "starred": false,
    "type": "session",
    "uid": 1000000866,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346728.32,
    "dateModified": 1594303347422.934,
    "definition": "[language = English] {\n    addtolist: \"Add to list...\"\n    all: \"All\"\n    duplicate: \"Duplicate\"\n    sharewith: \"Share with...\"\n    showtimeline: \"Show Timeline\"\n    starred: \"Starred\"\n    timelineof: \"Timeline of this\"\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "English",
    "selector": "[language = English]",
    "starred": false,
    "type": "language",
    "uid": 1000000868,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346732.281,
    "dateModified": 1594303347425.204,
    "definition": "[language = Dutch] {\n    addtolist: \"Voeg toe aan lijst...\"\n    all: \"Alle\"\n    duplicate: \"Dupliceer\"\n    sharewith: \"Deel met...\"\n    showtimeline: \"Toon Tijdslijn\"\n    starred: \"Favoriete\"\n    timelineof: \"Tijdslijn van deze\"\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "Dutch",
    "selector": "[language = Dutch]",
    "starred": false,
    "type": "language",
    "uid": 1000000870,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346738.828,
    "dateModified": 1594303347428.94,
    "definition": ".defaultButtonsForItem {\n    actionItems: [\n        noop {\n            title: \"{$sharewith}\"\n        }\n        noop {\n            title: \"{$addtolist}\"\n        }\n        duplicate {\n            title: \"{$duplicate} {type}\"\n        }\n    ]\n    contextButtons: star schedule\n    editActionButton: toggleEditMode\n    filterButtons: [\n        openView {\n            arguments: {\n                view: {\n                    defaultRenderer: \"timeline\"\n\n                    [datasource = pod] {\n                        query: \"AuditItem appliesTo:{.id}\"\n                        sortAscending: true\n                        sortProperty: \"dateCreated\"\n                    }\n\n                    [renderer = timeline] {\n                        timeProperty: \"dateCreated\"\n                    }\n                }\n            }\n            icon: \"increase.indent\"\n            title: \"{$showtimeline}\"\n        }\n        showContextPane\n    ]\n    navigateItems: [\n        openView {\n            arguments: {\n                view: {\n                    defaultRenderer: \"timeline\"\n\n                    [datasource = pod] {\n                        query: \"AuditItem appliesTo:{.id}\"\n                        sortAscending: true\n                        sortProperty: \"dateCreated\"\n                    }\n\n                    [renderer = timeline] {\n                        timeProperty: \"dateCreated\"\n                    }\n                }\n            }\n            title: \"{$timelineof} {type.lowercased()}\"\n        }\n        openViewByName {\n            arguments: {\n                viewArguments: {\n                    include: \"all-{type}\"\n                }\n                name: \"filter-starred\"\n            }\n            title: \"{$starred} {type.plural()}\"\n        }\n        openViewByName {\n            name: \"all-{type}\"\n            title: \"{$all} {type.lowercased().plural()}\"\n        }\n    ]\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "defaultButtonsForItem",
    "selector": ".defaultButtonsForItem",
    "starred": false,
    "type": "view",
    "uid": 1000000872,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346805.1702,
    "dateModified": 1594303347490.0232,
    "definition": "Person {\n    actionItems: [\n        noop {\n            title: \"{$sharewith}\"\n        }\n        noop {\n            title: \"{$addtolist}\"\n        }\n        duplicate {\n            title: \"{$duplicate} person\"\n        }\n    ]\n    contextButtons: star schedule\n    defaultRenderer: \"generalEditor\"\n    editActionButton: toggleEditMode\n    filterButtons: [\n        openView {\n            arguments: {\n                view: {\n                    defaultRenderer: \"timeline\"\n\n                    [datasource = pod] {\n                        query: \"AuditItem appliesTo:{.id}\"\n                        sortAscending: true\n                        sortProperty: \"dateCreated\"\n                    }\n\n                    [renderer = timeline] {\n                        timeProperty: \"dateCreated\"\n                    }\n                }\n            }\n            icon: \"increase.indent\"\n            title: \"{$showtimeline}\"\n        }\n        showContextPane\n    ]\n    navigateItems: [\n        openView {\n            arguments: {\n                view: {\n                    defaultRenderer: \"timeline\"\n\n                    [datasource = pod] {\n                        query: \"AuditItem appliesTo:{.id}\"\n                        sortAscending: true\n                        sortProperty: \"dateCreated\"\n                    }\n\n                    [renderer = timeline] {\n                        timeProperty: \"dateCreated\"\n                    }\n                }\n            }\n            title: \"{$timelineof} person\"\n        }\n        openViewByName {\n            arguments: {\n                viewArguments: {\n                    include: \"all-person\"\n                }\n                name: \"filter-starred\"\n            }\n            title: \"{$starred} persons\"\n        }\n        openViewByName {\n            name: \"all-person\"\n            title: \"{$all} persons\"\n        }\n    ]\n    title: \"{.firstName} {.lastName}\"\n\n    [renderer = generalEditor] {\n        layout: [\n            {\n                section: \"profilePicture\"\n            }\n            {\n                section: \"labels\"\n            }\n            {\n                section: \"names\"\n                fields: \"firstName\" \"lastName\"\n            }\n            {\n                section: \"picturesOfPerson\"\n            }\n            {\n                type: \"PhoneNumber\"\n                section: \"phoneNumbers\"\n                edges: \"hasPhoneNumber\"\n            }\n            {\n                type: \"Person\"\n                section: \"relationships\"\n                edges: \"relationship\"\n            }\n            {\n                type: \"Address\"\n                section: \"addresses\"\n                edges: \"address\"\n            }\n            {\n                type: \"Website\"\n                section: \"websites\"\n                edges: \"website\"\n            }\n            {\n                type: \"Company\"\n                section: \"companies\"\n                edges: \"company\"\n            }\n            {\n                type: \"Diet\"\n                section: \"diets\"\n                edges: \"diet\"\n            }\n            {\n                type: \"MedicalCondition\"\n                section: \"medicalConditions\"\n                edges: \"medicalCondition\"\n            }\n            {\n                type: \"PublicKey\"\n                section: \"publicKeys\"\n                edges: \"publicKey\"\n            }\n            {\n                type: \"OnlineProfile\"\n                section: \"onlineProfiles\"\n                edges: \"onlineProfile\"\n            }\n            {\n                section: \"other\"\n                fields: \"*\"\n            }\n            {\n                section: \"dates\"\n            }\n        ]\n        \n        labels: {\n            showTitle: false\n            dividers: false\n\n            VStack {\n                padding: 10 36 5 36\n\n                Text {\n                    text: \"no labels yet\"\n                    show: {{ !.label }}\n                }\n\n                FlowStack {\n                    list: {{ .label[] }}\n\n                    Button {\n                        press: openViewByName {\n                            arguments: {\n                                uid: {{.uid}}\n                                name: \"{.name}\"\n                            }\n                            name: \"all-items-with-label\"\n                        }\n\n                        VStack {\n                            cornerRadius: 5\n                            background: {{.color}}\n\n                            Text {\n                                text: \"{.name}\"\n                                padding: 5 8 5 8\n                                font: 16 semibold\n                                color: #ffffff\n                            }\n                        }\n                    }\n                }\n            }\n        }\n        \n        onlineProfiles: {\n            EditorRow {\n                title: \"{.type}\"\n\n                VStack {\n                    cornerRadius: 5\n\n                    Text {\n                        text: \"{.handle}\"\n                    }\n                }\n            }\n        }\n        \n        picturesOfPerson: {\n            title: \"Photos of {.computedTitle()}\"\n\n            SubView {\n                view: {\n                    defaultRenderer: \"thumbnail.horizontalgrid\"\n\n                    [datasource = pod] {\n                        query: \"Photo AND ANY allEdges.targetItemID = {.uid}\"\n                    }\n\n                    [renderer = thumbnail.horizontalgrid] {\n                        allowBounce: false\n                        columns: 2\n                        edgeInset: 0\n                    }\n                }\n                minHeight: 165\n                arguments: {\n                    toolbar: false\n                    searchbar: false\n                    readOnly: true\n                }\n            }\n        }\n        \n        profilePicture: {\n            showTitle: false\n\n            ZStack {\n                alignment: center\n\n                Image {\n                    resizable: \"fill\"\n                    opacity: 0.6\n                    image: {{.profilePicture}}\n                    minHeight: 250\n                    maxHeight: 250\n                    align: center\n                    border: #cccccc 1\n                }\n\n                ZStack {\n                    padding: 12\n                    maxWidth: 140\n                    maxHeight: 140\n                    align: center\n                    border: #ffffff 27\n                    cornerRadius: 100\n\n                    Image {\n                        resizable: \"fill\"\n                        image: {{.profilePicture}}\n                    }\n\n                    HStack {\n                        show: {{!readOnly}}\n                        maxWidth: 140\n                        maxHeight: 140\n                        align: center\n\n                        Action {\n                            press: openViewByName {\n                                arguments: {\n                                    viewArguments: {\n                                        type: \"Photo\"\n                                        title: \"Choose a photo\"\n                                        subject: {{.}}\n                                        renderer: \"thumbnail\"\n                                        query: \"Photo\"\n                                        edgeType: \"profilePicture\"\n                                        distinct: true\n                                    }\n                                    name: \"choose-item-by-query\"\n                                }\n                                renderAs: popup\n                                title: \"Edit\"\n                            }\n                            maxWidth: 50\n                            maxHeight: 50\n                            align: center\n                            font: 14 regular\n                            cornerRadius: 25\n                            color: #434343\n                            background: #eeeeee\n                        }\n                    }\n                }\n            }\n        }\n        \n        publicKeys: {\n            EditorRow {\n                title: \"{.name}\"\n\n                Text {\n                    text: \"{.key}\"\n                }\n            }\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "selector": "Person",
    "starred": false,
    "type": "view",
    "uid": 1000000874,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346824.071,
    "dateModified": 1594303347505.848,
    "definition": "Person[] {\n    actionButton: addItem {\n        arguments: {\n            template: {\n                _type: \"Person\"\n            }\n        }\n    }\n    defaultRenderer: \"thumbnail\"\n    editActionButton: toggleEditMode\n    emptyResultText: \"There are no people here yet\"\n    filterButtons: showStarred toggleFilterPanel\n    title: \"All People\"\n\n    [datasource = pod] {\n        query: \"Person\"\n        sortProperty: \"dateModified\"\n    }\n\n    [renderer = list] {\n        VStack {\n            padding: 5 0 0 20\n            alignment: left\n\n            HStack {\n                alignment: center\n\n                ZStack {\n                    padding: 12\n                    margin: 5 15 9 0\n                    maxWidth: 25\n                    maxHeight: 25\n                    align: center\n                    cornerRadius: 30\n\n                    Image {\n                        resizable: \"fill\"\n                        image: {{.profilePicture}}\n                        minHeight: 60\n                        maxHeight: 60\n                    }\n                }\n\n                VStack {\n                    Text {\n                        text: \"{.firstName} {.lastName}\"\n                        padding: 0 0 3 0\n                        font: 18 semibold\n                        color: #333333\n                    }\n\n                    Text {\n                        text: \"{.relation[.firstName = 'Alice'].lastName}\"\n                        padding: 0 0 5 0\n                        font: 14 regular\n                        color: #888888\n                    }\n                }\n            }\n        }\n    }\n\n[renderer = thumbnail] {\n        edgeInset: 10\n        spacing: 10\n\n        VStack {\n            alignment: center\n\n            Image {\n                resizable: \"fit\"\n                image: {{.profilePicture}}\n                cornerRadius: 10\n            }\n\n            Text {\n                textAlign: center\n                text: \"{.firstName} {.lastName}\"\n                padding: 3 0 0 0\n                font: 12 semibold\n                color: #333333\n            }\n        }\n    }\n\n[renderer = map] {\n        addressKey: \"addresses\"\n        labelKey: \"firstName\"\n    }\n\n[renderer = chart] {\n        chartTitle: \"People by height\"\n        hideGridlines: true\n        label: \"{.firstName}\"\n        sortAscending: true\n        sortProperty: \"height\"\n        yAxis: \"{.height}\"\n        yAxisStartAtZero: true\n    }\n\n[renderer = chart.line] {\n        chartSubtitle: \"A demo of dynamically graphing your data.\"\n        chartTitle: \"Height vs. Age\"\n        label: \"{.firstName}\"\n        xAxis: \"{.age}\"\n        yAxis: \"{.height}\"\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "selector": "Person[]",
    "starred": false,
    "type": "view",
    "uid": 1000000876,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346828.4353,
    "dateModified": 1594303347507.698,
    "definition": "[renderer = chart] {\n    press: openView\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "chart",
    "selector": "[renderer = chart]",
    "starred": false,
    "type": "renderer",
    "uid": 1000000878,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346832.492,
    "dateModified": 1594303347509.361,
    "definition": "[session = all-indexer-instances] {\n    [view] {\n        title: \"All IndexerRuns\"\n\n        [datasource = pod] {\n            query: \"IndexerRun\"\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "all-indexer-instances",
    "selector": "[session = all-indexer-instances]",
    "starred": false,
    "type": "session",
    "uid": 1000000880,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346870.848,
    "dateModified": 1594303347542.8413,
    "definition": "IndexerRun {\n    contextButtons: star schedule\n    defaultRenderer: \"generalEditor\"\n    editActionButton: toggleEditMode\n    filterButtons: [\n        openView {\n            arguments: {\n                view: {\n                    defaultRenderer: \"timeline\"\n\n                    [datasource = pod] {\n                        query: \"AuditItem appliesTo:{.id}\"\n                        sortAscending: true\n                        sortProperty: \"dateCreated\"\n                    }\n\n                    [renderer = timeline] {\n                        timeProperty: \"dateCreated\"\n                    }\n                }\n            }\n            icon: \"increase.indent\"\n            title: \"Show Timeline\"\n        }\n        showContextPane\n    ]\n    navigateItems: [\n        openView {\n            arguments: {\n                view: {\n                    defaultRenderer: \"timeline\"\n\n                    [datasource = pod] {\n                        query: \"AuditItem appliesTo:{.id}\"\n                        sortAscending: true\n                        sortProperty: \"dateCreated\"\n                    }\n\n                    [renderer = timeline] {\n                        timeProperty: \"dateCreated\"\n                    }\n                }\n            }\n            title: \"Timeline of this indexer run\"\n        }\n        openViewByName {\n            arguments: {\n                viewArguments: {\n                    include: \"all-notes\"\n                }\n                name: \"filter-starred\"\n            }\n            title: \"Starred indexer runs\"\n        }\n        openViewByName {\n            name: \"all-indexer-instances\"\n            title: \"All indexer runs\"\n        }\n    ]\n    title: \"{.name}\"\n\n    [renderer = generalEditor] {\n        layout: [\n            {\n                section: \"iconHeading\"\n            }\n            {\n                section: \"info\"\n                exclude: \"name\" \"run\"\n            }\n            {\n                section: \"labels\"\n            }\n            {\n                section: \"other\"\n                fields: \"*\"\n            }\n            {\n                section: \"dates\"\n            }\n        ]\n        \n        iconHeading: {\n            showTitle: false\n            dividers: false\n\n            HStack {\n                show: {{ .indexer.icon or .indexer.bundleImage }}\n                padding: 20 0 20 0\n                align: center\n\n                Image {\n                    systemName: {{.indexer.icon}}\n                    show: {{.indexer.icon}}\n                    resizable: \"fill\"\n                    padding: 8 0 8 0\n                    maxWidth: 100\n                    maxHeight: 100\n                    align: center\n                    color: #d64f4f\n                }\n\n                Image {\n                    show: {{!.indexer.icon}}\n                    resizable: \"fill\"\n                    minWidth: 100\n                    maxWidth: 100\n                    minHeight: 100\n                    maxHeight: 100\n                    align: center\n                    color: #2480d6\n                    bundleImage: {{.indexer.bundleImage}}\n                }\n            }\n        }\n        \n        info: {\n            showTitle: false\n            dividers: false\n\n            VStack {\n                Divider\n\n\n                EditorRow {\n                    title: \"Name\"\n                    readOnly: true\n\n                    Text {\n                        text: {{.name}}\n                    }\n                }\n\n                EditorRow {\n                    Text {\n                        text: {{.indexer.itemDescription}}\n                        padding: 8 36 8 0\n                        font: 14 regular\n                        color: #555555\n                    }\n\n                    Divider\n\n                }\n\n                HStack {\n                    align: left\n                    background: #f9f9f9\n\n                    Button {\n                        press: runIndexerRun {\n                            arguments: {\n                                indexerRun: {{.}}\n                            }\n                        }\n                        margin: 0 5 10 35\n\n                        Text {\n                            text: \"START RUN\"\n                            padding: 5 8 5 8\n                            font: 16 semibold\n                            cornerRadius: 5\n                            color: #ffffff\n                            background: #70ba6c\n                        }\n                    }\n\n                    Button {\n                        press: setProperty {\n                            arguments: {\n                                value: 565\n                                subject: {{.}}\n                                property: \"progress\"\n                            }\n                        }\n                        margin: 0 5 10 35\n\n                        Text {\n                            text: \"TEST\"\n                            padding: 5 8 5 8\n                            font: 16 semibold\n                            cornerRadius: 5\n                            color: #ffffff\n                            background: #70ba6c\n                        }\n                    }\n                }\n\n                Divider\n\n            }\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "selector": "IndexerRun",
    "starred": false,
    "type": "view",
    "uid": 1000000882,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346878.5142,
    "dateModified": 1594303347548.377,
    "definition": "IndexerRun[] {\n    actionButton: addItem {\n        arguments: {\n            template: {\n                name: {{.name}}\n                _type: \"IndexerRunInstance\"\n            }\n        }\n    }\n    defaultRenderer: \"thumbnail\"\n    editActionButton: toggleEditMode\n    emptyResultText: \"There are no IndexerRuns\"\n    filterButtons: showStarred toggleFilterPanel\n    name: \"all-indexer-instances\"\n    sortFields: \"datatype\" \"dateModified\" \"dateAccessed\" \"dateCreated\"\n    title: \"All IndexerRuns\"\n\n    [datasource = pod] {\n        query: \"IndexerRun\"\n        sortAscending: false\n        sortProperty: \"dateModified\"\n    }\n\n    [renderer = thumbnail] {\n        VStack {\n            rowInset: 12 20 -12 20\n            alignment: left\n\n            Text {\n                text: \"{.name}\"\n                padding: 0 0 3 0\n                font: 18 semibold\n                color: #333333\n            }\n\n            Text {\n                text: \"{.datatype}\"\n                removeWhiteSpace: true\n                maxChar: 100\n                font: 14 regular\n                color: #555555\n            }\n\n            Text {\n                text: \"{.dateModified}\"\n                padding: 8 0 5 0\n                font: 11 regular\n                color: #888888\n            }\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "selector": "IndexerRun[]",
    "starred": false,
    "type": "view",
    "uid": 1000000884,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346893.249,
    "dateModified": 1594303347559.593,
    "definition": "[renderer = generalEditor] {\n    layout: [\n        {\n            section: \"labels\"\n        }\n        {\n            section: \"other\"\n            fields: \"*\"\n            exclude: \"version\" \"deleted\" \"syncState\" \"uid\" \"externalID\" \"allEdges\"\n        }\n        {\n            section: \"dates\"\n            readOnly: true\n            exclude: \"dateCreated\" \"dateModified\" \"dateAccessed\" \"changelog\"\n        }\n    ]\n    \n    dates: {\n        showTitle: false\n        dividers: false\n\n        Text {\n            textAlign: center\n            text: \"{.describeChangelog()}\"\n            padding: 30 40 40 40\n            maxChar: 300\n            font: 13\n            color: #999999\n            alignment: center\n        }\n    }\n    \n    labels: {\n        EditorRow {\n            Text {\n                text: \"No labels yet\"\n                show: {{ !.label }}\n                padding: 10 0 5 0\n                color: #777777\n            }\n\n            FlowStack {\n                list: {{ .label[] }}\n\n                Button {\n                    press: openViewByName {\n                        arguments: {\n                            uid: {{.uid}}\n                            name: \"{.name}\"\n                        }\n                        name: \"all-items-with-label\"\n                    }\n\n                    VStack {\n                        cornerRadius: 5\n                        background: {{.color}}\n\n                        Text {\n                            text: \"{.name}\"\n                            padding: 5 8 5 8\n                            font: 16 semibold\n                            color: #ffffff\n                        }\n                    }\n                }\n            }\n        }\n    }\n    \n    starred: {\n        Action {\n            press: star\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "generalEditor",
    "selector": "[renderer = generalEditor]",
    "starred": false,
    "type": "renderer",
    "uid": 1000000886,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346898.0242,
    "dateModified": 1594303347561.634,
    "definition": "[session = all-importer-instances] {\n    [view] {\n        title: \"All ImporterRuns\"\n\n        [datasource = pod] {\n            query: \"ImporterRun\"\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "all-importer-instances",
    "selector": "[session = all-importer-instances]",
    "starred": false,
    "type": "session",
    "uid": 1000000888,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346919.6338,
    "dateModified": 1594303347580.729,
    "definition": "ImporterRun {\n    contextButtons: star schedule\n    defaultRenderer: \"generalEditor\"\n    editActionButton: toggleEditMode\n    filterButtons: [\n        openView {\n            arguments: {\n                view: {\n                    defaultRenderer: \"timeline\"\n\n                    [datasource = pod] {\n                        query: \"AuditItem appliesTo:{.id}\"\n                        sortAscending: true\n                        sortProperty: \"dateCreated\"\n                    }\n\n                    [renderer = timeline] {\n                        timeProperty: \"dateCreated\"\n                    }\n                }\n            }\n            icon: \"increase.indent\"\n            title: \"Show Timeline\"\n        }\n        showContextPane\n    ]\n    navigateItems: [\n        openView {\n            arguments: {\n                view: {\n                    defaultRenderer: \"timeline\"\n\n                    [datasource = pod] {\n                        query: \"AuditItem appliesTo:{.id}\"\n                        sortAscending: true\n                        sortProperty: \"dateCreated\"\n                    }\n\n                    [renderer = timeline] {\n                        timeProperty: \"dateCreated\"\n                    }\n                }\n            }\n            title: \"Timeline of this importer run\"\n        }\n        openViewByName {\n            arguments: {\n                viewArguments: {\n                    include: \"all-notes\"\n                }\n                name: \"filter-starred\"\n            }\n            title: \"Starred importer runs\"\n        }\n        openViewByName {\n            name: \"all-importer-instances\"\n            title: \"All importer runs\"\n        }\n    ]\n    title: \"{.name} importer run\"\n\n    [renderer = generalEditor] {\n        layout: [\n            {\n                section: \"iconHeading\"\n            }\n            {\n                section: \"name\"\n                readOnly: true\n            }\n            {\n                section: \"run\"\n            }\n            {\n                section: \"labels\"\n            }\n            {\n                section: \"other\"\n                fields: \"*\"\n            }\n            {\n                section: \"dates\"\n            }\n        ]\n        \n        iconHeading: {\n            showTitle: false\n\n            HStack {\n                padding: 30 0 0 0\n                align: center\n\n                Image {\n                    systemName: {{.importer.icon}}\n                    show: {{.importer.icon}}\n                    resizable: \"fill\"\n                    maxWidth: 100\n                    maxHeight: 100\n                    align: center\n                    color: #2480d6\n                }\n\n                Image {\n                    show: {{!.importer.icon and .importer.bundleImage}}\n                    resizable: \"fill\"\n                    minWidth: 100\n                    maxWidth: 100\n                    minHeight: 100\n                    maxHeight: 100\n                    align: center\n                    color: #2480d6\n                    bundleImage: {{.importer.bundleImage}}\n                }\n            }\n        }\n        \n        run: {\n            showTitle: false\n\n            VStack {\n                HStack {\n                    align: left\n                    background: #f9f9f9\n\n                    Button {\n                        press: runImporterRun {\n                            arguments: {\n                                importerRun: {{.}}\n                            }\n                        }\n                        margin: 5 5 5 35\n\n                        Text {\n                            text: \"START RUN\"\n                            padding: 5 8 5 8\n                            font: 16 semibold\n                            cornerRadius: 5\n                            color: #ffffff\n                            background: #70ba6c\n                        }\n                    }\n                }\n\n                Divider\n\n            }\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "selector": "ImporterRun",
    "starred": false,
    "type": "view",
    "uid": 1000000890,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346927.819,
    "dateModified": 1594303347585.6929,
    "definition": "ImporterRun[] {\n    actionButton: addItem {\n        arguments: {\n            template: {\n                name: {{.name}}\n                _type: \"ImporterRunInstance\"\n            }\n        }\n    }\n    defaultRenderer: \"thumbnail\"\n    editActionButton: toggleEditMode\n    emptyResultText: \"There are no ImporterRuns\"\n    filterButtons: showStarred toggleFilterPanel\n    name: \"all-importer-instances\"\n    sortFields: \"datatype\" \"dateModified\" \"dateAccessed\" \"dateCreated\"\n    title: \"All ImporterRuns\"\n\n    [datasource = pod] {\n        query: \"ImporterRun\"\n        sortAscending: false\n        sortProperty: \"dateModified\"\n    }\n\n    [renderer = thumbnail] {\n        VStack {\n            rowInset: 12 20 -12 20\n            alignment: left\n\n            Text {\n                text: \"{.name}\"\n                padding: 0 0 3 0\n                font: 18 semibold\n                color: #333333\n            }\n\n            Text {\n                text: \"{.datatype}\"\n                removeWhiteSpace: true\n                maxChar: 100\n                font: 14 regular\n                color: #555555\n            }\n\n            Text {\n                text: \"{.dateModified}\"\n                padding: 8 0 5 0\n                font: 11 regular\n                color: #888888\n            }\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "selector": "ImporterRun[]",
    "starred": false,
    "type": "view",
    "uid": 1000000892,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346932.77,
    "dateModified": 1594303347587.954,
    "definition": "[sessions = defaultSessions] {\n    currentSessionIndex: 0\n\n    [session] {\n        currentViewIndex: 4\n\n        [view] {\n            [datasource = pod] {\n                query: \"Label\"\n            }\n        }\n\n    [view] {\n            [datasource = pod] {\n                query: \"Person\"\n            }\n        }\n\n    [view] {\n            [datasource = pod] {\n                query: \"Session\"\n            }\n        }\n\n    [view] {\n            [datasource = pod] {\n                query: \"AuditItem\"\n            }\n        }\n\n    [view] {\n            [datasource = pod] {\n                query: \"Note\"\n            }\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "defaultSessions",
    "selector": "[sessions = defaultSessions]",
    "starred": false,
    "type": "sessions",
    "uid": 1000000894,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346936.686,
    "dateModified": 1594303347590.176,
    "definition": "[session = all-notes] {\n    [view] {\n        title: \"All Notes\"\n\n        [datasource = pod] {\n            query: \"Note\"\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "all-notes",
    "selector": "[session = all-notes]",
    "starred": false,
    "type": "session",
    "uid": 1000000896,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346943.8538,
    "dateModified": 1594303347595.7131,
    "definition": "Note {\n    actionItems: [\n        noop {\n            title: \"Share with...\"\n        }\n        noop {\n            title: \"Add to list...\"\n        }\n        duplicate {\n            title: \"Duplicate Note\"\n        }\n    ]\n    contextButtons: star schedule\n    defaultRenderer: \"custom\"\n    editActionButton: toggleEditMode\n    filterButtons: [\n        openView {\n            arguments: {\n                view: {\n                    defaultRenderer: \"timeline\"\n\n                    [datasource = pod] {\n                        query: \"AuditItem appliesTo:{.id}\"\n                        sortAscending: true\n                        sortProperty: \"dateCreated\"\n                    }\n\n                    [renderer = timeline] {\n                        timeProperty: \"dateCreated\"\n                    }\n                }\n            }\n            icon: \"increase.indent\"\n            title: \"Show Timeline\"\n        }\n        showContextPane\n    ]\n    navigateItems: [\n        openView {\n            arguments: {\n                view: {\n                    defaultRenderer: \"timeline\"\n\n                    [datasource = pod] {\n                        query: \"AuditItem appliesTo:{.id}\"\n                        sortAscending: true\n                        sortProperty: \"dateCreated\"\n                    }\n\n                    [renderer = timeline] {\n                        timeProperty: \"dateCreated\"\n                    }\n                }\n            }\n            title: \"Timeline of this note\"\n        }\n        openViewByName {\n            arguments: {\n                viewArguments: {\n                    include: \"all-notes\"\n                }\n                name: \"filter-starred\"\n            }\n            title: \"Starred notes\"\n        }\n        openViewByName {\n            name: \"all-notes\"\n            title: \"All notes\"\n        }\n    ]\n    title: {{.title or \"Untitled\" }}\n\n    [renderer = custom] {\n        RichTextfield {\n            value: {{.textContent}}\n            titleHint: \"Untitled Note\"\n            title: {{.title}}\n            htmlValue: {{.content}}\n            fontSize: 18\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "selector": "Note",
    "starred": false,
    "type": "view",
    "uid": 1000000898,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346960.4878,
    "dateModified": 1594303347609.339,
    "definition": "Note[] {\n    actionButton: addItem {\n        arguments: {\n            template: {\n                _type: \"Note\"\n            }\n        }\n    }\n    defaultRenderer: \"list\"\n    editActionButton: toggleEditMode\n    emptyResultText: \"There are no notes here yet\"\n    filterButtons: showStarred toggleFilterPanel\n    name: \"all-notes\"\n    sortFields: \"title\" \"dateModified\" \"dateAccessed\" \"dateCreated\"\n    title: \"All Notes\"\n\n    [datasource = pod] {\n        query: \"Note\"\n        sortAscending: false\n        sortProperty: \"dateModified\"\n    }\n\n    [renderer = list] {\n        VStack {\n            spacing: 3\n            alignment: left\n\n            HStack {\n                Text {\n                    text: {{.title or \"Untitled Note\"}}\n                    padding: 0 0 0 0\n                    font: 18 semibold\n                    color: #333333\n                }\n\n                Image {\n                    systemName: \"star.fill\"\n                    show: {{.starred}}\n                    margin: 5\n                    font: 14\n                    color: #eecc00\n                }\n            }\n\n            Text {\n                text: \"{.content.plainString}\"\n                removeWhiteSpace: true\n                maxChar: 100\n                font: 14 regular\n                color: #555555\n            }\n\n            Text {\n                text: \"{.dateModified}\"\n                padding: 0 0 0 0\n                font: 11 regular\n                color: #888888\n            }\n        }\n    }\n\n[renderer = thumbnail] {\n        edgeInset: 10 10 10 10\n        spacing: 10\n\n        VStack {\n            padding: 0 0 5 0\n            minWidth: 10\n            alignment: center\n\n            Text {\n                text: \"{.content.plainString}\"\n                padding: 10\n                maxChar: 100\n                idealHeight: 80\n                minHeight: 40\n                align: \"left\" \"top\"\n                font: 9 regular\n                border: #efefef 2\n                cornerRadius: 10\n                color: #333333\n                background: #ffffff\n                allowNil: true\n            }\n\n            HStack {\n                Text {\n                    text: {{.title or \"Untitled Note\"}}\n                    padding: 5 0 0 0\n                    maxChar: 100\n                    font: 12 semibold\n                    color: #333333\n                }\n\n                Image {\n                    systemName: \"star.fill\"\n                    show: {{.starred}}\n                    margin: 8 0 0 2\n                    font: 10\n                    color: #eecc00\n                }\n            }\n\n            Text {\n                text: \"{.dateModified}\"\n                padding: 3 0 0 0\n                font: 9 regular\n                color: #888888\n            }\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "selector": "Note[]",
    "starred": false,
    "type": "view",
    "uid": 1000000900,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346965.309,
    "dateModified": 1594303347611.4758,
    "definition": "[session = all-audit-items] {\n    [view] {\n        title: \"All Audit Items\"\n\n        [datasource = pod] {\n            query: \"AuditItem\"\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "all-audit-items",
    "selector": "[session = all-audit-items]",
    "starred": false,
    "type": "session",
    "uid": 1000000902,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346973.578,
    "dateModified": 1594303347617.026,
    "definition": "AuditItem[] {\n    defaultRenderer: \"list\"\n    editActionButton: toggleEditMode\n    emptyResultText: \"There are no log entries here yet\"\n    filterButtons: showStarred toggleFilterPanel\n    sortFields: \"date\"\n    title: \"All Log Entries\"\n\n    [datasource = pod] {\n        query: \"audititem\"\n        sortAscending: false\n        sortProperty: \"date\"\n    }\n\n    [renderer = list] {\n        VStack {\n            spacing: 3\n            rowInset: 0 20 0 20\n            padding: 5\n\n            HStack {\n                alignment: center\n\n                Text {\n                    text: \"{.action}\"\n                    font: 14 semibold\n                }\n\n                Spacer\n\n\n                Text {\n                    text: \"{.date}\"\n                    font: 11 regular\n                    color: #888888\n                }\n            }\n\n            Text {\n                text: \"{.contents}\"\n                removeWhiteSpace: true\n                padding: 5\n                maxChar: 100\n                font: 14 light\n                cornerRadius: 5\n                background: #f3f3f3\n            }\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "selector": "AuditItem[]",
    "starred": false,
    "type": "view",
    "uid": 1000000904,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346978.31,
    "dateModified": 1594303347618.986,
    "definition": "[session = all-importers] {\n    [view] {\n        title: \"All Importers\"\n\n        [datasource = pod] {\n            query: \"Importer\"\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "name": "all-importers",
    "selector": "[session = all-importers]",
    "starred": false,
    "type": "session",
    "uid": 1000000906,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346984.818,
    "dateModified": 1594303347622.7732,
    "definition": "Importer {\n    contextButtons: star schedule\n    defaultRenderer: \"generalEditor\"\n    editActionButton: toggleEditMode\n    filterButtons: [\n        openView {\n            arguments: {\n                view: {\n                    defaultRenderer: \"timeline\"\n\n                    [datasource = pod] {\n                        query: \"AuditItem appliesTo:{.id}\"\n                        sortAscending: true\n                        sortProperty: \"dateCreated\"\n                    }\n\n                    [renderer = timeline] {\n                        timeProperty: \"dateCreated\"\n                    }\n                }\n            }\n            icon: \"increase.indent\"\n            title: \"Show Timeline\"\n        }\n        showContextPane\n    ]\n    navigateItems: [\n        openView {\n            arguments: {\n                view: {\n                    defaultRenderer: \"timeline\"\n\n                    [datasource = pod] {\n                        query: \"AuditItem appliesTo:{.id}\"\n                        sortAscending: true\n                        sortProperty: \"dateCreated\"\n                    }\n\n                    [renderer = timeline] {\n                        timeProperty: \"dateCreated\"\n                    }\n                }\n            }\n            title: \"Timeline of this importer\"\n        }\n        openViewByName {\n            arguments: {\n                viewArgument* Connection #0 to host localhost left intacts: {\n                    include: \"all-notes\"\n                }\n                name: \"filter-starred\"\n            }\n            title: \"Starred importers\"\n        }\n        openViewByName {\n            name: \"all-importers\"\n            title: \"All importers\"\n        }\n    ]\n    title: \"{.name}\"\n}",
    "deleted": false,
    "domain": "defaults",
    "selector": "Importer",
    "starred": false,
    "type": "view",
    "uid": 1000000908,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303346994.39,
    "dateModified": 1594303347629.864,
    "definition": "Importer[] {\n    defaultRenderer: \"thumbnail\"\n    emptyResultText: \"There are no Importers\"\n    filterButtons: showStarred toggleFilterPanel\n    name: \"all-importers\"\n    sortFields: \"datatype\" \"dateModified\" \"dateAccessed\" \"dateCreated\"\n    title: \"All Importers\"\n\n    [datasource = pod] {\n        query: \"Importer\"\n        sortAscending: false\n        sortProperty: \"dateModified\"\n    }\n\n    [renderer = thumbnail] {\n        press: addItem {\n            arguments: {\n                template: {\n                    name: {{.name}}\n                    importer: {{.}}\n                    _type: \"ImporterRun\"\n                }\n            }\n        }\n\n        VStack {\n            rowInset: 12 20 -12 20\n            alignment: left\n\n            VStack {\n                padding: 20 0 0 0\n                maxWidth: 60\n                maxHeight: 60\n\n                Image {\n                    systemName: {{.icon}}\n                    show: {{.icon}}\n                    color: #2480d6\n                }\n\n                Image {\n                    show: {{!.icon and .bundleImage}}\n                    resizable: \"fit\"\n                    minWidth: 50\n                    maxWidth: 50\n                    minHeight: 50\n                    maxHeight: 50\n                    color: #2480d6\n                    bundleImage: {{.bundleImage}}\n                }\n            }\n\n            Text {\n                text: \"{.name}\"\n                padding: 0 0 3 0\n                font: 16 semibold\n                color: #333333\n            }\n\n            Text {\n                text: \"{.dateModified}\"\n                padding: 8 0 5 0\n                font: 11 regular\n                color: #888888\n            }\n        }\n    }\n}",
    "deleted": false,
    "domain": "defaults",
    "selector": "Importer[]",
    "starred": false,
    "type": "view",
    "uid": 1000000910,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303347015.172,
    "dateModified": 1594303348801,
    "definition": "[view] {\n    [datasource = pod] {\n        query: \"Label\"\n    }\n}",
    "deleted": false,
    "domain": "user",
    "selector": "[view]",
    "starred": false,
    "type": "view",
    "uid": 1000000917,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303347040.037,
    "dateModified": 1594303348801,
    "definition": "[view] {\n    [datasource = pod] {\n        query: \"Person\"\n    }\n}",
    "deleted": false,
    "domain": "user",
    "selector": "[view]",
    "starred": false,
    "type": "view",
    "uid": 1000000924,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303347075.952,
    "dateModified": 1594303348802,
    "definition": "[view] {\n    [datasource = pod] {\n        query: \"Session\"\n    }\n}",
    "deleted": false,
    "domain": "user",
    "selector": "[view]",
    "starred": false,
    "type": "view",
    "uid": 1000000931,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303347100.8867,
    "dateModified": 1594303348802,
    "definition": "[view] {\n    [datasource = pod] {\n        query: \"AuditItem\"\n    }\n}",
    "deleted": false,
    "domain": "user",
    "selector": "[view]",
    "starred": false,
    "type": "view",
    "uid": 1000000938,
    "version": 1
}, {
    "_type": "CVUStoredDefinition",
    "dateCreated": 1594303347120.3398,
    "dateModified": 1594303348802,
    "definition": "[view] {\n    [datasource = pod] {\n        query: \"Note\"\n    }\n}",
    "deleted": false,
    "domain": "user",
    "selector": "[view]",
    "starred": false,
    "type": "view",
    "uid": 1000000945,
    "version": 1
}]*/

export var mockApi = {
    mockdata,
    async http({method = "GET", path = "", body, data}, callback) {
        if (path == "search_by_fields" || path == "items_with_edges" && method == "POST") {
            return callback(null, JSON.parse(JSON.stringify(mockdata)));
        }
        if (method == "POST") {
            var payload = JSON.parse(body);
            if (path == "create_item") {
                mockdata.push(payload)
                return callback()
            }
            var uid = typeof payload == "object" ? payload?.uid : payload
            
            mockdata.some(function(x, i) {
                if (x.uid == uid) {
                    item = x
                    index = i;
                    return true
                };
            })
            if (!uid || !item)
                return callback(new Error());
            
            if (path == "update_item") {
                mockdata[index] = payload
                return callback(null, uid)
            }
            if (path == "delete_item") {
                mockdata.splice(index, 1);
                return callback(null, uid)
            }
        }
    }
}




