//
//  Installer.swift
//  memri
//
//  Copyright © 2020 memri. All rights reserved.
//


import {MemriContext} from "../context/MemriContext";
import {debugHistory} from "../cvu/views/ViewDebugger";
import {DatabaseController} from "../storage/DatabaseController";
import {CacheMemri} from "../model/Cache";
import {settings} from "../model/Settings";
import {Authentication} from "../api/Authentication";

export class Installer {
	isInstalled: boolean = false
	debugMode: boolean = false

	readyCallback;

	constructor() {
		//this.debugMode = CrashObserver.shared.didCrashLastTime
	}

	await(context: MemriContext, callback) {
		let authAtStartup = settings.get("device/auth/atStartup") ?? true

		let check = () => {
			if (settings.get("memri/installed")) {
				this.isInstalled = true

				if (!this.debugMode) {
					this.ready(context)
				}
			}
		}

		this.readyCallback = callback

		if (authAtStartup) {
			Authentication.authenticateOwner((error) => {
				if (error) {
					throw `Unable to authenticate ${error}` // TODO report to user allow retry
				}

				check()
			})
		} else {
			check()
		}
	}

	ready(context:MemriContext) {
		this.isInstalled = true

		settings.set("memri/installed", Date()); //TODO: LocalSetting

		try {
			this.readyCallback()
			this.readyCallback = {}
			context.scheduleUIUpdate()
		} catch (error) {
			debugHistory.error(`${error}`)
		}
	}

	installLocalAuthForNewPod(context: MemriContext, areYouSure: boolean, host: string, callback) {

		DatabaseController.deleteDatabase((error) => {
			try {
				if (error) {
					throw `${error}`
				}

				Authentication.createRootKey(areYouSure)

				this.installDefaultDatabase(context, (error) => {
					if (error) {
						// TODO Error Handling - show to the user
						debugHistory.warn(`${error}`)
						callback(error)
						return
					}

					//DispatchQueue.main.async {
					if (error) {
						// TODO Error Handling - show to the user
						debugHistory.warn(`${error}`)
						callback(error)
						return
					}

					try {
						//console.log(`KEY: ${Authentication.getPublicRootKeySync().hexEncodedString(".upperCase")}`) //TODO?

						Authentication.createOwnerAndDBKey()
					} catch {
						callback(error)
					}

					settings.set("user/pod/host", host)
					this.ready(context)
					context.cache.sync.schedule()

					callback(undefined)
					//}
				})
			} catch {
				callback(error)
			}
		})
	}

	installLocalAuthForExistingPod(context: MemriContext, areYouSure: boolean, host: string, privateKey: string, publicKey: string, dbKey: string, callback) {

		DatabaseController.deleteDatabase((error) => {
			try {
				if (error) {
					callback(error)
					throw `Unable to authenticate: ${error}`
				}

				context.podAPI.host = host

				Authentication.createRootKey(areYouSure)

				context.cache.sync.syncAllFromPod(() => { // TODO error handling
					settings.set("user/pod/host", host)

					try {
						Authentication.setOwnerAndDBKey(privateKey, publicKey, dbKey);
					} catch {
						callback(error)
					}

					this.ready(context)

					callback(undefined)
				})
			} catch {
				callback(error)
			}
		})
	}

	installLocalAuthForLocalInstallation(context: MemriContext, areYouSure: boolean, callback) {

		DatabaseController.deleteDatabase((error) => {
			try {
				if (error) {
					throw `Unable to authenticate: ${error}`
				}

				Authentication.createRootKey(areYouSure)

				this.installDefaultDatabase(context, (error) => {
					if (error) {
						// TODO Error Handling - show to the user
						debugHistory.warn(`${error}`)
						callback(error)
					}
					this.ready(context)

					callback(undefined)
				})
			} catch {
				callback(error)
			}
		})
	}

	/*installForTesting(boot = true) { //TODO:
		if (!this.isInstalled) {
			let root = new RootContext("", "");

			this.await(() => {
				if (boot) {
					root.boot(true)
				}
			})

			this.installDefaultDatabase(root)
		}
	}*/

	handleInstallError(error) {
		// TODO ERror handling - report to the user
		debugHistory.warn(`${error!}`)
	}

	installDefaultDatabase(context: MemriContext, callback) {
		debugHistory.info("Installing defaults in the database")
		this.install(context, "default_database", callback)
	}

	installDemoDatabase(context: MemriContext, callback) {
		debugHistory.info("Installing demo database")
		this.install(context, "demo_database", callback)
	}

	install(context: MemriContext, dbName: string, callback) {
		try {
			// Load default objects in database
			context.cache.install(dbName, (error) => {
				if (error) {
					callback(error)
					return
				}

				// Load default views in database
				context.views.context = context
				context.views.install(undefined, (error) => {
					if (error) {
						callback(error)
						return
					}

					// Load default sessions in database
					context.sessions.install(context, (error) => {
						if (error) {
							callback(error)
							return
						}

						// Installation complete
						settings.set("memri/installed", Date()) //TODO:

						callback(undefined)
					})
				})
			})
		} catch (error) {
			callback(error)
		}
	}

	continueAsNormal(context: MemriContext) {
		this.debugMode = false
		this.ready(context)
	}

	clearDatabase(context: MemriContext, callback) {
		DatabaseController.current(true,(realm) => {
			realm.deleteAll()

			CacheMemri.cacheUIDCounter = -1

			this.isInstalled = false
			this.debugMode = false
			context.scheduleUIUpdate()

			callback(undefined)
		})
	}

	clearSessions(context: MemriContext, callback) {
		DatabaseController.current(true, callback, () => {
			// Create a new default session
			context.sessions.install(context, (error) => {
				if (error) {
					// TODO Error Handling - show to the user
					debugHistory.warn(`${error}`)
					callback(error)
					return
				}

				this.debugMode = false
				this.ready(context)
				callback(undefined)
			})
		})
	}
}