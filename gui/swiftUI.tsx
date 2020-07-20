import * as React from "react";
import {BaseTextFieldProps, Button, ButtonProps, Divider, Icon, TextField} from "@material-ui/core";
import {MemriContext} from "../context/MemriContext";
import {Font} from "../parsers/cvu-parser/CVUParser";

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
        Object.assign(styles, this.props.font, this.props.padding, this.props.frame);
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

export class ActionButton extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, centeredOverlayWithinBoundsPreferenceKey, ...other} = this.props;
    return (
            <Button style={this.setStyles()} {...other}>
                {this.props.children}
            </Button>
        )
    }
}

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