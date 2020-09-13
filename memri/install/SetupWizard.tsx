//
//  SetupWizard.swift
//  memri
//
//  Created by Ruben Daniels on 7/26/20.
//  Copyright © 2020 memri. All rights reserved.
//

import {
    font,
    frame,
    HStack,
    MainUI, MemriRealButton,
    MemriText,
    MemriTextField,
    NavigationLink,
    NavigationView,
    Section,
    MemriAlert, SecureField, Form
} from "../gui/swiftUI";
import * as React from "react";
import {Alignment, Font} from "../parsers/cvu-parser/CVUParser";
import {MemriContext} from "../context/MemriContext";
import {debugHistory} from "../cvu/views/ViewDebugger";

export class SetupWizard extends MainUI {
    context: MemriContext

    host: string = "http://192.168.88.24:3030"
    privateKey: string = "54365395D0C23087C44FF5FC0A2320D276B942AA8A7F0A92585A8368FFBEAA29"
    publicKey: string = "401E34DC78BF9588554A3CBACF6528A6CED7AD2CBF1ED56EB19DDF6924903F59"
    databaseKey: string = "9F293DAA30B642C7885770F824CED595E7B206B670EE476087655EE9BDA6977B"
    showingAlert = false;

    render(){
        this.context = this.props.context;
        this.host = this.props.host ?? this.host;
        this.privateKey = this.props.privateKey ?? this.privateKey;
        this.publicKey = this.props.publicKey ?? this.publicKey;
        this.databaseKey = this.props.databaseKey ?? this.databaseKey;
        this.showingAlert = this.props.showingAlert ?? this.showingAlert;

        let primaryButtonAction = () => {
            this.context.installer.installLocalAuthForNewPod(
                this.context,
                true,
                this.host, (error) => {
                    error && debugHistory.error(`${error}`) // TODO: show this to the user
                })
            /*this.setState({
                open: false,
            });*/
        } //TODO: logic for cancel;
        let buttonForExistingPod = () => {
            this.context.installer.installLocalAuthForExistingPod(
                this.context,
                true,
                this.host, this.privateKey,
                this.publicKey,
                this.databaseKey, (error) => {
                    error && error.map(($0) => debugHistory.error(`${$0}`))// TODO: show this to the user
                })
            //this.context.showInstalled();
            }

        let buttonForLocalInstall = () => {
            this.context.installer.installLocalAuthForLocalInstallation(this.context, true, (error) => {
                error && error.map(($0) => debugHistory.error(`${$0}`))// TODO: show this to the user
            })
        }


        return (
            <NavigationView>
                <Form>
                    {!this.context.installer.isInstalled && !this.context.installer.debugMode &&
                    <>
                        <MemriText font={font({family: "system", size: 22, weight: Font.Weight.bold})}>
                            Setup Wizard
                        </MemriText>
                        <Section header={<MemriText>
                            Connect to a pod
                        </MemriText>}>

                            <NavigationLink destination={
                                <Form>
                                    <Section header={<MemriText>
                                        Pod Connection
                                    </MemriText>} footer={
                                        <MemriText font={font({family: "system", size: 11, weight: Font.Weight.regular})}>
                                            Never give out these details to anyone
                                        </MemriText>
                                    }>
                                        <HStack>
                                            <MemriText frame={frame({width:100, alignment: Alignment.topLeading})}>
                                                Host:
                                            </MemriText>
                                            <MemriTextField value={this.host}/>
                                        </HStack>
                                        <HStack>
                                            <MemriRealButton action={() => {
                                                if (this.host != "") {
                                                    this.showingAlert = true
                                                }
                                            }}
                                                             alert={
                                                                 <MemriAlert title={
                                                                     <MemriText>
                                                                         Clear Database
                                                                     </MemriText>}
                                                                             message={
                                                                                 <MemriText>
                                                                                     This will delete
                                                                                     access to all previous data on this
                                                                                     device and load the default
                                                                                     database
                                                                                     to connect to a new pod. Are you
                                                                                     sure? There is no
                                                                                     undo!
                                                                                 </MemriText>
                                                                             }
                                                                             primaryButton={<MemriRealButton
                                                                                 action={primaryButtonAction}><MemriText>Delete</MemriText></MemriRealButton>}
                                                                             secondaryButton={
                                                                                 <MemriRealButton><MemriText>Cancel</MemriText></MemriRealButton>}/>}

                                            >
                                                <MemriText>
                                                    Authenticate
                                                </MemriText>
                                            </MemriRealButton>
                                        </HStack>
                                    </Section>
                                </Form>
                            }>
                                <MemriText>
                                    Connect to a new pod
                                </MemriText>
                            </NavigationLink>
                            <NavigationLink destination={
                                <Form>
                                    <Section header={<MemriText>
                                        Pod Connection
                                    </MemriText>} footer={
                                        <MemriText
                                            font={font({family: "system", size: 11, weight: Font.Weight.regular})}>
                                            Never give out these details to anyone
                                        </MemriText>
                                    }>
                                        <HStack>
                                            <MemriText frame={frame({width:100, alignment: Alignment.leading})}>
                                                Host:
                                            </MemriText>
                                            <MemriTextField value={this.host}/>
                                        </HStack>
                                        <HStack>
                                            <MemriText frame={frame({width:100, alignment: Alignment.leading})}>
                                                Private Key:
                                            </MemriText>
                                            <SecureField text={this.privateKey} placeholder={"Private Key:"}/>
                                        </HStack>
                                        <HStack>
                                            <MemriText frame={frame({width:100, alignment: Alignment.leading})}>
                                                Public Key:
                                            </MemriText>
                                            <SecureField text={this.publicKey} placeholder={"Public Key:"}/>
                                        </HStack>
                                        <HStack>
                                            <MemriText frame={frame({width:100, alignment: Alignment.leading})}>
                                                Database Key:
                                            </MemriText>
                                            <SecureField text={this.databaseKey} placeholder={"Database Key:"}/>
                                        </HStack>
                                        <HStack>
                                            <MemriRealButton action={() => {
                                                if (this.host != "") {
                                                    this.showingAlert = true
                                                }
                                            }}
                                                             alert={
                                                                 <MemriAlert title={
                                                                     <MemriText>
                                                                         Clear Database
                                                                     </MemriText>}
                                                                             message={
                                                                                 <MemriText>
                                                                                     This will delete access to all previous data on this device and load a fresh copy of your data from your pod. Are you sure? There is no undo!
                                                                                 </MemriText>
                                                                             } primaryButton={<MemriRealButton
                                                                     action={buttonForExistingPod}><MemriText>Delete</MemriText></MemriRealButton>}/>}
                                                             secondaryButton={
                                                                 <MemriRealButton><MemriText>Cancel</MemriText></MemriRealButton>}
                                            >
                                                <MemriText>
                                                    Authenticate
                                                </MemriText>
                                            </MemriRealButton>
                                        </HStack>

                                    </Section>
                                </Form>
                            }>
                                <MemriText>Connect to an existing pod</MemriText>
                            </NavigationLink>
                        </Section>
                        <Section header={<MemriText>
                            Or use Memri locally
                        </MemriText>}>
                            <MemriRealButton action={buttonForLocalInstall}>
                                <MemriText>Use memri without a pod</MemriText>
                            </MemriRealButton>
                        </Section>
                    </>
                    }
                </Form>
            </NavigationView>
        )
    }

    /*var body: some View {
        NavigationView {
            Form {
                if context.installer.debugMode {
                    Text("Recovery Wizard")
                        .font(.system(size: 22, weight: .bold))

                    Section(
                        header: Text("Memri crashed last time. What would you like to do?")
                    ) {
                        Button(action: {
                            self.context.installer.continueAsNormal(self.context)
                        }) {
                            Text("Continue as normal")
                        }
                        Button(action: {
                            self.context.installer.clearDatabase(self.context) { error in
                                debugHistory.error("\(error)") // TODO: show this to the user
                            }
                        }) {
                            Text("Delete the local database and start over")
                        }
                        if context.installer.isInstalled {
                            Button(action: {
                                self.context.installer.clearSessions(self.context) { error in
                                    debugHistory.error("\(error)") // TODO: show this to the user
                                }
                            }) {
                                Text("Clear the session history (to recover from an issue)")
                            }
                        }
                    }
                }
            }
        }
    }*/
}
