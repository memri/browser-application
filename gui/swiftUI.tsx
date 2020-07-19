import * as React from "react";
import {BaseTextFieldProps, Button, ButtonProps, TextField} from "@material-ui/core";

export class VStack extends React.Component {
    render() {
        var {centeredOverlayWithinBoundsPreferenceKey, ...other} = this.props;
        let styles = {
            spacing: this.props.spacing
        }
        return (
            <div style={styles} className="VStack" {...other}>
                {this.props.children}
            </div>
        )
    }
}

export class ZStack extends React.Component {
    render() {
        var {zIndex, ...other} = this.props;
        let styles = {
            spacing: this.props.spacing,
            alignment: this.props.alignment
        }
        return (
            <div style={styles} className="ZStack" {...other}>
                {this.props.children}
            </div>
        )
    }
}

export class HStack extends React.Component {
    render() {
        var {zIndex, ...other} = this.props;
        let styles = {
            spacing: this.props.spacing,
            alignment: this.props.alignment
        }
        return (
            <div style={styles} className="HStack" {...other}>
                {this.props.children}
            </div>
        )
    }
}

export class ColorArea extends React.Component {
    render() {
        var {contentShape, edgesIgnoringSafeArea, zIndex, ...other} = this.props;
        return (
            <div className="ColorArea" {...other}>
                {this.props.children}
            </div>
        )
    }
}

export class Content extends React.Component {
    render() {
        var {zIndex, ...other} = this.props;
        return (
            <div className="Content" {...other}>
                {this.props.children}
            </div>
        )
    }
}

export class MemriButton extends React.Component<MemriButtonProps, ButtonProps> {
    render() {
        var {sheet, ...other} = this.props;
        return (
            <Button {...other}>
                {this.props.children}
            </Button>
        )
    }
}

export class ActionButton extends React.Component<MemriButtonProps, ButtonProps> {
    render() {
        var {sheet, ...other} = this.props;
        return (
            <Button {...other}>
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

export class MemriTextField extends React.Component<MemriTextFieldProps, {}> {
    render() {
        var {
            value, textColor, tintColor, clearButtonMode,
            showPrevNextButtons, layoutPriority, padding,
            accentColor, background, cornerRadius, ...other
        } = this.props;
        return (
            <TextField defaultValue={value} {...other}/>
        )
    }
}

export class MemriText extends React.Component {
    render() {
        var {sheet, ...other} = this.props;
        return (
            <span {...other}>
                {this.props.children}
            </span>
        )
    }
}

export class ScrollView extends React.Component {
    render() {
        var {zIndex, ...other} = this.props;
        let styles = {
            spacing: this.props.spacing,
            alignment: this.props.alignment
        }
        return (
            <div style={styles} className="ScrollView" {...other}>
                {this.props.children}
            </div>
        )
    }
}

export function frame(attrs) { //TODO:
    return "frame:";
}

export function padding(attrs) { //TODO:
    return "padding:";
}

export function offset(attrs) { //TODO: x,y
    return "offset:";
}