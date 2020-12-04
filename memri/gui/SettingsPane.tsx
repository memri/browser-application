//
// SettingsPane.swift
// Copyright © 2020 memri. All rights reserved.

import {
    font,
    Form,
    frame,
    HStack,
    MainUI,
    MemriText,
    NavigationLink,
    NavigationView,
    Section,
    MemriTextField,
    MemriRealButton, Toggle
} from "./swiftUI";
import {debugHistory} from "../cvu/views/ViewDebugger";
import * as React from "react";
import {Alignment, Font} from "./cvuComponents/valueTypes/CVUFont";

export class SettingsPane extends MainUI {
    context: MemriContext
    presentationMode

    getBinding(path: string) {
        return {
            get: () => {
                // TODO: Error handling
                let x = this.context.settings.get(path);
                if (x != undefined) {
                    return x
                } else {
                    debugHistory.warn(`Could not get setting ${path}`)
                    return;
                    /*if T.self == String.self { return "" as! T }
                    if T.self == Double.self { return 0 as! T }
                    if T.self == Int.self { return 0 as! T }
                    if T.self == Bool.self { return false as! T }*/
                }

                return 0// Should never get here
            },
            set: (e) => {
                let value = e.target.value;
                if (e.target.type == "checkbox") {
                    value = e.target.checked;
                    this.setState({"checked": value});
                }
                this.context.settings.set(path, value)
            }
        }
    }


    render(){
        this.context = this.props.context;

        return (
            <NavigationView context={this.context} height={"100%"}>
                <Form navigationBarTitle={<MemriText>Settings</MemriText>} navigationBarItems={{
                    leading:
                        <MemriRealButton action={() => { this.context.showSettings = false; this.context.scheduleUIUpdate();
                        }}><MemriText>Close</MemriText></MemriRealButton>
                }} context={this.context}>
                    <NavigationLink context={this.context} destination={
                        <Form>
                            <Section header={<MemriText>Pod Connection</MemriText>} footer={<MemriText
                                font={font({family: "system", size: 11, weight: Font.Weight.regular})}>Never give out
                                these details to anyone</MemriText>}>
                                <HStack>
                                    <MemriText frame={frame({width: 100, alignment: Alignment.leading})}>
                                        Host:
                                    </MemriText>
                                    <MemriTextField value={this.getBinding("/user/pod/host")}/>
                                </HStack>
                                <HStack>
                                    <MemriRealButton action={() => {
                                        let datasource = this.context.currentView?.datasource.flattened()
                                        if (datasource) {
                                            this.context.cache.sync.clearSyncCache()
                                            this.context.cache.sync.syncQuery(datasource)
                                        }
                                    }}>
                                        <MemriText>
                                            Connect
                                        </MemriText>
                                    </MemriRealButton>
                                </HStack>
                            </Section>
                            <Section header={<MemriText>Syncing</MemriText>}>
                                <Toggle isOn={this.getBinding("/device/upload/cellular")}/>
                                <MemriText>
                                    Enable upload of images while on cellular
                                </MemriText>
                            </Section>
                        </Form>
                    }>
                        <MemriText>
                            Pod Connection
                        </MemriText>
                    </NavigationLink>
                    <NavigationLink context={this.context} destination={
                        <Form>
                            <Section header={<MemriText>User Interface</MemriText>} footer={<MemriText
                                font={font({family: "system", size: 11, weight: Font.Weight.regular})}>Show 'xx time ago' in place of dates less than 36 hours ago</MemriText>}>
                                <Toggle isOn={this.getBinding("/user/general/gui/showEditButton")}/>
                                <MemriText>
                                    Always show edit button
                                </MemriText>
                                <Toggle isOn={this.getBinding("/user/general/gui/showDateAgo")}/>
                                <MemriText>
                                    Enable time ago
                                </MemriText>
                            </Section>
                        </Form>
                    }>
                        <MemriText>
                            User Interface
                        </MemriText>
                    </NavigationLink>
                    <NavigationLink context={this.context} destination={
                        <Form>
                            <Section header={<MemriText>Sensors</MemriText>}>
                                <Toggle isOn={this.getBinding("/device/sensors/location/track")}/>
                                <MemriText>
                                    Track and store location
                                </MemriText>
                            </Section>
                        </Form>
                    }>
                        <MemriText>
                            Sensors
                        </MemriText>
                    </NavigationLink>
                    <NavigationLink context={this.context} destination={
                        <Form>
                            <Section header={<MemriText>Internationalization</MemriText>}>
                                <MemriTextField value={this.getBinding("/user/formatting/date")}/>
                            </Section>
                        </Form>
                    }>
                        <MemriText>
                            Internationalization
                        </MemriText>
                    </NavigationLink>
                    <NavigationLink context={this.context} destination={
                        <Form>
                            <Section header={<MemriText>Debug Settings</MemriText>}>
                                <Toggle isOn={this.getBinding("/device/debug/autoShowErrorConsole")}/>
                                <MemriText>
                                    Automatically pop up the debug console on errors
                                </MemriText>
                                <Toggle isOn={this.getBinding("/device/debug/autoReloadCVU")}/>
                                <MemriText>
                                    Automatically reload CVU when it changes
                                </MemriText>
                            </Section>
                            <Section header={<MemriText>Debug Actions</MemriText>}>
                                <HStack>
                                    <MemriRealButton action={()=>this.context.cache.sync.schedule()}>
                                        <MemriText>Sync To Pod</MemriText>
                                    </MemriRealButton>
                                </HStack>
                            </Section>
                        </Form>
                    }>
                        <MemriText>
                            Debug
                        </MemriText>
                    </NavigationLink>
                </Form>
            </NavigationView>
        )
    }
}
