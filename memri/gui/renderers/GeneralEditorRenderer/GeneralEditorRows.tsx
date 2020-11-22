//
//  GeneralEditorRows.swift
//  memri
//
//  Copyright © 2020 memri. All rights reserved.
//

import {
    MainUI,
    MemriDivider,
    MemriText,
    MemriTextField,
    padding,
    Toggle,
    VStack,
    font,
    DatePicker, frame
} from "../../swiftUI";
import {Item} from "../../../../router";
import {ViewArguments} from "../../../../router";
import {Alignment, Font} from "../../../../router";
import {ExprInterpreter} from "../../../../router";
import {MemriButton} from "../../common/MemriButton";
import * as React from "react";

export class DefaultGeneralEditorRow extends MainUI {
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
        let propType = this.item.objectSchema.properties[this.prop]; //TODO:
        let propValue = this.item.get(this.prop);
        return (
            <VStack spacing={0}>
                {(propValue != undefined || !this.readOnly) &&
                <>
                    <VStack alignment={Alignment.leading} spacing={4} padding={padding({bottom: 10, horizontal:"default"})} background={this.readOnly ? "#f9f9f9" : "#f7fcf5"} fullWidth>
                        <MemriText>
                            <GeneralEditorLabel>
                                {this.prop
                                    .camelCaseToWords()
                                    .toLowerCase()
                                    .capitalizingFirst()
                                }
                            </GeneralEditorLabel>
                        </MemriText>
                        {this.renderConfig.hasGroup(this.prop) ?
                            this.renderConfig.render(this.item, this.prop, this.argumentsJs) :
                            (this.readOnly) ?
                                (["string", "bool", "date", "int", ].includes(propType)) ?
                                    this.defaultRow(ExprInterpreter.evaluateString(propValue)) :
                                    (propType == "object") ?
                                        (propValue instanceof Item) ?
                                            <MemriButton context={this.context} item={propValue}>

                                            </MemriButton> :
                                            this.defaultRow() :
                                        this.defaultRow() :
                                (propType == "string") ?
                                    this.stringRow() :
                                    (propType == "date") ?
                                        this.dateRow() :
                                    (propType == "bool") ?
                                        this.boolRow() :
                                        (propType == "int") ?
                                            this.intRow() :
                                            this.defaultRow()
                        }
                    </VStack>
                    {(!this.isLast) &&
                    <MemriDivider padding={padding({leading: 35})}/>}
                </>
                }
            </VStack>
        )
    }

    stringRow()  {
        return <GeneralEditorCaption><MemriTextField value={this.item.getString(this.prop) ?? ""}
                                                     onChange={(e) => this.item.set(this.prop, e.target.value)}
                                                     clearButtonMode={"whileEditing"} isEditing={this.context.editMode}
                                                     isSharedEditingBinding={true}/></GeneralEditorCaption>
    }

    boolRow() {

        return (<>
                <Toggle isOn={this.item[this.prop] ?? false} onChange={() => {
                    try {
                        this.item.toggle(this.prop)
                        //this.context.objectWillChange.send()
                    } catch {
                    }
                }} toggleStyle={"MemriToggleStyle"}/>
                <MemriText>
                    <GeneralEditorCaption>
                        {this.prop.camelCaseToWords()
                            .toLowerCase()
                            .capitalizingFirst()}
                    </GeneralEditorCaption>
                </MemriText>
            </>
        )
    }

    intRow() {
        return <GeneralEditorCaption><MemriTextField value={this.item[this.prop]}
                                                     onChange={(el) => this.item.set(this.prop, el)}
                                                     clearButtonMode={"whileEditing"} isEditing={this.context.editMode}
                                                     isSharedEditingBinding={true}/></GeneralEditorCaption>
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

    dateRow() {
        //onChange={(e) => this.item.set(this.prop, e.target)}
        return <DatePicker value={this.item[this.prop] ?? Date.now()} frame={frame({width: 300, height: 80, alignment: Alignment.center})} padding={padding(8)}/>/*("", selection: binding, displayedComponents: .date)
            .clipped()
          */
    }

    defaultRow(caption?: string) {
        return <MemriText><GeneralEditorCaption>{caption ?? this.prop.camelCaseToWords().toLowerCase().capitalizingFirst()}</GeneralEditorCaption></MemriText>
    }
}

export class GeneralEditorInput extends MainUI {
    render(){
        let styles = {
            border: [0,0,1,1]
        }
        Object.assign(styles, font({family: "system", size: 16, weight: Font.Weight.regular}), padding(10));
        return (
            <GeneralEditorCaption>
                <div className={"GeneralEditorInput"} style={styles} fullHeight>
                    {this.props.children}
                </div>
            </GeneralEditorCaption>
        );
    }
}

export class GeneralEditorLabel extends MainUI {
    render() {
        let styles = {
            color: "#38761d",
        }
        Object.assign(styles, font({family: "system", size: 14, weight: Font.Weight.regular}), padding({top: 10}));
        return (
            <div className={"GeneralEditorLabel"} style={styles}>
                {this.props.children}
            </div>
        );
    }
}

export class GeneralEditorCaption extends MainUI {
    render() {
        let styles = {
            color: "#223322",
        }
        Object.assign(styles, font({family: "system", size: 18, weight: Font.Weight.regular}));
        return (
            <div className={"GeneralEditorCaption"} style={styles}>
                {this.props.children}
            </div>
        );
    }
}

export class GeneralEditorHeader extends MainUI {
    render() {
        let styles = {
            color: "#333",
        }
        Object.assign(styles, font({family: "system", size: 15, weight: Font.Weight.regular}), padding({bottom: 5,top: 24, horizontal:"default"}));
        return (
            <div className={"GeneralEditorHeader"} style={styles}>
                {this.props.children}
            </div>
        );
    }
}
