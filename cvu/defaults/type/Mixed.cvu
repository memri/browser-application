Mixed[] {
    name: "all-mixed"
    title: "Various Items"
    emptyResultText: "There are no data items here yet"
    defaultRenderer: list
    sortFields: title dateModified dateAccessed dateCreated
    
    editActionButton: toggleEditMode
    filterButtons: showStarred toggleFilterPanel
    
    [renderer = list] {
        ItemCell {
            dataItem: {.}
            renderers: list, thumbnail
        }
    }
}

"Inbox" {
    name: "inbox"
    title: "Inbox"
    emptyResultText: "There are no data items here yet"
    defaultRenderer: list
    sortFields: title dateModified dateAccessed dateCreated
    
    editActionButton: toggleEditMode
    filterButtons: showStarred toggleFilterPanel
    
    [renderer = list] {
        ZSTack {
            MemriButton { dataItem: {{.}} }
            ItemCell {
                dataItem: {{.}}
                renderers: list, thumbnail
            }
        }
    }
}
