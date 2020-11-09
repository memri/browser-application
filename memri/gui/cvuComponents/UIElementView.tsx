//
// UIElementView.swift
// Copyright © 2020 memri. All rights reserved.


import {
    EmptyView,
    MainUI, MemriDivider,
    MemriText,
    Spacer,
} from "../swiftUI";
import {CVU_Image, CVUStateDefinition, Item} from "../../../router";
import {ViewArguments} from "../../../router";
import * as React from "react";
import {Action} from "../../../router";
import {CVUParsedViewDefinition} from "../../../router";
import {debugHistory} from "../../../router";
import {ActionButton} from "../ActionView";

import {SubView} from "../common/SubView";
import {CVU_HStack, CVU_VStack, CVU_ZStack} from "./CVU_Stack";
import {CVU_SmartText, CVU_Text, CVU_TextField} from "./CVU_Text";
import {CVU_Map} from "./CVU_Map";
import {CVU_RichTextEditor} from "./CVU_RichTextEditor";
import {CVU_EditorRow, CVU_EditorSection} from "./CVU_EditorSection";
import {CVU_Toggle} from "./CVU_Toggle";
import {CVU_MemriButton} from "./CVU_MemriButton";
import {CVU_Button} from "./CVU_Button";
import {CVU_ShapeCircle, CVU_ShapeRectangle} from "./CVU_Shape";
import {CVU_HTMLView} from "./CVU_HTMLView";
import {ItemCell} from "../common/ItemCell";
import {CVU_TimelineItem} from "./CVU_TimelineItem";
import {CVU_AppearanceModifier} from "./CVU_AppearanceModifier";
import {FlowStack} from "../components/FlowStack";
require("../../extension/common/string");


export enum UIElementFamily {
    // Implemented
    VStack="VStack", HStack="HStack", ZStack="ZStack", FlowStack="FlowStack",
    Text="Text", SmartText="SmartText", Textfield="Textfield", RichTextfield="RichTextfield",
    Image="Image",
    Toggle="Toggle", Picker="Picker",
    MemriButton="MemriButton", Button="Button", ActionButton="ActionButton",
    Map="Map",
    Empty="Empty", Spacer="Spacer", Divider="Divider", HorizontalLine="HorizontalLine",
    Circle="Circle", Rectangle="Rectangle",
    EditorSection="EditorSection", EditorRow="EditorRow",
    SubView="SubView",
    HTMLView="HTMLView",
    TimelineItem="TimelineItem",
    ItemCell="ItemCell",

    //Unimplemented
    EditorLabel="EditorLabel",
}

export class UIElementView extends MainUI {
    context: MemriContext

    nodeResolver: UINodeResolver

    editModeBinding = {
        get: () => {
            return this.context.editMode
        },
        set: ($0) => {
            this.context.editMode = $0
        }
    }

    get resolvedComponent() {
        switch (this.nodeResolver.node.type) {
            case UIElementFamily.HStack:
                return new CVU_HStack({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.VStack:
                return new CVU_VStack({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.ZStack:
                return new CVU_ZStack({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.Text:
                return new CVU_Text({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.SmartText:
                return new CVU_SmartText({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.Image:
                return new CVU_Image({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.Map:
                return new CVU_Map({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.Textfield:
                return new CVU_TextField({nodeResolver: this.nodeResolver, editModeBinding: this.editModeBinding})
            case UIElementFamily.RichTextfield:
                return new CVU_RichTextEditor({nodeResolver: this.nodeResolver, editModeBinding: this.editModeBinding, searchTerm: this.context.currentView?.filterText})
            case UIElementFamily.EditorSection:
                return new CVU_EditorSection({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.EditorRow:
                return new CVU_EditorRow({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.EditorLabel:
                return new EmptyView({})
                //warning("EditorLabel Unimplemented")
            case UIElementFamily.Toggle:
                return new CVU_Toggle({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.MemriButton:
                return new CVU_MemriButton({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.ActionButton:
                return new ActionButton({action: this.nodeResolver.resolve("press") ?? new Action(this.context, "noop"), item: this.nodeResolver.item, context: this.context})
            case UIElementFamily.Button:
                return new CVU_Button({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.Divider:
                return new MemriDivider({})
            case UIElementFamily.HorizontalLine:
                return new HorizontalLine({})
            case UIElementFamily.Circle:
                return new CVU_ShapeCircle({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.Rectangle:
                return new CVU_ShapeRectangle({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.HTMLView:
                return new CVU_HTMLView({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.Spacer:
                return new Spacer({})
            case UIElementFamily.Empty:
                return new EmptyView({})
            case UIElementFamily.SubView:
                return this.subview
            case UIElementFamily.FlowStack:
                return this.flowstack
            case UIElementFamily.Picker:
                return this.picker
            case UIElementFamily.ItemCell:
                return new ItemCell({
                    item: this.nodeResolver.item,
                    rendererNames: this.nodeResolver.resolve("rendererNames") ?? [],
                    argumentsJs: this.nodeResolver.viewArguments, context: this.context
                })
            case UIElementFamily.TimelineItem:
                return new CVU_TimelineItem({nodeResolver: this.nodeResolver, context: this.context})
            default:
                return new MemriText({nodeResolver: this.nodeResolver, text: `${this.nodeResolver.node.type} not implemented`, context: this.context})
        }
    }

    get needsModifier(): boolean {
        if (this.nodeResolver) {
            if (!this.nodeResolver.showNode) {
                return false
            }
            switch (this.nodeResolver.node.type) {
                case UIElementFamily.Empty:
                case UIElementFamily.Spacer:
                case UIElementFamily.Divider:
                case UIElementFamily.FlowStack:
                case UIElementFamily.SubView:
                case UIElementFamily.ActionButton:
                    return false
                default:
                    return true
            }
        }
        return false;
    }

    render() {
        this.nodeResolver = this.props.nodeResolver;
        this.context = this.props.context;
        // var x = this.render1()
        //if (x === undefined) debugger
        // return x || null
        var resolvedComponent
        if (this.nodeResolver.showNode) {
            resolvedComponent = this.resolvedComponent;

            if (this.needsModifier) {
                if (!resolvedComponent.modifier) {
                    console.log(resolvedComponent)
                }
                let modifiers = resolvedComponent.modifier(new CVU_AppearanceModifier(this.nodeResolver));
                Object.assign(resolvedComponent.props, modifiers);
            }
            return resolvedComponent.render();
        }

    }

    get flowstack() {//TODO:
        return new FlowStack({
            nodeResolver: this.nodeResolver,
            data: this.nodeResolver.resolve("list") ?? [],
            spacing: this.nodeResolver.spacing,
            content: (listItem) => this.nodeResolver.childrenInForEach(this.context, listItem)
        })
    }

    get picker() {//TODO:
        let [_, propItem, propName] = this.nodeResolver.getType("value")
        let selected = this.nodeResolver.resolve("value", Item) ?? this.nodeResolver.resolve("defaultValue", Item)
        let emptyValue = this.nodeResolver.resolve("hint") ?? "Pick a value"
        let query = this.nodeResolver.resolve("query", String)
        let renderer = this.nodeResolver.resolve("renderer", String)

        let item = this.nodeResolver.item

        if (item && propItem) {
            return <Picker
                item={item}
                selected={selected}
                title={this.nodeResolver.string("title") ?? "Select:"}
                emptyValue={emptyValue}
                propItem={propItem}
                propName={propName}
                renderer={renderer}
                query={query ?? ""}
            />
        }
    }

    get subview() {
        let subviewArguments = new ViewArguments(this.nodeResolver.resolve("arguments"))
        let viewName = this.nodeResolver.string("viewName")
        if (viewName) {
            return new SubView({context: this.context, viewName: viewName, item: this.nodeResolver.item, viewArguments: subviewArguments})
        } else {
            let parsed = this.nodeResolver.resolve("view")
            let view
            // #warning(
            //     "This is creating a new CVU at every redraw. Instead architect this to only create the CVU once and have that one reload"
            // )
            if (parsed) {
                let def = new CVUParsedViewDefinition(
                    "[view]",
                    undefined,
                    "view",
                    undefined,
                    "user",
                    parsed
                )
                try {
                    view = CVUStateDefinition.fromCVUParsedDefinition(def)
                } catch (error) {
                    debugHistory.error(`${error}`)
                }
            } else {
                debugHistory
                    .error(
                        "Failed to make subview (not defined), creating empty one instead"
                    )
                view = new CVUStateDefinition()
            }
            //#warning("This was carried over from the old UIElementView - this has potential to cause performance issues")
            return new SubView({context: this.context, view: view, item: this.nodeResolver.item, viewArguments: subviewArguments})
        }
    }
}


    //
    // from: UIElement
    // item: Item
    // viewArguments: ViewArguments
    //
    // init(gui: UIElement, dataItem: Item, viewArguments?: ViewArguments) {
    //     this.from = gui
    //     this.item = dataItem.isInvalidated ? new Item() : dataItem
    //
    //     this.viewArguments = new ViewArguments(viewArguments, this.item)
    // }
    //
    // has(propName: String) {
    //     return this.viewArguments.get(propName) != undefined || this.from.has(propName)
    // }
    //
    // get(propName: string, defaultValue?) {
    //     if (propName == "align") {
    //         let align = this.from.get(propName, this.item, this.viewArguments);
    //         if (align) {
    //             return align
    //         }
    //         else {
    //             let align = this.from.get(propName, this.item, this.viewArguments);
    //             if (align)  {
    //             return CVUParser.specialTypedProperties["align"](align)
    //         }}
    //     }
    //
    //     return this.from.get(propName, this.item, this.viewArguments) ?? defaultValue;
    // }
    //
    // getFileURI(propName: string) { //TODO:
    //     let file = this.get(propName);
    //     if (file && file.file) {
    //         return "memri/Resources/DemoAssets/" + file.file.filename + ".jpg"
    //     }
    //     if (file) {
    //         return "memri/Resources/DemoAssets/" + file.filename + ".jpg"
    //     }
    //
    //     return "";
    //  /*   if let photo: Photo? = get(propName), let file = photo?.file {
    //         return file.asUIImage ?? UIImage()
    //     }
    //
    //     return UIImage()*/
    // }
    //
    // getbundleImage() {
    //     let name: string = this.get("bundleImage");
    //     if (name) {
    //         return <MemriImage>{name}</MemriImage>
    //     }
    //     return <MemriImage>{"exclamationmark.bubble"}</MemriImage>
    // }
    //
    // getList(key: string) {
    //     return this.get(key) ?? [];
    // }
    //
    // resize(view) {
    //     let resizable: String = this.from.get("resizable", this.item) ?? ""
    //     let y = view.resizable()
    //
    //    /* switch (resizable) {
    //     case "fill": return AnyView(y.aspectRatio(contentMode: .fill))
    //     case "fit": return AnyView(y.aspectRatio(contentMode: .fit))
    //     case "stretch":
    //     default:
    //         return AnyView(y)
    //     }*/ //TODO:
    // }
    //
    // render1(){
    //     this.context = this.props.context;
    //     this.init(this.props.gui, this.props.dataItem, this.props.viewArguments);
    //     let editorLabelAction = () => {
    //         let args = new MemriDictionary({
    //             "subject": this.context.item, // self.item,
    //             "edgeType": this.viewArguments.get("name")
    //         })
    //         let action = new ActionUnlink(this.context, args)
    //         this.context.executeAction(action, this.item, this.viewArguments
    //         )
    //     }
    //
    //     let buttonAction = () => {
    //         let press: Action = this.get("press");
    //         if (press) {
    //             this.context.executeAction(press, this.item, this.viewArguments)
    //         }
    //     }
    //
    //     let setView = function () {
    //         let parsed = this.get("view");
    //         if (parsed) {
    //             let def = new CVUParsedViewDefinition(
    //                 "[view]",
    //                 undefined,
    //                 "view",
    //                 undefined,
    //                 "user",
    //                 parsed
    //             )
    //             try {
    //                 return CVUStateDefinition.fromCVUParsedDefinition(def)
    //             } catch (error) {
    //                 debugHistory.error(`${error}`)
    //             }
    //         } else {
    //             debugHistory
    //                 .error(
    //                     "Failed to make subview (not defined), creating empty one instead"
    //                 )
    //         }
    //         return new CVUStateDefinition()
    //     }.bind(this) //TODO: ();
    //
    //     let show = this.get("show")
    //     if (!this.has("show") || show) {
    //         switch (this.from.type) {
    //             case UIElementFamily.Image:
    //                 return (
    //                     (this.has("systemName")) ?
    //                         <MemriImage
    //                             setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}>
    //                             {this.get("systemName") ?? "exclamationmark.bubble"}
    //                             {/*.if(from.has("resizable")) { self.resize($0) }*/}
    //                         </MemriImage> :
    //                         (this.has("bundleImage")) ?
    //                             <this.getbundleImage renderingMode="original"
    //                                                  setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}/> :
    //                             <UIImage src={this.getFileURI("image")}
    //                                 setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}>
    //
    //                                 {/* MemriImageView(imageURI: getFileURI("image"),
    //                                    fitContent: from.propertyResolver.fitContent,
    //                                    forceAspect: from.propertyResolver.forceAspect)
    //                         .setProperties(
    //                             from.propertyResolver.properties,
    //                             self.item,
    //                             context,
    //                             self.viewArguments
    //                         )*/}
    //                             </UIImage>
    //                 )
    //             case UIElementFamily.HStack:
    //                 return (
    //                     <HStack alignment={this.get("alignment") ?? Alignment.top}
    //                             spacing={this.get("spacing") ?? 0} clipped
    //                             setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}>
    //                         {this.renderChildren}
    //                     </HStack>
    //                 )
    //             case UIElementFamily.VStack:
    //                 return (
    //                     <VStack alignment={this.get("alignment") ?? Alignment.leading}
    //                             spacing={this.get("spacing") ?? 0} clipped
    //                             setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}>
    //                         {this.renderChildren}
    //                     </VStack>
    //                 )
    //             case UIElementFamily.ZStack:
    //                 return (
    //                     <ZStack alignment={this.get("alignment") ?? Alignment.top}
    //                             spacing={this.get("spacing") ?? 0} clipped
    //                             setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}>
    //                         {this.renderChildren}
    //                     </ZStack>
    //                 )
    //             case UIElementFamily.Text:
    //                 return (
    //                     (this.from.processText(this.get("text")
    //                         ?? this.get("nilText")
    //                         ?? (this.get("allowNil", false) ? "" : undefined)))?.map((text) => {
    //                             return <MemriText
    //                                 setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}>
    //                                 {text}
    //                                 {/*.if(from.getBool("bold")) { $0.bold() }
    //                                                 .if(from.getBool("italic")) { $0.italic() }
    //                                                 .if(from.getBool("underline")) { $0.underline() }
    //                                                 .if(from.getBool("strikethrough")) { $0.strikethrough() }
    //                                                 .fixedSize(horizontal: false, vertical: true)*/}
    //                             </MemriText>
    //                         }
    //                     )
    //                 )
    //             case UIElementFamily.EditorSection:
    //                 if (this.has("title")) {
    //                     return (
    //                         <Section header={(this.get("title") ?? "").toUpperCase()}
    //                                  clipped
    //                                  setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}>
    //                             <GeneralEditorHeader>
    //                                 <MemriDivider/>
    //                                 {this.renderChildren}
    //                                 <MemriDivider/>
    //                             </GeneralEditorHeader>
    //                         </Section>
    //                     )
    //                 } else {
    //                     return (
    //                         <VStack spacing={0} clipped
    //                                 setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}>
    //                             {this.renderChildren}
    //                         </VStack>
    //                     )
    //                 }
    //             case UIElementFamily.EditorRow:
    //                 return (
    //                     <VStack spacing={0}>
    //                         <VStack alignment={Alignment.leading} spacing={4} fullWidth
    //                                 padding={padding({
    //                                     bottom: this.get("nopadding") != true ? 10 : 0,
    //                                     leading: this.get("nopadding") != true ? 36 : 0,
    //                                     trailing: this.get("nopadding") != true ? 36 : 0
    //                                 })} clipped
    //                                 setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}
    //                                 background={this.get("readOnly") ?? this.viewArguments.get("readOnly") ?? false
    //                                     ? "#f9f9f9"
    //                                     : "#f7fcf5"}>
    //                             {(this.has("title") && this.get("nopadding") != true) &&
    //                             <MemriText>
    //                                 <GeneralEditorLabel>
    //                                     {(this.get("title") ?? "")
    //                                         .toLowerCase()
    //                                         .camelCaseToWords()
    //                                         .capitalizingFirst()}
    //                                 </GeneralEditorLabel>
    //                             </MemriText>
    //                             }
    //                             <GeneralEditorCaption>{this.renderChildren} </GeneralEditorCaption>
    //                         </VStack>
    //                         {(this.has("title")) &&
    //                         <MemriDivider padding={padding({leading: 35})}/>
    //                         }
    //                     </VStack>
    //                 )
    //             case UIElementFamily.EditorLabel:
    //                 return (
    //                     <HStack alignment={Alignment.center} spacing={15} frame={frame({
    //                         minWidth: 130,
    //                         maxWidth: 130,
    //                         maxHeight: ".infinity",
    //                         alignment: Alignment.leading
    //                     })} padding={padding(10)} border={border({width: [0, 0, 1, 1], color: "#eee"})}>
    //                         <MemriRealButton action={editorLabelAction}>
    //                             <MemriImage foregroundColor="red" font={font({size: 22})} lineLimit={1}>
    //                                 minus.circle.fill
    //                             </MemriImage>
    //                         </MemriRealButton>
    //                         {(this.has("title")) &&
    //                         <MemriRealButton>
    //                             <HStack>
    //                                 <MemriText foregroundColor="blue" font={font({size: 15})}>
    //                                     {this.get("title") ?? ""}
    //                                 </MemriText>
    //                                 <Spacer/>
    //                                 <MemriImage foregroundColor="gray"
    //                                             font={font({size: 14, weight: Font.Weight.bold})}>
    //                                     chevron.right
    //                                 </MemriImage>
    //                             </HStack>
    //                         </MemriRealButton>
    //                         }
    //                     </HStack>
    //                 )
    //             case UIElementFamily.Button:
    //                 return (
    //                     <MemriRealButton context={this.context} action={buttonAction}
    //                                      setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}>
    //                         {this.renderChildren}
    //                     </MemriRealButton>
    //                 );
    //             case UIElementFamily.FlowStack:
    //                 //TODO: FlowStack component
    //                 return (
    //                     <ASCollectionView
    //                         setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}>
    //                         {this.getList("list").map((listItem) => {
    //                             return this.from.children.map((child) => {
    //                                     return <Grid item key={listItem.uid}><UIElementView context={this.context} gui={child} dataItem={listItem}
    //                                                           viewArguments={this.viewArguments}/></Grid>
    //                                 }
    //                             )
    //                         })}
    //                         {/* FlowStack(getList("list")) { listItem in
    //                                 ForEach(0 ..< self.from.children.count) { index in
    //                                     UIElementView(self.from.children[index], listItem, self.viewArguments)
    //                                     .environmentObject(self.context)
    //                                     }
    //                                     }*/}
    //                     </ASCollectionView>
    //                 );
    //             case UIElementFamily.Textfield:
    //                 /*
    //                 <this.renderTextfield
    //                         setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}>
    //
    //                     </this.renderTextfield>
    //                  */
    //                 //TODO:
    //                 return (
    //                     <div className="renderTextfield"></div>
    //                 )
    //             case UIElementFamily.RichTextfield:
    //                 //TODO:
    //                 /*
    //                 <this.renderRichTextfield
    //                         setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}>
    //
    //                     </this.renderRichTextfield>
    //                  */
    //                 return (<>
    //                     {this.renderRichTextfield()}
    //                     </>
    //                 );
    //             case UIElementFamily.ItemCell:
    //                 //TODO:
    //                 return (<div className="ItemCell"></div>)
    //             case UIElementFamily.EmailContent:
    //                 //TODO:
    //                 return (<div className="EmailContent">
    //                     {this.get("content")}
    //                 </div>)
    //             case UIElementFamily.Toggle:
    //                 return this.renderToggle()
    //                     /*.setProperties(//TODO
    //                         from.propertyResolver.properties,
    //                         self.item,
    //                         context,
    //                         self.viewArguments*/
    //             case UIElementFamily.SubView:
    //                 return (
    //                     (this.has("viewName")) ?
    //                         <SubView context={this.context}
    //                                  viewName={this.from.getString("viewName")}
    //                                  item={this.item}
    //                                  viewArguments={new ViewArguments(this.get("arguments"))}
    //                                  setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}>
    //
    //                         </SubView> :
    //
    //                         <SubView context={this.context}
    //                                  view={setView()}
    //                                  item={this.item}
    //                                  viewArguments={new ViewArguments(this.get("arguments"))}
    //                                  setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}>
    //
    //                         </SubView>
    //                 )
    //             case UIElementFamily.Map:
    //                 //TODO:
    //                 return (<div className="Map"></div>)
    //             case UIElementFamily.Picker:
    //                 return (
    //                     <this.renderPicker
    //                         setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}>
    //
    //                     </this.renderPicker>
    //                 )
    //             case UIElementFamily.SecureField:
    //                 //TODO:
    //                 return (<div className="SecureField"></div>)
    //             case UIElementFamily.Action:
    //                 return (
    //                     <ActionButton context={this.context}
    //                         action={this.get("press") ?? new Action(this.context, "noop")}
    //                         item={this.item}
    //                         setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}>
    //
    //                     </ActionButton>
    //                 )
    //             case UIElementFamily.MemriButton:
    //                 return (
    //                     <MemriButton context={this.context}
    //                                      item={this.get("item")} edge={this.get("edge")}
    //                                      setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}>
    //
    //                     </MemriButton>
    //                 )
    //             case UIElementFamily.TimelineItem:
    //                 //TODO:
    //                 return (<div className="TimelineItem"></div>)
    //             case UIElementFamily.MessageBubble:
    //                 //font: get("font", type: FontDefinition.self))
    //                 return (<MessageBubbleView timestamp={this.get("dateTime")}
    //                                            sender={this.get("sender")}
    //                                            content={this.from.processText(this.get("content")) ?? ""}
    //                                            outgoing={this.get("isOutgoing") ?? false}
    //                                            setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}
    //                 />)
    //             case UIElementFamily.SmartText:
    //                 return (
    //                     <MemriSmartTextView string={this.get("text") ?? ""}
    //                                         detectLinks={this.get("detectLinks") ?? true}
    //                                         font={this.from.propertyResolver.font}
    //                                         color={this.get("color") ?? new Color("label")}
    //                                         maxLines={this.get("maxLines")}
    //                                         setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}
    //
    //                     />
    //                 )
    //             //.fixedSize(horizontal: false, vertical: true)
    //             case UIElementFamily.EmailHeader:
    //                 //TODO:
    //                 return (
    //                     <EmailHeaderView senderName={this.get("title") ?? "Untitled"}
    //                                      recipientList={this.get("subtitle")} dateString={this.get("rightSubtitle")}
    //                                      color={this.get("color")}
    //                                      setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}
    //                     />
    //                 )
    //             case UIElementFamily.Circle:
    //                 //TODO:
    //                 return (<div className="Circle"></div>)
    //             case UIElementFamily.HorizontalLine:
    //                 /*
    //                 <HorizontalLine
    //                         setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}>
    //
    //                     </HorizontalLine>
    //                  */
    //                 //TODO:
    //                 return (<div className="HorizontalLine"></div>)
    //             case UIElementFamily.Rectangle:
    //                 //TODO:
    //                 /*return (
    //                     <Rectangle
    //                         setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}>
    //
    //                     </Rectangle>
    //                 )*/
    //                 return (<div className="Rectangle"></div>)
    //             case UIElementFamily.RoundedRectangle:
    //                 //TODO:
    //                 return (
    //                     <RoundedRectangle
    //                         setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}>
    //
    //                     </RoundedRectangle>
    //                 )
    //             case UIElementFamily.Spacer:
    //                 return (
    //                     <Spacer
    //                         setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}>
    //
    //                     </Spacer>
    //                 )
    //             case UIElementFamily.Divider:
    //                 return (
    //                     <MemriDivider
    //                         setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}>
    //
    //                     </MemriDivider>
    //                 )
    //             case UIElementFamily.Empty:
    //                 return (
    //                     <Empty
    //                         setProperties={setProperties(this.from.propertyResolver.properties, this.item, this.context, this.viewArguments)}>
    //
    //                     </Empty>
    //                 )
    //             default:
    //                 return (
    //                     <>
    //                         {this.logWarning(`Warning: Unknown UI element type '${this.from.type}'`)}
    //                     </>
    //                 )
    //         }
    //     }
    //
    //     return null;
    //
    //
    // }
    //
    // logWarning(message: string) {
    //     console.log(message)
    //     //return EmptyView()
    // }
    //
    // renderRichTextfield() { //TODO:
    //     let [_, contentDataItem, contentPropertyName] = this.from.getType("content", this.item, this.viewArguments)
    //     /*if (!contentDataItem.hasProperty(contentPropertyName) || !plainContentDataItem.hasProperty(plainContentPropertyName)) {
    //         return <MemriText>Invalid property value set on RichTextEditor</MemriText>
    //     }*/
    //
    //     // CONTENT
    //     /*let contentBinding = Binding<String?>(
    //         get: { (contentDataItem[contentPropertyName] as? String)?.nilIfBlank },
    //         set: { contentDataItem.set(contentPropertyName, $0) }
    //     )*/
    //
    //     /*let plainContentBinding = Binding<String?>(
    //         get: { (plainContentDataItem[plainContentPropertyName] as? String)?.nilIfBlank },
    //         set: { plainContentDataItem.set(plainContentPropertyName, $0) }
    //     )*/
    //
    //     let fontSize = this.get("fontSize")
    //
    //     // TITLE
    //     let [___, titleDataItem, titlePropertyName] = this.from.getType("title", this.item, this.viewArguments);
    //     let titleBinding = titleDataItem.hasProperty(titlePropertyName);
    //     /*let titleBinding = titleDataItem.hasProperty(titlePropertyName) ? Binding<String?>(
    //         get: { (titleDataItem[titlePropertyName] as? String)?.nilIfBlank },
    //         set: { titleDataItem.set(titlePropertyName, $0) }
    //     ) : nil // Only pass a title binding if the property exists (otherwise pass nil)*/
    //     let titleHint = this.get("titleHint")
    //     let titleFontSize = this.get("titleFontSize")
    //
    //     // Filter (unimplemented)
    //     /* let filterTextBinding = Binding<String>(
    //         get: { self.context.currentView?.filterText ?? "" },
    //         set: { self.context.currentView?.filterText = $0 }
    //     )*/
    //
    //     return (
    //         <RichTextEditor htmlContentBinding={contentDataItem[contentPropertyName]}
    //                         titleBinding={titleDataItem[titlePropertyName]}
    //                         titleHint={titleHint} headingFontSize={titleFontSize ?? 26}
    //                         fontSize={fontSize ?? 18} item={this.item}
    //         />
    //     )
    //
    //     /*return _RichTextEditor(htmlContentBinding: contentBinding,
    //                            plainContentBinding: plainContentBinding,
    //                            titleBinding: titleBinding,
    //                            titleHint: titleHint,
    //                            fontSize: fontSize ?? 18,
    //                            headingFontSize: titleFontSize ?? 26,
    //                            filterText: filterTextBinding)
    //         .eraseToAnyView()*/ //TODO:
    // }
    //
    // renderToggle() {
    //     let [_, dataItem, propName] = this.from.getType("value", this.item, this.viewArguments)
    //
    //     return (
    //         <Toggle isOn={dataItem.get(propName) ?? false}
    //                 onChange={(e) => {
    //                     dataItem.set(propName, e.target.value)
    //                 }}
    //                 labelsHidden>
    //             <EmptyView/>
    //         </Toggle>
    //     )
    // }
    //
    // renderTextfield() {
    //     /*let [type, dataItem, propName] = this.getType("value", this.item, this.viewArguments)
    //     //        let rows:CGFloat = self.get("rows") ?? 2
    //
    //     return (
    //         <Group>
    //             {propName == "" ?
    //             <MemriText>
    //                 Invalid property value set on TextField
    //             </MemriText> :
    //                 (type != PropertyType.string) ?
    //                     <MemriTextField>
    //
    //                     </MemriTextField>
    //
    //
    //             }
    //         </Group>
    //         if propName == "" {
    //             Text("Invalid property value set on TextField")
    //         }
    //         else if type != PropertyType.string {
    //             TextField(LocalizedStringKey(self.get("hint") ?? ""), value: Binding<Any>(
    //                 get: { dataItem[propName] as Any },
    //                 set: { dataItem.set(propName, $0) }
    //             ),
    //                       formatter: type == .date ? DateFormatter() :
    //                 NumberFormatter()) // TODO: Refactor: expand to properly support all types
    //                 .keyboardType(.decimalPad)
    //                 .generalEditorInput()
    //         }
    //         else {
    //             MemriTextField(
    //                 value: Binding<String>(
    //                     get: { dataItem.getString(propName) },
    //                     set: { dataItem.set(propName, $0) }
    //                 ), placeholder: self.get("hint")
    //             )
    //             .generalEditorInput()
    //         }
    //     }
    // )*/
    // }
    //
    // renderPicker() {
    //     return (<div className="Picker">Testpicker</div>)
    //     // let dataItem = this.get("value")
    //     // let [_, propItem, propName] = this.from.getType("value", this.item, this.viewArguments)
    //     // let emptyValue = this.get("empty") ?? "Pick a value"
    //     // let query = this.get("query")
    //     // let renderer = this.get("renderer")
    //     //
    //     // return <Picker>
    //     //
    //     // </Picker>
    //     //
    //     // return Picker(
    //     //     item: item,
    //     //     selected: dataItem ?? get("defaultValue"),
    //     //     title: get("title") ?? "Select a \(emptyValue)",
    //     //     emptyValue: emptyValue,
    //     //     propItem: propItem,
    //     //     propName: propName,
    //     //     renderer: renderer,
    //     //     query: query ?? ""
    //     // )
    // }
    //
    // get renderChildren() {
    //     return (
    //         <Group>
    //             {
    //                 this.from.children.map((uiElement) => {
    //                     return <UIElementView gui={uiElement} dataItem={this.item}  viewArguments={this.viewArguments}/>
    //                     })
    //             }
    //         </Group>
    //     )
    // }

