//
//  RecoveryWizard.swift
//  memri
//
//  Created by T Brennan on 5/12/20.
//  Copyright © 2020 memri. All rights reserved.
//

import * as React from "react";
import {font, MainUI, MemriRealButton, MemriText, Section} from "../gui/swiftUI";
import {debugHistory} from "../cvu/views/ViewDebugger";
import {Font} from "../gui/cvuComponents/valueTypes/CVUFont";

export class RecoveryWizard extends MainUI {
    render(){
        return (
            <div className={"RecoveryWizard"}>
                <MemriText font={font({size: 22, weight: Font.Weight.bold, family: "system"})}>
                    Recovery Wizard
                </MemriText>
                <Section header={<MemriText>
                            Memri crashed last time. What would you like to do?
                        </MemriText>}
                >
                    <MemriRealButton action={
                        () => this.context.installer.continueAsNormal(this.context)
                    }>
                        <MemriText>Continue as normal</MemriText>
                    </MemriRealButton>
                    <MemriRealButton action={
                        () => this.context.installer.clearDatabase(this.context, (error) => {
                            debugHistory.error(`${error ?? ""}`) // TODO: show this to the user
                        })
                    }>
                        <MemriText>Delete the local database and start over</MemriText>
                    </MemriRealButton>
                    <MemriRealButton action={
                        () => this.context.installer.clearSessions(this.context, (error) => {
                            debugHistory.error(`${error ?? ""}`) // TODO: show this to the user
                        })
                    }>
                        <MemriText>Clear the session history (to recover from an issue)</MemriText>
                    </MemriRealButton>

                </Section>
            </div>
        )
    }
}
//
//struct RecoveryWizard_Previews: PreviewProvider {
//    static var previews: some View {
//        RecoveryWizard()
//    }
//}
