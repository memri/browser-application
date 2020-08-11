//
// GeneralEditorView.swift
// Copyright © 2020 memri. All rights reserved.

import {allRenderers, CascadingGeneralEditorConfig} from "../../cvu/views/Renderers";
import {debugHistory} from "../../cvu/views/ViewDebugger";
import {Item, UUID} from "../../model/items/Item";
import {
    font,
    frame,
    Group,
    HStack,
    MainUI, MemriButton, MemriDivider,
    MemriText, MemriTextField,
    padding,
    RenderersMemri,
    ScrollView,
    Section, Toggle,
    VStack
} from "../swiftUI";
import * as React from "react";
import {Alignment, Font} from "../../parsers/cvu-parser/CVUParser";
import {ActionButton} from "../ActionView";
import {ItemCell} from "../common/ItemCell";
import {ViewArguments} from "../../cvu/views/CascadableDict";
import {ActionOpenViewByName, RenderType} from "../../cvu/views/Action";
import {ExprInterpreter} from "../../parsers/expression-parser/ExprInterpreter";

export var registerGeneralEditorRenderer = function () {
    if (allRenderers) {
        allRenderers.register(
            "generalEditor",
            "Default",
            0,
            "pencil.circle.fill",
            new GeneralEditorView(),
            CascadingGeneralEditorConfig,
            function(items) { return items.length == 1 }
        )
    }
}


export class GeneralEditorLayoutItem {
    id = UUID()
    dict: MemriDictionary
    viewArguments

    constructor(dict, viewArguments?) {
        this.dict = dict;
        this.viewArguments = viewArguments;
    }

    has(propName: string) {
        return this.dict[propName] != undefined
    }

    get(propName: string, type, item?: Item) {
        let propValue = this.dict[propName]
        if (!propValue) {
            if (propName == "section") {
                console.log("ERROR")
            }

            return
        }

        var value = propValue;

        // Execute expression to get the right value
        let expr = propValue;
        if (expr?.constructor?.name == "Expression") {
            try {
                value = expr.execute(this.viewArguments)
            } catch (error) {
                // TODO: Refactor error handling
                debugHistory.error(`Could note compute layout property ${propName}\n`
                    + `Arguments: [${this.viewArguments?.description ?? ""}]\n`
                    + (expr.startInStringMode
                        ? `Expression: "${expr.code}"\n`
                        : `Expression: ${expr.code}\n`)
                    + `Error: ${error}`)
                return
            }
        }//
        if (type == "[Edge]") {
            if (Array.isArray(value) && value.length > 0 && value[0]?.constructor?.name == "Edge") {
                return value;
            } else if (typeof value == "string") {
                return item?.edges(value)?.edgeArray()
            } else if (Array.isArray(value) && value.length > 0 && typeof value[0] == "string") {
                return item?.edges(value)?.edgeArray();
            }
        } else if (type == "[String]" && typeof value == "string") {
            return [value];
        }

        return value;
    }
}

export class GeneralEditorView extends RenderersMemri {
    context: MemriContext

    name = "generalEditor"

    render(){
        this.context = this.props.context;
        let item = this.getItem()
        let layout = this.getLayout()
        let renderConfig = this.getRenderConfig()
        let usedFields = this.getUsedFields(layout)
        return (
            <ScrollView>
                <VStack alignment={Alignment.leading} spacing={0}
                        frame={frame({maxWidth: ".infinity", maxHeight: ".infinity"})}>
                    {(renderConfig == undefined) ?
                        <MemriText>Unable to render this view</MemriText> :
                        layout.map((layoutSection) => {
                            return (
                                <GeneralEditorSection context={this.context} item={item} renderConfig={renderConfig}
                                                      layoutSection={layoutSection} usedFields={usedFields}>

                                </GeneralEditorSection>
                            )
                        })

                    }
                </VStack>
            </ScrollView>
        )
    }

    getLayout() {
        let l = this.getRenderConfig()?.layout;
        if (l) {
            return l
        } else {
            return [new GeneralEditorLayoutItem({"section": "other", "fields": "*"})]
        }
    }

    getItem(): Item {
        let dataItem = this.context.currentView?.resultSet.singletonItem;
        if (dataItem) {
            return dataItem
        }
        else {
            debugHistory.warn("Could not load item from result set, creating empty item")
            return new Item()
        }
    }

    getRenderConfig(): CascadingGeneralEditorConfig {
        return this.context.currentView?.renderConfig;
    }

    getUsedFields(layout) {
        var result = [];
        for (let item of layout) {
            let list = item.get("fields", "[String]");
            if (list) {
                result.push(...list);
            }
            list = item.get("exclude", "[String]");
            if (list) {
                result.push(...list)
            }
        }
        return result
    }
}

/*struct GeneralEditorView_Previews: PreviewProvider {
    static var previews: some View {
        let context = try! RootContext(name: "", key: "").mockBoot()

        return ZStack {
            VStack(alignment: .center, spacing: 0) {
                TopNavigation()
                GeneralEditorView()
                Search()
            }.fullHeight()

            ContextPane()
        }.environmentObject(context)
    }
}*/

export class GeneralEditorSection extends MainUI {
    context: MemriContext

    item: Item
    renderConfig: CascadingGeneralEditorConfig
    layoutSection: GeneralEditorLayoutItem
    usedFields

    render() {
        this.context = this.props.context;
        this.item = this.props.item;
        this.renderConfig = this.props.renderConfig;
        this.layoutSection = this.props.layoutSection;
        this.usedFields = this.props.usedFields;

        let renderConfig = this.renderConfig
        let editMode = this.context.currentSession?.editMode ?? false
        let fields = (this.layoutSection.get("fields", "String") == "*"
            ? this.getProperties(this.item, this.usedFields)
            : this.layoutSection.get("fields", "[String]")) ?? []
        let edgeNames = this.layoutSection.get("edges", "[String]", this.item) ?? []
        let edgeType = this.layoutSection.get("type", "String", this.item)
        let edges = this.layoutSection.get("edges", "[Edge]", this.item) ?? []
        let groupKey = this.layoutSection.get("section", "String") ?? ""

        let sectionStyle = this.sectionStyle(groupKey)
        let readOnly = this.layoutSection.get("readOnly", "Bool") ?? false
        let isEmpty = this.layoutSection.has("edges") && edges.length == 0 && fields
            .length == 0 && !editMode
        let hasGroup = renderConfig.hasGroup(groupKey)

        let title = (hasGroup ? sectionStyle.title : undefined) ?? groupKey.toUpperCase()/*.camelCaseToWords()
            .uppercased()*/ //TODO:
        let dividers = sectionStyle.dividers ?? !(sectionStyle.showTitle ?? false)
        let showTitle = sectionStyle.showTitle ?? true
        let action = editMode
            ? sectionStyle
            .action ?? (!readOnly && edgeType != undefined /* TODO: support multiple / many types*/
            ? this.getAction(edgeNames[0], edgeType ?? "")
            : undefined)
            : undefined
        let spacing = sectionStyle.spacing ?? 0
        let paddingCur = sectionStyle.padding

        let header = (
            <Group>
                {(showTitle && !isEmpty) &&
                <HStack padding={padding({trailing: 20})}>
                    <MemriText>
                        {title}
                    </MemriText>
                    {(action != undefined) &&
                    <ActionButton context={this.context} action={action} item={item} foregroundColor="#777"
                                  font={font({family: "system", size: 18, weight: Font.Weight.semibold})}
                                  padding={padding({bottom: 10})}/>
                    }
                </HStack>
                }
            </Group>
        )

        let content = (
            <>
            {dividers &&
            <MemriDivider/>
            }
                {hasGroup ?
                    <VStack alignment={Alignment.leading} spacing={0} padding={padding({top: paddingCur[0],
                        leading: paddingCur[3],
                        bottom: paddingCur[2],
                        trailing: paddingCur[1]})}>
                        {(fields.length == 0 && edges.length == 0) ?
                            renderConfig.render(
                                this.item,
                                groupKey,
                                this._args(groupKey,
                                    groupKey, undefined,
                                    this.item)
                            ) :
                            fields.length > 0 &&
                            fields.map((field) => {
                                return renderConfig.render(
                                    this.item,
                                    groupKey,
                                    this._args(groupKey,
                                        field, undefined,
                                        this.item)
                                )
                            }) || //TODO: ?
                            edges.length > 0 &&
                            edges.map((edge) => {
                                let targetItem = edge.item()
                                return renderConfig.render(
                                    targetItem,
                                    groupKey,
                                    this._args(groupKey,
                                        targetItem,
                                        targetItem, undefined,
                                        edge)
                                )
                            })

                        }
                    </VStack> :
                    // Render groups with the default render row
                    (fields.length > 0) &&
                    fields.map((field) => {
                        return (
                            <DefaultGeneralEditorRow context={this.context} item={this.item} prop={field}
                                                     readOnly={!editMode || readOnly} isLast={fields.last == field}
                                                     renderConfig={renderConfig} argumentsJs=
                                                         {this._args(field, undefined, this.item.get(field), this.item)}>

                            </DefaultGeneralEditorRow>
                        )
                    }) ||
                    // Render lists with their default renderer
                    edges.length > 0 &&
                    <ScrollView frame={frame({maxHeight: 1000})} fixedSize={{horizontal: false, vertical: true}}>
                        <VStack alignment={Alignment.leading} spacing={spacing} padding={padding({
                            top: paddingCur[0],
                            leading: paddingCur[3],
                            bottom: paddingCur[2],
                            trailing: paddingCur[1]
                        })}>
                            {edges.map((edge) => {
                                let targetItem = edge.item()
                                return <ItemCell context={this.context} item={targetItem} rendererNames={["generalEditor"]}
                                                 argumentsJs={this._args(groupKey,
                                                     edge.type ?? "",
                                                     targetItem,
                                                     this.item,
                                                     edge)}/>
                            })}
                        </VStack>
                    </ScrollView>
                }
                {dividers &&
                <MemriDivider/>
                }
            </>
        );
        return (
            <Section>
                {header}
                {!isEmpty ? content: ""}
            </Section>

        )
    }

    getProperties(item: Item, used) { //TODO:
        return Object.keys(item).filter(($0) => {
            return !used.includes($0)
            /*&& !$0.isArray*/
        }).map(($0) => $0)
    }

    _args(
        groupKey = "",
        name = "",
        value?,
        item?: Item,
        edge?: Edge) {
        return new ViewArguments(
            {
                "subject": item,
                "readOnly": !(this.context.currentSession?.editMode ?? false),
                "title": groupKey.toUpperCase()/*.camelCaseToWords().uppercased()*/,
                "displayName": name/*.camelCaseToWords().capitalizingFirst()*/, //TODO:
                "name": name,
                "edge": edge,
                ".": item,
            },
            this.renderConfig.viewArguments?.cascadeStack
        )
    }

    getAction(edgeType: string, itemType: string) {
        return new ActionOpenViewByName(
            this.context,
            {
                "name": "choose-item-by-query",
                "viewArguments": new ViewArguments({
                    "query": itemType,
                    "type": edgeType,
                    "subject": this.item,
                    "renderer": "list",
                    "edgeType": edgeType,
                    "title": `Choose a ${itemType}`,
                    "item": this.item,
                }),
                "icon": "plus",
                "renderAs": RenderType.popup,
            }
        )
    }

    sectionStyle(groupKey: string): SectionStyle {
        let s = this.renderConfig.getGroupOptions(groupKey)
        let allPadding = this.getValue(groupKey, s["padding"], "CGFloat") ?? 0

        return new SectionStyle(
            this.getValue(groupKey, s["title"], "String")?.toUpperCase()/*?.uppercased()*/,
            this.getValue(groupKey, s["dividers"], "Bool"),
            this.getValue(groupKey, s["showTitle"], "Bool"),
            this.getValue(groupKey, s["action"], "Action"),
            this.getValue(groupKey, s["spacing"], "CGFloat"),
            this.getValue(groupKey, s["padding"], "[CGFloat]")
            ?? [allPadding, allPadding, allPadding, allPadding]
        )
    }

    getValue(groupKey: string, value?, type?) {
        if (value == undefined) {
            return
        }
        let expr = value;
        if (expr?.constructor?.name == "Expression") {
            let args = this._args(groupKey, groupKey, undefined, this.item);
            try {
                return expr.execForReturnType(args)
            } catch (error) {
                debugHistory.error(error)
                return
            }
        }

        return value;
    }
}

class SectionStyle {
    title
    dividers
    showTitle
    action
    spacing
    padding

    constructor(title, dividers, showTitle, action, spacing, padding) {
        this.title = title;
        this.dividers = dividers;
        this.showTitle = showTitle;
        this.action = action;
        this.spacing = spacing;
        this.padding = padding;
    }
}

class DefaultGeneralEditorRow extends MainUI {
    context: MemriContext

    item: Item
    prop: string
    readOnly: boolean
    isLast: boolean
    renderConfig: CascadingRenderConfig
    argumentsJs?: ViewArguments

    render() {
        this.context = this.props.context;
        this.item = this.props.item;
        this.prop = this.props.prop;
        this.readOnly = this.props.readOnly;
        this.isLast = this.props.isLast;
        this.renderConfig = this.props.renderConfig;
        this.argumentsJs = this.props.argumentsJs;

        // Get the type from the schema, because when the value is nil the type cannot be determined
        let propType = this.item[this.prop]; //TODO:
        let propValue = this.item.get(this.prop);
        return (
            <VStack spacing={0}>
                {(propValue != undefined || !this.readOnly) &&
                <VStack alignment={Alignment.leading} spacing={4} padding={padding({bottom: 10, horizontal: 36})} background={this.readOnly ? "#f9f9f9" : "#f7fcf5"} fullWidth>
                    <MemriText>
                        {this.prop
                           /* .camelCaseToWords()
                            .lowercased()
                            .capitalizingFirst())
                            .generalEditorLabel()*/
                        }
                    </MemriText>
                    {this.renderConfig.hasGroup(this.prop) ?
                    this.renderConfig.render(this.item, this.prop, this.argumentsJs) :
                        (this.readOnly) ?
                            (typeof propValue != "object") ?
                                this.defaultRow(ExprInterpreter.evaluateString(propValue)) :
                                (typeof propValue == "object") ?
                                    (propValue instanceof Item) ?
                                        <MemriButton context={this.context} item={propValue}>

                                        </MemriButton> :
                                        this.defaultRow() :
                                    this.defaultRow() :
                            (typeof propValue != "string") ?
                                this.stringRow() :
                                (typeof propValue != "boolean") ?
                                    this.boolRow() :
                                    (typeof propValue != "number") ?
                                        this.intRow() :
                                        this.defaultRow()
                    }
                </VStack> ||
                (!this.isLast) &&
                <MemriDivider padding={padding({leading: 35})}/>
                }
            </VStack>
        )
    }

    stringRow()  {
        return <MemriTextField value={this.item.getString(this.prop)} onChange={(el)=>this.item.set(this.prop, el)}/>
            /*.onEditingBegan {
                self.context.currentSession?.editMode = true
            }
            .generalEditorCaption()*/
    }

    boolRow() {

        return (<>
                <Toggle isOn={this.item[this.prop] ?? false} onChange={() => {
                    try {
                        this.item.toggle(this.prop)
                        //this.context.objectWillChange.send()
                    } catch {
                    }
                }}/>
                <MemriText>
                    {this.prop}
                </MemriText>
            </>
        )

        /*Toggle(isOn: binding) {
            Text(prop
                .camelCaseToWords()
                .lowercased()
                .capitalizingFirst())
        }
        .toggleStyle(MemriToggleStyle())
        .generalEditorCaption()*/
    }

    intRow()  {
        /*let binding = Binding<Int>(
            get: { self.item[self.prop] as? Int ?? 0 },
            set: {
                self.item.set(self.prop, $0)
                self.context.objectWillChange.send()
            }
        )*/

        return <MemriTextField value={this.item[this.prop]} onChange={(el)=>this.item.set(this.prop, el)}/>
        /*MemriTextField(value: binding)
            .onEditingBegan {
                self.context.currentSession?.editMode = true
            }
            .generalEditorCaption()*/
    }

    /*func doubleRow() -> some View {
        let binding = Binding<Double>(
            get: { self.item[self.prop] as? Double ?? 0 },
            set: {
                self.item.set(self.prop, $0)
                self.context.objectWillChange.send()
            }
        )

        return MemriTextField(value: binding)
            .onEditingBegan {
                self.context.currentSession?.editMode = true
            }
            .generalEditorCaption()
    }*/

    /*func dateRow() -> some View {
        let binding = Binding<Date>(
            get: { self.item[self.prop] as? Date ?? Date() },
            set: {
                self.item.set(self.prop, $0)
                self.context.objectWillChange.send()
            }
        )

        return DatePicker("", selection: binding, displayedComponents: .date)
            .frame(width: 300, height: 80, alignment: .center)
            .clipped()
            .padding(8)
    }*/

    defaultRow(caption?: string) {
        return <MemriText>{caption ?? this.prop}</MemriText>
        /*Text(caption ?? prop.camelCaseToWords().lowercased().capitalizingFirst())
            .generalEditorCaption()*/
    }
}
/*
public extension View {
    func generalEditorLabel() -> some View { modifier(GeneralEditorLabel()) }
    func generalEditorCaption() -> some View { modifier(GeneralEditorCaption()) }
    func generalEditorHeader() -> some View { modifier(GeneralEditorHeader()) }
    func generalEditorInput() -> some View { modifier(GeneralEditorInput()) }
}*/ //TODO:

/*private struct GeneralEditorInput: ViewModifier {
    func body(content: Content) -> some View {
        content
            .fullHeight()
            .font(.system(size: 16, weight: .regular))
            .padding(10)
            .border(width: [0, 0, 1, 1], color: Color(hex: "#eee"))
            .generalEditorCaption()
    }
}

private struct GeneralEditorLabel: ViewModifier {
    func body(content: Content) -> some View {
        content
            .foregroundColor(Color(hex: "#38761d"))
            .font(.system(size: 14, weight: .regular))
            .padding(.top, 10)
    }
}

private struct GeneralEditorCaption: ViewModifier {
    func body(content: Content) -> some View {
        content
            .font(.system(size: 18, weight: .regular))
            .foregroundColor(Color(hex: "#223322"))
    }
}

private struct GeneralEditorHeader: ViewModifier {
    func body(content: Content) -> some View {
        content
            .font(Font.system(size: 15, weight: .regular))
            .foregroundColor(Color(hex: "#434343"))
            .padding(.bottom, 5)
            .padding(.top, 24)
            .padding(.horizontal, 36)
            .foregroundColor(Color(hex: "#333"))
    }
}*/
