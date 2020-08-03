//
//  Installer.swift
//  memri
//
//  Copyright © 2020 memri. All rights reserved.
//


import {MemriContext, RootContext} from "../context/MemriContext";
import {debugHistory} from "../cvu/views/ViewDebugger";
import {DatabaseController} from "../model/DatabaseController";
import {CacheMemri} from "../model/Cache";

export class Installer {
	isInstalled: boolean = false
	debugMode: boolean = false

	readyCallback;

	constructor() {
		let realm = DatabaseController.getRealm()
		if (realm.objectForPrimaryKey("AuditItem", -2)) {
			this.isInstalled = true
		}
		//this.debugMode = CrashObserver.shared.didCrashLastTime
	}

	await(callback) {
		if (this.isInstalled && !this.debugMode) {
			callback()
			return
		}

		this.readyCallback = callback
	}

	ready() {
		this.isInstalled = true

		DatabaseController.writeSync((realm) => {
			realm.create("AuditItem", {"uid": -2}, ".modified")
		});

		try {
			this.readyCallback()
			this.readyCallback = {}
		} catch (error) {
			debugHistory.error(`${error}`)
		}
	}

	installForTesting(boot = true) {
		if (!this.isInstalled) {
			let root = new RootContext("", "");

			this.await(() => {
				if (boot) {
					root.boot(true)
				}
			})

			this.installDefaultDatabase(root)
		}
	}

	installDefaultDatabase(context: MemriContext) {
		debugHistory.info("Installing defaults in the database")

		try {
			this.install(context, "default_database")
		} catch (error) {
			debugHistory.error(`Unable to load: ${error}`)
		}
	}

	installDemoDatabase(context: MemriContext) {
		debugHistory.info("Installing demo database")

		try {
			this.install(context, "demo_database")
		} catch (error) {
			debugHistory.error(`Unable to load: ${error}`)
		}
	}

	install(context: MemriContext, dbName: string) {
		// Load default objects in database
		context.cache.install(dbName)

		// Load default views in database
		context.views.context = context
		context.views.install()

		// Load default sessions in database
		context.sessions.install(context)

		// Installation complete
		DatabaseController.writeSync((realm) => {
			realm.create("AuditItem", {
				"uid": -2,
				action: "install",
				dateCreated: new Date(),
				contents: JSON.stringify({version: "1.0"})
			})
		})

		this.ready();
	}

	continueAsNormal(context: MemriContext) {
		this.debugMode = false
		context.scheduleUIUpdate(true)
	}

	clearDatabase(context: MemriContext) {
		DatabaseController.writeSync((realm) => {
			realm.deleteAll()
		})

		this.isInstalled = false
		this.debugMode = false
		context.scheduleUIUpdate(true)
	}

	clearSessions(context: MemriContext) {
		DatabaseController.writeSync(() => {
			// Create a new default session
			context.sessions.install(context)
		})

		this.debugMode = false
		this.ready()
	}
}

/*struct SetupWizard: View {
	@EnvironmentObject var context: MemriContext

	@State var host: String = "http://localhost:3030"
	@State var username: String = ""
	@State var password: String = ""

	var body: some View {
		NavigationView {
			Form {
				if !context.installer.isInstalled && !context.installer.debugMode {
					Text("Setup Wizard")
						.font(.system(size: 22, weight: .bold))

					Section(
						header: Text("Connect to a pod")
				) {
						NavigationLink(destination: Form {
							Section(
								header: Text("Pod Connection"),
								footer: Text("Never give out these details to anyone")
								.font(.system(size: 11, weight: .regular))
						) {
								HStack {
									Text("Host:")
										.frame(width: 100, alignment: .leading)
									MemriTextField(value: $host)
								}
								HStack {
									Text("Username:")
										.frame(width: 100, alignment: .leading)
									MemriTextField(value: $username)
								}
								HStack {
									Text("Password:")
										.frame(width: 100, alignment: .leading)
									SecureField("Password", text: $password)
								}
								HStack {
									Button(action: {
										if self.host != "" {
//                                            self.context.installer.clearDatabase(self.context)
											self.context.installer
												.installDefaultDatabase(self.context)
											Settings.shared.set("user/pod/host", self.host)
											Settings.shared.set("user/pod/username", self.username)
											Settings.shared.set("user/pod/password", self.password)
											self.context.cache.sync.schedule()
										}
									}) {
										Text("Connect")
									}
								}
							}
						}) {
							Text("Connect to a new pod")
						}
						NavigationLink(destination: Form {
							Section(
								header: Text("Pod Connection"),
								footer: Text("Never give out these details to anyone")
								.font(.system(size: 11, weight: .regular))
						) {
								HStack {
									Text("Host:")
										.frame(width: 100, alignment: .leading)
									MemriTextField(value: $host)
								}
								HStack {
									Text("Username:")
										.frame(width: 100, alignment: .leading)
									MemriTextField(value: $username)
								}
								HStack {
									Text("Password:")
										.frame(width: 100, alignment: .leading)
									SecureField("Password", text: $password)
								}
								HStack {
									Button(action: {
										if self.host != "" {
											self.context.podAPI.host = self.host
											self.context.podAPI.username = self.username
											self.context.podAPI.password = self.password

											self.context.cache.sync.syncAllFromPod {
												Settings.shared.set("user/pod/host", self.host)
												Settings.shared.set(
													"user/pod/username",
													self.username
												)
												Settings.shared.set(
													"user/pod/password",
													self.password
												)
												self.context.installer.ready()
											}
										}
									}) {
										Text("Connect")
									}
								}
							}
						}) {
							Text("Connect to an existing pod")
						}
					}
					Section(
						header: Text("Or use Memri locally")
				) {
						Button(action: {
							self.context.settings.set("user/pod/host", "")
							self.context.installer.installDefaultDatabase(self.context)
						}) {
							Text("Use memri without a pod")
						}
						Button(action: {
							self.context.settings.set("user/pod/host", "")
							self.context.installer.installDemoDatabase(self.context)
						}) {
							Text("Play around with the DEMO database")
						}
//                        Button(action: {
//                            fatalError()
//                        }) {
//                            Text("Simulate a hard crash")
//                        }
					}
				}
				if context.installer.debugMode {
					Text("Recovery Wizard")
						.font(.system(size: 22, weight: .bold))

					Section(
						header: Text("Memri crashed last time. What would you like to do?")
				) {
						Button(action: {
							self.context.installer.continueAsNormal(self.context)
						}) {
							Text("Continue as normal")
						}
						Button(action: {
							self.context.installer.clearDatabase(self.context)
						}) {
							Text("Delete the local database and start over")
						}
						if context.installer.isInstalled {
							Button(action: {
								self.context.installer.clearSessions(self.context)
							}) {
								Text("Clear the session history (to recover from an issue)")
							}
						}
					}
				}
			}
		}
	}
}*/
