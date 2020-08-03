import * as React from "react";
import {BaseTextFieldProps, Button, Divider, Icon, List, TextField} from "@material-ui/core";
import {MemriContext} from "../context/MemriContext";
import {Alignment, Font, TextAlignment} from "../parsers/cvu-parser/CVUParser";

interface MemriUIProps {
    foregroundColor?
    font?,
    padding?,
    spacing?,
    frame?,
    offset?,
    zIndex?,
    background?,
    textColor?,
    cornerRadius?,
    context?,
    opacity?
}

export class MainUI extends React.Component<MemriUIProps, {}> {
    styles;
    context: MemriContext;

    setProperties(properties, _: Item, __: MemriContext, viewArguments: ViewArguments) {
        let ViewPropertyOrder = [
            "style",
            "frame",
            "color",
            "font",
            "padding",
            "background",
            "textAlign",
            "rowbackground",
            "cornerRadius",
            "cornerborder",
            "border",
            "margin",
            "shadow",
            "offset",
            "blur",
            "opacity",
            "zindex",
        ]

        var view = [];

        function setProperty(name: string, value?) {
            switch (name) {
                case "style":
                    // TODO: Refactor: Implement style sheets
                    break
                case "shadow":
                    if (Array.isArray(value)) {
                        let color = value[0]/* as? Color*/;
                        let radius = value[1]/* as? CGFloat*/;
                        let x = value[2]/* as? CGFloat*/;
                        let y = value[3]/* as? CGFloat*/;

                        if (color && radius && x && y) {
                            view["boxShadow"] = `${x}px ${y}px ${radius}px 0 ${color}`
                        }
                    } else {
                        console.log("Exception: Invalid values for shadow")
                        view["boxShadow"] = '0'
                    }
                    break;
                case "margin":
                case "padding":
                    if (Array.isArray(value)) {
                        //#warning("This errored while editing CVU. Why did the validator not catch this?")

                        view["padding"] = padding(
                            {
                                top: value[0] ?? 0,
                                leading: value[3] ?? 0,
                                bottom: value[2] ?? 0,
                                trailing: value[1] ?? 0
                            }
                        )
                    } else {
                        view["padding"] = padding(value);
                    }
                    break;
                case "blur":
                    if (value) {
                        view["Blur"] = value //TODO:
                    }
                    break;
                case "opacity":
                    if (value) {
                        view["Opacity"] = value//TODO:
                    }
                    break;
                case "color":
                    if (value) {
                        view["color"] = value // TODO: named colors do not work
                    }
                    break;
                case "background":
                    if (value) {
                        view["backgroundColor"] = value;
                    }
                    break;
                case "rowbackground":
                    if (value) {
                        view["listRowBackground"] = value; //TODO:
                    }
                    break;
                case "border":
                    /* if let value = value as? [Any?] {
                         if let color = value[0] as? Color {
                             return AnyView(border(color, width: value[1] as? CGFloat ?? 1.0))
                 }
                 else {
                         print("FIX BORDER HANDLING2")
                     }
                 }
                 else {
                         print("FIX BORDER HANDLING")
                     }*/ //TODO:
                    break;
                case "offset":
                    if (Array.isArray(value)) {
                        view["offset"] = offset({x: value[0], y: value[1]})
                    }
                    break;
                case "zindex":
                    if (value) {
                        view["zIndex"] = value;
                    }
                case "cornerRadius":
                    if (value) {
                        view["borderRadius"] = value;
                    }
                    break;
                case "cornerborder":
                    if (Array.isArray(value)) {
                        let color = value[0]; //Color
                        if (color) {
                            /*
                                return AnyView(overlay(
                                    RoundedRectangle(cornerRadius: value[2] as? CGFloat ?? 1.0)
                    .stroke(color, lineWidth: value[1] as? CGFloat ?? 1.0)
                    .padding(1)
                    ))*/ //TODO:
                        }
                    }
                case "frame":
                    if (Array.isArray(value)) {
                        view["frame"] = frame(
                            {
                                minWidth: value[0],
                                maxWidth: value[1],
                                minHeight: value[2],
                                maxHeight: value[3],
                                alignment: value[4] ?? Alignment.top
                            }
                        )
                    }
                    break
                case "font":
                    var fontV;

                    if (Array.isArray(value)) {
                        let name = value[0];
                        if (name) {
                            fontV = font({family: name, size: value[1] ?? 12.0});
                        } else {
                            fontV = font({
                                family: "system", size: value[0] ?? 12.0,
                                weight: value[1],
                                design: "default"
                            });
                        }
                    } else if (value) {
                        fontV = font({family: "system", size: value});
                    } else if (Font.Weight[value]) {
                        fontV = font({family: "system", size: 12, weight: value});
                    } else {

                    }
                    Object.assign(view, fontV);
                    break;
                case "textAlign":
                    if (TextAlignment[value]) {
                        view["textAlign"] = value;
                    }
                    break;
                //        case "minWidth", "minHeight", "align", "maxWidth", "maxHeight", "spacing", "alignment", "text", "maxchar", "removewhitespace", "bold":
                //            break
                default:
                    console.log(`NOT IMPLEMENTED PROPERTY: ${name}`)
            }
        }

        if (properties.length == 0) {
            return view
        }

        for (let name in ViewPropertyOrder) {
            var value = properties[name];
            if (value) {
                let expr = value;
                if (expr?.constructor?.name == "Expression") {
                    try {
                        value = expr.execute(viewArguments);
                    } catch {
                        // TODO: refactor: Error handling
                        console.log(`Could not set property. Executing expression ${expr} failed`)
                        continue
                    }
                }

                setProperty(name, value);
            }
        }

        return view
    }

    setStyles() {
        let styles = {
            color: this.props.foregroundColor ?? this.props.textColor ?? "black",
            margin: this.props.spacing ?? undefined,
            offset: this.props.offset,
            zIndex: this.props.zIndex,
            backgroundColor: this.props.background,
            borderRadius: this.props.cornerRadius,
            opacity: this.props.opacity
        }
        var fixedProps = {}
        if (this.props.setProperties) {
            //this.context = this.props.setProperties.context;
            fixedProps = this.setProperties(this.props.setProperties.properties, undefined, undefined , this.props.setProperties.viewArguments);
        }

        Object.assign(styles, this.props.font, this.props.padding, this.props.frame, fixedProps);
        return styles;
    }
}

export class VStack extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, centeredOverlayWithinBoundsPreferenceKey, ...other} = this.props;
        return (
            <div style={this.setStyles()} className="VStack" {...other}>
                {this.props.children}
            </div>
        )
    }
}

export class ZStack extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, centeredOverlayWithinBoundsPreferenceKey, ...other} = this.props;
        return (
            <div style={this.setStyles()} className="ZStack" {...other}>
                {this.props.children}
            </div>
        )
    }
}

export class HStack extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, centeredOverlayWithinBoundsPreferenceKey, ...other} = this.props;
        return (
            <div style={this.setStyles()} className="HStack" {...other}>
                {this.props.children}
            </div>
        )
    }
}

export class ColorArea extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, contentShape, edgesIgnoringSafeArea, zIndex, ...other} = this.props;
        return (
            <div style={this.setStyles()} className="ColorArea" {...other}>
                {this.props.children}
            </div>
        )
    }
}

export class Content extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, centeredOverlayWithinBoundsPreferenceKey, ...other} = this.props;
        return (
            <div style={this.setStyles()} className="Content" {...other}>
                {this.props.children}
            </div>
        )
    }
}

export class MemriButton extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, centeredOverlayWithinBoundsPreferenceKey, ...other} = this.props;
        return (
            <Button style={this.setStyles()} {...other}>
                {this.props.children}
            </Button>
        )
    }
}

export class NavigationView extends MainUI {
    render() {
        return (
            <div className={"NavigationView"}>
                {this.props.children}
            </div>
        )
    }
}

/*export class ActionButton extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, centeredOverlayWithinBoundsPreferenceKey, ...other} = this.props;
    return (
            <Button style={this.setStyles()} {...other}>
                {this.props.children}
            </Button>
        )
    }
}*/

interface MemriTextFieldProps extends BaseTextFieldProps {
    textColor?,
    tintColor?,
    clearButtonMode?,
    showPrevNextButtons?,
    layoutPriority?,
    padding?,
    accentColor?,
    background?,
    cornerRadius?
}

export class MemriTextField extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex,
            value, textColor, tintColor, clearButtonMode,
            showPrevNextButtons, layoutPriority,
            accentColor, background, cornerRadius, ...other
        } = this.props;
        return (
            <TextField style={this.setStyles()} defaultValue={value} {...other}/>
        )
    }
}

export class MemriText extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, centeredOverlayWithinBoundsPreferenceKey, ...other} = this.props;
        return (
            <span style={this.setStyles()} {...other}>
                {this.props.children}
            </span>
        )
    }
}

export class ScrollView extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, centeredOverlayWithinBoundsPreferenceKey, ...other} = this.props;
        return (
            <div style={this.setStyles()} className="ScrollView" {...other}>
                {this.props.children}
            </div>
        )
    }
}
export class MemriImage extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, centeredOverlayWithinBoundsPreferenceKey, ...other} = this.props;
        return (
            <Icon style={this.setStyles()} {...other}>
                {this.props.children}
            </Icon>
        )
    }
}

export class Spacer extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, ...other} = this.props;
        return (
            <div style={this.setStyles()} className="Spacer" {...other}>
                {this.props.children}
            </div>
        )
    }
}

export class MemriDivider extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, ...other} = this.props;
        return (
            <Divider style={this.setStyles()} className="Spacer" {...other}/>
        )
    }
}

export class ASTableView extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, ...other} = this.props;
        return (
            <List style={this.setStyles()} className="ASTableView" {...other}>
                {this.props.children}
            </List>
        )
    }
}

export class SectionHeader extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, ...other} = this.props;
        return (
            <div style={this.setStyles()} className="SectionHeader" {...other}>
                {this.props.children}
            </div>
        )
    }
}

export class Section extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, ...other} = this.props;
        return (
            <div style={this.setStyles()} className="Section" {...other}>
                {this.props.children}
            </div>
        )
    }
}

export class Empty extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, ...other} = this.props;
        return (
            <div style={this.setStyles()} className="Empty" {...other}>
                {this.props.children}
            </div>
        )
    }
}

export class Group extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, ...other} = this.props;
        return (
            <List style={this.setStyles()} className="Group" {...other}>
                {this.props.children}
            </List>
        )
    }
}

export class MemriList extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, ...other} = this.props;
        return (
            <List style={this.setStyles()} className="MemriList" {...other}>
                {this.props.children}
            </List>
        )
    }
}

export class UIImage extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, ...other} = this.props;
        return (
            <img style={this.setStyles()} className="UIImage" {...other}/>
        )
    }
}



export function frame(attrs:{width?, height?, minWidth?, idealWidth?, maxWidth?, minHeight?, idealHeight?, maxHeight?, alignment?}) { //TODO:
    let frameObj = attrs;

    return frameObj;
}

export function padding(attrs:{horizontal?,vertical?,top?,bottom?,leading?,trailing?}|any) {
    let paddingObj = {};
    if (typeof attrs == "number" || typeof attrs == "string") {
        paddingObj["padding"] = attrs;
    } else {
        if (attrs.horizontal) {
            paddingObj["paddingRight"] = paddingObj["paddingLeft"] = attrs.horizontal;
        }
        if (attrs.vertical) {
            paddingObj["paddingTop"] = paddingObj["paddingBottom"] = attrs.vertical;
        }
        if (attrs.leading) {
            paddingObj["paddingLeft"] = attrs.leading;
        }
        if (attrs.trailing) {
            paddingObj["paddingRight"] = attrs.trailing;
        }
        if (attrs.top) {
            paddingObj["paddingTop"] = attrs.top;
        }
        if (attrs.bottom) {
            paddingObj["paddingBottom"] = attrs.bottom;
        }
    }
    return paddingObj;
}

export function offset(attrs:{x?,y?}) { //TODO: x,y
    return `${attrs.x? attrs.x +" px" : ""} ${attrs.y? attrs.y+" px" : ""}`;
}

export function font(attrs:{family?: string, size?:number; weight?: string}) {
    let fontObj = {};
    if (attrs.size)
        fontObj["fontSize"] = attrs.size;
    if (attrs.weight) {
        switch (attrs.weight) {
            case Font.Weight.regular:
                fontObj["fontWeight"] = "normal";
                break;
            case Font.Weight.semibold:
                fontObj["fontWeight"] = 500;
                break;
            case Font.Weight.heavy:
                fontObj["fontWeight"] = "bolder";
                break;
            case Font.Weight.light:
                fontObj["fontWeight"] = "lighter";
                break;
            case Font.Weight.ultraLight:
                fontObj["fontWeight"] = 100;
                break;
            case Font.Weight.black:
                fontObj["fontWeight"] = 900;
                break;
            default:
                fontObj["fontWeight"] = attrs.weight;
        }

    }

    return fontObj;
}

export function border(attrs) {
    //TODO: {width: [0, 0, 1, 1], color: "#eee"}
 return attrs;
}

export function contentInsets(attrs:{top?,bottom?,left?,right?}) { //TODO:
    let contentInsetsObj = attrs;

    return contentInsetsObj;
}

export function setProperties(properties, item, context, viewArguments) {
    return {properties: properties, item: item, context: context, viewArguments: viewArguments}
}
