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
    DialogContentText, DialogActions, ListSubheader, FormGroup, FormControlLabel, Checkbox
} from "@material-ui/core";
import {Color, MemriContext, UIElementFamily, UINodeResolver} from "../../router";
import {Alignment, Font, TextAlignment} from "../../router";
import {geom} from "../../geom";

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
    bold?,
    overflowY?,
    shadow?,
    corners?
}

export class MainUI extends React.Component<MemriUIProps, {}> {
    styles;
    context: MemriContext;

    constructor(props) {
        super(props);
        this.context = props.context;
    }

    updateNavigationProps() {
        if (this.props.navigationBarTitle) {
            this.props.context.setNavigationBarTitle(this.props.navigationBarTitle)
        }
        if (this.props.navigationBarItems) {
            this.props.context.setNavigationBarItems(this.props.navigationBarItems)
        }
    }

    componentDidMount(): void {
       this.updateNavigationProps()
    }

    componentDidUpdate(): void {
        this.updateNavigationProps()
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
            offset: this.props.offset,
            zIndex: this.props.zIndex,
            backgroundColor: this.props.fill ?? this.props.background?.value ?? this.props.background,
            borderRadius: (!this.props.corners) ? this.props.cornerRadius: undefined,
            opacity: this.props.opacity,
            height: this.props.height ?? this.props.frame?.height,
            width: this.props.width ?? this.props.frame?.width,
            textAlign: this.props.textAlign,
            fontWeight: (this.props.bold) ? "bold" : undefined,
            justifyContent: this.props.justifyContent,
            overflowY: this.props.overflowY,
            flexWrap: this.props.flexWrap,
            boxShadow: this.props.shadow,
            flexGrow: this.props.flexGrow,
            top: this.props.top,
            right: this.props.right,
            float: this.props.float,
            border: this.props.border
        }

        Object.assign(styles, this.props.font, this.props.padding, this.props.margin, this.props.contentInsets, this.props.frame, this.setAlignment());

        if (this.props.corners && this.props.cornerRadius) {
            let corners = {};
            for (let i = 0; i < this.props.corners.length; i++) {
                this.props.corners.forEach((el) => corners[el] = this.props.cornerRadius)
            }
            Object.assign(styles, corners)
        }
        if (this.props.lineLimit) {
            Object.assign(styles, {
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: this.props.lineLimit,
                WebkitBoxOrient: "vertical"
            })
        }
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

    selectedIndicesBinding = (event) => {
        let selectedIndices = this.controller.context.selectedIndicesBinding;
        let index = parseInt(event.currentTarget.attributes.index.value)
        if (event.currentTarget.checked) {
            selectedIndices.push(index)
        } else {
            index = selectedIndices.indexOf(index);
            if (index !== -1) {
                selectedIndices.splice(index, 1);
            }
        }
        this.controller.context.selectedIndicesBinding = selectedIndices;
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
        let {position, top, bottom, opacity, color, font, padding, foregroundColor, spacing, frame, contentShape, edgesIgnoringSafeArea, zIndex, ...other} = this.props;
        let style = this.setStyles();
        Object.assign(style, {position: position ?? "relative", top: top ?? undefined, bottom: bottom ?? undefined, backgroundColor: new Color(color).value})
        return (
            <div style={style} className="ColorArea" {...other}>
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
        let {sheet, flexGrow, alert, font, padding, foregroundColor, spacing, frame, zIndex, centeredOverlayWithinBoundsPreferenceKey, action, ...other} = this.props;
        action = alert ? this.onAlert : (action && typeof action == "function") ? action :  ()=> {};
        let style = this.setStyles();
        Object.assign(style, {minWidth: style.minWidth ?? "10px", textTransform: "none"})
        return (
            <>
                <div className={"MemriRealButton"} style={{flexGrow: flexGrow ?? undefined}}>
                    <Button onClick={action} style={style} {...other}>
                        {this.props.children}
                    </Button>
                    {this.state.showAlert ?
                        alert :
                        null
                    }
                </div>
                {sheet != undefined &&
                    sheet()
                }
            </>
        )
    }
}

export class Sheet extends MainUI {
    render() {
        let style = this.setStyles();
        Object.assign(style, {
            position: "absolute",
            top: 10,
            left: 0,
            width: geom.size.width,
            height: geom.size.height - 10,
            zIndex: 4,
            backgroundColor: "white",
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10
        })

        return (
            <div style={style} className={"Sheet"}>
                {this.props.children}
            </div>
        )
    }
}

export class NavigationView extends MainUI {
    navigationBarItemsDiv
    constructor(props) {
        super(props);
        this.state = {navigationBarTitle: null, navigationBarItems: null, destination: null, navigationView: null};
        this.props.context.setNavigationBarTitle = (title) => this.setState({"navigationBarTitle": title})
        this.props.context.setNavigationBarItems = (items) => this.setState({"navigationBarItems": items})
        this.props.context.setNavigationBarDestination = (destination) => this.setState({"destination": destination})
        this.props.context.getNavigationBarTitle = () => {return this.state["navigationBarTitle"]}
    }

    hideBarItemsOverflowText() {
        if (this.navigationBarItemsDiv) {
            console.log(this.navigationBarItemsDiv)
            console.log(this.navigationBarItemsDiv.scrollWidth)
            console.log(this.navigationBarItemsDiv.clientWidth)
            if (this.navigationBarItemsDiv.scrollWidth > this.navigationBarItemsDiv.clientWidth) {
                let textList = this.navigationBarItemsDiv.getElementsByClassName("MemriText")
                for (let i = 0; i < textList.length; i++) {
                    textList.item(i).style.display = "none"
                }
            }
        }
    }

    componentDidMount(): void {
        this.hideBarItemsOverflowText();
    }

    componentDidUpdate(): void {
        this.hideBarItemsOverflowText();
    }

    render() {
        let style = this.setStyles();
        Object.assign(style, {background: "#f2f2f7"});
        let navigationView = (
            <div style={style} className={"NavigationView"}>
                {(this.state.navigationBarTitle || this.state.navigationBarItems) &&
                <>
                    <HStack padding={padding({vertical: 5})} frame={frame({minHeight: 15})} background={"white"}>
                        <div ref={(navigationBarItemsDiv) => {this.navigationBarItemsDiv = navigationBarItemsDiv}} className={"navigationBarItems"} style={{zIndex: 5, width: "23%"}}>
                            {this.state.navigationBarItems && this.state.navigationBarItems.leading}
                        </div>
                        <div style={{
                            textAlign: "center",
                            fontSize: "18px",
                            fontWeight: "bold",
                            width: "60%",
                            alignSelf: "center"
                        }}>
                            {this.state.navigationBarTitle}
                        </div>
                        <div style={{zIndex: 5, width: "23%"}}>
                            {this.state.navigationBarItems && this.state.navigationBarItems.trailing}
                        </div>

                    </HStack>
                    <MemriDivider margin={margin({bottom: 10})}/>
                </>
                }
                <div className={"NavigationViewContent"}>
                    {this.state.destination || this.props.children}
                </div>
            </div>
        )

        return navigationView
    }
}

export class NavigationLink extends MainUI {
    previousNavigationBarTitle
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
        this.previousNavigationBarTitle = this.props.context.getNavigationBarTitle()
        this.props.context.setNavigationBarTitle(undefined)
        this.props.context.setNavigationBarDestination(this.props.destination)
        this.props.context.setNavigationBarItems({leading: <MemriRealButton action={() => {
                this.props.context.setNavigationBarDestination(undefined);
                this.props.context.setNavigationBarItems({})
                this.setState({
                    showComponent: false,
                });
        }
            }><div style={{color: "blue", display: "flex"}}>
                <MemriImage>chevron_left</MemriImage>
                {this.previousNavigationBarTitle}</div>
        </MemriRealButton>})
    }

    render() {
        let {destination, font, foregroundColor, spacing, zIndex, action, ...other} = this.props;
        return (
            <>
                <MemriRealButton action={destination ? this._onNavigationLinkClick : () => {
                }} className={"NavigationLink"}
                                 {...other}>
                    {this.props.children}
                    <MemriImage>chevron_right</MemriImage>
                </MemriRealButton>
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
        if (value) {
            if (value.set) {
                other["onChange"] = value.set;
                other["defaultValue"] = value.get();
            } else {
                other["defaultValue"] = value;
            }
        }
        return (
            <TextField style={this.setStyles()} {...other}/>
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
            <div className={"MemriText"} style={this.setStyles()} {...other}>
                {text ?? this.props.children}
            </div>
        )
    }
}

export class ScrollView extends MainUI {
    updateHeight() {
        let scrollView = document.getElementsByClassName("ScrollView");
        if (scrollView.length > 0) {
            let topNavigation = document.getElementsByClassName("TopNavigation").item(0)
            let bottomBarView = document.getElementsByClassName("BottomBarView").item(0);

            let scrollViewPaddings = Number(scrollView.item(0).style.paddingTop.replace("px", "")) + Number(scrollView.item(0).style.paddingBottom.replace("px", ""));
            if (scrollViewPaddings) {
                scrollView.item(0).style.height = geom.size.height - topNavigation.clientHeight - bottomBarView.clientHeight - scrollViewPaddings + "px";
            } else  {
                scrollView.item(0).style.height = geom.size.height - topNavigation.clientHeight - bottomBarView.clientHeight + "px";
            }
        }
    }

    componentDidMount(): void {
        this.updateHeight();
    }

    componentDidUpdate(): void {
        this.updateHeight();
    }

    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, centeredOverlayWithinBoundsPreferenceKey, ...other} = this.props;
        let style = this.setStyles();
        Object.assign(style, {overflowY: "auto"})

        return (
            <div style={style} className="ScrollView" {...other}>
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
        Object.assign(style, {flexGrow: 1})
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
    updateHeight() {
        let tableView = document.getElementsByClassName("ASTableView");
        if (tableView.length > 0) {
            let topNavigation = document.getElementsByClassName("TopNavigation").item(0)
            let bottomVarView = document.getElementsByClassName("BottomBarView").item(0);
            let height = geom.size.height - topNavigation.clientHeight - bottomVarView.clientHeight;
            let tableViewPaddings = Number(tableView.item(0).style.paddingTop.replace("px", "")) + Number(tableView.item(0).style.paddingBottom.replace("px", ""));
            if (tableViewPaddings)
                height -= tableViewPaddings;
            let messageComposer = document.getElementById("MessageComposer");
            if (messageComposer)
                height -= messageComposer.clientHeight;
            let contextualBottomBar = document.getElementsByClassName("ContextualBottomBar");
            if (contextualBottomBar.length > 0)
                height -= contextualBottomBar.item(0).clientHeight;
            tableView.item(0).style.height = height + "px";
        }
    }

    componentDidMount(): void {
        this.updateHeight();
    }

    componentDidUpdate(): void {
        this.updateHeight();
    }

    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, ...other} = this.props;
        let style = this.setStyles();
        Object.assign(style, {display: "flex", flexDirection: "column", overflowY: "auto"})
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
                {header ? header : ""}
                <div className={"SectionContent"}>
                    {this.props.children}
                </div>
                {footer ? footer: ""}
            </div>
        )
    }
}

export class ASSection extends MainUI {
    static contextMenuShown = false
    static contextMenuParent
    static contextMenuIndex

    closeContextMenu() {
        if (!ASSection.contextMenuShown) return;
        ASSection.contextMenuShown = false
        ASSection.contextMenuParent = null
        ASSection.contextMenuIndex = null
        this.context.scheduleUIUpdate(true)
    }

    doContextAction = (action) => {
        action && action()
        this.closeContextMenu()
    }

    render() {
        let {header, footer, data, editMode, callback, deleteIconFn, dataID, direction, selectionMode, selectedIndices, contextMenuProvider, font, padding, foregroundColor, spacing, zIndex, ...other} = this.props;
        let style = this.setStyles();
        this.context = this.props.context
        Object.assign(style, {display: "flex", width: style.width, flexDirection: direction ?? "row"})

        let contextMenuShown = ASSection.contextMenuShown && (ASSection.contextMenuParent == this)
        return (
            <div style={style} className="ASSection" {...other}>
                {contextMenuShown && <ColorArea color={"black"} position="absolute" top={0}
                                                frame={frame({width: geom.size.width, height: geom.size.height})} opacity={0.5}
                                                edgesIgnoringSafeArea="all"
                                                onClick={() => this.closeContextMenu()} zIndex={10}/>
                }
                {header ? header: ""}
                {this.props.children}
                {data && data.map((dataItem, index) => {
                    let label = callback(dataItem, index)
                    let deleteIcon = deleteIconFn && deleteIconFn(dataItem, index)
                    let isContextMenuItem = contextMenuShown && index == ASSection.contextMenuIndex
                    let style = isContextMenuItem ? {zIndex: 100, backgroundColor: "white", borderRadius: 10, marginLeft: 10, marginRight: 10} : {}
                    return <>
                        <div className={"ASSectionItem"} style={style} onClick={() => this.closeContextMenu()}>
                            {editMode
                                ?
                                <FormControlLabel style={{paddingLeft: 10}} onChange={selectionMode(dataItem)}
                                    control={<Checkbox checked={(selectedIndices.includes(index))} name={data[dataID]} inputProps={{index: index}} />}
                                    label={label}
                                />
                                :
                                <>
                                    <div onClick={selectionMode(dataItem, index)}
                                         onContextMenu={contextMenuProvider ? (e)=> {
                                             e.preventDefault();
                                             ASSection.contextMenuShown = true
                                             ASSection.contextMenuParent = this
                                             ASSection.contextMenuIndex = index
                                             this.context.scheduleUIUpdate(true)
                                         } : null}
                                    >
                                        {label}
                                    </div>
                                    {deleteIcon}

                                </>
                            }
                        </div>
                        {isContextMenuItem && <>
                            {contextMenuProvider(index, dataItem)}
                        </>}
                    </>
                })}

                {footer ? footer: ""}
            </div>
        )
    }
}

export class ASCollectionViewSection extends MainUI {
    static contextMenuShown = false
    static contextMenuParent
    static contextMenuIndex

    closeContextMenu() {
        if (!ASCollectionViewSection.contextMenuShown) return;
        ASCollectionViewSection.contextMenuShown = false
        ASCollectionViewSection.contextMenuParent = null
        ASCollectionViewSection.contextMenuIndex = null
        this.context.scheduleUIUpdate(true)
    }

    doContextAction = (action) => {
        action && action()
        this.closeContextMenu()
    }

    render() {
        let {columns, contentInsets, header, footer, data, editMode, callback, dataID, direction, selectionMode, selectedIndices, contextMenuProvider, font, padding, foregroundColor, spacing, zIndex, ...other} = this.props;
        let style = this.setStyles();
        this.context = this.props.context
        Object.assign(style, {display: "flex", width: style.width, flexDirection: direction ?? "row"})
        let contextMenuShown = ASCollectionViewSection.contextMenuShown && (ASCollectionViewSection.contextMenuParent == this)
        return (
            <>
                {contextMenuShown && <ColorArea color={"black"} position="absolute" top={0}
                                                frame={frame({width: geom.size.width, height: geom.size.height})}
                                                opacity={0.5}
                                                edgesIgnoringSafeArea="all"
                                                onClick={() => this.closeContextMenu()} zIndex={10}/>
                }
                {header ? header : ""}
                {data && data.map((dataItem, index) => {
                    let label = callback(dataItem, index)
                    let isContextMenuItem = contextMenuShown && index == ASCollectionViewSection.contextMenuIndex
                    let style = isContextMenuItem ? {
                        zIndex: 100,
                        backgroundColor: "white",
                        borderRadius: 10,
                        marginLeft: 10,
                        marginRight: 10
                    } : {}
                    return <>
                        <MemriGrid xs={12 / columns} item key={dataItem.uid} contentInsets={contentInsets}>
                            <div className={"ASSectionItem"} style={style} onClick={() => this.closeContextMenu()}>
                                <div onClick={selectionMode(dataItem, index)} index={index} checked={!(selectedIndices.includes(index))}
                                     onContextMenu={contextMenuProvider ? (e) => {
                                         e.preventDefault();
                                         ASCollectionViewSection.contextMenuShown = true
                                         ASCollectionViewSection.contextMenuParent = this
                                         ASCollectionViewSection.contextMenuIndex = index
                                         this.context.scheduleUIUpdate(true)
                                     } : null}
                                >
                                    {label}
                                </div>
                            </div>
                            {isContextMenuItem && <>
                                {contextMenuProvider(index, dataItem)}
                            </>}
                        </MemriGrid>
                    </>
                })}

                {footer ? footer : ""}
            </>
        )
    }
}


export class UIAction extends MainUI {
    render() {
        let {title, action, ...other} = this.props;
        return (
            <div className="UIAction">
                <MemriRealButton {...other} action={() => {
                    action && action()
                    ASSection.contextMenuParent.closeContextMenu()
                }}>
                    <MemriText frame={frame({width: "100%"})}>
                        <MemriText font={font({size: 18})}>{title}</MemriText>
                    </MemriText>
                    {this.props.children}
                </MemriRealButton>
            </div>
        )
    }
}

export class UIMenu extends MainUI {
    render() {
        let {buttons, font, padding, foregroundColor, spacing, frame, zIndex, ...other} = this.props;
        let style = Object.assign(this.setStyles(), {backgroundColor: "white", marginTop: 10, borderRadius: 10, zIndex: 100, marginLeft: 10, width: "70%"})
        return (
            <div style={style} className="UIMenu" {...other}>
                {buttons.map((button, index) => <>
                    {(index > 0) && <MemriDivider/>}
                    {button}
                </>)}
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
        let {scrollHeight, font, padding, foregroundColor, spacing, frame, zIndex, ...other} = this.props;
        let style = this.setStyles();
        return (<>

                <div style={style} className="MemriList" {...other}>

                    <div style={scrollHeight ? {height: scrollHeight, overflow: "auto"} : undefined}>
                        {this.props.children}
                    </div>
                </div>
            </>
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
        let style = this.setStyles();
        //TODO: actually this is done to make rectangles to look like circles (in labels) @mkslanc
        Object.assign(style, {width: style.width || style.maxWidth, maxHeight: style.height || style.maxHeight});
        if (padding && !padding.padding) {
            Object.assign(style, {paddingRight: null, paddingTop: null, paddingLeft: null, paddingBottom: null});
        }
        return (
            <div style={style} className="RoundedRectangle" {...other}>
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
    updateHeight() {
        let collectionView = document.getElementsByClassName("ASCollectionView");
        if (collectionView.length > 0) {
            let topNavigation = document.getElementsByClassName("TopNavigation").item(0)
            let bottomVarView = document.getElementsByClassName("BottomBarView").item(0);
            let height = geom.size.height - topNavigation.clientHeight - bottomVarView.clientHeight;
            let collectionViewPaddings = Number(collectionView.item(0).style.paddingTop.replace("px", "")) + Number(collectionView.item(0).style.paddingBottom.replace("px", ""));
            if (collectionViewPaddings)
                height -= collectionViewPaddings;
            let contextualBottomBar = document.getElementsByClassName("ContextualBottomBar");
            if (contextualBottomBar.length > 0)
                height -= contextualBottomBar.item(0).clientHeight;
            collectionView.item(0).style.height = height + "px";
        }
    }

    componentDidMount(): void {
        this.updateHeight();
    }

    componentDidUpdate(): void {
        this.updateHeight();
    }

    render() {
        let {font, padding, foregroundColor, spacing, frame, zIndex, images, ...other} = this.props;
        let style = this.setStyles();
        if (images == true) {
            Object.assign(style, {maxHeight: "400px", overflowY: "auto", flexWrap: style.flexWrap ?? "nowrap"})
            return (
                <GridList style={style} className="ASCollectionView" {...other} cols={3}>
                    {this.props.children}
                </GridList>
            )
        } else {
            Object.assign(style, {overflowY: "auto", flexWrap: style.flexWrap ?? "nowrap"})
            return (
                <Grid container style={style} className="ASCollectionView" {...other}>
                    {this.props.children}
                </Grid>
            )
        }
    }
}

export class Toggle extends MainUI {
    constructor(props) {
        super(props);
        this.state = {
            checked: null,
        };
    }

    render() {
        let {font, padding, foregroundColor, spacing, frame, contentShape, edgesIgnoringSafeArea, zIndex, isOn, ...other} = this.props;
        if (isOn) {
            if (isOn.set) {
                other["onChange"] = (e) => {
                    isOn.set(e);
                    this.setState({checked: isOn.get()});
                }
                this.state.checked = isOn.get()
                other["checked"] = this.state.checked;
            } else {
                if (isOn)
                    other["checked"] = "";
            }
        }
        return (
            <Switch style={this.setStyles()} {...other}/>
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
        let {fill, font, padding, foregroundColor, spacing, zIndex, ...other} = this.props;
        let style = this.setStyles();
        Object.assign(style, {width: style.width ?? "40px", height: style.height ?? "40px", borderRadius: "50%", backgroundColor: fill, alignItems: "center", justifyContent: "center"})
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
    render() {
        let {navigationBarItems, navigationBarTitle, font, foregroundColor, spacing, frame, zIndex, ...other} = this.props;
        return (
            <>
                <div className="Form" {...other}>

                    {this.props.children}
                </div>
            </>
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

export class DatePicker extends MainUI {
    render() {
        let {value, font, padding, foregroundColor, spacing, frame, contentShape, edgesIgnoringSafeArea, zIndex, ...other} = this.props;
        value = new Date(value).toISOString().replace(/T(.)*$/, "");
        return (
            <TextField type="date" style={this.setStyles()} className="KeyboardDatePicker" value={value} {...other}/>
        )
    }
}


export class ActionSheet extends MainUI {
    close() {
        this.closeCallback && this.closeCallback()
        this.context.scheduleUIUpdate(true)
    }

    doAction = (action) => {
        action && action()
        this.close()
    }

    render() {
        let {buttons, title, closeCallback, context, ...other} = this.props;
        this.closeCallback = closeCallback
        this.context = context
        let style = this.setStyles();
        Object.assign(style, {width: geom.size.width - 10, paddingLeft: 5, bottom: 0, position: "absolute", zIndex: 10})
        let cancelIndex;
        return (
            <>
                <ColorArea color={"black"} position="absolute" top={0}
                           frame={frame({width: geom.size.width, height: geom.size.height})} opacity={0.5}
                           edgesIgnoringSafeArea="all"
                           onClick={() => this.close()} zIndex={10}/>
                <div className={"ActionSheet"} style={style} {...other}>
                    <div style={{backgroundColor: "white", textAlign: "center", paddingTop: 20, borderRadius: 10}}>
                        <MemriText foregroundColor={"#aeb0ad"}>{title}</MemriText>
                        {buttons.map((button, index) => {
                            if (!button.cancel) {
                                return (<>
                                        <MemriDivider/>
                                        <MemriRealButton action={() => this.doAction(button.action)}
                                                         frame={frame({width: "100%"})}>
                                            <MemriText foregroundColor={"#307ad9"}
                                                       font={font({size: 18})}>{button.text}</MemriText>
                                        </MemriRealButton>
                                    </>
                                )
                            } else
                                cancelIndex = index;
                        })}
                    </div>
                    {cancelIndex != undefined  && <div style={{
                        backgroundColor: "white",
                        textAlign: "center",
                        marginTop: 5,
                        borderRadius: 10
                    }}><MemriRealButton action={() => this.doAction(buttons[cancelIndex].action)} frame={frame({width: "100%"})}>
                        <MemriText foregroundColor={"#307ad9"}
                                   font={font({size: 18})}>{buttons[cancelIndex].text}</MemriText>
                    </MemriRealButton></div>}
                </div>
            </>

        )
    }
}

export function frame(attrs: { width?, height?, minWidth?, idealWidth?, maxWidth?, minHeight?, idealHeight?, maxHeight?, alignment? }) { //TODO:
    let frameObj = Object.assign({}, attrs);
    for (let prop in frameObj) {
        if (frameObj[prop] == ".infinity" || frameObj[prop] == "infinity")
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

export function padding(attrs: { horizontal?: number | "default", vertical?: number | "default", top?: number | "default", bottom?: number | "default", leading?: number | "default", trailing?: number | "default", left?: number | "default", right?: number | "default" } | any|"default") {
    let defaultPadding = 10;
    if (!attrs)
        return
    let paddingObj = {};
    if (typeof attrs == "number" || typeof attrs == "string") {
        paddingObj["padding"] = (attrs == "default") ? defaultPadding : attrs;
    } else {
        if (attrs.horizontal) {
            paddingObj["paddingRight"] = paddingObj["paddingLeft"] = (attrs.horizontal == "default") ? defaultPadding : attrs.horizontal;
        }
        if (attrs.vertical) {
            paddingObj["paddingTop"] = paddingObj["paddingBottom"] = (attrs.vertical == "default") ? defaultPadding : attrs.vertical;
        }
        if (attrs.leading || attrs.left) {
            paddingObj["paddingLeft"] = (attrs.leading == "default" || attrs.left == "default") ? defaultPadding : (attrs.leading || attrs.left);
        }
        if (attrs.trailing || attrs.right) {
            paddingObj["paddingRight"] = (attrs.trailing == "default" || attrs.right == "default") ? defaultPadding : (attrs.trailing || attrs.right);
        }
        if (attrs.top) {
            paddingObj["paddingTop"] = (attrs.top == "default") ? defaultPadding : attrs.top;
        }
        if (attrs.bottom) {
            paddingObj["paddingBottom"] = (attrs.bottom == "default") ? defaultPadding : attrs.bottom;
        }
    }
    return paddingObj;
}

export function margin(attrs: { horizontal?: number | "default", vertical?: number | "default", top?: number | "default", bottom?: number | "default", leading?: number | "default", trailing?: number | "default", left?: number | "default", right?: number | "default" } | any|"default") {
    let defaultPadding = 10;
    if (!attrs)
        return
    let paddingObj = {};
    if (typeof attrs == "number" || typeof attrs == "string") {
        paddingObj["margin"] = (attrs == "default") ? defaultPadding : attrs;
    } else {
        if (attrs.horizontal) {
            paddingObj["marginRight"] = paddingObj["marginLeft"] = (attrs.horizontal == "default") ? defaultPadding : attrs.horizontal;
        }
        if (attrs.vertical) {
            paddingObj["marginTop"] = paddingObj["marginBottom"] = (attrs.vertical == "default") ? defaultPadding : attrs.vertical;
        }
        if (attrs.leading || attrs.left) {
            paddingObj["marginLeft"] = (attrs.leading == "default" || attrs.left == "default") ? defaultPadding : (attrs.leading || attrs.left);
        }
        if (attrs.trailing || attrs.right) {
            paddingObj["marginRight"] = (attrs.trailing == "default" || attrs.right == "default") ? defaultPadding : (attrs.trailing || attrs.right);
        }
        if (attrs.top) {
            paddingObj["marginTop"] = (attrs.top == "default") ? defaultPadding : attrs.top;
        }
        if (attrs.bottom) {
            paddingObj["marginBottom"] = (attrs.bottom == "default") ? defaultPadding : attrs.bottom;
        }
    }
    return paddingObj;
}

export function offset(attrs:{x?,y?}) { //TODO: x,y
    return `${attrs.x? attrs.x +"px" : ""} ${attrs.y? attrs.y+"px" : ""}`;
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

export function shadow(attrs:{x?,y?,radius?, color?}) {
    return `${attrs.x ?? 0}px ${attrs.y ?? 0}px ${attrs.radius ?? 0}px ${attrs.color ?? "#000000"}`;
}

export function contentInsets(attrs:{top?,bottom?,left?,right?}) { //TODO:
    let contentInsetsObj = attrs;

    return contentInsetsObj;
}

export function setProperties(properties, item, context, viewArguments) {
    return {properties: properties, item: item, context: context, viewArguments: viewArguments}
}

export enum Corners {
    topLeft="borderTopLeftRadius",
    topRight="borderTopRightRadius",
    bottomLeft="borderBottomLeftRadius",
    bottomRight="borderBottomRightRadius"
}