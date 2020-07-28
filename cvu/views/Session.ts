//
//  Session.swift
//  memri
//
//  Copyright © 2020 memri. All rights reserved.
//

import {jsonDataFromFile, MemriJSONDecoder, realmWriteIfAvailable} from "../../gui/util";
import {SessionView} from "./SessionView";
import {CVUParsedViewDefinition} from "../../parsers/cvu-parser/CVUParsedDefinition";
import {DataItem} from "../../model/DataItem";
import {Views} from "./Views";

class Session extends DataItem {
 
    genericType() { return "Session" }
 
    name = ""
 
    currentViewIndex = 0
 
    views = [] // @Published//TODO
 
    showFilterPanel = false
 
    showContextPane = false
 
    editMode = false
 
    screenshot = null

    get isEditMode() {
        return this.editMode
    }
    set isEditMode(newValue){//TODO
        realmWriteIfAvailable(this.realm, ()=> {
            this.editMode = newValue
        })
    }
    get swiftUIEditMode() {
        if (this.editMode) { return this.active }
        else { return this.inactive }
    }
    set swiftUIEditMode(value) {//TODO
        realmWriteIfAvailable(this.realm,()=>{
            if (value == this.active) { this.editMode = true }
            else { this.editMode = false }
        })
    }
    
    rlmTokens = []
    cancellables = []
    
    get hasHistory () {
        return this.currentViewIndex > 0
    }
    
    get currentView() {
        return this.views.length > 0 ? this.views[this.currentViewIndex] : new SessionView()
    }
    
    constructor(decoder)  {//TODO
        super()
        this.postInit()
        
        /*jsonErrorHandling(decoder) {
            currentViewIndex =  decoder.decodeIfPresent("currentViewIndex") ?? currentViewIndex
            showFilterPanel =  decoder.decodeIfPresent("showFilterPanel") ?? showFilterPanel
            showContextPane =  decoder.decodeIfPresent("showContextPane") ?? showContextPane
            editMode =  decoder.decodeIfPresent("editMode") ?? editMode

            decodeIntoList(decoder, "views", this.views)

             super.superDecode(from: decoder)
        }*/

        // this.postInit()
    }

    /*constructor() {

        this.postInit()
    }*/
    
    postInit() {
        if (this.realm != null) {
            for (var view of this.views){
                this.decorate(view)
            }
            
            /*this.rlmTokens.push(this.observe(function (objectChange) {//TODO
                /!*if (.change = objectChange) {
                    this.objectWillChange.send()
                }*!/
            }.bind(this)))*/
        }
    }
    
    decorate(view) {
        // Set the .session property on views for easy querying
        if (view.session == null) { realmWriteIfAvailable(this.realm, () => { view.session = this }) }//TODO
        
        // Observe and process changes for UI updates
        if (this.realm != null) {
            // TODO Refactor: What is the impact of this not happening in subviews
            //                The impact is that for instance clicking on the showFilterPanel button
            //                is not working. The UI won't update. Perhaps we need to implement
            //                our own pub/sub structure. More thought is needed.


           /* this.rlmTokens.push(view.observe(function (objectChange) {//TODO
                /!*if (.change = objectChange) {
                    this.objectWillChange.send()
                }*!/
            }.bind(this)))*/
        }
    }
    
//    deinit {
//        let realm = this.realm
//        if (realm) {
//            realm.write {
//                realm.delete(self)
//            }
//        }
//    }
    
    setCurrentView(view) {
        let index = this.views.indexOf(view)
        if (index > 0) {
            realmWriteIfAvailable(this.realm, function () {
                this.currentViewIndex = index
            }.bind(this))//TODO
        }
        else {
            realmWriteIfAvailable(this.realm, () => {
                // Remove all items after the current index
                //this.views.removeSubrange(...(this.currentViewIndex + 1)) //TODO
                this.views.splice(this.currentViewIndex + 1);
                //===================   <-  The way to solve class problem
                if (view) {
                    let realView = new Views();
                    for (let key in view) {
                        realView[key] = view[key];
                    }
                    //===================
                    // Add the view to the session
                    this.views.push(realView)
                }
                // Update the index pointer
                this.currentViewIndex = this.views.length - 1
            })
            
            this.decorate(view)
        }
    }
    
    /*takeScreenShot() {
        let view = UIApplication.shared.windows[0].rootViewController?.view//TODO
        if (view) {
            let uiImage = view.takeScreenShot()
            
            if (this.screenshot == null) {
                let doIt = function () { 
                    this.screenshot = new File({uri: File.generateFilePath()}) 
                }.bind(this)//TODO

                realmWriteIfAvailable(realm, doit)
            }
            
            try {
                 this.screenshot?.write(uiImage)
            }
            catch {error} {
                console.log(error)
            }
        }
        else {
            console.log("No view available")
        }
    }*/
    
    static fromCVUDefinition(def) {
        let views = def["viewDefinitions"].constructor.name == "Array" && def["viewDefinitions"][0].constructor.name == "CVUParsedViewDefinition" ? def["viewDefinitions"] : []
            .map(function (item){ return new SessionView().fromCVUDefinition(item) })
        
        return new Session({
            selector: def.selector || "[session]",
            name: typeof def["name"] === "string" ? def["name"] : "",
            currentViewIndex: parseInt(def["currentViewIndex"]) || 0,
            showFilterPanel: typeof def["showFilterPanel"] === "boolean" ? def["showFilterPanel"] : false,
            showContextPane: typeof def["showContextPane"] === "boolean" ? def["showContextPane"] : false,
            editMode: typeof def["editMode"] === "boolean" ? def["editMode"] : false,
            screenshot: def["screenshot"]/*instanceof File*/,//TODO
            views: views
        })
    }
    
    fromJSONFile(file, ext =  "json") {
        let jsonData = jsonDataFromFile(file, ext)
        let session = MemriJSONDecoder(jsonData)//TODO
        return session
    }
    
    fromJSONString(json) {
        let session = MemriJSONDecoder(json)//TODO
        return session
    }

    static function (lt, rt) {//TODO
        return lt.memriID == rt.memriID
    }
}

//extension UIView {
//    var renderedImage: UIImage {
//        // rect of capure
//        let rect = this.bounds
//        // create the context of bitmap
//        UIGraphicsBeginImageContextWithOptions(rect.size, false, 0.0)
//        let context: CGContext = UIGraphicsGetCurrentContext()!
//        this.layer.render(in: context)
//        // get a image from current context bitmap
//        let capturedImage: UIImage = UIGraphicsGetImageFromCurrentImageContext()!
//        UIGraphicsEndImageContext()
//        return capturedImage
//    }
//}
//
//extension View {
//    function takeScreenshot(origin, size) {
//        let window = UIWindow(frame: CGRect(origin: origin, size: size))
//        let hosting = UIHostingController(rootView: self)
//        hosting.view.frame = window.frame
//        window.addSubview(hosting.view)
//        window.makeKeyAndVisible()
//        return hosting.view.renderedImage
//    }
//}

//function image(with view) {
//
//       UIGraphicsBeginImageContextWithOptions(view.bounds.size, view.isOpaque, 0.0)
//
//       defer { UIGraphicsEndImageContext() }
//
//       if (let context = UIGraphicsGetCurrentContext()) {
//
//           view.layer.render(in: context)
//
//           if (let image = UIGraphicsGetImageFromCurrentImageContext()) {
//
//
//
//               return image
//
//           }
//
//
//
//           return null
//
//       }
//
//       return null
//
//   }


/*class UIView {//TODO

    takeScreenShot() {
        UIGraphicsBeginImageContextWithOptions(this.bounds.size, false, UIScreen.main.scale)
        drawHierarchy(this.bounds, true)

        // NOTE: Allowed force unwrap
        let image = UIGraphicsGetImageFromCurrentImageContext()
        if (image) {
            UIGraphicsEndImageContext()
            return image
        }
        
        return null
    }
}*/
