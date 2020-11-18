import * as React from "react";
import {
    BaseTextFieldProps,
    Box,
    Button, Dialog, DialogTitle,
    Divider,
    Grid,
    GridList,
    Icon,
    List, Modal,
    Switch,
    TextField,
    DialogContentText, DialogActions, ListSubheader
} from "@material-ui/core";
import {MemriContext, UIElementFamily, UINodeResolver} from "../../router";
import {Alignment, Font, TextAlignment} from "../../router";

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
    opacity?,
    bold?
}

export class MainUI extends React.Component<MemriUIProps, {}> {
    styles;
    context: MemriContext;

    constructor(props) {
        super(props);
        this.context = props.context;
    }

    readSize(onChange) { //TODO:
        /*background(
            GeometryReader { geometryProxy in
        Color.clear
            .preference(key: SizePreferenceKey.self, value: geometryProxy.size)
        }
    )
    .onPreferenceChange(SizePreferenceKey.self, perform: onChange)*/
    }

    setStyles() {
        let styles = {
            color: this.props.foregroundColor?.value ?? this.props.foregroundColor ?? this.props.textColor,
            gap: this.props.spacing,
            margin: this.props?.margin,
            offset: this.props.offset,
            zIndex: this.props.zIndex,
            backgroundColor: this.props.background?.value ?? this.props.background,
            borderRadius: this.props.cornerRadius,
            opacity: this.props.opacity,
            height: this.props.height ?? this.props.frame?.height,
            width: this.props.width ?? this.props.frame?.width,
            textAlign: this.props.textAlign,
            fontWeight: (this.props.bold) ? "bold" : undefined
        }

        Object.assign(styles, this.props.font, this.props.padding, this.props.contentInsets, this.props.frame, this.setAlignment());
        return styles;
    }

    setAlignment() {//justifyContent={}
        if (this.props.alignment) {
            switch (this.props.alignment) {
                case Alignment.top:
                    return {alignItems: "flex-start"};
                /*case Alignment.center:
                    return {alignItems: "center", justifyContent: "center"};*/
                case Alignment.bottom:
                    return {alignItems: "flex-end"};
                case Alignment.leading:
                    return {justifyContent: "flex-start"};
                case Alignment.trailing:
                    return {justifyContent: "flex-end"};
                case Alignment.topLeading:
                    return {alignItems: "flex-start", justifyContent: "flex-start"};
                case Alignment.topTrailing:
                    return {alignItems: "flex-start", justifyContent: "flex-end"};
                case Alignment.bottomLeading:
                    return {alignItems: "flex-end", justifyContent: "flex-start"};
                case Alignment.bottomTrailing:
                    return {alignItems: "flex-end", justifyContent: "flex-end"};
            }
        }
        return
    }
}

export class CVU_UI extends MainUI {
    nodeResolver: UINodeResolver;

    constructor(props: MemriUIProps, context?: any) {
        super(props, context);
        this.nodeResolver = this.props.nodeResolver;
        delete this.props.nodeResolver;
    }

    modifier(modifiers) {
        return modifiers
    }
}

export class RenderersMemri extends MainUI {
    controller

    executeAction = (dataItem) => () => {
        let press = this.controller.config.press
        if (press) {
            this.controller.context.executeAction(press, dataItem)
        }
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

export class MemriRealButton extends MainUI {
    constructor(props) {
        super(props);
        this.state = {
            showAlert: false,
        };
        this.onAlert = this.onAlert.bind(this);
    }

    onAlert() {
        this.setState({
            showAlert: true,
        });
    }

    render() {
        let {alert, font, padding, foregroundColor, spacing, frame, zIndex, centeredOverlayWithinBoundsPreferenceKey, action, ...other} = this.props;
        action = alert ? this.onAlert : (action && typeof action == "function") ? action :  ()=> {};
         return (
            <div className={"MemriRealButton"}>
            <Button onClick={action} style={this.setStyles()} {...other}>
                {this.props.children}
            </Button>
                {this.state.showAlert ?
                    alert :
                    null
                }
            </div>
        )
    }
}

export class NavigationView extends MainUI {
    render() {
        return (
            <div style={this.setStyles()} className={"NavigationView"}>
                {this.props.children}
            </div>
        )
    }
}

export class NavigationLink extends MainUI {
    constructor(props) {
        super(props);
        this.state = {
            showComponent: false,
        };
        this._onNavigationLinkClick = this._onNavigationLinkClick.bind(this);
    }

    _onNavigationLinkClick() {
        this.setState({
            showComponent: true,
        });
    }

    render() {
        let {destination, font, padding, foregroundColor, spacing, frame, zIndex, action, ...other} = this.props;
        return (
            <>
                <Button onClick={destination ? this._onNavigationLinkClick : ()=>{}} className={"NavigationLink"}
                        style={this.setStyles()} {...other}>
                    {this.props.children}
                </Button>
                {this.state.showComponent ?
                    destination :
                    null
                }
            </>
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

export class SecureField extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex,
            text, textColor, tintColor, clearButtonMode,
            showPrevNextButtons, layoutPriority,
            accentColor, background, cornerRadius, ...other
        } = this.props;
        return (
            <TextField type="password" style={this.setStyles()} defaultValue={text} {...other}/>
        )
    }
}

export class MemriText extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, centeredOverlayWithinBoundsPreferenceKey, text, ...other} = this.props;
        return (
            <div style={this.setStyles()} {...other}>
                {text ?? this.props.children}
            </div>
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
            <Icon style={this.setStyles()} fontSize="small" {...other}>
                {this.props.children}
            </Icon>
        )
    }
}

export class Spacer extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, ...other} = this.props;
        let style = this.setStyles();
        Object.assign(style, {flexGrow: 1, minWidth: "10px"})
        return (
            <div style={style} className="Spacer" {...other}>
                {this.props.children}
            </div>
        )
    }
}

export class MemriDivider extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, ...other} = this.props;
        return (
            <Divider style={this.setStyles()} className="Divider" {...other}/>
        )
    }
}

export class ASTableView extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, ...other} = this.props;
        let style = this.setStyles();
        Object.assign(style, {display: "flex", flexDirection: "column"})
        return (
            <div style={style} className="ASTableView" {...other}>
                {this.props.children}
            </div>
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
        let {header, footer, font, padding, foregroundColor, spacing, frame, zIndex, ...other} = this.props;
        let style = this.setStyles();
        return (
            <div style={style} className="Section" {...other}>
                {header ? header: ""}
                {this.props.children}
                {footer ? footer: ""}
            </div>
        )
    }
}

export class ASSection extends MainUI {
    render() {
        let {header, footer, font, padding, foregroundColor, spacing, frame, zIndex, ...other} = this.props;
        let style = this.setStyles();
        Object.assign(style, {display: "flex", width: style.width ?? "100%"})

        return (
            <div style={style} className="ASSection" {...other}>
                {header ? header: ""}
                {this.props.children}
                {footer ? footer: ""}
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
            <div style={this.setStyles()} className="Group" {...other}>
                {this.props.children}
            </div>
        )
    }
}

export class MemriList extends MainUI {
    render() {
        let {navigationBarTitle, font, padding, foregroundColor, spacing, frame, zIndex, ...other} = this.props;
        let style = this.setStyles();
        Object.assign(style, {overflow: "auto", width: "fit-content", height: "inherit"})
        return (
            <List style={style} className="MemriList" {...other}>
                {navigationBarTitle &&
                <ListSubheader>{navigationBarTitle}</ListSubheader>
                }
                {this.props.children}
            </List>
        )
    }
}

export class UIImage extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, ...other} = this.props;
        let style = this.setStyles();
        Object.assign(style, {maxWidth: "100%", maxHeight: "100%"})
        return (
            <img style={style} className="UIImage" {...other}/>
        )
    }
}

export class MemriImageView extends MainUI {
    render() {
        //TODO: fitContent
        let {font, padding, foregroundColor, spacing, frame, zIndex, image, ...other} = this.props;
        let style = this.setStyles();
        Object.assign(style, {maxWidth: style.maxWidth || "100%", maxHeight: style.maxHeight || "100%"})
        return (
            <img src={image} style={style} className="MemriImageView" {...other}/>
        )
    }
}

export class RoundedRectangle extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, contentShape, edgesIgnoringSafeArea, zIndex, ...other} = this.props;
        return (
            <div style={this.setStyles()} className="RoundedRectangle" {...other}>
                {this.props.children}
            </div>
        )
    }
}

export class Capsule extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, contentShape, edgesIgnoringSafeArea, zIndex, ...other} = this.props;
        return (
            <div style={this.setStyles()} className="Capsule" {...other}>
                {this.props.children}
            </div>
        )
    }
}

export class ASCollectionView extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, images, ...other} = this.props;
        let style = this.setStyles();
        Object.assign(style, {maxHeight: "400px"})
        if (images == true) {
            return (
                <GridList style={style} className="ASCollectionView" {...other} cols={3}>
                    {this.props.children}
                </GridList>
            )
        } else {
            return (
                <Grid container style={this.setStyles()} className="ASCollectionView" {...other}>
                    {this.props.children}
                </Grid>
            )
        }
    }
}

export class Toggle extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, contentShape, edgesIgnoringSafeArea, zIndex, isOn, ...other} = this.props;
        return (
            <Switch checked={isOn} style={this.setStyles()} {...other}/>
        )
    }
}

export class MemriStepper extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, ...other} = this.props;
        return (
            <input type="number" {...other}/>
        )
    }
}

export class EmptyView extends MainUI {
    render() {
        return (
            <div className="EmptyView">
            </div>
        )
    }
}

export class Circle extends MainUI {
    render() {
        let {fill, font, padding, foregroundColor, spacing, frame, zIndex, ...other} = this.props;
        let style = this.setStyles();
        Object.assign(style, {width: "40px", height: "40px", borderRadius: "50%", backgroundColor: fill, alignItems: "center", justifyContent: "center"})
        return (
            <Box display="flex" style={style} className="Circle MuiAvatar-root MuiAvatar-circle" {...other}>
                {this.props.children}
            </Box>
        )
    }
}

export class MemriAlert extends MainUI {
    constructor(props) {
        super(props);
        this.state = {
            open: true,
        };
        this.handleClose = this.handleClose.bind(this);
    }

    handleClose() {
        this.setState({
            open: false,
        });
    }

    render() {
        let {primaryButton, secondaryButton, title, message, font, padding, foregroundColor, spacing, frame, zIndex, ...other} = this.props;
        return (
            <div style={this.setStyles()} className="Alert" {...other}>
                <Dialog open={this.state.open} onClose={this.handleClose}>
                    {title &&
                    <DialogTitle>{title}</DialogTitle>
                    }
                    {message &&
                    <DialogContentText>
                        {message}
                    </DialogContentText>
                    }
                    {(primaryButton || secondaryButton) &&
                    <DialogActions>
                        {primaryButton}
                        {secondaryButton}
                    </DialogActions>
                    }
                </Dialog>
            </div>
        )
    }
}

export class Form extends MainUI {
    render() {//TODO: navigationBarTitle
        return (
            <div className="Form">
                {this.props.children}
            </div>
        )
    }
}

export class MemriGrid extends MainUI {
    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, ...other} = this.props;
        return (
            <Grid style={this.setStyles()} className="Grid" {...other}>
                {this.props.children}
            </Grid>
        )
    }
}

export function frame(attrs: { width?, height?, minWidth?, idealWidth?, maxWidth?, minHeight?, idealHeight?, maxHeight?, alignment? }) { //TODO:
    let frameObj = Object.assign({}, attrs);
    for (let prop in frameObj) {
        if (frameObj[prop] == ".infinity")
            delete frameObj[prop]
    }
    if (frameObj.idealHeight) {
        frameObj["height"] = frameObj.idealHeight
        delete frameObj.idealHeight;
    }
    if (frameObj.idealWidth) {
        frameObj["width"] = frameObj.idealWidth
        delete frameObj.idealWidth;
    }

    return frameObj;
}

export function padding(attrs:{horizontal?,vertical?,top?,bottom?,leading?,trailing?,left?,right?}|any) {
    if (!attrs)
        return
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
        if (attrs.leading || attrs.left) {
            paddingObj["paddingLeft"] = attrs.leading || attrs.left;
        }
        if (attrs.trailing || attrs.right) {
            paddingObj["paddingRight"] = attrs.trailing || attrs.right;
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

export function font(attrs:{family?: string, size?:number; weight?: string; italic?: boolean}) {
    let fontObj = {};
    if (attrs.size)
        fontObj["fontSize"] = attrs.size;
    if (attrs.italic)
        fontObj["fontStyle"] = "italic";
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
