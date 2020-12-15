//
//  LabelAnnotationRenderer.swift
//  memri
//
//  Created by Toby Brennan on 26/8/20.
//  Copyright © 2020 memri. All rights reserved.
//



import {CascadingRendererConfig} from "../../../../router";
import {DatabaseController} from "../../../../router";
import {CacheMemri} from "../../../../router";
import {
    Corners,
    font, frame,
    HStack,
    MainUI,
    MemriDivider, MemriImage, MemriList,
    MemriRealButton,
    MemriText,
    padding,
    RenderersMemri, ScrollView, shadow,
    VStack
} from "../../swiftUI";
import {Alignment, Color, Font} from "../../../../router";
import * as React from "react";
import {LabelAnnotation} from "../../../../router";

class LabelOption {
    labelID: string
    text: string
    icon

    constructor(labelID: string, text: string, icon) {
        this.labelID = labelID
        this.text = text
        this.icon = icon
    }

    get id(): string {return this.labelID}
}

export class LabelAnnotationRendererController {
    static rendererType = {name: "labelAnnotation", icon: "tag.circle.fill", makeController:LabelAnnotationRendererController, makeConfig:LabelAnnotationRendererController.makeConfig}

    constructor(context: MemriContext, config?: CascadingRendererConfig) {
        this.context = context
        this.config = config ?? new LabelAnnotationRendererConfig()
        this.loadExistingAnnotation()
    }

    context: MemriContext
    config: LabelAnnotationRendererConfig

    makeView() {
        return new LabelAnnotationRendererView({controller: this, context: this.context}).render();
    }

    update() {
        /*objectWillChange.send()*/
        return
    }

    static makeConfig(head?: CVUParsedDefinition, tail?: CVUParsedDefinition[], host?: Cascadable) {
        return new LabelAnnotationRendererConfig(head, tail, host)
    }

    view(item: Item) {
        return this.config.render(item)
    }

    currentIndex = 0;
    /*
    .zero {
        didSet {
            if currentIndex != oldValue {
                loadExistingAnnotation()
            }
        }
    }
     */
    selectedLabels= {}

    get labelType() {
        return this.config.labelType
    }

    get labelOptions() {
        //TODO labelOptions.indexed
        return Object.entries(this.config.labelOptions).map((label) =>
            new LabelOption(label[1], label[1].titleCase(), <MemriImage>{this.config.labelOptionIcons[label[0]] ?? "tag"}</MemriImage>)
        )
    }

    moveToPreviousItem() {
        if (this.currentIndex <= 0) { return;}
        this.currentIndex--;
        this.loadExistingAnnotation()
        this.context.scheduleCascadableViewUpdate(false)
    }
    moveToPreviousItem = this.moveToPreviousItem.bind(this)

    moveToNextItem() {
        if (this.currentIndex >= this.context.items.length - 1) { return;}
        this.currentIndex++;
        this.loadExistingAnnotation()
        this.context.scheduleCascadableViewUpdate(false)
    }
    moveToNextItem = this.moveToNextItem.bind(this)

    loadExistingAnnotation() {
        this.selectedLabels = this.currentAnnotationLabels
    }

    applyCurrentItem() {
        if (!this.currentItem) {
            return;
        }

        let oldAnnotation = this.currentAnnotation()
        DatabaseController.sync(true, (realm) => {
            let annotationItem: Item = oldAnnotation ?? new LabelAnnotation({"_type": "LabelAnnotation"})//TODO
            annotationItem.labelType = this.labelType
            annotationItem.labelsSet = this.selectedLabels
            try {
                if (oldAnnotation == undefined) {
                    annotationItem.uid = annotationItem.uid ?? CacheMemri.incrementUID()
                    realm.add(annotationItem)
                }
                annotationItem.link(this.currentItem, "annotatedItem", undefined, undefined, true, true)
            } catch (error) {
                console.log(`Couldn't link item to annotation: ${error}`)
            }
        })

        this.moveToNextItem()
    }
    applyCurrentItem = this.applyCurrentItem.bind(this)

    currentAnnotation() {
        return DatabaseController.sync(false, (realm) => {
            let edge = this.currentItem?.reverseEdges("annotatedItem")?.find(($0) => {
                return $0.source()?.labelType == this.labelType
            }) //TODO:
            return edge?.source()
        })
    }

    get currentAnnotationLabels() {
        return this.currentAnnotation()?.labelsSet ?? []
    }

    get currentItem() {
        return this.context.items[this.currentIndex]
    }

    get currentRenderedItem() {
        return this.config.render(this.currentItem)
    }

    get progressText() {
        if (this.context.items.length == 0) {
            return
        }
        return `Item ${this.currentIndex + 1} of ${this.context.items.length}`
    }

    get enableBackButton() {
        return this.currentIndex > 0
    }

    get enableSkipButton() {
        return this.currentIndex < this.context.items.length - 1
    }

}

class LabelAnnotationRendererConfig extends CascadingRendererConfig {
    showSortInConfig = false
    showContextualBarInEditMode = false

    configItems(context: MemriContext) {
        return []
    }

    get labelType() {
        return this.cascadeProperty("labelType") ?? "UNDEFINED"
    }

    get labelOptions() {
        return this.cascadeList("labelOptions")
    }

    get labelOptionIcons() {
        return this.cascadeList("labelOptionIcons")
    }
}


export class LabelAnnotationRendererView extends RenderersMemri {
    controller : LabelAnnotationRendererController

    get currentContent() {
        if (this.controller.currentItem != undefined) {
            return this.controller.currentRenderedItem
        } else {
            return (
                <MemriText font={font({weight:Font.Weight.bold})}>
                    "No items to label"
                </MemriText>
            )
                //.frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    selectedLabelBinding = {//TODO!!!
        get: () => {
            return this.controller.selectedLabels
        },
        set: ($0) => {
            this.controller.selectedLabels = $0
            this.controller.context.scheduleCascadableViewUpdate(false)
        }
      /*  Binding(
            get: { self.controller.selectedLabels },
        set: {
            self.controller.selectedLabels = $0
        })*/
    }

    render() {
        this.controller = this.props.controller;
        return (
            <LabelSelectionView options={this.controller.labelOptions} selected={this.selectedLabelBinding}
                                enabled={this.controller.currentItem != undefined}
                                onBackPressed={this.controller.moveToPreviousItem}
                                onCheckmarkPressed={this.controller.applyCurrentItem}
                                onSkipPressed={this.controller.moveToNextItem}
                                enableBackButton={this.controller.enableBackButton}
                                enableCheckmarkButton={true}
                                enableSkipButton={this.controller.enableSkipButton}
                                topText={this.controller.progressText}
                                content={this.currentContent}
                                useScrollView={false}
            />
        )
    }
}

class LabelSelectionView extends MainUI {
    options

    selected: string[]
    enabled: boolean

    onBackPressed
    onCheckmarkPressed
    onSkipPressed

    enableBackButton
    enableCheckmarkButton
    enableSkipButton

    topText: string

    content
    useScrollView

    render(){
        this.options = this.props.options;
        this.selected = this.props.selected.get();
        this.enabled = this.props.enabled;
        this.onBackPressed = this.props.onBackPressed;
        this.onCheckmarkPressed = this.props.onCheckmarkPressed;
        this.onSkipPressed = this.props.onSkipPressed;
        this.enableBackButton = this.props.enableBackButton;
        this.enableCheckmarkButton = this.props.enableCheckmarkButton;
        this.enableSkipButton = this.props.enableSkipButton;
        this.topText = this.props.topText;
        this.content = this.props.content;
        this.useScrollView = this.props.useScrollView;

        return (
            <div id={"LabelAnnotationRenderer"}>
                <VStack spacing={0} disabled={!this.enabled} bottom={0}>
                    <MemriText font={font({family: "body"})} padding={padding({horizontal: 10, vertical: 5})}
                               background={new Color("secondarySystemBackground")}>
                        {this.topText}
                    </MemriText>
                    {this.topText != undefined &&
                    <MemriDivider/>
                    }
                    {this.useScrollView ?
                        <ScrollView vertical>
                            {this.content}
                        </ScrollView> :
                        this.content
                    }
                    <div id={"BottomLabels"} style={{
                        position: "absolute",
                        bottom: document.getElementsByClassName("BottomBarView").item(0).clientHeight,
                        width: "100%"
                    }}>
                        <MemriList opacity={this.enabled ? 1 : 0.4} frame={frame({height: 220})} cornerRadius={20}
                                   corners={[Corners.topLeft, Corners.topRight]}
                                   background={Color.named("systemBackground")}
                                   shadow={shadow({radius: 10})}>
                            {this.options.map((option) => {
                                return (
                                    <MemriRealButton action={() => {
                                        this.selected.includes(option.id)
                                            ? this.selected.splice(this.selected.findIndex((id) => id === option.id), 1)
                                            : this.selected.push(option.id)
                                        this.props.selected.set(this.selected);
                                    }}>
                                        <HStack frame={frame({maxWidth: "infinity", alignment: Alignment.leading})}
                                                foregroundColor={this.selected.includes(option.id) ? "white" : ""}
                                                background={this.selected.includes(option.id) ? "blue" : ""}
                                                cornerRadius={this.selected.includes(option.id) ? 4 : 0}
                                                padding={padding(this.selected.includes(option.id) ? -5 : 0)}
                                        >
                                            {option.icon}
                                            <MemriText>
                                                {option.text}
                                            </MemriText>
                                        </HStack>
                                    </MemriRealButton>
                                )
                            })
                            }
                        </MemriList>
                        <MemriDivider/>
                        <HStack spacing={0} opacity={this.enabled ? 1 : 0.4} frame={frame({height: 50})}
                                background={new Color("secondarySystemBackground")}>
                            <MemriRealButton action={this.onBackPressed} disabled={!this.enableBackButton}>
                                <MemriImage font={font({family: "system", size: 20})}
                                            padding={padding({horizontal: 20})}
                                            foregroundColor={this.enableBackButton ? "blue" : new Color("gray").opacity(0.5)}>
                                    undo
                                </MemriImage>
                            </MemriRealButton>
                            <MemriRealButton flexGrow={1} action={this.onCheckmarkPressed}
                                             disabled={!this.enableCheckmarkButton}>
                                <MemriImage font={font({family: "system", size: 25})}
                                            foregroundColor={"white"}
                                            background={new Color("green").opacity(this.enableCheckmarkButton ? 1 : 0.5)}
                                            padding={padding("default")}>
                                    checkmark
                                </MemriImage>
                            </MemriRealButton>
                            <MemriRealButton action={this.onSkipPressed} disabled={!this.enableSkipButton}>
                                <MemriText font={font({family: "system", size: 20})} padding={padding({horizontal: 20})}
                                           foregroundColor={this.enableSkipButton ? "blue" : new Color("gray").opacity(0.5)}>
                                    Skip
                                </MemriText>
                            </MemriRealButton>
                        </HStack>
                    </div>
                </VStack>
            </div>
        )
    }

}
