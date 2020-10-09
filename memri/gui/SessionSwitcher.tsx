//
// SessionSwitcher.swift
// Copyright © 2020 memri. All rights reserved.

import * as React from 'react';
import {font, frame, HStack, MainUI, offset, padding, ZStack} from "./swiftUI";
import {Alignment} from "../cvu/parsers/cvu-parser/CVUParser";
import {ActionButton} from "./ActionView";
import {ActionShowSessionSwitcher} from "../cvu/views/Action";

export class SessionSwitcher extends MainUI {
    items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

    _globalOffset = 0;
    dragOffset = 0

    get count() {
        return Math.min(10, this.context.sessions.count);
    }

    get countIndexOffset() {
        return this.context.sessions.count - this.count;
    }

    get globalOffset() {
        return Math.min(this.count * this.height / 2, Math.max(0, this._globalOffset + this.dragOffset))
    }

    height = 738

    currentImage = 1
    lastpos = 0

    bounds = [0.0, 0.17, 0.2, 0.23, 0.245, 0.266, 0.5, 1.0]

    getOffsetX(i, geometry) {
        return (geometry.size.width - this.getWidth(i)) / 2
    }

    getWidth() {
        return 360
    }

    getAnchorZ(i, geometry) {
        let speeds = [0, -2000, -4000, 0, 1000, 0, 0] // [0, -1000, -2000, 1000, 0, 0, 0]

        let position = this.getRelativePosition(i, geometry)
        var anchorZ = 300
        for (let i = 0; i < this.bounds.length - 1; i++) {
            let lower = this.bounds[i]
            if (position > lower) {
                let upper = this.bounds[i + 1]
                let d_in_seg = Math.min(upper, position) - lower
                anchorZ += d_in_seg * speeds[i]
            }
        }
        return anchorZ
    }

    getPerspective(i, geometry) {
        let speeds = [-2, 0, 0, 0, 0, 0, 0] // [-2, -20, 20, 0, 0, 0, 0]

        let position = this.getRelativePosition(i, geometry)
        var perspective = 1
        for (let i = 0; i < this.bounds.length - 1; i++) {
            let lower = this.bounds[i]
            if (position > lower) {
                let upper = this.bounds[i + 1]
                let d_in_seg = Math.min(upper, position) - lower
                perspective += d_in_seg * speeds[i]
            }
        }
        return perspective
    }

    getOffsetY(i, geometry) {
        let speeds = [0.5, 3, 6, 10, 30, 10, 0] // [0.5, 10, 40, 100, 40, 0, 0]

        let position = this.getRelativePosition(i, geometry)
        var distance = 0.0
        for (let i = 0; i < this.bounds.length - 1; i++) {
            let lower = this.bounds[i]
            if (position > lower) {
                let upper = this.bounds[i + 1]
                let d_in_seg = Math.min(upper, position) - lower
                distance += d_in_seg * this.height * speeds[i]
            }
        }
        return distance - 120
    }

    getRotation(i, geometry) {
        //        let speeds: [Double] = [0,100,-100,-100,0,0,0] //[0.0, 500, -1000, -500, 0, 500, 0]
        let speeds = [0, 100, -100, 0, -200, 0, 0] // [0.0, 500, -1000, -500, 0, 500, 0]
        //        let speeds: [Double] = [0,0,-200,200,200,0,0] //[0.0, 500, -1000, -500, 0, 500, 0]

        let position = this.getRelativePosition(i, geometry)
        var rotation = 0.0
        for (let i = 0; i < this.bounds.length - 1; i++) {
            let lower = this.bounds[i]
            if (position > lower) {
                let upper = this.bounds[i + 1]
                let d_in_seg = Math.min(upper, position) - lower
                rotation += Number(d_in_seg) * speeds[i]
            }
        }
        return rotation
    }

    getRelativePosition(i, geometry) {//TODO _: GeometryProxy???
        let normalizedPosition = i / this.count;
        let maxGlobalOffset = this.count * this.height
        let normalizedGlobalState = Math.min(1, Math.max(0, this.globalOffset / maxGlobalOffset))
        let translatedRelativePosition = normalizedGlobalState + (normalizedPosition / 2)
        return translatedRelativePosition / 2.0
    }

    hide() {
        this.context.showSessionSwitcher = false
    }

    render() {
        this.context = this.props.context;
        return (
            <ZStack alignment={""/*alignment({horizontal: Alignment.trailing, vertical: Alignment.top})*/}>
                <HStack alignment={Alignment.top} spacing={10}
                        padding={padding({top: 15, bottom: 10, leading: 15, trailing: 15})}
                        frame={frame({height: 50, alignment: Alignment.top})}
                        zIndex={100}
                >
                    <ActionButton action={new ActionShowSessionSwitcher(this.context)}
                                  fixedSize={""}
                                  font={font({size: 20, weight: "medium"})}
                                  rotationEffect={"degrees(90)"}
                                  context={this.context}
                                  padding={padding({vertical: 7, horizontal: 4})}
                                  background={"#ddd"}
                                  cornerRadius={25}
                                  zIndex={1000}
                                  offset={offset({x: 4, y: -7})}
                    />
                </HStack>
            </ZStack>
        )
    }
}

/*struct SessionSwitcher_Previews: PreviewProvider {
    static var previews: some View {
        SessionSwitcher().environmentObject(try! RootContext(name: "", key: "").mockBoot())
    }
}*/
