//
//  ViewDebugger.swift
//  memri
//
//  Created by Ruben Daniels on 5/12/20.
//  Copyright © 2020 memri. All rights reserved.
//

// TODO: file watcher
// let documentsUrl = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
// let watcher = DirectoryWatcher.watch(documentsUrl)
//
// watcher.onNewFiles = { newFiles in
//  // Files have been added
// }
//
// watcher.onDeletedFiles = { deletedFiles in
//  // Files have been deleted
// }
// Call watcher.stopWatching() and watcher.startWatching() to pause / resume.

/*
 Needs to know, which views are currently displayed (in the cascade)
 Then updates the view by recomputing the view with the new values
 Display any errors in the console
 */

//import {UUID} from "../../model/items/Item";

enum InfoType {//TODO
	info, warn, error

	/*var icon: String {
		switch self {
		case .info: return "info.circle.fill"
		case .warn: return "exclamationmark.triangle.fill"
		case .error: return "xmark.octagon.fill"
		}
	}

	var color: Color {
		switch self {
		case .info: return Color.gray
		case .warn: return Color.yellow
		case .error: return Color.red
		}
	}*/
}

import {settings} from "../../model/Settings";

class InfoState /*extends Hashable*/ {
	id /*= UUID()*/

/*	static function == (lhs: InfoState, rhs: InfoState) -> Bool {//TODO
		lhs.id == rhs.id
	}*/

	hash(hasher) {
		hasher.combine(this.displayMessage)
		hasher.combine(this.date)
	}

	date = new Date() //TODO
	displayMessage = ""
	messageCount = 1
	type = InfoType.info //TODO
	//    var cascadingView: ComputedView

	constructor(m) {
		//super()
		this.displayMessage = m
	}
}

class ErrorState extends InfoState {
	error

	constructor(m) {
		super(m)

		this.type = InfoType.error//TODO
	}
}

class WarnState extends InfoState {
	constructor(m) {
		super(m)

		this.type = InfoType.warn//TODO
	}
}

class DebugHistory /*extends ObservableObject */{
	showErrorConsole = false

	log = []

	time() {
		let d = new Date().toISOString() //TODO

		/*let dateFormatter = new DateFormatter()

		dateFormatter.dateFormat = "yyyy-MM-dd HH:mm:ss"//TODO
		dateFormatter.locale = Locale(identifier: "en_US")
		dateFormatter.timeZone = TimeZone(secondsFromGMT: 0)*/

		//return `[${dateFormatter.string(d)}]`//TODO
		return `[${d}]`
	}

	info(message) {
		// if (same view
		if (this.log[this.log.length - 1]?.displayMessage == message) {
			this.log[this.log.length - 1].messageCount += 1
		} else {
			this.log.push(new InfoState(
				message
				//            cascadingView: cascadingView
			))
		}

		console.log(`${this.time()} INFO: ${message.replace("\n", "\n    ")}`)
	}

	warn(message) {
		// if (same view
		if (this.log[this.log.length - 1]?.displayMessage == message) {
			this.log[this.log.length - 1].messageCount += 1
		} else {
			this.log.push(new WarnState(
				message
				//            cascadingView: cascadingView
			))
		}

		console.log(`${this.time()} WARNING: ${message.replace("\n", "\n    ")}`)
	}

	error(message) {
		// if (same view
		if (this.log[this.log.length - 1]?.displayMessage == message) {
			this.log[this.log.length - 1].messageCount += 1
		} else {
			this.log.push(new ErrorState(
				message
				//            cascadingView: cascadingView
			))
		}

		if (settings.get("device/debug/autoShowErrorConsole") ?? false) { //TODO
			this.showErrorConsole = true
		}

		console.log(`${this.time()} ERROR: ${message.replace("\n", "\n    ")}`)
	}

	clear() {
		this.log = []

		//objectWillChange.send()//TODO
	}
}

// Intentionally global
export var debugHistory = new DebugHistory()

class DebugConsole /*extends View*/ {
	context: MemriContext

	history = debugHistory;

	scrollPosition

	get body() {//TODO
		/*let dateFormatter = new DateFormatter()//TODO

		dateFormatter.dateFormat = "h:mm a"
		dateFormatter.locale = Locale("en_US")*/
		//        dateFormatter.timeZone = TimeZone(secondsFromGMT: 0)

		/*return Group {//TODO
			if (debugHistory.showErrorConsole) {
				VStack(spacing: 0) {
					HStack {
						Text("Console")
							.font(.system(size: 14, weight: .semibold))
							.padding(EdgeInsets(top: 5, leading: 10, bottom: 5, trailing: 10))
							.foregroundColor(Color(hex: "555"))
                        Spacer()
						Button(action: { self.scrollPosition = .top }) {
							Text("scroll to top")
						}
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(Color(hex: "#999"))
                        .padding(10)
						Button(action: { self.history.clear() }) {
							Text("clear")
						}
						.font(.system(size: 14, weight: .semibold))
						.foregroundColor(Color(hex: "#999"))
						.padding(10)
						Button(action: {
							self.history.showErrorConsole = false
                        }) {
							Image(systemName: "xmark")
						}
						.font(.system(size: 12))
						.foregroundColor(Color(hex: "#999"))
						.padding(10)
					}
					.fullWidth()
					.background(Color(hex: "#eee"))

					ASTableView(section:
						ASSection(id: 0, data: debugHistory.log.reversed(), dataID: \.self) { notice, _ in
							HStack(alignment: .top, spacing: 4) {
								Image(systemName: notice.type.icon)
									.padding(.top, 4)
									.font(.system(size: 14))
									.foregroundColor(notice.type.color)

								Text(notice.displayMessage)
									.multilineTextAlignment(.leading)
									.fixedSize(horizontal: false, vertical: true)
									.font(.system(size: 14))
									.padding(.top, 1)
									.foregroundColor(Color(hex: "#333"))

								if notice.messageCount > 1 {
									Text("\(notice.messageCount)x")
										.padding(3)
										.background(Color.yellow)
										.cornerRadius(20)
										.font(.system(size: 12, weight: .semibold))
										.foregroundColor(Color.white)
								}

								Spacer()

								Text(dateFormatter.string(from: notice.date))
									.font(.system(size: 12))
									.padding(.top, 1)
									.foregroundColor(Color(hex: "#999"))
							}
							.padding(.horizontal)
							.padding(.vertical, 4)
							.fullWidth()
                    })
						.scrollPositionSetter($scrollPosition)
				}
				.frame(maxWidth: .infinity, alignment: .topLeading)
				.background(Color.white.edgesIgnoringSafeArea(.all))
				.border(width: [1, 0, 0, 0], color: Color(hex: "ddd"))
				.frame(height: 200)
			}4
		}*/
	}
}

class ErrorConsole_Previews /*extends PreviewProvider*/ {
	static previews () {//TODO
		new DebugConsole().environmentObject(RootContext("").mockBoot())//TODO
	}
}
