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
	MemriTextField, MemriImage, font
} from "../swiftUI";
import {Button, Icon, TextField} from "@material-ui/core";


interface NavigationWrapperProps { isVisible?: boolean; widthRatio?: number; content?;offset?}

export class NavigationWrapper extends React.Component<NavigationWrapperProps, {}> {
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
		let geom = /*this.props.geom;*/
			{
				size: {
					width: 200,
					height: 200
				}//TODO: for testing
			}
		return (
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

class Navigation extends React.Component<NavigationProps, {}> {
	context: MemriContext

	keyboardResponder;

	showSettings: boolean;

	constructor(props) {
		super(props);
	}

	render() {
		this.keyboardResponder = this.props.keyboardResponder;
		this.showSettings = this.props.showSettings ?? false;
		this.context = this.props.context
		return (
		<VStack frame={frame({maxWidth: "Infinity", alignment: Alignment.leading})} background = "#543184">
			<HStack spacing={20} padding={padding({top: 40, horizontal: 20})} frame={frame({minHeight: 95})} background="#492f6c">
				<MemriButton action={function () {
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
			{/*<ASTableView separatorsEnabled={false} contentInsets={UIEdgeInsets({top: 10, left: 0, bottom: 0, right: 0})}>
				<ASSection id={0} data={this.context.navigation.getItems()} dataID={} >

				</ASSection>
			</ASTableView>*/}

		</VStack>
			) //TODO: logic in ASSection
	}


//
	// TODO: -   This functionality (below) has been temporaily moved to TableView and it should remain here
	//          so this is a refactoring task

//
	//    public func hide(){
	//        withAnimation {
	//            self.context.showNavigation = false
	//        }
	//    }

	//    func item(_ navigationItem: NavigationItem) -> AnyView{
	//        switch navigationItem.type{
	//        case "item":
	//            return AnyView(NavigationItemView(item: navigationItem, hide: hide))
	//        case "heading":
	//            return AnyView(NavigationHeadingView(title: navigationItem.title))
	//        case "line":
	//            return AnyView(NavigationLineView())
	//        default:
	//            return AnyView(NavigationItemView(item: navigationItem, hide: hide))
	//        }
	//    }
}

class NavigationItemView extends React.Component {
	context: MemriContext

	item: NavigationItem
	hide

	constructor(props) {
		super(props);
		this.context = props.context;
		this.item = props.item;
		this.hide = props.hide;
	}

	render() {
		let action = function () {
			let sessionName = this.item.sessionName;
			if (sessionName) {
				// TODO:
				try {
					new ActionOpenSessionByName(this.context).exec({"name": sessionName})
				} catch {
				}

				this.hide()
			}
		}.bind(this)
		return(
			<MemriButton buttonStyle={NavigationButtonStyle()} action={action()}>
				<Text font={Font.system({size: 18, weight: Font.Weight.regular})} padding={padding({vertical: 10, horizontal: 35})} foregroundColor="#d9d2e9" frame={frame({maxWidth: infinity, alignment: Alignment.leading})} contentShape={Rectangle()}>
					{this.item.title?.firstUppercased ?? ""}
				</Text>
			</MemriButton>
		)
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

class NavigationHeadingView extends React.Component {
	title: string
	constructor(props) {
		super(props);
		this.title = props.title;
	}
	render() {
		return (
			<HStack>
				<Text font={Font.system({size: 18, weight: Font.Weight.bold})} padding={padding({vertical: 8, horizontal: 20})} foregroundColor="#8c73af">
					{(this.title ?? "").toUpperCase()}
				</Text>
				<Spacer/>
			</HStack>
		)
	}
}

class NavigationLineView extends React.Component {
	render() {
		return (
			<VStack padding={padding({horizontal: 50})}>
				<Divider background="black"/>
			</VStack>
		)
	}
}
/*struct Navigation_Previews: PreviewProvider {
	static var previews: some View {
		Navigation().environmentObject(try! RootContext(name: "", key: "").mockBoot())
	}
}*/
