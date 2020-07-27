//
//  Navigation.swift
//  memri
//
//  Copyright © 2020 memri. All rights reserved.
//

import * as React from 'react';
import {Alignment, Color, Font} from "../../parsers/cvu-parser/CVUParser";
import {ActionOpenSessionByName} from "../../cvu/views/Action";
import {
	frame,
	ZStack,
	offset,
	VStack,
	HStack,
	padding,
	ColorArea,
	Content,
	MemriButton,
	MemriTextField, MemriImage, font, MemriDivider, MemriText, Spacer, ASTableView, contentInsets, MainUI
} from "../swiftUI";
import {geom} from "../../demo-react";
import {List, ListItem} from "@material-ui/core";


interface NavigationWrapperProps { isVisible?: boolean; widthRatio?: number; content?;offset?}

export class NavigationWrapper extends MainUI {
	widthRatio;
	isVisible;
	offset;
	content: Content;

	/*
	/*@GestureState(reset: { _, transaction in
		transaction.animation = .default
    }) */

	navWidth(geom: GeometryProxy) {
		return geom.size.width * this.widthRatio
	}

	cappedOffset(geom: GeometryProxy) {
		if (this.isVisible) {
			return Math.max(Math.min(0, this.offset), -this.navWidth(geom))
		} else {
			return Math.min(Math.max(0, this.offset), this.navWidth(geom))
		}
	}

	fractionVisible(geom: GeometryProxy) {
		let fraction = Math.abs(this.cappedOffset(geom)) / this.navWidth(geom)
		return this.isVisible ? 1 - fraction : fraction
	}

	render() {//Color.clear ??
		this.widthRatio = this.props.widthRatio ?? 0.8;
		this.isVisible = this.props?.isVisible;
		this.offset = this.props.offset ?? 0;
		this.content = this.props?.content
		this.context = this.props.context;
		return (
			<div className="NavigationWrapper">
			<ZStack alignment={Alignment.leading}>
				<Content frame={frame({width: geom.size.width, height: geom.size.height, alignment: Alignment.topLeading})}
					 offset={offset({x: this.isVisible ? this.navWidth(geom) + this.cappedOffset(geom) : this.cappedOffset(geom)})}
					 disabled={this.isVisible}
					 zIndex={-1}>
				{this.props.children}
				</Content>
				<ColorArea value="clear" contentShape="Rectangle" frame={frame({minWidth:10, maxWidth:10, maxHeight:"Infinity"})}
					   /*simultaneousGesture={this.navigationDragGesture}*//>
				{(this.isVisible || this.offset > 0) &&
				<ColorArea opacity={this.fractionVisible(geom) * 0.5} edgesIgnoringSafeArea="all"
					   /*simultaneousGesture={this.navigationDragGesture}*/ zIndex={10}/> &&
				<Navigation
					frame={frame({width: geom.size.width * this.widthRatio})} edgesIgnoringSafeArea="all"
					offset={offset({x:this.isVisible ? this.cappedOffset(geom) : (-this.navWidth(geom) + this.cappedOffset(geom)),y: 0})}
					/*simultaneousGesture={this.navigationDragGesture}*/
					/*transition={move(Alignment.leading)}*/
					zIndex={15} context={this.context}
				/>
				}
			</ZStack>
			</div>
		)
	}

	/*var body: some View {
        Group {
            if memri_shouldUseLargeScreenLayout {
                GeometryReader { geom in
                    self.bodyForLargeScreen(withGeom: geom)
                }
            } else {
                GeometryReader { geom in
                    self.body(withGeom: geom)
                }
            }
        }
    }*/

	/*func bodyForLargeScreen(withGeom _: GeometryProxy) -> some View {
		HStack(spacing: 0) {
			Navigation()
				.frame(width: 300)
				.edgesIgnoringSafeArea(.all)
			content
		}
	}*/

	/*get navigationDragGesture() {
		return (
			<DragGesture updating={updating($offset, function (value, offset) {
				offset = value.translation.width
			})}
						 onEnded={function (value) {
							 if (this.isVisible && value.predictedEndTranslation.width < -140 || !this.isVisible && value.translation.width > 50 && Math.abs(value.predictedEndTranslation.width) > 20) {
								 //withAnimation {
								 this.isVisible = !this.visible;
								 // }
							 }
						 }}
			>
			</DragGesture>
		)
	}*/
}
interface NavigationProps { context?; keyboardResponder?; showSettings?; frame?; edgesIgnoringSafeArea?; offset?; simultaneousGesture?; transition?; zIndex?}

class Navigation extends MainUI {
	context: MemriContext

	keyboardResponder;

	showSettings: boolean;

	constructor(props) {
		super(props);
	}

	getNavigationItems() {
		let navigationItems = this.context.navigation.getItems();
		return navigationItems.map((navItem) => {
			switch (navItem.type) {
				case "item":
					return <NavigationItemView item={navItem} context={this.context} hide={()=>this.context.showNavigationBinding()}/>/*(navItem, hide: {
					withAnimation {
						self.context.showNavigation = false
					}
				})*/
				case "heading":
					return <NavigationHeadingView title={navItem.title}/>//(title: navItem.title)
				case "line":
					return <NavigationLineView/>
				default:
					return <NavigationItemView item={navItem} context={this.context} hide={()=>this.context.showNavigationBinding()}/>/*(item: navItem, hide: {
					withAnimation {
						self.context.showNavigation = false
					}
				})*/
			}
			/*return <ListItem button>
				{item.type}
			</ListItem>*/
		});
	}

	render() {
		this.keyboardResponder = this.props.keyboardResponder;
		this.showSettings = this.props.showSettings ?? false;
		this.context = this.props.context //{/*separatorsEnabled={false} contentInsets={UIEdgeInsets({top: 10, left: 0, bottom: 0, right: 0})}*/}

		return (
		<VStack frame={frame({alignment: Alignment.leading})} background = "#543184">
			<HStack spacing={20} padding={padding({top: 40, horizontal: 20})} frame={frame({minHeight: 95})} background="#492f6c">
				<MemriButton onClick={function () {
					this.showSettings = true
				}.bind(this)} /*sheet={sheet(this.$showSettings, function () {
					SettingsPane().environmentObject(this.context)
				}.bind(this))}*/>
					{<MemriImage foregroundColor="#d9d2e9" font={font({size: 22, weight: Font.Weight.semibold})}>settings</MemriImage>}
				</MemriButton>
				<MemriTextField value={this.context.navigation.filterText} placeholder="Search"
								textColor="#8a66bc" tintColor="white" clearButtonMode="always"
								showPrevNextButtons="false" layoutPriority="-1" padding={padding(5)}
								accentColor="white" background="#341e51" cornerRadius={5}/>
				<MemriButton>
					{<MemriImage font={font({size: 22, weight: Font.Weight.semibold})} foregroundColor="#d9d2e9">create</MemriImage>}
				</MemriButton>
				<MemriButton>
					{<MemriImage foregroundColor="#d9d2e9" font={font({size: 22, weight: Font.Weight.semibold})}>add</MemriImage>}
				</MemriButton>
			</HStack>
			<ASTableView separatorsEnabled={false} contentInsets={contentInsets({top: 10, left: 0, bottom: 0, right: 0})}>
				{this.getNavigationItems()}
			</ASTableView>

		</VStack>
			) //TODO: logic in ASSection
	}

}

class NavigationItemView extends MainUI {
	context: MemriContext

	item: NavigationItem
	hide

	constructor(props) {
		super(props);
	}

	render() {
		this.context = this.props.context;
		this.item = this.props.item;
		this.hide = this.props.hide;
		let action = () => {

			let sessionName = this.item.sessionName;
			if (sessionName) {
				// TODO:
				try {
					new ActionOpenSessionByName(this.context).exec({"name": sessionName})
				} catch {
				}

				this.hide()
				console.log(this.context)
			}
		}
		return(<ListItem>
			<MemriButton onClick={action}>
				<MemriText font={font({size: 18, weight: Font.Weight.regular})} padding={padding({vertical: 10, horizontal: 35})} foregroundColor="#d9d2e9" frame={frame({maxWidth: "infinity", alignment: Alignment.leading})} >
					{this.item.title ?? ""}
				</MemriText>
			</MemriButton>
			</ListItem>
		)//?.firstUppercased buttonStyle={NavigationButtonStyle()} contentShape={Rectangle()}
	}
}

/*struct NavigationButtonStyle: ButtonStyle {
	func makeBody(configuration: Configuration) -> some View {
		configuration.label
			.background(
				configuration.isPressed ? Color.white.opacity(0.15) : .clear
			)
	}
}*/

class NavigationHeadingView extends MainUI {
	title: string
	constructor(props) {
		super(props);
		this.title = props.title;
	}
	render() {
		return (
			<ListItem>
				<HStack>
					<MemriText font={font({size: 18, weight: Font.Weight.bold})}
							   padding={padding({vertical: 8, horizontal: 20})} foregroundColor="#8c73af">
						{(this.title ?? "").toUpperCase()}
					</MemriText>
					<Spacer/>
				</HStack>
			</ListItem>
		)
	}
}

class NavigationLineView extends MainUI {
	render() {
		return (
			<ListItem>
				<VStack padding={padding({horizontal: 50})}>
					<MemriDivider background="black"/>
				</VStack>
			</ListItem>
		)
	}
}
/*struct Navigation_Previews: PreviewProvider {
	static var previews: some View {
		Navigation().environmentObject(try! RootContext(name: "", key: "").mockBoot())
	}
}*/
