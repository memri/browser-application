//
//  Action.swift
//  memri
//
//  Created by Koen van der Veen on 30/03/2020.
//  Copyright © 2020 memri. All rights reserved.
//


import {MainUI, MemriButton, MemriImage, MemriText, padding, VStack} from "./swiftUI";
import {Button} from "@material-ui/core";
import * as React from "react";
import {Action, ActionNoop, RenderType} from "../cvu/views/Action";
import {MemriContext} from "../context/MemriContext";

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

	/*var body: some View {
		let icon = action.getString("icon")
		let title: String? = action.get("title")

		return Button(action: {
			withAnimation {
				self.execute?()
			}
        }) {
			if icon != "" || title == nil {
                Image(systemName: icon == "" ? "exclamationmark.triangle" : icon)
					.fixedSize()
					.padding(.horizontal, 5)
					.padding(.vertical, 5)
					.foregroundColor(action.color)
					.background(action.backgroundColor)
				//                    .border(Color.red, width: 1)
			}

			if title != nil && (icon == "" || action.getBool("showTitle")) {
				// NOTE: Allowed force unwrapping (logic)
				Text(title ?? "")
					.font(.subheadline)
					.foregroundColor(.black)
			}
		}
	}*/
}

/*struct ActionPopupButton: View {
	@EnvironmentObject var context: MemriContext

	var action: Action
    var item: Item? = nil

	@State var isShowing = false

	var body: some View {
		ActionButtonView(action: self.action, execute: {
			self.isShowing = true
        })
        .sheet(isPresented: $isShowing) {
            ActionPopup(action: self.action, item: self.item).environmentObject(self.context)
        }
	}
}

struct ActionPopup: View {
	@EnvironmentObject var context: MemriContext
	@Environment(\.presentationMode) var presentationMode: Binding<PresentationMode>

	var action: Action
    var item: Item? = nil

	var body: some View {
		// TODO: refactor: this list item needs to be removed when we close the popup in any way
        self.context.addToStack(self.presentationMode)

        let args = action.arguments["viewArguments"] as? ViewArguments ?? ViewArguments(nil)
		args.set("showCloseButton", true)

		// TODO: scroll selected into view? https://stackoverflow.com/questions/57121782/scroll-swiftui-list-to-new-selection
		if action.name == .openView {
			if let view = action.arguments["view"] as? CVUStateDefinition {
				return SubView(
					context: self.context,
					view: view, // TODO: refactor: consider adding .closePopup to all press actions
					item: item,
					viewArguments: args
				)
			} else {
				// TODO: ERror logging
			}
		} else if action.name == .openViewByName {
			if let viewName = action.arguments["name"] as? String {
				return SubView(
					context: self.context,
					viewName: viewName,
					item: item,
					viewArguments: args
				)
			} else {
				// TODO: Error logging
			}
		}

		// We should never get here. This is just to ease the compiler
		return SubView(
			context: self.context,
			viewName: "catch-all-view",
			item: item,
			viewArguments: args
		)
	}
}*/
