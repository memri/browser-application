const fs = require('fs');
const path = require('path');
const {readdir} = require('fs').promises;
const express = require('express');
const exphbs = require('express-handlebars');
const helpers = require('./helpers');

// Defines the Express + Handlebars app.
const app = express();
const port = 3000;
app.engine('.hbs', exphbs({
  helpers: {
    log: function (value) {
      console.log(value);
    },
  },
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  extname: '.hbs'
}));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.resolve(__dirname + '/public')));

const entityHierarchyPath = path.resolve('../entityHierarchy');
const predicateHierarchyPath = path.resolve('../predicateHierarchy');
const dataFiles = ['description.md', 'properties.txt', 'expectedTypes.txt'];

function addToHierarchyFromFile(hierarchy, filePath, dir, dirent) {
  let value = fs.readFileSync(path.resolve(dir, dirent.name), 'utf8', function (err, data) {
  });
  // Splits .txt files on newlines to parse properties and expectedTypes.
  if (dirent.name.split('.')[1] === 'txt') {
    value = value.split('\n').filter(function (e) {
      return e !== '';
    });
  }
  // Stores data both under full path as single name to enable easy lookup
  // (TODO use a name2path object to not store the data twice)
  hierarchy[filePath] = hierarchy[filePath] || {};
  hierarchy[filePath][dirent.name.split('.')[0]] = value;
  hierarchy[filePath.split('/').slice(-1)[0]] = hierarchy[filePath.split('/').slice(-1)[0]] || {};
  hierarchy[filePath.split('/').slice(-1)[0]][dirent.name.split('.')[0]] = value;
  hierarchy[filePath.split('/').slice(-1)[0]]['path'] = filePath;
}

async function getHierarchy(dir, hierarchy, splitPath) {
  // Recursively read the directory structure.
  const dirents = await readdir(dir, {withFileTypes: true});
  for (const dirent of dirents) {
    let filePath = dir.split(splitPath)[1];
    if (dirent.isDirectory()) {
      hierarchy[filePath] = hierarchy[filePath] || {};
      hierarchy[filePath]['children'] = hierarchy[filePath]['children'] || [];
      hierarchy[filePath]['children'].push(dirent.name);
      await getHierarchy(path.resolve(dir, dirent.name), hierarchy, splitPath);
    } else if (dataFiles.includes(dirent.name)) {
      addToHierarchyFromFile(hierarchy, filePath, dir, dirent);
    }
  }
}

// function getAncestry(path) {
//   // Returns ancestry of a node in the hierarchy as a mapping from the node name to the node path,
//   // e.g. '/thing/Item' -> { thing: '/thing', Item: '/thing/Item' }
//   let ancestry = {};
//   for (let i = 1; i < path.length; i++) {
//     ancestry[path[i]] = (path.slice(0, i + 1).join('/'));
//   }
//   return ancestry;
// }

let entityHierarchy = {};
let predicateHierarchy = {};
(async () => {
  await getHierarchy(entityHierarchyPath, entityHierarchy, entityHierarchyPath);
  await getHierarchy(predicateHierarchyPath, predicateHierarchy, predicateHierarchyPath);
})();

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  }
  console.log(`server is listening on http://localhost:${port}`);
});

app.get('/*', (request, response) => {
  let path = request.originalUrl;
  let pathList = path.split('/');
  pathList.shift();
  let data = {
    name: pathList.slice(-1)[0],
    path: path,
    pathLinks: helpers.getAncestry(path.split('/')),
    entityHierarchy: entityHierarchy,
    predicateHierarchy: predicateHierarchy,
  };
  if (path === '/') {
    response.render('home');
  } else if (Object.keys(entityHierarchy).includes(path)) {
    response.render('entity', data);
  } else if (Object.keys(predicateHierarchy).includes(path)) {
    response.render('predicate', data);
  } else {
    response.render('404', {name: path});
  }
});
