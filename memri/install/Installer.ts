//
//  Installer.swift
//  memri
//
//  Copyright © 2020 memri. All rights reserved.
//


import {MemriContext} from "../../router";
import {debugHistory} from "../../router";
import {DatabaseController} from "../../router";
import {CacheMemri} from "../../router";
import {Settings} from "../../router";
import {Authentication} from "../../router";
import {LocalSetting} from "../../router";
import {mockApi} from "../../playground/mockApi";

enum InstallerState {
	inactive,
	downloadingDemoData
	, extractingDemoData
	, installingDatabase
}

export class Installer {
	isInstalled: boolean = false
	debugMode: boolean = false

	state = InstallerState.inactive //TODO: InstallerState

	readyCallback;

	constructor() {
		//this.debugMode = CrashObserver.shared.didCrashLastTime
	}

	await(context: MemriContext, callback) {
		let authAtStartup = Settings.shared.get("device/auth/atStartup") ?? true

		let check = () => {
			if (LocalSetting.get("memri/installed")) {
				this.isInstalled = true

				if (!this.debugMode) {
					this.ready(context)
				}
			}
		}

		this.readyCallback = callback

		/*if (authAtStartup) { //TODO:
			Authentication.authenticateOwner((error) => {
				if (error) {
					throw `Unable to authenticate ${error}` // TODO: report to user allow retry
				}

				check()
			})
		} else {*/
			check()
		//}
	}

	ready(context:MemriContext) {
		this.isInstalled = true

		LocalSetting.set("memri/installed", Date.now()); //TODO: LocalSetting

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

				//Authentication.createRootKey(areYouSure)

				this.installDemoDatabase(context, (error) => {
					if (error) {
						// TODO: Error Handling - show to the user
						debugHistory.warn(`${error}`)
						callback(error)
						return
					}

					//DispatchQueue.main.async {
					if (error) {
						// TODO: Error Handling - show to the user
						debugHistory.warn(`${error}`)
						callback(error)
						return
					}
					localStorage.setItem("isLocalInstall", "false"); //TODO: added not to sync with missing pod
					try {
						//console.log(`KEY: ${Authentication.getPublicRootKeySync().hexEncodedString(".upperCase")}`) //TODO?

						//Authentication.createOwnerAndDBKey()
					} catch {
						callback(error)
					}

					Settings.shared.set("user/pod/host", host)
					this.ready(context)

					context.cache.sync.schedule();

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
				if (host == "mock") {
					context.podAPI=new mockApi();
				}
				context.podAPI.host = host
				localStorage.setItem("isLocalInstall", "false"); //TODO: added not to sync with missing pod
				localStorage.setItem("ownerKey", publicKey); //TODO:
				localStorage.setItem("databaseKey", dbKey); //TODO:
				//Authentication.createRootKey(areYouSure)


				context.cache.sync.syncAllFromPod(() => { // TODO: error handling
					Settings.shared.set("user/pod/host", host)

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

				//Authentication.createRootKey(areYouSure)

				this.installDemoDatabase(context, (error) => {
					if (error) {
						// TODO: Error Handling - show to the user
						debugHistory.warn(`${error}`)
						callback(error)
					}
					localStorage.setItem("isLocalInstall", "true"); //TODO: added not to sync with missing pod
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
		// TODO: ERror handling - report to the user
		debugHistory.warn(`${error!}`)
	}

	installDemoDatabase(context: MemriContext, callback) {
		debugHistory.info("Installing demo database")
		this.install(context, "demo_database", callback)
	}

	install(context: MemriContext, dbName: string, callback) {
		this.state = InstallerState.installingDatabase
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
						LocalSetting.set("memri/installed", Date())
						this.state = InstallerState.inactive

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
		DatabaseController.asyncOnCurrentThread(true, undefined,(realm) => {
			realm.deleteAll()

			CacheMemri.cacheUIDCounter = -1

			this.isInstalled = false
			this.debugMode = false
			context.scheduleUIUpdate()

			callback(undefined)
		})
	}

	clearSessions(context: MemriContext, callback) {
		DatabaseController.asyncOnCurrentThread(true, callback, () => {
			// Create a new default session
			context.sessions.install(context, (error) => {
				if (error) {
					// TODO: Error Handling - show to the user
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