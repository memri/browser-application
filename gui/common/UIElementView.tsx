//
// UIElementView.swift
// Copyright © 2020 memri. All rights reserved.


import {
    border,
    font, frame,
    Group,
    HStack,
    MainUI, MemriButton,
    MemriDivider,
    MemriImage,
    MemriText,
    padding,
    Section, Spacer,
    UIImage,
    VStack,
    ZStack
} from "../swiftUI";
import {CVUStateDefinition, Item} from "../../model/items/Item";
import {ViewArguments} from "../../cvu/views/CascadableDict";
import * as React from "react";
import {UIElementFamily} from "../../cvu/views/UIElement";
import {Alignment, Font} from "../../parsers/cvu-parser/CVUParser";
import {Action, ActionUnlink} from "../../cvu/views/Action";
import {CVUParsedViewDefinition} from "../../parsers/cvu-parser/CVUParsedDefinition";
import {debugHistory} from "../../cvu/views/ViewDebugger";
import {ActionButton} from "../ActionView";

export class UIElementView extends MainUI {
    context: MemriContext

    from: UIElement
    item: Item
    viewArguments: ViewArguments

    init(gui: UIElement, dataItem: Item, viewArguments?: ViewArguments) {
        this.from = gui
        this.item = dataItem.isInvalidated ? new Item() : dataItem

        this.viewArguments = new ViewArguments(viewArguments, this.item)
    }

    has(propName: String) {
        return this.viewArguments.get(propName) != undefined || this.from.has(propName)
    }

    get(propName: string, defaultValue?) {
        return this.from.get(propName, this.item, this.viewArguments) ?? defaultValue;
    }

    getImage(propName: string) {
        let file = this.get(propName);
        if (file) {
            return file.asUIImage ?? <UIImage/> //TODO:
        }
     /*   if let photo: Photo? = get(propName), let file = photo?.file {
            return file.asUIImage ?? UIImage()
        }

        return UIImage()*/
    }

    getbundleImage() {
        let name: string = this.get("bundleImage");
        if (name) {
            return <MemriImage>{name}</MemriImage>
        }
        return <MemriImage>{"exclamationmark.bubble"}</MemriImage>
    }

    getList(key: string) {
        return this.get(key) ?? [];
    }

    resize(view) {
        let resizable: String = this.from.get("resizable", this.item) ?? ""
        let y = view.resizable()

       /* switch (resizable) {
        case "fill": return AnyView(y.aspectRatio(contentMode: .fill))
        case "fit": return AnyView(y.aspectRatio(contentMode: .fit))
        case "stretch":
        default:
            return AnyView(y)
        }*/ //TODO:
    }

    render(){
        this.init(this.props.gui, this.props.dataItem, this.props.viewArguments);
        let editorLabelAction = () => {
            let args = {
                "subject": this.context.item, // self.item,
                "edgeType": this.viewArguments.get("name")
            }
            let action = new ActionUnlink(this.context, args)
            this.context.executeAction(action, this.item, this.viewArguments
            )
        }

        let buttonAction = () => {
            let press: Action = this.get("press");
            if (press) {
                this.context.executeAction(press, this.item, this.viewArguments)
            }
        }

        let setView = () => {
            let parsed = this.get("view");
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
                    return CVUStateDefinition.fromCVUParsedDefinition(def)
                } catch (error) {
                    debugHistory.error(`${error}`)
                }
            } else {
                debugHistory
                    .error(
                        "Failed to make subview (not defined), creating empty one instead"
                    )
            }
            return new CVUStateDefinition()
        } //TODO: ();


        return (
            <Group>
                {!this.has("show") || this.get("show") == true ?
                    (this.from.type == UIElementFamily.VStack) ?
                        <VStack alignment={this.get("alignment") ?? Alignment.leading}
                                spacing={this.get("spacing") ?? 0} clipped
                                setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}>
                            {this.renderChildren}
                        </VStack> :
                        (this.from.type == UIElementFamily.HStack) ?
                            <HStack alignment={this.get("alignment") ?? Alignment.top}
                                    spacing={this.get("spacing") ?? 0} clipped
                                    setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}>
                                {this.renderChildren}
                            </HStack> :
                            (this.from.type == UIElementFamily.ZStack) ?
                                <ZStack alignment={this.get("alignment") ?? Alignment.top}
                                        spacing={this.get("spacing") ?? 0} clipped
                                        setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}>
                                    {this.renderChildren}
                                </ZStack> :
                                ((this.from.type == UIElementFamily.EditorSection) ?
                                    <ZStack alignment={this.get("alignment") ?? Alignment.top}
                                            spacing={this.get("spacing") ?? 0} clipped
                                            setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}>
                                        {this.renderChildren}
                                    </ZStack> :
                                    ((this.has("title")) ?
                                        <Section header={(this.get("title") ?? "").toUpperCase()} generalEditorHeader
                                                 clipped
                                                 setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}>
                                            <MemriDivider/>
                                            {this.renderChildren}
                                            <MemriDivider/>
                                        </Section> :
                                        <VStack spacing={0} clipped
                                                setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}>
                                            {this.renderChildren}
                                        </VStack>)) :
                    (this.from.type == UIElementFamily.EditorRow) ?
                        <VStack spacing={0}>
                            <VStack alignment={Alignment.leading} spacing={4} fullWidth
                                    padding={padding({
                                        bottom: this.get("nopadding") != true ? 10 : 0,
                                        leading: this.get("nopadding") != true ? 36 : 0,
                                        trailing: this.get("nopadding") != true ? 36 : 0
                                    })} clipped
                                    setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}
                                    background={this.get("readOnly") ?? this.viewArguments.get("readOnly") ?? false
                                        ? "#f9f9f9"
                                        : "#f7fcf5"}>
                                {(this.has("title") && this.get("nopadding") != true) &&
                                <MemriText generalEditorLabel>
                                    {this.get("title") ?? ""
                                        /*.camelCaseToWords()
                                        .lowercased()
                                        .capitalizingFirst()*/}
                                </MemriText>
                                }
                                {this.renderChildren.generalEditorCaption()}
                            </VStack>
                            {(this.has("title")) &&
                            <MemriDivider padding={padding({leading: 35})}/>
                            }
                        </VStack> :
                        (this.from.type == UIElementFamily.EditorLabel) ?
                            <HStack alignment={Alignment.center} spacing={15} frame={frame({minWidth: 130, maxWidth: 130, maxHeight: ".infinity", alignment: Alignment.leading})} padding={padding(10)} border={border({width: [0, 0, 1, 1], color: "#eee"})}>
                                <MemriButton onClick={editorLabelAction}>
                                    <MemriImage foregroundColor="red" font={font({size: 22})} lineLimit={1}>
                                        minus.circle.fill
                                    </MemriImage>
                                </MemriButton>
                                {(this.has("title")) &&
                                <MemriButton>
                                    <HStack>
                                        <MemriText foregroundColor="blue" font={font({size: 15})}>
                                            {this.get("title") ?? ""}
                                        </MemriText>
                                        <Spacer/>
                                        <MemriImage foregroundColor="gray" font={font({size: 14, weight: Font.Weight.bold})}>
                                            chevron.right
                                        </MemriImage>
                                    </HStack>
                                </MemriButton>
                                }
                            </HStack> :
                            (this.from.type == UIElementFamily.Button) ?
                                <MemriButton action={buttonAction} setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}>
                                    {this.renderChildren}
                                </MemriButton> :
                                (this.from.type == UIElementFamily.FlowStack) ?
                                    <FlowStack setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}>
                                       {/* FlowStack(getList("list")) { listItem in
                                    ForEach(0 ..< self.from.children.count) { index in
                                        UIElementView(self.from.children[index], listItem, self.viewArguments)
                                        .environmentObject(self.context)
                                        }
                                        }*/}
                                    </FlowStack> :
                                    (this.from.type == UIElementFamily.Text) ?
                                        (this.from.processText(this.get("text"))
                                            ?? this.get("nilText")
                                            ?? (this.get("allowNil", false) ? "" : undefined)).map((text) => {
                                                return <MemriText setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}>
                                                    {text}
                                                    {/*.if(from.getBool("bold")) { $0.bold() }
                                                    .if(from.getBool("italic")) { $0.italic() }
                                                    .if(from.getBool("underline")) { $0.underline() }
                                                    .if(from.getBool("strikethrough")) { $0.strikethrough() }
                                                    .fixedSize(horizontal: false, vertical: true)*/}
                                                </MemriText>
                                            }
                                        ) :
                                        (this.from.type == UIElementFamily.Textfield) ?
                                            <this.renderTextfield setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}>

                                            </this.renderTextfield> :
                                            (this.from.type == UIElementFamily.RichTextfield) ?
                                                <this.renderRichTextfield setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}>

                                                </this.renderRichTextfield> :
                                                (this.from.type == UIElementFamily.ItemCell) ?
                                                    <>
                                                    </>:
                                                    (this.from.type == UIElementFamily.SubView) ?
                                                        (this.has("viewName")) ?
                                                            <SubView context={this.context}
                                                                     viewName={this.from.getString("viewName")}
                                                                     item={this.item}
                                                                     viewArguments={new ViewArguments(this.get("arguments"))}
                                                                     setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}>

                                                            </SubView> :

                                                            <SubView context={this.context}
                                                                     view={setView}
                                                                     item={this.item}
                                                                     viewArguments={new ViewArguments(this.get("arguments"))}
                                                                     setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}>

                                                            </SubView> :
                                                        (this.from.type == UIElementFamily.Map) ?
                                                            <>
                                                               {/* MapView(
                                                                useMapBox: context.settings
                                                                .get("/user/general/gui/useMapBox", type: Bool.self) ?? false,
                                                                config: .init(dataItems: [self.item],
                                                                locationResolver: { _ in
                                                            self
                                                                .get("location", type: Location.self) ??
                                                                (self
                                                                .get("location",
                                                                type: Results<Item>.self) as Any?)

                                                            },
                                                                addressResolver: {
                                                                _ in
                                                                (
                                                                    self.get("address", type: Address.self) as Any?
                                                                ) ??
                                                                (self
                                                                .get("address", type: Results<Item>.self) as Any?)

                                                            },
                                                                labelResolver: { _ in self.get("label") })
                                                                )
                                                                .background(Color(.secondarySystemBackground))
                                                                .setProperties(from.properties, self.item, context, self.viewArguments)*/}
                                                            </> :
                                                            (this.from.type == UIElementFamily.Picker) ?
                                                                <this.renderPicker setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}>

                                                                </this.renderPicker> :
                                                                (this.from.type == UIElementFamily.SecureField) ?
                                                                    <>
                                                                    </> :
                                                                    (this.from.type == UIElementFamily.Action) ?
                                                                        <ActionButton
                                                                            action={this.get("press") ?? new Action(this.context, "noop")}
                                                                            item={this.item}
                                                                            setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}>

                                                                        </ActionButton> :
                                                                        (this.from.type == UIElementFamily.MemriButton) ?
                                                                            <MemriButton
                                                                                item={this.item}
                                                                                setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}>

                                                                            </MemriButton> :
                                                                            (this.from.type == UIElementFamily.TimelineItem) ?
                                                                                <>
                                                                                    {/*TimelineItemView(icon: Image(systemName: get("icon") ?? "arrowtriangle.right"),
                                                                                    title: from.processText(get("title")) ?? "-",
                                                                                    subtitle: from.processText(get("text")),
                                                                                    backgroundColor: ItemFamily(rawValue: item.genericType)?
                                                                                    .backgroundColor ?? .gray)
                                                                                    .setProperties(from.properties, self.item, context, self.viewArguments)*/}
                                                                                </> :
                                                                                (this.from.type == UIElementFamily.MessageBubble) ?
                                                                                    <>
                                                                                        {/*MessageBubbleView(timestamp: get("dateTime"),
                                                                                              sender: get("sender"),
                                                                                              content: from.processText(get("content")) ?? "",
                                                                                              outgoing: get("isOutgoing") ?? false)
                                                                                .setProperties(from.properties, self.item, context, self.viewArguments)*/}
                                                                                    </> :
                                                                                    (this.from.type == UIElementFamily.Image) ?
                                                                                            (this.has("systemName")) ?
                                                                                                <MemriImage setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}>
                                                                                                    {this.get("systemName") ?? "exclamationmark.bubble"}
                                                                                                    {/*.if(from.has("resizable")) { self.resize($0) }*/}
                                                                                                </MemriImage> :
                                                                                                (this.has("bundleImage")) ?
                                                                                                    <this.getbundleImage renderingMode="original" setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}/> :
                                                                                                    <MemriImage setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}>
                                                                                                        {this.get("systemName") ?? "exclamationmark.bubble"}
                                                                                                        {/*Image(uiImage: getImage("image"))
                                                                                                        .renderingMode(.original)
                                                                                                        .if(from.has("resizable")) { view in
                                                                                                            GeometryReader { geom in
                                                                                                                self.resize(view)
                                                                                                                    .frame(width: geom.size.width, height: geom.size.height)
                                                                                                                    .clipped()
                                                                                                            }
                                                                                                        }
                                                                                                        .setProperties(from.properties, self.item, context, self.viewArguments)*/}
                                                                                                    </MemriImage> :
                                                                                        (this.from.type == UIElementFamily.Circle) ?
                                                                                            <>
                                                                                            </> :
                                                                                            (this.from.type == UIElementFamily.HorizontalLine) ?
                                                                                                <HorizontalLine setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}>

                                                                                                </HorizontalLine> :
                                                                                                (this.from.type == UIElementFamily.Rectangle) ?
                                                                                                    <Rectangle setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}>

                                                                                                    </Rectangle> :
                                                                                                    (this.from.type == UIElementFamily.RoundedRectangle) ?
                                                                                                        <RoundedRectangle setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}>

                                                                                                        </RoundedRectangle> :
                                                                                                        (this.from.type == UIElementFamily.Spacer) ?
                                                                                                            <Spacer setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}>

                                                                                                            </Spacer> :
                                                                                                            (this.from.type == UIElementFamily.Divider) ?
                                                                                                                <MemriDivider setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}>

                                                                                                                </MemriDivider> :
                                                                                                                (this.from.type == UIElementFamily.Empty) ?
                                                                                                                    <Empty setProperties={setProperties(this.from.properties, this.item, this.context, this.viewArguments)}>

                                                                                                                    </Empty> :
                                                                                                                    <>
                                                                                                                    {this.logWarning("Warning: Unknown UI element type '\(from.type)'")}
                                                                                                                    </>



                }
            </Group>
        )
    }

    logWarning(message: string) {
        console.log(message)
        //return EmptyView()
    }

    renderRichTextfield() {
        let [_, contentDataItem, contentPropertyName] = this.getType("htmlValue", this.item, this.viewArguments)
        let [__, plainContentDataItem, plainContentPropertyName] = this.getType("value", this.item, this.viewArguments)
        if (!contentDataItem.hasProperty(contentPropertyName) || !plainContentDataItem.hasProperty(plainContentPropertyName)) {
            return <MemriText>Invalid property value set on RichTextEditor</MemriText>
        }

        // CONTENT
        /*let contentBinding = Binding<String?>(
            get: { (contentDataItem[contentPropertyName] as? String)?.nilIfBlank },
            set: { contentDataItem.set(contentPropertyName, $0) }
        )*/

        /*let plainContentBinding = Binding<String?>(
            get: { (plainContentDataItem[plainContentPropertyName] as? String)?.nilIfBlank },
            set: { plainContentDataItem.set(plainContentPropertyName, $0) }
        )*/

        let fontSize = this.get("fontSize")

        // TITLE
        let [___, titleDataItem, titlePropertyName] = this.getType("title", this.item, this.viewArguments)
        /*let titleBinding = titleDataItem.hasProperty(titlePropertyName) ? Binding<String?>(
            get: { (titleDataItem[titlePropertyName] as? String)?.nilIfBlank },
            set: { titleDataItem.set(titlePropertyName, $0) }
        ) : nil // Only pass a title binding if the property exists (otherwise pass nil)
        let titleHint = get("titleHint", type: String.self)
        let titleFontSize = get("titleFontSize", type: CGFloat.self)

        // Filter (unimplemented)
        let filterTextBinding = Binding<String>(
            get: { self.context.currentView?.filterText ?? "" },
            set: { self.context.currentView?.filterText = $0 }
        )*/

        /*return _RichTextEditor(htmlContentBinding: contentBinding,
                               plainContentBinding: plainContentBinding,
                               titleBinding: titleBinding,
                               titleHint: titleHint,
                               fontSize: fontSize ?? 18,
                               headingFontSize: titleFontSize ?? 26,
                               filterText: filterTextBinding)
            .eraseToAnyView()*/ //TODO:
    }

    renderTextfield() {
        /*let [type, dataItem, propName] = this.getType("value", this.item, this.viewArguments)
        //        let rows:CGFloat = self.get("rows") ?? 2

        return (
            <Group>
                {propName == "" ?
                <MemriText>
                    Invalid property value set on TextField
                </MemriText> :
                    (type != PropertyType.string) ?
                        <MemriTextField>

                        </MemriTextField>


                }
            </Group>
            if propName == "" {
                Text("Invalid property value set on TextField")
            }
            else if type != PropertyType.string {
                TextField(LocalizedStringKey(self.get("hint") ?? ""), value: Binding<Any>(
                    get: { dataItem[propName] as Any },
                    set: { dataItem.set(propName, $0) }
                ),
                          formatter: type == .date ? DateFormatter() :
                    NumberFormatter()) // TODO: Refactor: expand to properly support all types
                    .keyboardType(.decimalPad)
                    .generalEditorInput()
            }
            else {
                MemriTextField(
                    value: Binding<String>(
                        get: { dataItem.getString(propName) },
                        set: { dataItem.set(propName, $0) }
                    ), placeholder: self.get("hint")
                )
                .generalEditorInput()
            }
        }
    )*/
    }

    renderPicker() {
        /*let dataItem: Item? = get("value")
        let (_, propItem, propName) = from.getType("value", item, viewArguments)
        let emptyValue = get("empty") ?? "Pick a value"
        let query = get("query", type: String.self)
        let renderer = get("renderer", type: String.self)

        return Picker(
            item: item,
            selected: dataItem ?? get("defaultValue"),
            title: get("title") ?? "Select a \(emptyValue)",
            emptyValue: emptyValue,
            propItem: propItem,
            propName: propName,
            renderer: renderer,
            query: query ?? ""
        )*/
    }

    get renderChildren() {
        return (
            <Group>
                {
                    this.from.children.map((uiElement) => {
                        return <UIElementView gui={uiElement} dataItem={this.item}  viewArguments={this.viewArguments}/>
                        })
                }
            </Group>
        )
    }
}
