//
// GeneralEditorView.swift
// Copyright © 2020 memri. All rights reserved.

import {debugHistory} from "../../../../router";
import {Item, UUID} from "../../../../router";
import {
    font,
    frame,
    Group,
    HStack,
    MainUI, MemriDivider,
    MemriText, MemriTextField,
    padding,
    RenderersMemri,
    ScrollView,
    Section, Toggle,
    VStack
} from "../../swiftUI";
import * as React from "react";
import {Alignment, Font} from "../../../../router";
import {ActionButton} from "../../ActionView";
import {ItemCell} from "../../common/ItemCell";
import {ViewArguments} from "../../../../router";
import {ActionOpenViewByName, RenderType} from "../../../../router";
import {MemriDictionary} from "../../../../router";
import {CascadingRendererConfig} from "../../../../router";
import {DefaultGeneralEditorRow} from "./GeneralEditorRows";

export class GeneralEditorRendererController {
    static rendererType = {name:"generalEditor",icon: "pencil.circle.fill", makeController:GeneralEditorRendererController, makeConfig:GeneralEditorRendererController.makeConfig}

    constructor(context: MemriContext, config?: CascadingRendererConfig) {
        this.context = context
        this.config = config ?? new GeneralEditorRendererConfig()
    }

    context: MemriContext
    config: GeneralEditorRendererConfig

    makeView() {
        return new GeneralEditorRendererView({controller: this, context: this.context}).render();
    }

    update() {
        /*objectWillChange.send()*/
        return
    }

    static makeConfig(head?: CVUParsedDefinition, tail?: CVUParsedDefinition[], host?: Cascadable) {
        return new GeneralEditorRendererConfig(head, tail, host)
    }
}

export class GeneralEditorRendererConfig extends CascadingRendererConfig {
    type = "generalEditor"

    get layout() {
        return this.cascadeList(
            "layout",
            (item) => {
                return String(item["section"]) ?? ""
            },
            (old, newJs) => {
                var result = old;
                for (let [key, value] of Object.entries(newJs)) { //TODO: need to check
                    if (old[key] == undefined) {
                        result[key] = value
                    } else if (key == "exclude") {
                        var dict = old[key];
                        if (Array.isArray(dict)) {
                            result[key] = dict.push(...(Array.isArray(newJs[key])? newJs[key] : [newJs[key]] ?? []))
                        }
                    }
                }

                return result
            }
        )
            .map((dict) => {
                return new GeneralEditorLayoutItem(dict["section"] ?? "", dict, this.viewArguments)
            })
    }

    showSortInConfig: boolean = false

    showContextualBarInEditMode: boolean = false

    configItems(context: MemriContext) {
        return []
    }
}

export class GeneralEditorLayoutItem {
    id;
    dict: MemriDictionary
    viewArguments

    constructor(id, dict, viewArguments?) {
        this.id = id;
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
                console.log("ERROR: tri")
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
                debugHistory.error(`Could not compute layout property ${propName}\n`
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

export class GeneralEditorRendererView extends RenderersMemri {
    controller: GeneralEditorRendererController
    context: MemriContext

    name = "generalEditor"

    get stackContent() {
        let item = this.getItem()
        let layout = this.controller.config.layout
        let usedFields = this.getUsedFields(layout)

        if (layout.length > 0) {
            return layout.map((layoutSection) => {
                return (
                    <GeneralEditorSection context={this.context} item={item} renderConfig={this.controller.config}
                                          layoutSection={layoutSection} usedFields={usedFields}>

                    </GeneralEditorSection>
                )
            })
        }
    }

    render(){
        this.context = this.props.context;
        this.controller = this.props.controller;

        return (
            <ScrollView vertical>
                <VStack alignment={Alignment.leading} spacing={0}>
                    {this.stackContent}
                </VStack>
            </ScrollView>
        )
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

    getUsedFields(layout) {
        var result = [];
        for (let item of layout) {
            let list = item.get("fields", "[String]");
            if (list) {
                result.push(...list); //TODO:
            }
            list = item.get("exclude", "[String]");
            if (list) {
                result.push(...list) //TODO:
            }
        }
        return result
    }
}

export class GeneralEditorSection extends MainUI {
    context: MemriContext

    item: Item
    renderConfig: GeneralEditorRendererConfig
    layoutSection: GeneralEditorLayoutItem
    usedFields

    render() {
        this.context = this.props.context;
        this.item = this.props.item;
        this.renderConfig = this.props.renderConfig;
        this.layoutSection = this.props.layoutSection;
        this.usedFields = this.props.usedFields;

        let renderConfig = this.renderConfig
        let editMode = this.context.editMode
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

        let title = (hasGroup ? sectionStyle.title : undefined) ?? groupKey.camelCaseToWords().toUpperCase()
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
                                let targetItem = edge.target()
                                return renderConfig.render(
                                    targetItem,
                                    groupKey,
                                    this._args(groupKey,
                                        "",
                                        targetItem,
                                        targetItem,
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
                                                     readOnly={readOnly} isLast={fields[fields.length - 1] == field}
                                                     renderConfig={renderConfig} argumentsJs=
                                                         {this._args("", field, this.item.get(field), this.item)}>

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
                                let targetItem = edge.target()
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
            <Section header={header}>
                {!isEmpty ? content: ""}
            </Section>

        )
    }

    getProperties(item: Item, used) { //TODO:
        return Object.keys(item.objectSchema.properties).filter(($0) => {
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
            new MemriDictionary({
                "subject": item,
                "readOnly": !(this.context.editMode),
                "title": groupKey.camelCaseToWords().toUpperCase(),
                "displayName": name.camelCaseToWords().capitalizingFirst(),
                "name": name,
                "edge": edge,
                ".": item,
            }),
            this.renderConfig.viewArguments?.cascadeStack
        )
    }

    getAction(edgeType: string, itemType: string) {
        return new ActionOpenViewByName(
            this.context,
            {
                "viewName": "choose-item-by-query",
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
            this.getValue(groupKey, s["title"], "String")?.toUpperCase(),
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

