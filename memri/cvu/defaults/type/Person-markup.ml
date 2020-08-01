[language = "English"] {
    sharewith: "Share with..."
    addtolist: "Add to list..."
    duplicate: "Duplicate"
    showtimeline: "Show Timeline"
    timelineof: "Timeline of this"
    starred: "Starred"
    all: "All"
}
[language = "Dutch"] {
    sharewith: "Deel met..."
    addtolist: "Voeg toe aan lijst..."
    duplicate: "Dupliceer"
    showtimeline: "Toon Tijdslijn"
    timelineof: "Tijdslijn van deze"
    starred: "Favoriete"
    all: "Alle"
}

"defaultButtonsForDataItem" {
    editActionButton: toggleEditMode
    filterButtons:
        openView {
            icon: "increase.indent"
            title: "{$showtimeline}"
            
            view: {
                defaultRenderer: timeline
                
                queryOptions: {
                    query: "AuditItem appliesTo:{.id}"
                    sortProperty: dateCreated
                    sortAscending: true
                }
                
                [renderer = timeline] {
                    timeProperty: dateCreated
                }
            }
        }
        showContextPane
    
    contextButtons: star schedule
    
    actionItems:
        showSharePanel { title: "{$sharewith}" }
        addToPanel { title: "{$addtolist}" }
        duplicate { title: "{$duplicate} {type}" }
    
    navigateItems:
        openView {
            title: "{$timelineof} {type.lowercased()}"
            view: {
                defaultRenderer: timeline
                
                queryOptions {
                    query: "AuditItem appliesTo:{.id}"
                    sortProperty: dateCreated
                    sortAscending: true
                }
                
                [renderer = timeline] {
                    timeProperty: dateCreated
                }
            }
        }
        openViewByName {
            title: "{$starred} {type.plural()}"
            name: "filter-starred"
            arguments: {
                fromTemplate: "all-{type}"
            }
        }
        openViewByName {
            title: "{$all} {type.lowercased().plural()}"
            name: "all-{type}"
        }
}

<View for="Person" title="{.firstName}" defaultRenderer="generalEditor">
    <include view="defaultButtonsForDataItem" />
    
    [renderer = generalEditor] {
        groups {
            profilePicture: profilePicture
            names: firstName lastName
            picturesOfPerson:
        }
        
        sequence: profilePicture labels names picturesOfPerson phoneNumbers relations addresses websites companies diets medicalConditions publicKeys onlineProfiles other dates
        
        /*excluded: profilePicture labels names picturesOfPerson phoneNumbers*/
        
        readOnly:
        
        <section for="picturesOfPerson" foreach="false" sectionTitle="Photos of {.computedTitle()}">
            <SubView minHeight="165">
                <view {
                    defaultRenderer: thumbnail.grid
                    
                    queryOptions {
                        query: "photo AND ANY includes.uid = '0x013'"
                    }
                    
                    [renderer = thumbnail.grid] {
                        columns: 5
                        itemInset: 0
                    }
                }>
                arguments: {
                    toolbar: false
                    searchbar: false
                    readonly: true
                }
            }
        }
        
        profilePicture {
            sectionTitle: ""
        
            <ZStack alignment="center">
                <Image>
                <ZStack>
                    <Image>
                    <HSTack>
                        <Button>
                            <Text>
                        }
                    }
                }
                
            }
        }
        
        labels {
            foreach: false
            sectionTitle: ""
        
            VSTack {
                padding: 10 36 5 36
            
                Text {
                    show: {{!.labels.count}}
                    text: "no labels yet"
                }
                
                FlowStack {
                    list: {{.labels}}
                
                    button {
                        press: openViewByName {
                            name: "all-items-with-label"
                            arguments: {
                                name: "Soccer team"
                                uid: 0x0124
                            }
                        }
                    
                        VStack {
                            background: {{.color}}
                            cornerRadius: 5
                        
                            Text {
                                text: "{.name}"
                                font: 16 semibold
                                color: #fff
                                padding: 5 8 5 8
                            }
                        }
                    }
                }
            }
        }
        
        publicKeys {
            EditorRow {
                title: "{.name}"
            
                Text {
                    text: "{.key}"
                }
            }
        }
        
        onlineProfiles {
            EditorRow {
                title: "{.type}"
            
                VStack {
                    cornerRadius: 5
                
                    Text {
                        text: "{.handle}"
                    }
                }
            }
        }
    }
}

Person[] {
    title: "All People"
    defaultRenderer: list
    emptyResultText: "There are no people here yet"
    
    queryOptions {
        query: "person"
        sortProperty: dateModified
    }
    
    actionButton:
        add {
            template: {
                type: "Person"
            }
        }
    
    editActionButton: toggleEditMode
    filterButtons: showStarred toggleFilterPanel
    
    [renderer = list] {
        VStack {
            alignment: left
            padding: 5 0 0 20
        
            HStack {
                alignment: center
                
                ZStack {
                    padding: 12
                    maxWidth: 25
                    maxHeight: 25
                    cornerRadius: 30
                    align: center
                    margin: 5 15 9 0
                
                    Image {
                        image: {{.profilePicture}}
                        resizable: fill
                        minHeight: 60
                        maxHeight: 60
                    }
                }
            
                VStack {
                    Text {
                        text: "{.firstName} {.lastName}"
                        font: 18 semibold
                        color: #333
                        padding: 0 0 3 0
                    }
                    Text {
                        text: "Brother"
                        font: 14 regular
                        color: #888
                        padding: 0050
                    }
                }
            }
            
            Rectangle {
                minHeight: 1
                maxHeight: 1
                color: #efefef
                padding: 0 0 0 0
            }
        }
        
    }
}
