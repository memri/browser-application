//
//  IndexerAPI.swift
//  Copyright © 2020 memri. All rights reserved.


import {MemriContext, Note} from "../../router";
import {Datasource} from "../../router";

export class IndexerAPI {
	context?: MemriContext

	execute(indexerInstance: IndexerRun, items: Item[]) {
		if (indexerInstance.name == "Note Label Indexer") {
			let notes = items
			if (!Array.isArray(notes) || !(notes[0] instanceof Note)) {
				throw `Could not execute IndexerRun ${indexerInstance} non note objects passed`
			}
			this.executeNoteLabelIndexer(indexerInstance, notes)
		} else {
			throw `\n***COULD NOT FIND LOCAL INDEXER IN INDEXERAPI***\n`
		}
	}
/*}

class IndexerAPI {*/
	executeNoteLabelIndexer(indexerInstance: IndexerRun, items: Note[]) {
		this.context?.cache.query(new Datasource("Label"), true, (error, labels) => {
			if (!labels) {
				if (error) {
					console.log(`Aborting, no labels found: ${error}`)
				}
				return
			}

			for (let [i, label] of Object.entries(labels.enumerated())) {
				let progress: number = Number(((i + 1) / labels.length) * 100)
				indexerInstance.set("progress", progress)
				let name = label.get("name")
				let aliases = label.get("aliases") ?? []
				let allAliases = aliases.concat(name != null ? [name!] : []).map((item: string) => { item.toLowerCase() })

				for (var note of items) {
					let content = note.get("content")
					if (!content) { continue }

					let contentString = content.strippingHTMLtags().toLowerCase()

					if (allAliases.includes(contentString.contains)) {
						// If any of the aliases matches
                        try {
							console.log(`Adding label from ${note} to ${label}`)
							label.link(note, "appliesTo")
						} catch(error) {
                            console.log("Could not create edge")
						}
					}
				}
			}
		})
	}
}
