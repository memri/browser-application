const helpers = require('./helpers');
const path = require('path');

const entityHierarchyPath = path.resolve('../entityHierarchy/thing/Item');
const predicateHierarchyPath = path.resolve('../predicateHierarchy/predicate');

let entityHierarchy = {};
let predicateHierarchy = {};
(async () => {
  await helpers.getHierarchy(entityHierarchyPath, entityHierarchy, entityHierarchyPath, 'Item');
  await helpers.getHierarchy(predicateHierarchyPath, predicateHierarchy, predicateHierarchyPath, 'predicate');

  console.log('Check if properties of entities exist...');
  for (entity of Object.keys(entityHierarchy)) {
    for (let property of entityHierarchy[entity]['properties']) {
      if (property.substring(0, 4) === 'one_') {
        property = property.substring(4);
      } else if (property.substring(0, 10) === 'sequenced_') {
        property = property.substring(10);
      }
      if (!Object.keys(predicateHierarchy).includes(property)) {
        console.log(`-> Entity: '${entity}', has non-existent property: '${property}'`);
      }
    }
  }

  console.log('Check if expected types of predicates exist...');
  for (predicate of Object.keys(predicateHierarchy)) {
    if (predicateHierarchy[predicate]['expectedTypes']) {
      let expectedTypes = predicateHierarchy[predicate]['expectedTypes'].split('\n');
      for (const expectedType of expectedTypes) {
        if (!Object.keys(entityHierarchy).includes(expectedType) && !helpers.PRIMITIVE_TYPES.includes(expectedType) && expectedTypes != 'any') {
          console.log(`-> Predicate: '${predicateHierarchy[predicate]['path']}', expects non-existent type: '${expectedType}'`);
        }
      }
    } else {
      // console.log(`-> Predicate: '${predicateHierarchy[predicate]['path']}', has no expected types`);
    }
  }

  // TODO check if a predicate expects all types that its children expect.
  // TODO check if lower cased properties and relations don't clash: they can't have different types
  // TODO check if props are `double`, i.e. already inherited and redefined
  // TODO check if there are unused Items
  // TODO check if there are unused relationships/properties
})();
