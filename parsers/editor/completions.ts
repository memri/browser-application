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
        }
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
            hasChildren: false
        },
        Rectangle: {
            desc: "Element that renders a rectangle"
        },
        RoundedRectangle: {
            desc: "Element that renders a rounded rectangle"
        },
        Spacer: {
            desc: "Element that maximizes the space between elements in a stack",
            hasChildren: false
        },
        Divider: {
            desc: "Element that renders a divider line",
            hasChildren: false
        },
        Empty: {
            desc: "Element that does not render anything",
            hasChildren: false
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
    definitions: {
        view: {
            
        }
    }
    
}