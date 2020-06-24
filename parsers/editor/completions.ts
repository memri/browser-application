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
        resizable: "fit, fill",
        "show, nopadding, bold, italic, underline, strikethrough": "boolean",
        "title, text, viewName, systemName, hint, empty, style, defaultValue, view": "string",
        alignment: "top, bottom, <.textAlign>",
        align: "<.alignment>,leftTop, topLeft, rightTop, topRight, leftBottom, bottomLeft, rightBottom, bottomRight",
        textAlign: "left,center,right",
        $fontWeight: "regular,bold,semibold,heavy,light,ultralight,black",
        font: "<.$fontWeight>",
        "spacing, cornerRadius, minWidth, maxWidth, minHeight, maxHeight, blur, opacity, zindex": "<number>", 
        "color, background, rowbackground": "<Color>",

        "image, press, list, arguments, location, address, value, datasource, empty, frame, padding, background, rowbackground, cornerborder, border, margin, shadow, offset, blur, opacity": "",
    },
    Color: "background, highlight, lightInputText, inputText, activeColor, activeBackgroundColor",
    Action: "back, addDataItem, openView, openDynamicView, openViewByName, toggleEditMode, toggleFilterPanel, star, showStarred, showContextPane, showOverlay, share, showNavigation, addToPanel, duplicate, schedule, addToList, duplicateNote, noteTimeline, starredNotes, allNotes, exampleUnpack, delete, setRenderer, select, selectAll, unselectAll, showAddLabel, openLabelView, showSessionSwitcher, forward, forwardToFront, backAsSession, openSession, openSessionByName, link, closePopup, unlink, multiAction, noop",
    ActionProperties: {
        name: "<string>",
        arguments: "",
        renderAs: "",
        title: "<string>",
        showTitle: "<string>",
        icon: "<string>",
        opensView: "boolean",
        "color, backgroundColor, inactiveColor, activeBackgroundColor, inactiveBackgroundColor": "Color",
    },
    $definitions: {
        sessions: {
            currentSessionIndex: "<number>",
            sessionDefinitions: "session[]"
        },
        session: {
            name: "<string>",
            currentViewIndex: "<number>",
            viewDefinitions: "view[]",
            "editMode, showFilterPanel, showContextPane": "boolean",
            screenshot: "<File>" 

        },
        view: {
            "name, emptyResultText, title, subTitle, filterText, activeRenderer, defaultRenderer, backTitle, searchHint": "<string>",
            userState: "",
            datasourceDefinition: "datasource",
            viewArguments: "",
            showLabels: "boolean",
            "actionButton, editActionButton": "Action",
            sortFields:"<string[]>",
            "editButtons, filterButtons, actionItems, navigateItems, contextButtons": "Action | Action[]",
            include: "<string> | <string[]>",
            renderDefinitions: "renderer[]"
        },
        datasource: {
            "query, sortProperty, sortAscending": "<string[]>",
        },
        renderer: {
            
        },
        color: "dark,light",
        style: {
            "background, color": "Color",
            "border": "",
        },
        language: {
        }
    }
    
}


export function getCompletions(ast, pos) {
    
    var currentNode = ast.findNode({ line: pos.row, col: pos.column });
    console.log(currentNode + "")
    currentNode.traverseUp("Rule(Selector(x), y)", function ({ x, y }) {
        if (/renderer/.test(x + "")) {
            
        }
        console.log(x + "");
    });
    debugger
    currentNode.traverseUp("x", function({x}) {
        console.log(x)
    })
    
    return Object.keys(types.UIElement).map((key) => {
        var elementData = types.UIElement[key];
        var hint = elementData.desc;
        var snippet = elementData.isEmpty ? undefined : key + " {$0}";
        return {value: key, type: "Element", docHTML: hint, snippet};
    })
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
    // console.log(ast + "")
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
        if (!selectors[selector]) selectors[selector] = []
        if (!types.UIElement[`"${selector}"`])
            selectors[selector].push(value)
        // console.log(arg.x+ "", arg.y)
    })
    
    console.log(ast.dict);
})
// debugger
all