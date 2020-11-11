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
import {Alignment, Font} from "../../router";
import {MemriContext} from "../../router";
import {debugHistory} from "../../router";

export class SetupWizard extends MainUI {
    context: MemriContext

    host: string = "http://192.168.88.31:3030"
    privateKey: string = "98D7A78E0FE878B20915BE65083FEBBA1E15EE6E110EB8395C040CF23F1AB74B"
    publicKey: string = "CDFA58CEDDD92508FCA6C509B56BE2693B63C6063902D25151F40E84E6740771"
    databaseKey: string = "C070BDD19BD248C2A31DCBBE85FF701C9C4E54C6AB474405B5B7C298F49188D0"
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
                    error && debugHistory.error(error) // TODO: show this to the user
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
                    error && debugHistory.error(error)// TODO: show this to the user
                })
            //this.context.showInstalled();
            }

        let buttonForLocalInstall = () => {
            this.context.installer.installLocalAuthForLocalInstallation(this.context, true, (error) => {
                error && debugHistory.error(error)// TODO: show this to the user
            })
        }

        let buttonForDemoInstall = () => {
            this.context.installer.installDemoDatabase(this.context, () => {
                this.context.settings.set("user/pod/host", "")
                this.context.installer.ready(this.context)
            })
        }


        return (
            <NavigationView>
                <Form navigationBarTitle={<MemriText>Setup Wizard</MemriText>}>
                    {!this.context.installer.isInstalled && !this.context.installer.debugMode &&
                    <>
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
                                            <MemriTextField value={this.host} onChange={(e) => this.host = e.target.value}/>
                                        </HStack>
                                    </Section>
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
                                            <MemriTextField value={this.host} onChange={(e) => this.host = e.target.value}/>
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
                                    </Section>

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
                                                                             This will delete access to all previous
                                                                             data on this device and load a fresh copy
                                                                             of your data from your pod. Are you sure?
                                                                             There is no undo!
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

                                </Form>
                            }>
                                <MemriText>Connect to an existing pod</MemriText>
                            </NavigationLink>
                        </Section>
                        <Section header={<MemriText>
                            Or use Memri locally
                        </MemriText>}>
                            <MemriRealButton action={buttonForLocalInstall}>
                                <MemriText>Use a local demo database (no pod)</MemriText>
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
