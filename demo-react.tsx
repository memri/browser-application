"use strict";


import * as React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import InputBase from '@material-ui/core/InputBase';
import { createStyles, Theme, fade, makeStyles } from '@material-ui/core/styles';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';

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

function SearchAppBar() {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar variant="dense">
          <IconButton
            edge="start"
            className={classes.menuButton}
            color="inherit"
            aria-label="open drawer"
          >
            <MenuIcon />
          </IconButton>
          <Typography className={classes.title} variant="h6" noWrap>
            Material-UI
          </Typography>
          <div className={classes.search}>
            <div className={classes.searchIcon}>
              <SearchIcon />
            </div>
            <InputBase
              placeholder="Search…"
              classes={{
                root: classes.inputRoot,
                input: classes.inputInput,
              }}
              inputProps={{ 'aria-label': 'search' }}
            />
          </div>
        </Toolbar>
      </AppBar>
    </div>
  );
}

import ace from "ace-builds";
import "ace-builds/src-noconflict/ext-searchbox";
import {Mode} from "./playground/cvu-mode";


let example = require("text-loader!./playground/example.view")

let DemoWorker = require("worker-loader!./demo-worker")

let demoWorker = new DemoWorker();

let value = window.localStorage.lastValue || example;
window.onbeforeunload = function() {
    window.localStorage.lastValue = editor.getValue()
}
let editor = ace.edit(null, {
    value,
    mode: new Mode(),
    newLineMode: "unix",
});

let output = ace.edit(null, {
    value: "",
    mode: new Mode(),
});

editor.container.style.cssText = "top:0; left: 0%; height: 100vh; right: 50vw"
editor.container.style.position = "absolute"
output.container.style.cssText = "top:0; left: 50vw; height: 100vh; right: 0vw"
output.container.style.position = "absolute"
// document.body.appendChild(editor.container)
// document.body.appendChild(output.container)



var WorkerClient = ace.require("ace/worker/worker_client").WorkerClient;
function WebpackWorkerClient(worker) {
    this.$sendDeltaQueue = this.$sendDeltaQueue.bind(this);
    this.changeListener = this.changeListener.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.$worker = worker;
    this.callbackId = 1;
    this.callbacks = {};
    this.$worker.onmessage = this.onMessage;
}
WebpackWorkerClient.prototype = WorkerClient.prototype;

var session = editor.session;
session.$worker = new WebpackWorkerClient(demoWorker);
session.$worker.attachToDocument(session.getDocument());

session.$worker.on("errors", function(e) {
    session.setAnnotations(e.data);
});

session.$worker.on("annotate", function(e) {
    session.setAnnotations(e.data);
});

session.$worker.on("terminate", function() {
    session.clearAnnotations();
}); 

session.$worker.on("result", function(e) {
    output.session.setValue(e.data);
}); 


import * as ReactDOM from 'react-dom';
import { Button } from '@material-ui/core';
import List from '@material-ui/core/List';
import ListItem, { ListItemProps } from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import InboxIcon from '@material-ui/icons/Inbox';
import DraftsIcon from '@material-ui/icons/Drafts';
import {Application} from "./gui/Application";
import {MemriContext, RootContext} from "./context/MemriContext";
import {PodAPI} from "./api/api";
import {Views} from "./cvu/views/Views";
import {Renderers} from "./cvu/views/Renderers";


function SimpleList() {
    const classes = useStylesList();

    return (
        <div className={classes.root}>
            <List component="nav" aria-label="main mailbox folders">
                <ListItem button>
                    <ListItemText primary="Inbox" />
                </ListItem>
                <ListItem button>
                    <ListItemText primary="Drafts" />
                </ListItem>
            </List>
            <Divider />
            <List component="nav" aria-label="secondary mailbox folders">
                <ListItem button>
                    <ListItemText primary="Trash" />
                </ListItem>
                <ListItemLink href="#simple-list">
                    <ListItemText primary="Spam" />
                </ListItemLink>
            </List>
        </div>
    );
}

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
context.boot();

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



