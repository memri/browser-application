import {decodeEdges} from "../gui/util";

export enum ItemFamily {
    typeAuditItem = "AuditItem",
    typeCVUStoredDefinition = "CVUStoredDefinition",
    typeCompany = "Company",
    typeCreativeWork = "CreativeWork",
    typeDigitalDocument = "DigitalDocument",
    typeComment = "Comment",
    typeNote = "Note",
    typeMediaObject = "MediaObject",
    typeAudio = "Audio",
    typePhoto = "Photo",
    typeVideo = "Video",
    typeDiet = "Diet",
    typeDownloader = "Downloader",
    typeEdge = "Edge",
    typeFile = "File",
    typeImporter = "Importer",
    typeImporterRun = "ImporterRun",
    typeIndexer = "Indexer",
    typeIndexerRun = "IndexerRun",
    typeLabel = "Label",
    typeLocation = "Location",
    typeAddress = "Address",
    typeCountry = "Country",
    typeMedicalCondition = "MedicalCondition",
    typeNavigationItem = "NavigationItem",
    typeOnlineProfile = "OnlineProfile",
    typePerson = "Person",
    typePhoneNumber = "PhoneNumber",
    typePublicKey = "PublicKey",
    typeSession = "Session",
    typeSessionView = "SessionView",
    typeSessions = "Sessions",
    typeSetting = "Setting",
    typeSyncState = "SyncState",
    typeViewArguments = "ViewArguments",
    typeWebsite = "Website",
    typeDatasource = "Datasource",
    typeUserState = "UserState"
}

/*static var discriminator: Discriminator = ._type

var backgroundColor: Color {
    switch self {
        case .typeAuditItem: return Color(hex: "#93c47d")
        case .typeCVUStoredDefinition: return Color(hex: "#93c47d")
        case .typeCompany: return Color(hex: "#93c47d")
        case .typeCreativeWork: return Color(hex: "#93c47d")
        case .typeDigitalDocument: return Color(hex: "#93c47d")
        case .typeComment: return Color(hex: "#93c47d")
        case .typeNote: return Color(hex: "#93c47d")
        case .typeMediaObject: return Color(hex: "#93c47d")
        case .typeAudio: return Color(hex: "#93c47d")
        case .typePhoto: return Color(hex: "#93c47d")
        case .typeVideo: return Color(hex: "#93c47d")
        case .typeDiet: return Color(hex: "#93c47d")
        case .typeDownloader: return Color(hex: "#93c47d")
        case .typeEdge: return Color(hex: "#93c47d")
        case .typeFile: return Color(hex: "#93c47d")
        case .typeImporter: return Color(hex: "#93c47d")
        case .typeImporterRun: return Color(hex: "#93c47d")
        case .typeIndexer: return Color(hex: "#93c47d")
        case .typeIndexerRun: return Color(hex: "#93c47d")
        case .typeLabel: return Color(hex: "#93c47d")
        case .typeLocation: return Color(hex: "#93c47d")
        case .typeAddress: return Color(hex: "#93c47d")
        case .typeCountry: return Color(hex: "#93c47d")
        case .typeMedicalCondition: return Color(hex: "#93c47d")
        case .typeNavigationItem: return Color(hex: "#93c47d")
        case .typeOnlineProfile: return Color(hex: "#93c47d")
        case .typePerson: return Color(hex: "#93c47d")
        case .typePhoneNumber: return Color(hex: "#93c47d")
        case .typePublicKey: return Color(hex: "#93c47d")
        case .typeSession: return Color(hex: "#93c47d")
        case .typeSessionView: return Color(hex: "#93c47d")
        case .typeSessions: return Color(hex: "#93c47d")
        case .typeSetting: return Color(hex: "#93c47d")
        case .typeSyncState: return Color(hex: "#93c47d")
        case .typeViewArguments: return Color(hex: "#93c47d")
        case .typeDatasource: return Color(hex: "#93c47d")
        case .typeUserState: return Color(hex: "#93c47d")
        case .typeWebsite: return Color(hex: "#93c47d")
    }
}

var foregroundColor: Color {
    switch self {
        case .typeAuditItem: return Color(hex: "#fff")
        case .typeCVUStoredDefinition: return Color(hex: "#fff")
        case .typeCompany: return Color(hex: "#fff")
        case .typeCreativeWork: return Color(hex: "#fff")
        case .typeDigitalDocument: return Color(hex: "#fff")
        case .typeComment: return Color(hex: "#fff")
        case .typeNote: return Color(hex: "#fff")
        case .typeMediaObject: return Color(hex: "#fff")
        case .typeAudio: return Color(hex: "#fff")
        case .typePhoto: return Color(hex: "#fff")
        case .typeVideo: return Color(hex: "#fff")
        case .typeDiet: return Color(hex: "#fff")
        case .typeDownloader: return Color(hex: "#fff")
        case .typeEdge: return Color(hex: "#fff")
        case .typeFile: return Color(hex: "#fff")
        case .typeImporter: return Color(hex: "#fff")
        case .typeImporterRun: return Color(hex: "#fff")
        case .typeIndexer: return Color(hex: "#fff")
        case .typeIndexerRun: return Color(hex: "#fff")
        case .typeLabel: return Color(hex: "#fff")
        case .typeLocation: return Color(hex: "#fff")
        case .typeAddress: return Color(hex: "#fff")
        case .typeCountry: return Color(hex: "#fff")
        case .typeMedicalCondition: return Color(hex: "#fff")
        case .typeNavigationItem: return Color(hex: "#fff")
        case .typeOnlineProfile: return Color(hex: "#fff")
        case .typePerson: return Color(hex: "#fff")
        case .typePhoneNumber: return Color(hex: "#fff")
        case .typePublicKey: return Color(hex: "#fff")
        case .typeSession: return Color(hex: "#fff")
        case .typeSessionView: return Color(hex: "#fff")
        case .typeSessions: return Color(hex: "#fff")
        case .typeSetting: return Color(hex: "#fff")
        case .typeSyncState: return Color(hex: "#fff")
        case .typeViewArguments: return Color(hex: "#fff")
        case .typeDatasource: return Color(hex: "#93c47d")
        case .typeUserState: return Color(hex: "#93c47d")
        case .typeWebsite: return Color(hex: "#fff")
    }
}

func getPrimaryKey() -> String {
    getType().primaryKey() ?? ""
}

}*/

export var getItemType = function (name) {

    switch (name) {
        case ItemFamily.typeAuditItem: return AuditItem
        case ItemFamily.typeCVUStoredDefinition: return CVUStoredDefinition
        case ItemFamily.typeCompany: return Company
        case ItemFamily.typeCreativeWork: return CreativeWork
        case ItemFamily.typeDigitalDocument: return DigitalDocument
        case ItemFamily.typeComment: return Comment
        case ItemFamily.typeNote: return Note
        case ItemFamily.typeMediaObject: return MediaObject
        case ItemFamily.typeAudio: return Audio
        case ItemFamily.typePhoto: return Photo
        case ItemFamily.typeVideo: return Video
        case ItemFamily.typeDiet: return Diet
        case ItemFamily.typeDownloader: return Downloader
        case ItemFamily.typeEdge: return Edge
        case ItemFamily.typeFile: return File
        case ItemFamily.typeImporter: return Importer
        case ItemFamily.typeImporterRun: return ImporterRun
        case ItemFamily.typeIndexer: return Indexer
        case ItemFamily.typeIndexerRun: return IndexerRun
        case ItemFamily.typeLabel: return Label
        case ItemFamily.typeLocation: return Location
        case ItemFamily.typeAddress: return Address
        case ItemFamily.typeCountry: return Country
        case ItemFamily.typeMedicalCondition: return MedicalCondition
        case ItemFamily.typeNavigationItem: return NavigationItem
        case ItemFamily.typeOnlineProfile: return OnlineProfile
        case ItemFamily.typePerson: return Person
        case ItemFamily.typePhoneNumber: return PhoneNumber
        case ItemFamily.typePublicKey: return PublicKey
        case ItemFamily.typeSession: return Session
        case ItemFamily.typeSessionView: return SessionView
        case ItemFamily.typeSessions: return Sessions
        case ItemFamily.typeSetting: return Setting
        case ItemFamily.typeSyncState: return SyncState
        case ItemFamily.typeViewArguments: return ViewArguments
        case ItemFamily.typeDatasource: return Datasource
        case ItemFamily.typeUserState: return UserState
        case ItemFamily.typeWebsite: return Website
    }
}

/// Item is the baseclass for all of the data classes.
export class SchemaItem {
    /// The unique identifier of the Item
    uid;
    /// Object describing syncing information about this object like loading state, versioning,
    /// etc.
    syncState = new SyncState();
    /// The last version loaded from the server.
    version: number = 0
    /// Boolean whether the Item has been deleted.
    deleted: boolean = false
    /// Last access date of the Item.
    dateAccessed: Date
    /// Creation date of the Item.
    dateCreated: Date
    /// Last modification date of the Item.
    dateModified: Date
    /// The identifier of an external source.
    /// A collection of all edges this Item is connected to.
    allEdges = [];
    externalID
    /// A description of the item.
    itemDescription
    /// Boolean whether the Item has been starred.
    starred: boolean = false

    superDecode(decoder: Decoder) {
        decodeEdges(decoder, "allEdges", this)
        this.dateAccessed = decoder.decodeIfPresent("dateAccessed") ?? this.dateAccessed
        this.dateCreated = decoder.decodeIfPresent("dateCreated") ?? this.dateCreated
        this.dateModified = decoder.decodeIfPresent("dateModified") ?? this.dateModified
        this.deleted = decoder.decodeIfPresent("deleted") ?? this.deleted
        this.externalID = decoder.decodeIfPresent("externalID") ?? this.externalID
        this.itemDescription = decoder.decodeIfPresent("itemDescription") ?? this.itemDescription
        this.starred = decoder.decodeIfPresent("starred") ?? this.starred
        this.syncState = decoder.decodeIfPresent("syncState") ?? this.syncState
        this.version = decoder.decodeIfPresent("version") ?? this.version
        this.uid.value = decoder.decodeIfPresent("uid") ?? this.uid.value
    }


}

/*
private enum CodingKeys: String, CodingKey {
case allEdges, dateAccessed, dateCreated, dateModified, deleted, externalID,
        itemDescription, starred, syncState, version, uid
}*/
