//
// SetupWizard.swift
// Copyright © 2020 memri. All rights reserved.

import {
    ColorArea,
    font, Form,
    frame,
    MainUI, MemriAlert,
    MemriRealButton,
    MemriText, MemriTextField,
    NavigationLink,
    NavigationView, padding, Section,
    Spacer, Toggle,
    VStack,
    ZStack
} from "../gui/swiftUI";
import * as React from "react";
import {Alignment, Font} from "../gui/cvuComponents/valueTypes/CVUFont";
import {Color} from "../gui/cvuComponents/valueTypes/CVUColor";
import {debugHistory} from "../cvu/views/ViewDebugger";

class SetupScreen_Model {
    defaultPodURL = "http://localhost:3030"
    podURL: string
    podPrivateKey: string
    podPublicKey: string
    podDatabaseKey: string
    setupAsNewPod: boolean = true
    
    state: PodSetupState = PodSetupState.idle
    
    getPodURL():string {
        return this.podURL?.nilIfBlank ?? this.defaultPodURL
    }

    get isValidToProceedToConnect(): boolean {
        if (this.setupAsNewPod) {
            return true
        }


        if (this.podPrivateKey?.nilIfBlank == null && this.podPublicKey?.nilIfBlank != null && this.podDatabaseKey?.nilIfBlank != null) {
            return false
        }
        return true
    }
    

}

enum PodSetupState {
    idle,
    loading,
    error
}


class SetupScreen extends MainUI {
    context: MemriContext
    model = new SetupScreen_Model();
    showingNewPodWarning: boolean = false

    render() {
        return (
            <ZStack>
                <NavigationView colorScheme={"dark"} navigationViewStyle={"StackNavigationViewStyle"}>
                    <VStack spacing={10} padding={padding("default")}
                            frame={frame({maxWidth: "infinity", maxHeight: "infinity"})}
                            background={Color.named("secondarySystemBackground")}>
                        <VStack spacing={-10}>
                            <MemriText font={font({family: "system", size: 20, weight: Font.Weight.light})}>
                                Welcome to
                            </MemriText>
                            <MemriText
                                font={font({family: "system", size: 60, weight: Font.Weight.bold, design: "default"})}
                                foregroundColor={Color.named("purple")}>
                                memri
                            </MemriText>
                        </VStack>
                        <MemriText multilineTextAlignment={Alignment.center} foregroundColor={Color.named("label")}>
                            A place where your data belongs to you.
                        </MemriText>
                        <Spacer frame={frame({height: 30})}/>
                        <VStack alignment={Alignment.leading} spacing={6}>
                            <MemriText>
                                Have a memri pod?
                            </MemriText>
                            <NavigationLink destination={this.podSetup} buttonStyle={"PlainButtonStyle"}>
                                <MemriText font={font({family: "headline"})} foregroundColor={Color.named("white")}
                                           frame={frame({maxWidth: "infinity", minHeight: 50})}
                                           background={Color.named("green")} cornerRadius={10}>
                                    Connect to pod
                                </MemriText>
                            </NavigationLink>
                        </VStack>
                        <VStack alignment={Alignment.leading} spacing={6} padding={padding({top: 10})}>
                            <MemriText>
                                Just want to try the app?
                            </MemriText>
                            <MemriRealButton action={this.onLocalDemoPressed} buttonStyle={"PlainButtonStyle"}>
                                <MemriText frame={frame({maxWidth: "infinity", minHeight: 50})}
                                           background={Color.named("tertiarySystemBackground")} cornerRadius={10}>
                                    Let me try the app without a pod
                                </MemriText>
                            </MemriRealButton>
                        </VStack>
                    </VStack>
                </NavigationView>
                {this.newPodWarning}
                {this.model.state == PodSetupState.loading &&
                <>
                    <ColorArea color={"black"} opacity={0.75}>

                    </ColorArea>
                    <VStack spacing={10}>
                        <ActivityIndicatorView style={"large"} color={"white"}/>
                        <MemriText>Setup in progress...</MemriText>
                    </VStack>
                </>
                }
            </ZStack>
        )
    }

    get captionFont() {
        return font({family:"caption", weight: Font.Weight.bold});
    }

    get podSetup() {
        //.showIf(model.setupAsNewPod)
        //.showIf(!model.setupAsNewPod)
        return (
            <Form navigationTitle={"Pod Setup"}>
                <Section header={<MemriText>Connection Details</MemriText>}>
                    <VStack alignment={Alignment.leading} spacing={2}>
                        <MemriText font={this.captionFont}>
                            Pod URL
                        </MemriText>
                        <MemriTextField value={this.model.podURL} placeholder={this.model.defaultPodURL}/>
                    </VStack>
                </Section>
                <Section header={<MemriText>Pod setup</MemriText>} footer={this.connectButton}>
                    <Toggle isOn={this.model.setupAsNewPod}>
                        Set up as new pod?
                    </Toggle>
                    <MemriText font={font({family: "caption"})}>
                        If enabled this will create new authentication keys and install the demo data.
                    </MemriText>
                </Section>
                {!this.model.setupAsNewPod}
                <Section header={<MemriText>Authentication</MemriText>} footer={this.connectButton}>
                    <VStack alignment={Alignment.leading} spacing={2}>
                        <MemriText font={this.captionFont}>
                            Public Key
                        </MemriText>
                        <MemriTextField value={this.model.podPublicKey} placeholder={"publickey"}/>
                        <MemriText font={this.captionFont}>
                            Private Key
                        </MemriText>
                        <MemriTextField value={this.model.podPrivateKey} placeholder={"privatekey"}/>
                        <MemriText font={this.captionFont}>
                            Database Key
                        </MemriText>
                        <MemriTextField value={this.model.podDatabaseKey} placeholder={"databasekey"}/>
                    </VStack>
                </Section>
            </Form>
        )
    }

    get connectButton() {
        return (
            <VStack spacing={10} padding={padding({top: "default"})}>
                {this.model.state == PodSetupState.error &&
                <MemriText multilineTextAlignment={Alignment.center} lineLimit={3} foregroundColor={Color.named("red")}>
                    Error connecting to pod: \(errorString)
                </MemriText>
                }
                {!this.model.isValidToProceedToConnect &&
                <MemriText foregroundColor={Color.named("red")}>
                    You must provide the public, private, and database key to connect to an existing pod.
                </MemriText>
                }
                <MemriRealButton action={this.onConnectPressed} buttonStyle={"PlainButtonStyle"} disabled={!this.model.isValidToProceedToConnect}>
                    <MemriText font={font({family: "headline"})} foregroundColor={Color.named("white")}
                               frame={frame({maxWidth: "infinity", minHeight: 50})} background={Color.named("green")}
                               cornerRadius={10}>
                        Connect to pod
                    </MemriText>
                </MemriRealButton>
            </VStack>
        )
    }
    

    onConnectPressed() {
        if (this.model.setupAsNewPod) {
            this.showingNewPodWarning = true
        } else {
            this._onConnectPressed()
        }
    }
    
    _onConnectPressed() {
        this.model.state = PodSetupState.loading
        
        function handleCompletion(error: Error) {
            if (error) {
                this.model.state = PodSetupState.error;//("\(error)")
                debugHistory.error(error)
            } else {
                this.model.state = PodSetupState.idle
            }
        }
        
        if (this.model.setupAsNewPod) {
            this.context.installer.installLocalAuthForNewPod(
                this.context,
                this.model.getPodURL(),
                handleCompletion(error) //TODO:
            )
        } else {
            this.context.installer.installLocalAuthForExistingPod(
                this.context,
                this.model.getPodURL(),
                this.model.podPrivateKey ?? "",
                this.model.podPublicKey ?? "",
                this.model.podDatabaseKey ?? "",
                handleCompletion(error:) //TODO:
            )
        }
    }
    
    /*func onLocalDemoPressed() {
        model.state = .loading
        
        func handleCompletion(error: Error?) {
            if let error = error {
                model.state = .error("\(error)")
                debugHistory.error("\(error)")
            } else {
                model.state = .idle
            }
        }
        
        context.installer.installLocalAuthForLocalInstallation(
            context: context,
            callback: handleCompletion(error:)
        )
    }
    
    var newPodWarning: Alert {
        Alert(title: Text("Set up new pod"),
              message: Text("Are you sure you want to install demo data to your pod?"),
              primaryButton: .default(Text("Set up as new pod"), action: _onConnectPressed),
              secondaryButton: .cancel())
    }*/
}

//struct SetupScreen_Previews: PreviewProvider {
//    static var previews: some View {
//        SetupScreen()
//    }
//}
