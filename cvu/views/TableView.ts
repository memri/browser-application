//
//  TableView.swift
//  memri
//
//  Created by Jess Taylor on 5/21/20.
//  Copyright © 2020 memri. All rights reserved.
//


let cellIdentifier = "aTableViewCell"

class TableView {
    
    context
    canDelete
    canReorder
    editMode
    
    constructor(context, canDelete = true, canReorder = true) {
        this.context = context
        this.canDelete = canDelete
        this.canReorder = canReorder
        this.editMode = context.currentSession.swiftUIEditMode
    }

    makeCoordinator() {
        new Coordinator(this)//TODO
    }
    
    makeUIViewController(context) {
        context.coordinator.tableViewController//TODO
    }
 
    updateUIViewController(tableViewController, context) {
        if (this.editMode.isEditing) {
            context.coordinator.tableViewController.setEditing(true, true)
        } else {
            context.coordinator.tableViewController.setEditing(false, true)
        }
    }
}

class Coordinator {
    
    parent
    tableViewController = new TableViewController(UITableView.Style.plain)//TODO
    
    constructor(parent) {
        this.parent = parent
        super()//TODO
        this.tableViewController.tableView.dataSource = this
        this.tableViewController.tableView.delegate = this
        this.tableViewController.tableView.register(HostingTableViewCell.constructor/*TODO*/, cellIdentifier)
        this.tableViewController.tableView.tableHeaderView = UIView(.zero)//TODO
        this.tableViewController.tableView.tableFooterView = UIView(.zero)
        if (Item.constructor == NavigationItem.constructor) {//TODO
            UITableView.appearance().separatorColor = .clear
            UITableView.appearance().backgroundColor = .clear
            UITableViewCell.appearance().backgroundColor = .clear
        }
    }
    
    name = "list"
    get renderConfig () {
        return this.parent.context.cascadingView.renderConfig
    }
    
    item(navigationItem) {
        switch (navigationItem.type) {
            case "item":
                return new AnyView(new NavigationItemView(navigationItem, this.hide))
            case "heading":
                return new AnyView(new NavigationHeadingView(navigationItem.title))
            case "line":
                return new AnyView(new NavigationLineView())
            default:
                return new AnyView(new NavigationItemView(navigationItem, this.hide))
            }
        }

    hide() {
        withAnimation {//TODO
            this.parent.context.showNavigation = false
        }
    }

    //
    // MARK: Source Delegate
    //

    numberOfSections() {//TODO
        1
    }

    tableView(tableView, section) {//TODO
        if (Item.self == DataItem.self) {//TODO
            return this.parent.context.items.length
        } else if (Item.self == NavigationItem.self) {
            return this.parent.context.navigation.getItems().length
        } else {
            fatalError("Object type not recognized")//TODO
        }
    }
    
    tableView1(tableView, indexPath) {
        let cell = tableView
            .dequeueReusableCell(cellIdentifier, indexPath)

        console.log(`indexPath.row = ${indexPath.row}`)
        if (Item.self == DataItem.self) {//TODO
            let dataItem = this.parent.context.items[indexPath.row]
            let guiView = this.renderConfig?.render(dataItem)
            cell.host(guiView, this.tableViewController)
        } else if (Item.self == NavigationItem.self) {//TODO
            let navigationItem = this.parent.context.navigation.getItems()[indexPath.row]
            let guiView = this.item(navigationItem)
            cell.host(guiView, this.tableViewController)
        } else {
            fatalError("Object type not recognized")//TODO
        }

        return cell
    }

    //
    // Mark: View Delegate
    //
    
    tableView2(tableView, didSelectRowAt) {
        if (Item.self == DataItem.self) {//TODO
            let dataItem = this.parent.context.items[didSelectRowAt.row]
            let press = this.renderConfig?.press
            if (press) {
                this.parent.context.executeAction(press, dataItem)
            }
        }
    }

    tableView3(tableView, canEditRowAt) {//TODO
        if (this.parent.canReorder || this.parent.canDelete) {
            return true
        } else {
            return false
        }
    }

    tableView4(tableView, canMoveRowAt) {//TODO
        this.parent.canReorder
    }

    tableView5(tableView, moveRowAt, sourceIndexPath, destinationIndexPath) {//TODO
        if (Item.self == DataItem.self) {//TODO
            let itemMoving = this.parent.context.items[sourceIndexPath.row]
            this.parent.context.items.splice(sourceIndexPath.row, 1)
            this.parent.context.items.splice(destinationIndexPath.row, 0, [itemMoving])
        } else if (Item.self == NavigationItem.self) {
            let itemMoving = this.parent.context.navigation.getItems()[sourceIndexPath.row]
            this.parent.context.navigation.items.splice(sourceIndexPath.row, 1)
            this.parent.context.navigation.items.splice(destinationIndexPath.row, 0, [itemMoving])
        } else {
            fatalError("Object type not recognized")//TODO
        }
    }
        
    tableView6(tableView, commit, indexPath) {//TODO
        if (this.editingStyle == UITableViewCell.EditingStyle.delete) {
        } else if (this.editingStyle == UITableViewCell.EditingStyle.insert) {}
    }
    
    tableView7(tableView, indexPath) {//TODO
        if (tableView.isEditing) {
            let deleteAction = this.deleteAction(indexPath)
            return new UISwipeActionsConfiguration([deleteAction])
        } else {
            let share = this.shareAction()
            let favorite = this.favoriteAction()
            return new UISwipeActionsConfiguration([share, favorite])
        }
    }
    
    tableView8(tableView, indexPath) {
        let deleteAction = this.deleteAction(indexPath)
        return new UISwipeActionsConfiguration([deleteAction])
    }

    //
    // TODO: Abstract based on data source, convert to use an image
    //
    shareAction() {
        let share = new UIContextualAction(".normal", "Share", function(ac, view, success){
            console.log("Share Button Tapped")
            //
            // TODO: Call action on context
            //
            success(true)
        })
        share.backgroundColor = .blue//TODO
        return share
    }

    favoriteAction() {
        let favorite = new UIContextualAction(".normal"/*TODO*/, "Favorite", function(ac, view, success) {
            console.log("Favorite Button Tapped")
            //
            // TODO: Call action on context
            //
            success(true)
        })
        favorite.backgroundColor = .orange//TODO
        return favorite
    }

    deleteAction(indexPath) {
        let itemAtRow = indexPath
        let deleteAction = new UIContextualAction(".destructive"/*TODO*/, "Delete", function (ac, view, success) {
            console.log("Delete Button Tapped")
            if (Item.self == DataItem.self) {//TODO
                this.parent.context.executeAction( new Action(this.parent.context, "delete"), this.parent.context.items[itemAtRow.row])
                this.tableViewController.tableView.deleteRows([indexPath], UITableView.RowAnimation.automatic)
            } else if (Item.self == NavigationItem.self) {
                //
                // TODO
                //
            } else {
                fatalError("Object type not recognized")
            }
            success(true)
        })
        deleteAction.backgroundColor = .red//TODO
        return deleteAction
    }

}

class TableViewController extends UITableViewController {
    constructor(style) {
        super(style)
    }
    
    init?(coder: NSCoder) {//TODO
        fatalError("init(coder:) has not been implemented")
    }
    
    viewDidLoad() {
        super.viewDidLoad()
    }

    viewWillAppear(animated) {
        super.viewWillAppear(animated)
        this.navigationController?.isNavigationBarHidden = false
    }
}

class HostingTableViewCell extends UITableViewCell {
    controller
    
    host(view, parent) {
        if (this.controller) {
            this.controller.rootView = view
            this.controller.view.layoutIfNeeded()
        } else {
            let swiftUICellViewController = new UIHostingController(view)
            this.controller = swiftUICellViewController
            swiftUICellViewController.view.backgroundColor = .clear//TODO
            this.layoutIfNeeded()//TODO
            parent.addChild(swiftUICellViewController)
            this.contentView.addSubview(swiftUICellViewController.view)//TODO
            swiftUICellViewController.view.translatesAutoresizingMaskIntoConstraints = false
            this.contentView.addConstraint(new NSLayoutConstraint(swiftUICellViewController.view, NSLayoutConstraint.Attribute.leading, NSLayoutConstraint.Relation.equal, contentView, NSLayoutConstraint.Attribute.leading, 1.0, 0.0))
            this.contentView.addConstraint(new NSLayoutConstraint(swiftUICellViewController.view, NSLayoutConstraint.Attribute.trailing, NSLayoutConstraint.Relation.equal, contentView, NSLayoutConstraint.Attribute.trailing, 1.0, 0.0))
            this.contentView.addConstraint(new NSLayoutConstraint(swiftUICellViewController.view, NSLayoutConstraint.Attribute.top, NSLayoutConstraint.Relation.equal, contentView, NSLayoutConstraint.Attribute.top, 1.0, 0.0))
            this.contentView.addConstraint(new NSLayoutConstraint(swiftUICellViewController.view, NSLayoutConstraint.Attribute.bottom, NSLayoutConstraint.Relation.equal, contentView, NSLayoutConstraint.Attribute.bottom, 1.0, 0.0))

            swiftUICellViewController.didMove(parent)
            swiftUICellViewController.view.layoutIfNeeded()
        }
    }
}

//struct TableView: UIViewControllerRepresentable {
//
//    var context: MemriContext!
//    var canDelete: Bool!
//    var canReorder: Bool!
//    var editMode: EditMode
//
//    let name = "list"
//    var renderConfig: ListConfig {
//        return this.context.computedView.renderConfigs[name] as? ListConfig ?? ListConfig()
//    }
//
//    init(context: MemriContext, canDelete: Bool? = true, canReorder: Bool? = true) {
//        this.context = context
//        this.canDelete = canDelete
//        this.canReorder = canReorder
//        this.editMode = context.currentSession.isEditMode
//    }
//
//    function makeCoordinator() {
//        Coordinator(parent: self)
//    }
//
//    function makeUIViewController(context) {
//        context.coordinator.tableViewController
//    }
//
//    function updateUIViewController(tableViewController, context) {
//        if (this.editMode.isEditing) {
//            context.coordinator.tableViewController.setEditing(true, animated: true)
//        } else {
//            context.coordinator.tableViewController.setEditing(false, animated: true)
//        }
//    }
//}
//

//class Coordinator : NSObject, UITableViewDelegate, UITableViewDataSource {
//
//    let parent: TableView
//    let tableViewController = TableViewController(style: UITableView.Style.plain)
//
//    init(parent: TableView) {
//        this.parent = parent
//        super.init()
//        tableViewController.tableView.dataSource = self
//        tableViewController.tableView.delegate = self
//        tableViewController.tableView.register(HostingTableViewCell<GUIElementInstance>.self, forCellReuseIdentifier: cellIdentifier)
//    }
//
//    //
//    // MARK: Source Delegate
//    //
//
//    function numberOfSections(in tableView) {
//        //
//        // TODO: # sections? Headers, Footers?
//        //
//        1
//    }
//
//    function tableView(tableView, numberOfRowsInSection section) {
//        this.parent.context.items.count
//    }
//
//    function tableView(tableView, cellForRowAt indexPath) {
//        let cell = tableView
//            .dequeueReusableCell(withIdentifier: cellIdentifier, for: indexPath) as! HostingTableViewCell<GUIElementInstance>
//
//        let dataItem = this.parent.context.items[indexPath.row]
//        let guiView = this.parent.renderConfig.render(item: dataItem)
//        cell.host(guiView, parent: this.tableViewController)
//
//        return cell
//    }
//
//    //
//    // Mark: View Delegate
//    //
//
//    function tableView(tableView, didSelectRowAt) {
//        let dataItem = this.parent.context.items[didSelectRowAt.row]
//        if (let press = this.parent.renderConfig.press) {
//            this.parent.context.executeAction(press, dataItem)
//        }
//    }
//
//    function tableView(tableView, canEditRowAt indexPath) {
//        if (this.parent.canReorder || this.parent.canDelete) {
//            return true
//        } else {
//            return false
//        }
//    }
//
//    function tableView(tableView, canMoveRowAt indexPath) {
//        this.parent.canReorder
//    }
//
//    function tableView(tableView, moveRowAt sourceIndexPath, to destinationIndexPath) {
//        let itemMoving = this.parent.context.items[sourceIndexPath.row]
//        this.parent.context.items.remove(at: sourceIndexPath.row)
//        this.parent.context.items.insert(itemMoving, at: destinationIndexPath.row)
//    }
//
//    let deleteItemAction = ActionDescription(icon: "", title: "", actionName: .delete, actionArgs: [], actionType: .none)
//
//    function tableView(tableView, commit editingStyle, forRowAt indexPath) {
//        if (editingStyle == UITableViewCell.EditingStyle.delete) {
//        } else if (editingStyle == UITableViewCell.EditingStyle.insert) {}
//    }
//
//    function tableView(tableView, //                   trailingSwipeActionsConfigurationForRowAt indexPath) {
//        if (tableView.isEditing) {
//            let delete = this.deleteAction(deleteItemAtRow: indexPath)
//            return UISwipeActionsConfiguration(actions: [delete])
//        } else {
//            let share = this.shareAction()
//            let favorite = this.favoriteAction()
//            return UISwipeActionsConfiguration(actions: [share, favorite])
//        }
//    }
//
//    function tableView(tableView, //                   leadingSwipeActionsConfigurationForRowAt indexPath) {
//        let delete = this.deleteAction(deleteItemAtRow: indexPath)
//        return UISwipeActionsConfiguration(actions: [delete])
//    }
//
//    //
//    // TODO: Abstract based on data source, convert to use an image
//    //
//    function shareAction() {
//        let share = UIContextualAction(style: .normal, title:  "Share", handler: { (ac: UIContextualAction, view: UIView, success: (Bool) -> Void) in
//            console.log("Share Button Tapped")
//            //
//            // TODO: Call action on context
//            //
//            success(true)
//        })
//        share.backgroundColor = .blue
//        return share
//    }
//
//    function favoriteAction() {
//        let favorite = UIContextualAction(style: .normal, title:  "Favorite", handler: { (ac: UIContextualAction, view: UIView, success: (Bool) -> Void) in
//            console.log("Favorite Button Tapped")
//            success(true)
//        })
//        favorite.backgroundColor = .orange
//        return favorite
//    }
//
//    function deleteAction(deleteItemAtRow indexPath) {
//        let itemAtRow = indexPath
//        let delete = UIContextualAction(style: .destructive, title:  "Delete", handler: { (ac: UIContextualAction, view: UIView, success: (Bool) -> Void) in
//            console.log("Delete Button Tapped")
//            this.parent.context.executeAction(this.deleteItemAction, this.parent.context.items[itemAtRow.row])
//            this.tableViewController.tableView.deleteRows(at: [indexPath], with: UITableView.RowAnimation.automatic)
//            success(true)
//        })
//        delete.backgroundColor = .red
//        return delete
//    }
//}
