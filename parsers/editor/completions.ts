import {parseCVU} from "./cvu";

var types = {
    UIElement: {
        VStack: {
            desc: "Element that stacks its children vertically"
        },
        HStack: {
            desc: "Element that stacks its children horizontally"
        },
        ZStack: {
            desc: "Element that stacks its children on top of eachother"
        },
        EditorSection: {
            desc: "Element that renders as a section in the general editor"
        },
        EditorRow: {
            desc: "Element that renders as a row in a section in the general editor"
        },
        EditorLabel: {
            desc: "Element that renders a label in a row in the general editor",
            hasChildren: false
        },
        Button: {
            desc: "Element that renders a button in the user interface. Buttons connect to",
            hasChildren: false
        },
        FlowStack: {
            desc: "Element that horizontally stacks its children and wraps to the next line at the end of the container."
        },
        Text: {
            desc: "Element that renders text on the screen",
            hasChildren: false
        },
        Textfield: {
            desc: "Element allows a user to change text",
            hasChildren: false
        },
        ItemCell: {
            desc: "Element that renders a data item as if it was displayed in a specific renderer"
        },
        SubView: {
            desc: "Element that renders a view inside another view"
        },
        Map: {
            desc: "Element that displays content on a map"
        },
        Picker: {
            desc: "Element that allows a user to choose from a list of options"
        },
        SecureField: {
            desc: "Element that allows a user to change text while keeping the entry private"
        },
        ActionButton: {
            desc: "Element that"
        },
        MemriButton: {
            desc: "Element that displays a cononical representation of a data item",
            hasChildren: false
        },
        Image: {
            desc: "Element that displays an image",
            hasChildren: false
        },
        Circle: {
            desc: "Element that renders a circle"
        },
        HorizontalLine: {
            desc: "Element that renders a horizontal line",
            hasChildren: false,
            isEmpty: true
        },
        Rectangle: {
            desc: "Element that renders a rectangle"
        },
        RoundedRectangle: {
            desc: "Element that renders a rounded rectangle"
        },
        Spacer: {
            desc: "Element that maximizes the space between elements in a stack",
            hasChildren: false,
            isEmpty: true
        },
        Divider: {
            desc: "Element that renders a divider line",
            hasChildren: false,
            isEmpty: true
        },
        Empty: {
            desc: "Element that does not render anything",
            hasChildren: false,
            isEmpty: true
        },
        Title: {
            hasChildren: false
        },
        RichTextfield: {
            hasChildren: false
        },
        Action: {
            hasChildren: false
        },
        
    },
    boolean: "true, false",
    UIElementProperties: {
        resizable: "fit, fill, stretch",
        "show, nopadding, bold, italic, underline, strikethrough": ".boolean",
        "title, text, viewName, systemName, hint, empty, style, defaultValue": "string",
        alignment: "top, bottom, .textAlign",
        align: ".alignment,leftTop, topLeft, rightTop, topRight, leftBottom, bottomLeft, rightBottom, bottomRight",
        textAlign: "left,center,right",
        $fontWeight: "regular,bold,semibold,heavy,light,ultralight,black",
        font: "<.$fontWeight>",
        "spacing, cornerRadius, minWidth, maxWidth, minHeight, maxHeight, blur, opacity, zindex": ".number", 
        "color, background, rowbackground": ".Color",
        image: ".File|.string",
        press: "Action|Action[]",
        list: "DataItem",//TODO:?
        view: "definitions|Object[]",
        arguments: "Object[]",
        location: ".Location",
        address: "Address",
        value: "true",
        datasource: "datasource",
        "padding, margin": ".number",
        border: "",
        shadow: "",
        offset: ".number",
        renderers: {list: "", generalEditor: "", chart: "", thumbnail: "", timeline: "", custom: ""}
    },
    Color: "background, highlight, lightInputText, inputText, activeColor, activeBackgroundColor",
    Action: "back, addDataItem, openView, openDynamicView, openViewByName, toggleEditMode, toggleFilterPanel, star, showStarred, showContextPane, showOverlay, share, showNavigation, addToPanel, duplicate, schedule, addToList, duplicateNote, noteTimeline, starredNotes, allNotes, exampleUnpack, delete, setRenderer, select, selectAll, unselectAll, showAddLabel, openLabelView, showSessionSwitcher, forward, forwardToFront, backAsSession, openSession, openSessionByName, link, closePopup, unlink, multiAction, noop",
    ActionProperties: {
        name: ".string",
        arguments: "",
        renderAs: "",
        title: ".string",
        showTitle: ".string",
        icon: ".string",
        opensView: ".boolean",
        "color, backgroundColor, inactiveColor, activeBackgroundColor, inactiveBackgroundColor": ".Color",
    },
    Location: {
        latitude: ".number",
        longitude: ".number"
    },
    Address: {
        "type, city, street, state, postalCode": ".string",
        country: ".Country",
        location: ".Location"
    },
    Country: {
        name: ".string",
        flag: ".File",
        location: ".Location"
    },
    Note: {
        "title, content, textContent": ".string"
    },
    PhoneNumber: {
        "type, number": ".string"
    },
    Website: {
        "type, url": ".string"
    },
    Company: {
        "type, name": ".string"
    },
    PublicKey: {
        "type, name, key": ".string"
    },
    OnlineProfile: {
        "type, handle": ".string"
    },
    Diet: {
        "type, name": ".string"
    },
    MedicalCondition: {
        "type, name": ".string"
    },
    Person: {
        "firstName, lastName, gender, sexualOrientation": ".string"
    },
    $definitions: {
        sessions: {
            currentSessionIndex: ".number",
            sessionDefinitions: "session[]"
        },
        session: {
            name: ".string",
            currentViewIndex: ".number",
            viewDefinitions: "view[]",
            "editMode, showFilterPanel, showContextPane": ".boolean",
            screenshot: ".File" 

        },
        view: {
            "name, emptyResultText, title, subTitle, filterText, activeRenderer, defaultRenderer, backTitle, searchHint": ".string",
            userState: "",
            datasourceDefinition: "datasource",
            viewArguments: "",
            showLabels: ".boolean",
            "actionButton, editActionButton": "Action",
            sortFields:"<string[]>",
            "editButtons, filterButtons, actionItems, navigateItems, contextButtons": "Action | Action[]",
            include: ".string | <string[]>",
            // renderDefinitions: "renderer[]"
        },
        datasource: {
            "query, sortProperty, sortAscending": ".string",
        },
        renderer: {
            $values: {list: "", generalEditor: "", chart: "", thumbnail: "", timeline: "", custom: ""}
        },
        color: "dark, light",
        style: {
            "background, color": ".Color",
            "border": "",
        },
        language: {
        }
    },
}


export function getCompletions(ast, pos, doc) {
    var completions = []
    var currentNode = ast.findNode({ line: pos.row, col: pos.column });
    console.log(currentNode + "")
    var definition = false;
    var parents = [];
    currentNode.traverseUp("Rule(Selector(x), y)", function ({ x, y }) {
        if (!definition) {
            var definitionType = /Prop\("(\w+)"/.exec(x + "")
            if (
                definitionType && definitionType[1]
                && types.$definitions.hasOwnProperty(definitionType[1])
            ) {
                definition = definitionType[1];
            }   
        }
        
        parents.push(x.value);
    });
    var isInselector = false;
    var propertyName;
    var line = doc.getLine(pos.row)
    var lineBefore = line.slice(0, pos.column)
    if (currentNode.cons == "Prop") {
        if (!/=/.test(lineBefore)) {
            Object.keys(types.$definitions).map(value => completions.push({value}))
        } else if (types.$definitions[currentNode[0].value]?.$values) {
            Object.keys(types.$definitions[currentNode[0].value]?.$values).map(value => completions.push({value}))
        }
    } else if (currentNode.cons == "Selector") {
        isInselector = true
        parents.shift()
    } else if (currentNode.cons == "Dict") {
        isInselector = true
    } else if (currentNode.cons == "Rule") {
        var propertyName = parents[0]
    }
    if (isInselector) {
        if (definition == "renderer") {
            var inElement = types.UIElement[parents[0]];
            if (inElement?.hasChildren !== false) {
                addUIElementNames(completions)
            }
            if (inElement) {
                addProperties(completions, types.UIElementProperties);
            }
        }
        if (types.$definitions[definition]) {
            addProperties(completions, types.$definitions[definition]);
        }
    } else if (propertyName) {
       addPropertyValues(completions, propertyName);
    }
    
    return completions
}
function addUIElementNames(completions) {
    Object.keys(types.UIElement).map((key) => {
        var elementData = types.UIElement[key];
        var hint = elementData.desc;
        var snippet = elementData.isEmpty ? undefined : key + " {$0}";
        completions.push({value: key, type: "Element", docHTML: hint, snippet});
    })
}
function addProperties(completions, typeMap) {
    Object.keys(typeMap).map((key) => {
        if (key[0] == "$") return;
        if (key[0] == "." && typeMap[key.slice(1)]) 
            return addProperties(completions, typeMap[key.slice(1)]);
        
        var elementData = typeMap[key];
        var hint = elementData.desc;
        var snippet = key + ": ";
        completions.push({value: key, type: "Element", docHTML: hint, snippet});
    })
}
function addPropertyValues(completions, propertyName) {
    var typeMap = types.UIElementProperties;
    var type = typeMap[propertyName]
    if (typeof type == "string") {
        if (type[0] == "$") return;
        if (type[0] == ".") type = types[type.slice(1)];
    }
    if (typeof type == "object") {
        add(type)
    }
    
    function add(type) {
        Object.keys(type).forEach((key) => {
            if (key[0] == "$") return;
            if (key[0] == "." && typeMap[key.slice(1)]) return add(typeMap[key.slice(1)])
            completions.push({value: key})
        });
    }
}


var defaults = {
    /*require("text-loader!../../cvu/defaults/default_user_views.json"),*/
    /*require("text-loader!../../cvu/defaults/macro_views.json"),*/
    "All-items-with-label": require("text-loader!../../cvu/defaults/named/All-items-with-label.cvu"),
    "Choose-item-by-query": require("text-loader!../../cvu/defaults/named/Choose-item-by-query.cvu"),
    "Filter-starred": require("text-loader!../../cvu/defaults/named/Filter-starred.cvu"),
    /*require("text-loader!../../cvu/defaults/named_sessions.json"),*/
    /*require("text-loader!../../cvu/defaults/named_views.json",)*/
    generalEditor: require("text-loader!../../cvu/defaults/renderer/generalEditor.cvu"),
    chart: require("text-loader!../../cvu/defaults/renderer/chart.cvu"),
    list: require("text-loader!../../cvu/defaults/renderer/list.cvu"),
    thumbnail: require("text-loader!../../cvu/defaults/renderer/thumbnail.cvu"),
    Sessions: require("text-loader!../../cvu/defaults/Session/Sessions.cvu"),
    defaults: require("text-loader!../../cvu/defaults/styles/defaults.cvu"),
    /*require("text-loader!../../cvu/defaults/template_views.json"),*/
    Address: require("text-loader!../../cvu/defaults/type/Address.cvu"),
    Any: require("text-loader!../../cvu/defaults/type/Any.cvu"),
    AuditItem: require("text-loader!../../cvu/defaults/type/AuditItem.cvu"),
    Country: require("text-loader!../../cvu/defaults/type/Country.cvu"),
    Importer: require("text-loader!../../cvu/defaults/type/Importer.cvu"),
    ImporterInstance: require("text-loader!../../cvu/defaults/type/ImporterInstance.cvu"),
    Indexer: require("text-loader!../../cvu/defaults/type/Indexer.cvu"),
    IndexerInstance: require("text-loader!../../cvu/defaults/type/IndexerInstance.cvu"),
    Label: require("text-loader!../../cvu/defaults/type/Label.cvu"),
    Mixed: require("text-loader!../../cvu/defaults/type/Mixed.cvu"),
    Note: require("text-loader!../../cvu/defaults/type/Note.cvu"),
    /*require("text-loader!../../cvu/defaults/type/Person-markup.ml"),*/
    Person: require("text-loader!../../cvu/defaults/type/Person.cvu"),
    Photo: require("text-loader!../../cvu/defaults/type/Photo.cvu"),
    Session: require("text-loader!../../cvu/defaults/type/Session.cvu"),
    /*require("text-loader!../../cvu/defaults/type/Session.json"),*/
    SessionView: require("text-loader!../../cvu/defaults/type/SessionView.cvu"),
    UserNote: require("text-loader!../../cvu/defaults/user/UserNote.cvu-disabled"),
    /*require("text-loader!../../cvu/defaults/views_from_server.json"),*/
};

var all = {}
var selectors = {}
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
   
 


function normalize(obj) {
    var regexp = /,\s*/;
    for (const [key, value] of Object.entries(obj)) {
        if (value instanceof Object) {
            obj[key] = normalize(value);
        }
        else {
            var keyList = key.split(regexp);
            var valueList = typeof value === "string" ? value.split(regexp) : null;
            if (keyList.length === 1 && !valueList)
                continue;

            for (var tmpKey of keyList) {
                if (valueList && valueList.length > 1) {
                    obj[tmpKey] = {};
                    for (var tmpValue of valueList) {
                        obj[tmpKey][tmpValue] = {};
                    }
                } else {
                    obj[tmpKey] = value;
                }

            }

            if (keyList.length > 1)
                delete obj[key];
        }
    }
    return obj;
}

types = normalize(types);

var propertiesByName = {}


