"use strict";


import * as React from 'react';
import { createStyles, Theme, fade, makeStyles } from '@material-ui/core/styles';


const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
    title: {
        flexGrow: 1,
        display: 'none',
        [theme.breakpoints.up('sm')]: {
            display: 'block',
        },
    },
    search: {
        position: 'relative',
        borderRadius: theme.shape.borderRadius,
        backgroundColor: fade(theme.palette.common.white, 0.15),
        '&:hover': {
            backgroundColor: fade(theme.palette.common.white, 0.25),
        },
        marginLeft: 0,
        width: '100%',
        [theme.breakpoints.up('sm')]: {
            marginLeft: theme.spacing(1),
            width: 'auto',
        },
    },
    searchIcon: {
        padding: theme.spacing(0, 2),
        height: '100%',
        position: 'absolute',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputRoot: {
        color: 'inherit',
    },
    inputInput: {
        padding: theme.spacing(1, 1, 1, 0),
        // vertical padding + font size from searchIcon
        paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('sm')]: {
            width: '12ch',
            '&:focus': {
                width: '20ch',
            },
        },
    },
}));

const useStylesList = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: '100%',
            maxWidth: 360,
            backgroundColor: theme.palette.background.paper,
        },
    }),
);



function ListItemLink(props: ListItemProps<'a', { button?: true }>) {
    return <ListItem button component="a" {...props} />;
}
 

let example = require("text-loader!./playground/example.view")



import * as ReactDOM from 'react-dom';
import {Application} from "./memri/gui/Application";
import {MemriContext, RootContext} from "./memri/context/MemriContext";
import {PodAPI} from "./memri/api/api";
import {Views} from "./memri/cvu/views/Views";
import {Renderers} from "./memri/cvu/views/Renderers";

 
/*function getContext(name, key) {
    let podAPI = new PodAPI(undefined, key);
    let cascadingView = new CascadableView(new SessionView(), []);
    let cache = new CacheMemri(podAPI);
    let realm = new Realm();
    let navigation = new MainNavigation(realm);

    return new MemriContext(name, podAPI, cache, undefined,
        undefined, undefined, new Views(),
        navigation,new Renderers(), undefined)
}*/

//import {mockApi} from "./playground/mockApi"
/*import {MainNavigation} from "./gui/navigation/MainNavigation";
import {CascadableView} from "./cvu/views/CascadableView";
import {SessionView} from "./cvu/views/SessionView";
import {Realm} from "./model/RealmLocal";
import {CacheMemri} from "./model/Cache";*/

let context = new RootContext("Memri GUI", "ABCDEF");
context.installer.await(() => {
    context.boot(false, () => {
        /*this.settingWatcher = context.settings.subscribe(
            "device/sensors/location/track",
            type: Bool.self
    ).sink {
            if let value = $0 as? Bool {
                if value { SensorManager.shared.locationTrackingEnabledByUser() }
        else { SensorManager.shared.locationTrackingDisabledByUser() }
        }
        }*/
    })
});
context.installer.install(context, "");

function App() {//TODO: don't ask, please, about link inside div =)
  return <div><link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
      <Application context={context}/>
  </div>
}

export var geom = {
    size: {
        width: 414,
        height: 736
    }//TODO: for testing
}

var div = document.body.appendChild(document.createElement("div"))

ReactDOM.render(App(), div)



