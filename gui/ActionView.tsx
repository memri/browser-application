//
//  Action.swift
//  memri
//
//  Created by Koen van der Veen on 30/03/2020.
//  Copyright © 2020 memri. All rights reserved.
//


import {MainUI, MemriButton, MemriImage, MemriText, padding, VStack} from "./swiftUI";
import * as React from "react";
import {Action, ActionFamily, ActionNoop, RenderType} from "../cvu/views/Action";
import {MemriContext} from "../context/MemriContext";
import {ViewArguments} from "../cvu/views/CascadableDict";
import {SubView} from "./common/SubView";

export class ActionButton extends MainUI {
	context: MemriContext

	action?: Action
    item?: Item

	render() {
		/*
		 <style={this.setStyles()} {...other}>
					{this.props.children}
				</getAction>
		 */
		let {item, action, context, font, padding, foregroundColor, spacing, frame, zIndex, centeredOverlayWithinBoundsPreferenceKey, ...other} = this.props;
		this.context = context;
		this.item = item;
		this.action = action;
		return (
			<VStack>
				{this.getAction()}
			</VStack>
		)
	}

	/*var body: some View {
		VStack {
			if action != nil {
				getAction()
			} else {
				EmptyView()
			}
		}
	}*/

	getAction() {
		let action = this.action ?? new ActionNoop(this.context);

		// NOTE: Allowed force unwrappings (logic)
		switch (action.getRenderAs(this.context.currentView?.viewArguments)) {
			case RenderType.popup:
				return <ActionPopupButton action={action} item={this.item}/>
			case RenderType.button:
				return <ActionButtonView action={action} context={this.context}/>
			/* {
				self.context.executeAction(action)
            })*/
			default:
				return <ActionButtonView action={action}/>
		}
	}
}

/*struct ActionView_Previews: PreviewProvider {
	static var previews: some View {
		let context = try! RootContext(name: "", key: "").mockBoot()
		return ActionButton(action: ActionBack(context))
			.environmentObject(context)
	}
}*/

class ActionButtonView extends MainUI {
	context: MemriContext

	action: Action
	execute

	render() {//{this.props.children}
		this.action = this.props.action;
		this.context = this.props.context;
		let icon = this.action.getString("icon");
		let title = this.action.get("title");
		return (
			<MemriButton onClick={this.action.exec ? this.action.exec.bind(this) : undefined}>
				{(icon || title == undefined) &&
				<MemriImage fixedSize padding={padding({
					horizontal: 5,
					vertical: 5
				})} foregroundColor={this.action.color}
							background={this.action.backgroundColor}>
					{icon == "" ? "warning"/*exclamationmark.triangle*/ : icon}
				</MemriImage>
				}
				{title != undefined && (icon == "" || this.action.getBool("showTitle")) &&
				<MemriText foregroundColor="black">
					{title ?? ""}
				</MemriText>
				}
			</MemriButton>

		);//font(.subheadline)
	}
}

class ActionPopupButton extends MainUI {
	context: MemriContext

	action: Action
	item?: Item

	isShowing = false

	render() {
		this.context = this.props.context;
		this.action = this.props.action;
		this.item = this.props.item;
		return (
			<ActionButtonView onClick={this.action} execute={this.isShowing = true} sheet={
				<ActionPopup isPresented={this.$isShowing} action={this.action} item={this.item} context={this.context}>
				</ActionPopup>
			}/>
		)
	}
}

class ActionPopup extends MainUI {
	context: MemriContext
	presentationMode

	action: Action
	item?: Item

	render() {
		this.context = this.props.context;
		this.action = this.props.action;
		this.item = this.props.item;

		this.context.addToStack(this.presentationMode);
		let args = this.action.getArguments(this.item)
		let viewArgs = new ViewArguments(args["viewArguments"]);
		viewArgs.set("showCloseButton", true);
		if (this.action.name == ActionFamily.openView) {
			let view = args["view"];
			if (view?.constructor?.name == "CVUStateDefinition") {
				return (
					<SubView context={this.context} view={view} item={this.item} viewArguments={viewArgs}>
						{this.props.children}
					</SubView>
				)
			} else {
				// TODO: ERror logging
			}
		} else if (this.action.name == ActionFamily.openViewByName) {
			let viewName = args["viewName"]
			if (viewName && typeof viewName == "string") {
				return (
					<SubView context={this.context} viewName={viewName} item={this.item} viewArguments={viewArgs}>
						{this.props.children}
					</SubView>
				)
			} else {
				// TODO: Error logging
			}
		} else {
			return (
				<SubView context={this.context} viewName="catch-all-view" item={this.item} viewArguments={viewArgs}>
					{this.props.children}
				</SubView>
			)
		}
	}
}


