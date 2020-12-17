//
// SetupWizard.swift
// Copyright © 2020 memri. All rights reserved.

import {
    ColorArea,
    font, Form,
    frame, getBinding,
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

    //TODO start @anijanyan
    setupScreen: SetupScreen
    properties = {state: PodSetupState.idle, setupAsNewPod: true}

    getProperty(propertyName){return this.properties[propertyName]}
    setProperty(propertyName, value) {
        this.properties[propertyName] = value
        this.updateSetupScreenState()
    }

    get podURL(): string {return this.properties["podURL"]}
    set podURL(value) {this.setProperty("podURL", value)}

    get podPrivateKey(): string {return this.properties["podPrivateKey"]}
    set podPrivateKey(value) {this.setProperty("podPrivateKey", value)}

    get podPublicKey(): string {return this.properties["podPublicKey"]}
    set podPublicKey(value) {this.setProperty("podPublicKey", value)}

    get podDatabaseKey(): string {return this.properties["podDatabaseKey"]}
    set podDatabaseKey(value) {this.setProperty("podDatabaseKey", value)}

    get setupAsNewPod(): boolean {return this.properties["setupAsNewPod"]}
    set setupAsNewPod(value) {this.setProperty("setupAsNewPod", value)}

    get state(): PodSetupState {return this.properties["state"]}
    set state(value) {this.setProperty("state", value)}

    updateSetupScreenState() {
        this.setupScreen.setState({model: this})
    }

    constructor(setupScreen) {
        this.setupScreen = setupScreen
    }
    //TODO end @anijanyan

    errorString //TODO @anijanyan
    
    getPodURL():string {
        return this.podURL ?? this.defaultPodURL
    }

    get isValidToProceedToConnect(): boolean {
        if (this.setupAsNewPod) {
            return true
        }


        if (!this.podPrivateKey || !this.podPublicKey || !this.podDatabaseKey) {
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


export class SetupScreen extends MainUI {
    // _model = new SetupScreen_Model(this);

    get model() {
        return this.state["model"]
    }

    get showingNewPodWarning(): boolean {
        return this.state["showingNewPodWarning"]
    }
    set showingNewPodWarning(value: boolean) {
        if (this.state["showingNewPodWarning"] != value) {
            this.setState({showingNewPodWarning: value})
        }
    }

    constructor(props) {
        super(props);
        this.state = {
            showingNewPodWarning: false,
            model: new SetupScreen_Model(this)
        }
        this.onConnectPressed = this.onConnectPressed.bind(this)
        this._onConnectPressed = this._onConnectPressed.bind(this)
        this.onLocalDemoPressed = this.onLocalDemoPressed.bind(this)
    }

    render() {
        this.context = this.props.context
        return (
            <ZStack>
                <NavigationView context={this.context} colorScheme={"dark"} navigationViewStyle={"StackNavigationViewStyle"}>
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
                            <NavigationLink context={this.context} destination={() => this.podSetup} buttonStyle={"PlainButtonStyle"}>
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
                        {/*<ActivityIndicatorView style={"large"} color={"white"}/>*/}
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
                        <MemriTextField value={getBinding(this.model, "podURL")} placeholder={this.model.defaultPodURL}/>
                    </VStack>
                </Section>
                <Section header={<MemriText>Pod setup</MemriText>} footer={this.model.setupAsNewPod && this.connectButton}>{/*TODO @anijanyan*/}
                    <Toggle isOn={getBinding(this.model, "setupAsNewPod")}>
                        Set up as new pod?
                    </Toggle>
                    <MemriText font={font({family: "caption"})}>
                        If enabled this will create new authentication keys and install the demo data.
                    </MemriText>
                </Section>
                {!this.model.setupAsNewPod &&
                    <Section header={<MemriText>Authentication</MemriText>} footer={!this.model.setupAsNewPod && this.connectButton}>{/*TODO @anijanyan*/}
                        <VStack alignment={Alignment.leading} spacing={2}>
                            <MemriText font={this.captionFont}>
                                Public Key
                            </MemriText>
                            <MemriTextField value={getBinding(this.model, "podPublicKey")} placeholder={"publickey"}/>
                            <MemriText font={this.captionFont}>
                                Private Key
                            </MemriText>
                            <MemriTextField value={getBinding(this.model, "podPrivateKey")} placeholder={"privatekey"}/>
                            <MemriText font={this.captionFont}>
                                Database Key
                            </MemriText>
                            <MemriTextField value={getBinding(this.model, "podDatabaseKey")} placeholder={"databasekey"}/>
                        </VStack>
                    </Section>
                }
            </Form>
        )
    }

    get connectButton() {
        return (
            <VStack spacing={10} padding={padding({top: "default"})}>
                {this.model.state == PodSetupState.error &&
                <MemriText multilineTextAlignment={Alignment.center} lineLimit={3} foregroundColor={Color.named("red")}>
                    {`Error connecting to pod: ${this.model.errorString}`}
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

        let handleCompletion = (error: Error) => {
            if (error) {
                this.model.errorString = error//TODO @anijanyan
                this.model.state = PodSetupState.error;

                debugHistory.error(error)
            } else {
                this.model.state = PodSetupState.idle

            }
        }
        
        if (this.model.setupAsNewPod) {
            this.context.installer.installLocalAuthForNewPod(
                this.context,
                this.model.getPodURL(),
                handleCompletion
            )
        } else {
            this.context.installer.installLocalAuthForExistingPod(
                this.context,
                this.model.getPodURL(),
                this.model.podPrivateKey ?? "",
                this.model.podPublicKey ?? "",
                this.model.podDatabaseKey ?? "",
                handleCompletion
            )
        }
    }
    
    onLocalDemoPressed() {
        this.model.state = PodSetupState.loading

        let handleCompletion = (error) => {
            if (error) {
                this.model.errorString = error//TODO @anijanyan
                this.model.state = PodSetupState.error

                debugHistory.error(error)
            } else {
                this.model.state = PodSetupState.idle
            }
        }

        this.context.installer.installLocalAuthForLocalInstallation(
            this.context,
            handleCompletion
        )
    }

    get newPodWarning() {
        return <MemriAlert
            isPresented={getBinding(this, "showingNewPodWarning")}
            title={<MemriText>Set up new pod</MemriText>}
            message={
                <MemriText>
                    Are you sure you want to install demo data to your pod?
                </MemriText>
            }
            primaryButton={{text: <MemriText>Set up as new pod</MemriText>, action: this._onConnectPressed, type: "default"}}
            secondaryButton={{type: "cancel"}}
        />
    }
}

//struct SetupScreen_Previews: PreviewProvider {
//    static var previews: some View {
//        SetupScreen()
//    }
//}
