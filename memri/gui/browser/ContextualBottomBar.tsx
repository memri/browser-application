//
//  ContextualBottomBar.swift
//  Copyright © 2020 memri. All rights reserved.


import * as React from 'react';
import {ActionDeselectAll, ActionSelectAll, Item} from "../../../router";
import {
	HStack,
	MainUI,
	MemriRealButton,
	MemriDivider,
	MemriImage,
	padding,
	Spacer,
	VStack,
	MemriText
} from "../swiftUI";
import {ActionDelete} from "../../../router";
import {Color} from "../../../router";

export class ContextualBottomBar extends MainUI {
	context: MemriContext
	
	shouldShow() {
		//return true
		return (this.context.currentView?.renderConfig?.showContextualBarInEditMode ?? true) && this.context.editMode
	}
	
	nonEmptySelection() {
		//return true
		return !(this.context.currentView?.userState.get("selection", Item)?.length == 0 ?? true)
	}
	
    render() {
		this.context = this.props.context;

		if (this.shouldShow()) {
			return (
				<div className={"ContextualBottomBar"}>
				<VStack spacing={0} background={new Color("secondarySystemBackground").toLowerCase()}>
					<MemriDivider/>
					<HStack padding={padding({horizontal: 5, vertical: 5})}>
						{this.context.editMode &&
						this.context.allItemsSelected ?
							<MemriRealButton onClick={() => {
								this.context.executeAction(new ActionDeselectAll(this.context))
							}
							}>
								<MemriText padding={5}>{"Deselect All"}</MemriText>
							</MemriRealButton>
							:
							<MemriRealButton onClick={() => {
								this.context.executeAction(new ActionSelectAll(this.context))
							}
							}>
								<MemriText padding={5}>{"Select All"}</MemriText>
							</MemriRealButton>

						}
						<Spacer/>
						{this.context.editMode &&
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
				</div>
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
