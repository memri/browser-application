//
//  Installer.swift
//  memri
//
//  Copyright © 2020 memri. All rights reserved.
//


import {MemriContext} from "../context/MemriContext";
import {debugHistory} from "../cvu/views/ViewDebugger";
import {DatabaseController} from "../model/DatabaseController";

export class Installer {

	constructor() {
	}

	install() {}

	installIfNeeded(context: MemriContext, callback: () => void) {
		let realm = DatabaseController.getRealm()
		let installLogs = realm.objects("AuditItem").filtered("action = 'install'")

		// TODO: Refactor: check version??
		if (installLogs.length == 0) {
			debugHistory.info("Installing defaults in the database")

			// Load default objects in database
			context.cache.install()

			// Load default views in database
			context.views.context = context
			context.views.install()

			// Load default sessions in database
			context.sessions.install(context)

			// Installation complete
			Cache.createItem(AuditItem, {
				action: "install",
				date: new Date(),
				contents: JSON.stringify({version: "1.0"})
			})
		}

		callback()
	}
}
