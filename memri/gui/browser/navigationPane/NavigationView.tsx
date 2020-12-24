//
//  Navigation.swift
//  memri
//
//  Copyright © 2020 memri. All rights reserved.
//

import * as React from 'react';
import {Alignment, Color, Font} from "../../../../router";
import {ActionOpenSessionByName} from "../../../../router";
import {
	frame,
	ZStack,
	offset,
	VStack,
	HStack,
	padding,
	ColorArea,
	Content,
	MemriRealButton,
	MemriTextField, MemriImage, font, MemriDivider, MemriText, Spacer, ASTableView, contentInsets, MainUI, Sheet, Group
} from "../../swiftUI";
import {geom} from "../../../../geom";
import {SettingsPane} from "../../SettingsPane";
import {memri_shouldUseLargeScreenLayout} from "../../Application";

export class NavigationWrapper extends MainUI {
	widthRatio;
	isVisible;
	offset;
	content: Content;

	navWidth(geom: GeometryProxy) {
		return Math.min(300, geom.size.width * this.widthRatio)
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

	body() {
		this.widthRatio = this.props.widthRatio ?? 0.8;
		this.isVisible = this.props?.isVisible;
		this.offset = this.props.offset ?? 0;
		return (
			<div className="NavigationWrapper">
			<ZStack alignment={Alignment.leading}>
				<Content frame={frame({width: geom.size.width, height: geom.size.height, alignment: Alignment.topLeading})}
					 offset={offset({x: this.isVisible ? this.navWidth(geom) + this.cappedOffset(geom) : this.cappedOffset(geom)})}
					 disabled={this.isVisible}
					 >
				{this.props.children}
				</Content>
				<ColorArea color="clear" contentShape="Rectangle" frame={frame({minWidth:10, maxWidth:10, maxHeight:"Infinity"})}
					   />
				{(this.isVisible) &&
				<>
					<ColorArea color={"black"} position="absolute" top={0} frame={frame({width: geom.size.width, height: geom.size.height})} opacity={this.fractionVisible(geom) * 0.5} edgesIgnoringSafeArea="all"
							   onClick={() => this.navigationDragGesture} zIndex={10}/>
					<Navigation
						frame={frame({width: this.navWidth(geom)})} edgesIgnoringSafeArea="all"
						offset={offset({
							x: this.isVisible ? this.cappedOffset(geom) : (-this.navWidth(geom) + this.cappedOffset(geom)),
							y: 0
						})}
						/*simultaneousGesture={this.navigationDragGesture}*/
						/*transition={move(Alignment.leading)}*/
						zIndex={15} context={this.context}
					/>
				</>
				}
			</ZStack>
			</div>
		)
	}

	render() {
		this.content = this.props?.content
		this.context = this.props.context;
		return (
			<Group>
				{memri_shouldUseLargeScreenLayout ?
					this.bodyForLargeScreen() : this.body()
				}
			</Group>
		)
	}

	bodyForLargeScreen() {
		return (
			<HStack spacing={0}>
				<Navigation frame={frame({width: 300})} context={this.context}/>
				<Content frame={frame({width: geom.size.width, height: geom.size.height})}>
					{this.props.children}
				</Content>
			</HStack>
		)
	}

	get navigationDragGesture() {
		if (this.isVisible) {
			this.context.showNavigation = false;
			this.context.showNavigationBinding();
			return this.isVisible;
		}
	}
}

class Navigation extends MainUI {
	keyboardResponder;

	showSettings: boolean;

	constructor(props) {
		super(props);
	}

	updateHeight() {
		document.getElementById("NavigationList").style.height = geom.size.height - document.getElementById("NavigationMenuTop").clientHeight - 10 + "px"
	}

	componentDidMount() {
		this.updateHeight()
	}

	componentDidUpdate() {
		this.updateHeight()
	}

	getNavigationItems() {
		let navigationItems = this.context.navigation.getItems();
		return navigationItems.map((navItem) => {
			switch (navItem.itemType) {
				case "item":
					return <NavigationItemView item={navItem} context={this.context} hide={()=>{this.context.showNavigation = false; this.context.showNavigationBinding()}}/>
				case "heading":
					return <NavigationHeadingView title={navItem.title}/>
				case "line":
					return <NavigationLineView/>
				default:
					return <NavigationItemView item={navItem} context={this.context} hide={()=>{this.context.showNavigation = false; this.context.showNavigationBinding()}}/>
			}
		});
	}

	render() {
		this.keyboardResponder = this.props.keyboardResponder;
		this.showSettings = this.props.showSettings ?? false;
		this.context = this.props.context
		let style = this.setStyles();

		return (
			<div className="Navigation" style={style}>
				<VStack frame={frame({alignment: Alignment.leading})}
						background={new Color("MemriUI-purpleBack").toLowerCase()}>
					<HStack id={"NavigationMenuTop"} spacing={20} padding={padding({top: 40, horizontal: 20})} frame={frame({minHeight: 95-34})}
							background={new Color("MemriUI-purpleBackSecondary").toLowerCase()}>
						<MemriRealButton action={() => {
							this.context.showSettings = true;
							this.context.scheduleUIUpdate();
						}} sheet={() => {
							if (this.context.showSettings)
								return (<Sheet><SettingsPane context={this.context}/></Sheet>)
						}}>
							{<MemriImage foregroundColor={Color.hex("d9d2e9")}
										 font={font({size: 22, weight: Font.Weight.semibold})}>settings</MemriImage>}
						</MemriRealButton>
						<MemriTextField value={this.context.navigation.filterText} placeholder="Search"
										textColor="#8a66bc" tintColor="white" clearButtonMode="always"
										showPrevNextButtons="false" layoutPriority="-1" padding={padding(5)}
										accentColor="white" background={new Color("black").opacity(0.4)}
										cornerRadius={5}
										onChange={(e) => this.context.navigation.filterText = e.target.value}
						/>
						{/*<MemriRealButton>
					{<MemriImage font={font({size: 22, weight: Font.Weight.semibold})} foregroundColor="#d9d2e9">create</MemriImage>}
				</MemriRealButton>
				<MemriRealButton>
					{<MemriImage foregroundColor="#d9d2e9" font={font({size: 22, weight: Font.Weight.semibold})}>add</MemriImage>}
				</MemriRealButton>*/}
					</HStack>
					<ASTableView overflowY={"auto"} id={"NavigationList"} separatorsEnabled={false}
								 contentInsets={padding({top: 10, left: 0, bottom: 0, right: 0})} frame={frame({height: geom.size.height})} context={this.context}>
						{this.getNavigationItems()}
					</ASTableView>

				</VStack></div>
		)
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
					new ActionOpenSessionByName(this.context).exec({"sessionName": sessionName})
				} catch {
				}

				this.hide()
			}
		}
		return(
			<MemriRealButton onClick={action}>
				<MemriText font={font({size: 18, weight: Font.Weight.regular})} padding={padding({vertical: 10, horizontal: 35})} foregroundColor={new Color("white").opacity(0.7)} frame={frame({maxWidth: "infinity", alignment: Alignment.leading})} >
					{this.item.title?.firstUppercased ?? ""}
				</MemriText>
			</MemriRealButton>

		)// buttonStyle={NavigationButtonStyle()} contentShape={Rectangle()}
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
			<HStack>
				<MemriText font={font({size: 18, weight: Font.Weight.bold})}
						   padding={padding({vertical: 8, horizontal: 20})} foregroundColor="#8c73af">
					{(this.title ?? "").toUpperCase()}
				</MemriText>
				<Spacer/>
			</HStack>
		)
	}
}

class NavigationLineView extends MainUI {
	render() {
		return (
				<VStack padding={padding({horizontal: 50})}>
					<MemriDivider background="black"/>
				</VStack>
		)
	}
}
