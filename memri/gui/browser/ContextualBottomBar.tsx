//
//  ContextualBottomBar.swift
//  Copyright © 2020 memri. All rights reserved.


import * as React from 'react';
import {Item} from "../../../router";
import {HStack, MainUI, MemriRealButton, MemriDivider, MemriImage, padding, Spacer, VStack} from "../swiftUI";
import {ActionDelete} from "../../../router";
import {Color} from "../../../router";

export class ContextualBottomBar extends MainUI {
	context: MemriContext
	
	shouldShow() {
		//return true
		return this.context.currentSession?.editMode ?? false
	}
	
	nonEmptySelection() {
		//return true
		return !(this.context.currentView?.userState.get("selection", Item)?.length == 0 ?? true)
	}
	
    render() {
		this.context = this.props.context;

		if (this.shouldShow()) {
			return (
				<VStack spacing={0} background={new Color("secondarySystemBackground").toLowerCase()}>
					<MemriDivider/>
					<HStack padding={padding({horizontal: 5, vertical: 5})}>
						<Spacer/>
						{this.context.currentSession?.editMode ||
							<MemriRealButton onClick={() => {this.context.executeAction(new ActionDelete(this.context))}}
                                             disabled={!this.nonEmptySelection()}
							>
								<MemriImage
									/*fixedSize*/
									padding={padding({horizontal: 5, vertical: 5})}
									foregroundColor={this.nonEmptySelection() ? "red" : "secondary"}
									/*font={"body"}*/
								>delete</MemriImage>

							</MemriRealButton>
						}
					</HStack>
				</VStack>
			)
		} else {
			return(<></>)
		}
    }
}

/*struct ContextualBottomBar_Previews: PreviewProvider {
    static var previews: some View {
        ContextualBottomBar()
    }
}*/
