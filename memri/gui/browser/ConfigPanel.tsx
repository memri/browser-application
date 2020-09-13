//
//  ConfigPanel.swift
//  memri
//
//  Created by Toby Brennan on 28/7/20.
//  Copyright © 2020 memri. All rights reserved.
//

import * as React from 'react';
import {
    font, frame,
    HStack,
    MainUI, MemriImage,
    MemriList,
    MemriRealButton, MemriStepper,
    MemriText,
    MemriTextField, NavigationLink,
    NavigationView, padding, Toggle,
    VStack
} from "../swiftUI";
import {Alignment, Color, Font} from "../../parsers/cvu-parser/CVUParser";
import {MemriButton} from "../common/MemriButton";
import {Expression} from "../../parsers/expression-parser/Expression";
import {ConfigItem, ConfigItemType, getSupportedRealmTypes, PossibleExpression, SpecialTypes} from "./ConfigPanelModel";
require("../../extension/common/string");

export class ConfigPanel extends MainUI {
    // keyboard = KeyboardResponder.shared
    shouldMoveAboveKeyboard = false

    render() {
        this.context= this.props.context
        let configItems = this.getConfigItems()

        return (
            <div className={"ConfigPanel"}>
            <NavigationView
                // .environment(\.verticalSizeClass, .compact)
                // .clipShape(RoundedRectangle(cornerRadius: shouldMoveAboveKeyboard ? 15 : 0))
                // .overlay(RoundedRectangle(cornerRadius: 15).strokeBorder(shouldMoveAboveKeyboard ? Color(.systemFill) : .clear))
                // .modifier(KeyboardModifier(enabled: shouldMoveAboveKeyboard, overrideHeightWhenVisible: 120))
            >
                {configItems.length === 0
                    ? this.noConfigItem
                    : <MemriList navigationBarTitle="Config" navigationBarHidden={true}
                        // .navigationBarTitle(Text("Config"), displayMode: .inline)
                        // .navigationBarHidden(keyboard.keyboardVisible)
                    >
                        {this.sortItem}
                        {configItems.map((configItem) => this.getConfigView(configItem))}
                    </MemriList>
                }
            </NavigationView>
            </div>
        )
    }
    
    get showSortItem(): boolean {
        return this.currentRendererConfig?.showSortInConfig ?? true
    }
    
    get noConfigItem() {
        if (this.showSortItem) {
            return <ConfigPanelSortView context={this.context}/>
        } else {
            return <MemriText padding foregroundColor={new Color("secondaryLabel").toLowerCase()} multilineTextAlignment={Alignment.center}>
                {"No configurable settings"}
            </MemriText>
        }
    }
    
    get sortItem() {
        if (this.showSortItem) {
            return <NavigationLink destination={<ConfigPanelSortView context={this.context}/>}>
                <MemriText>{"Sort order"}</MemriText>
            </NavigationLink>
        }
    }
    
    getConfigView(configItem: ConfigItem) {
        if (configItem.isItemSpecific) {
            return <NavigationLink destination={<ConfigPanelSelectionView configItem={configItem}/>} eraseToAnyView>
                <MemriText>{configItem.displayName}</MemriText>
            </NavigationLink>
        } else {
            switch (configItem.type) {
                case ConfigItemType.bool:
                    return <ConfigPanelBoolView context={this.context} configItem={configItem} eraseToAnyView/>
                case ConfigItemType.number:
                    return <ConfigPanelNumberView context={this.context} configItem={configItem} eraseToAnyView/>
                case SpecialTypes.chartType:
                    return <NavigationLink configItem={configItem} eraseToAnyView
                                           destination={<ConfigPanelEnumSelectionView context={this.context} configItem={configItem} type={ChartType}/>}
                    >
                        <MemriText>{configItem.displayName}</MemriText>
                    </NavigationLink>
                case SpecialTypes.timeLevel:
                    return <NavigationLink configItem={configItem} eraseToAnyView
                                           destination={<ConfigPanelEnumSelectionView context={this.context} configItem={configItem} type={DetailLevel}/>}
                    >
                        <MemriText>{configItem.displayName}</MemriText>
                    </NavigationLink>
                default:
                    return <NavigationLink configItem={configItem} eraseToAnyView
                                           destination={<ConfigPanelStringView context={this.context} configItem={configItem} shouldMoveAboveKeyboard={this.shouldMoveAboveKeyboard}/>}
                    >
                        <MemriText>{configItem.displayName}</MemriText>
                    </NavigationLink>
            }
        }
    }

    get currentRendererConfig(): ConfigurableRenderConfig {
        return this.context.currentView?.renderConfig
    }

    getConfigItems(): ConfigItem[] {
        return []// this.currentRendererConfig?.configItems(this.context) ?? []
    }
}

export class ConfigPanelBoolView extends MainUI {
    configItem: ConfigItem
    
    render() {
        this.context = this.props.context
        this.configItem = this.props.configItem
        return (
            <Toggle isOn={this.bindingForBoolExp}
                    onChange={(e) => this.bindingForBoolExp = e.target.value}>
                <MemriText>{this.configItem.displayName}</MemriText>
            </Toggle>
        )
    }

    get bindingForBoolExp() {
        return this.context?.currentView?.renderConfig?.cascadeProperty(this.configItem.propertyName) ?? false
    }

    set bindingForBoolExp($0) {
        this.context?.currentView?.renderConfig?.setState(this.configItem.propertyName, $0)
        this.context?.scheduleUIUpdate()
    }
}

export class ConfigPanelNumberView extends MainUI {
    configItem: ConfigItem

    render() {
        this.context = this.props.context
        this.configItem = this.props.configItem
        return <MemriStepper title={this.configItem.displayName}
                             value={this.bindingForNumber}
                             onChange={(e) => this.bindingForNumber = e.target.value}
        />
    }

    get bindingForNumber() {
        return this.context?.currentView?.renderConfig?.cascadeProperty(this.configItem.propertyName) ?? 0
    }
    set bindingForNumber($0) {
        this.context?.currentView?.renderConfig?.setState(this.configItem.propertyName, $0)
        this.context?.scheduleUIUpdate()
    }
}

export class ConfigPanelStringView extends MainUI {
	configItem: ConfigItem
    shouldMoveAboveKeyboard: boolean
	
	render() {
        this.context = this.props.context
        this.configItem = this.props.configItem
	    return (
	        <VStack alignment={Alignment.center}>
                <MemriText>{this.configItem.displayName}</MemriText>
                <MemriTextField value={this.bindingForExp}
                                onChange={(e) => this.bindingForExp = e.target.value}
                                placeholder={this.configItem.displayName}
                                clearButtonMode={"whileEditing"}
                                // returnKeyType={UIReturnKeyType.done} //TODO
                                showPrevNextButtons={false}
                                padding={5}
                                // background(Color(.systemFill).cornerRadius(5))

                >
                </MemriTextField>

            </VStack>
        )
	}

    get bindingForExp() {
	    return this.context?.currentView?.renderConfig?.cascadeProperty(this.configItem.propertyName) ?? ""
	}
    set bindingForExp($0) {
        this.context?.currentView?.renderConfig?.setState(this.configItem.propertyName, $0)
        this.context?.scheduleUIUpdate()
    }
}

export class ConfigPanelSelectionView extends MainUI {
	configItem: ConfigItem

    render() {
        this.context = this.props.context
        this.configItem = this.props.configItem

		let options = this.getRelevantFields()
        let currentSelection = this.currentSelection

        return <MemriList navigationBarTitle={this.configItem.displayName} /*displayMode: .inline*/>
            {options.map((option) => <MemriRealButton action={() => this.onSelect(option)}>
                <MemriText bold={option.propertyName == currentSelection/*TODO*/}>{option.displayName}
                </MemriText>
            </MemriRealButton>)}
        </MemriList>
	}
	
    onSelect(selected: PossibleExpression) {
        this.context.currentView?.renderConfig?.setState(this.configItem.propertyName, new Expression(selected.expressionString, false, this.context.views.lookupValueOfVariables, this.context.views.executeFunction))
        this.context.scheduleUIUpdate()
	}
	
	static excludedFields = ["uid", "deleted", "externalId", "version", "allEdges"]
	
    get currentSelection(): string {
        return (this.context.currentView?.renderConfig?.cascadeProperty(this.configItem.propertyName)?.code ?? "")//TODO .trimmingCharacters(CharacterSet(charactersIn: " .{}()"))
    }
    
	getRelevantFields(): PossibleExpression[] {
        let item = this.context.currentView?.resultSet.items[0]
		if (!item) { return [] }
		
		// let properties = Object.entries(item)//TODO item.objectSchema.properties
        let properties = Object.entries(item.objectSchema.properties)
        let computedProperties = item.computedVars
		
        let propertyOptions = properties.map ((prop) => {
            let propName = prop[0]
            let propType = prop[1]
            if (getSupportedRealmTypes(this.configItem.type).includes(propType) && !ConfigPanelSelectionView.excludedFields.includes(propName) && !(propName.indexOf("_") === 0)) {
                return new PossibleExpression(propName)//TODO
            }
            else {
                return undefined
            }
        }).filter((item) => item != undefined)
        
        let computedPropertyOptions = computedProperties.map ((prop) => {
            if (getSupportedRealmTypes(this.configItem.type).includes(prop.type)) {
                return new PossibleExpression(prop.propertyName, true)
            }
            else {
                return undefined
            }
        }).filter((item) => item != undefined)

        Object.assign(propertyOptions, computedPropertyOptions)
        
        return propertyOptions.sort(($0, $1) => {
            if ($0.propertyName < $1.propertyName) return 1
            else if ($0.propertyName > $1.propertyName) return -1
            else return 0
        })//TODO
	}
}

export class ComputedPropertyLink {
    propertyName: string
    type: string//PropertyType

    constructor(propertyName, type) {
        this.propertyName = propertyName
        this.type= type
    }
}

export class ConfigPanelSortView extends MainUI {
    render() {
        this.context = this.props.context
        this.configItem = this.props.configItem

        let options = this.getSortFields()
        let currentSort = this.context.currentView?.datasource.sortProperty ?? ""

        return <MemriList navigationBarTitle={"Sort"}
    //                       .navigationBarItems(trailing: toggleOrderButton)
    //                       .navigationBarTitle(Text("Sort"), displayMode: .inline)

        >
            {options.map((option) => <MemriRealButton key={option.propertyName} action={() => this.onSelect(option)}>
                <HStack>
                    <MemriText bold={option.propertyName == currentSort/*TODO*/}>
                        {option.displayName}
                        {currentSort == option.propertyName && this.sortDirectionImage}
                    </MemriText>
                </HStack>
            </MemriRealButton>)}
        </MemriList>
    }
    
    onSelect(selected: PossibleExpression) {
        if (this.context.currentView?.datasource.sortProperty == selected.propertyName) {
            // Toggle direction
            this.toggleAscending()
        } else {
            // Change sort property
            this.changeOrderProperty(selected.propertyName)
        }
    }

    toggleAscending() {
        let ds = this.context.currentView?.datasource
        if (ds) {ds.sortAscending = !(ds.sortAscending ?? true)}
        // ds && (ds.sortAscending = !(ds.sortAscending ?? true))
        this.context.scheduleCascadableViewUpdate()
    }
    
    changeOrderProperty(fieldName: string) {
        let currentView = this.context.currentView
        if (currentView) {currentView.datasource.sortProperty = fieldName}
        // currentView && (currentView.datasource.sortProperty = fieldName)
        this.context.scheduleCascadableViewUpdate()
    }
    
    static excludedFields = ["uid", "deleted", "externalId", "version", "allEdges"]
    
    getSortFields(): PossibleExpression[] {
        let item = this.context.currentView?.resultSet.items[0]
        if (!item) { return [] }

        let properties = Object.keys(item.objectSchema.properties)
        
        return properties.map((prop) => {
            if (!ConfigPanelSelectionView.excludedFields.includes(prop) && !(prop.indexOf("_") === 0)) {
                return new PossibleExpression(prop)
            }
            else {
                return undefined
            }
        }).filter((item) => item != undefined)
    }
    
    get sortDirectionImage() {
        return <MemriImage>
            {this.context.currentView.datasource.sortAscending == false
                ? "arrow_downward"
                : "arrow_upward"}
        </MemriImage>
    }
    get toggleOrderButton() {
        return <MemriRealButton onClick={() => this.toggleAscending()} padding={5}>
            {this.sortDirectionImage}
            {/*.contentShape(Rectangle())*/}
        </MemriRealButton>
    }
}

export class ConfigPanelEnumSelectionView extends MainUI{
    configItem: ConfigItem

    get currentSelection(): String {
        return this.context.currentView?.renderConfig?.cascadeProperty(this.configItem.propertyName)
    }
    
    onSelect(selected: string) {
        this.context.currentView?.renderConfig?.setState(this.configItem.propertyName, selected)
        this.context.scheduleUIUpdate()
    }
    
    render() {
        this.context = this.props.context
        this.configItem = this.props.configItem

        let options = []
        // let options = EnumType.allCases
        let currentSelection = this.currentSelection

        return <MemriList navigationBarTitle={this.configItem.displayName}
            //                       navigationBarTitle(Text(configItem.displayName), displayMode: .inline)
        >
            {options.map((option) => <MemriRealButton action={() => this.onSelect(option)}>
                <MemriText bold={option == currentSelection/*TODO*/}>
                    {option.camelCaseToWords()}
                </MemriText>
            </MemriRealButton>)}
        </MemriList>
    }
}
