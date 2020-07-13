## About
Schema is an open-source component of [Memri](https://blog.memri.io). It functions as the single source of truth of the
data model of your personal data. The latest stable version can be explored at 
[schema.memri.io](https://schema.memri.io).  

This repository contains code to export schema definitions for both the 
[Pod](https://gitlab.memri.io/memri/pod) and the [iOS app](https://gitlab.memri.io/memri/ios-application). This is only
necessary if you [change the schema](#Changing the schema), as they both repositories already include a generated 
schema.

## Local build/install
To run the code, make sure you have [Node.js and npm](https://www.npmjs.com/get-npm) installed and run:
```bash
cd tools/
npm install
```

To run the explorer (web app): `node explorer.js`
This will show the same page as schema.memri.io

To export the schema for the pod: `node export_schema_pod.js`
To export the schema for the ios application: `node export_schema_ios_application.js`  

## The schema
The schema consists of 3 parts:
* Item Hierarchy
* Edge & Property Hierarchy
* Primitive Types

### Item Hierarchy
All the data points in Memri are called items, e.g. a Person, a Location or a Video. The top level item is called Item, 
and all other items inherit all the properties and edges of Item.

### Edge & Property Hierarchy
Items can have edges and properties. Both are 

#### Edges
Edges are connections to other items, for instance, there might be a 'father' edge between two Persons. By default, 
edges are one-to-many relations: An item can have any number of edges of an allowed edge type.

#### Properties
Where edges connect to other items, properties connect directly to a value of a primitive type, for instance, an item 
could have a 'name' property of type 'Sting'. Properties are always one-to-one relations: An item can only have single 
value for a property.

### Primitive types
The primitive types that are supported by the data model. All properties must have one of these types.

## Changing the schema
The schema is stored as three directory trees.
