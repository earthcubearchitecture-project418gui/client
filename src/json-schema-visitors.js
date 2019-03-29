/// Modifies json schema instance, adding '@id'

const createVisitor = require('json-schema-visitor');


// visitor(doc, instance, 
//   (schema, instance) => {
//     console.log(schema.type, 'instance:', instance);
//   }
// );


export function fillInMissingIDs(schema, instance, options) {
  
  const visitor = createVisitor({
    object: (schema, instance, callback) => {
      if (!instance) { return; }
      callback(schema, instance);
      
      // Test if oneOf, ...
      if (! schema.properties) { return; }

      if ( schema.properties['@id'] ) {
        // console.log('hit:', schema.type, schema.title);
        if ( !(instance['@id']) || instance['@id'] === '' ) {
          const transferValue = instance['url'] || options.url;
          instance['@id'] = transferValue; 
        }
      }

      Object.entries(schema.properties)
        .forEach(([prop, childSchema]) => visitor(childSchema, instance[prop], callback))
    },
    array: (schema, arr = [], callback) => {
      callback(schema, arr);
      arr.forEach(item => visitor(schema.items, item, callback));
    },
    // allOf: (schema, instance, callback) => {
    //   callback(schema, instance);
    //   schema.allOf.forEach(childSchema => visitor(childSchema, instance[key], callback))
    // },
    // anyOf: (schema, instance, callback) => {
    //   callback(schema, instance);
    //   schema.anyOf.forEach(childSchema => visitor(childSchema, instance[key], callback))
    // },
    // oneOf: (schema, instance, callback) => {
    //   callback(schema, instance);
    //   debugger;
    //   schema.oneOf.forEach(childSchema => visitor(childSchema, instance[key], callback))
    // },
    // any: (schema, instance, callback) => {
    //   callback(schema, instance);
    // }
  });
  
  visitor(schema, instance, () => { ; });
  return instance;
}

/** Removes @id property from all objects */
export function removeIDs(schema, options) {
  
  const visitor = createVisitor({
    object: (schema, callback) => {
      callback(schema);
      
      // Test if oneOf, ...
      if (! schema.properties) { return; }

      if ( schema.properties['@id'] ) {
        delete schema.properties['@id'];
      }

      Object.entries(schema.properties)
        .forEach(([prop, childSchema]) => visitor(childSchema, callback))
    },
    array: (schema, callback) => {
      callback(schema);
      if (schema.items) { visitor(schema.items, callback); }
    },
    // allOf: (schema, instance, callback) => {
    //   callback(schema, instance);
    //   schema.allOf.forEach(childSchema => visitor(childSchema, instance[key], callback))
    // },
    // anyOf: (schema, instance, callback) => {
    //   callback(schema, instance);
    //   schema.anyOf.forEach(childSchema => visitor(childSchema, instance[key], callback))
    // },
    // oneOf: (schema, instance, callback) => {
    //   callback(schema, instance);
    //   debugger;
    //   schema.oneOf.forEach(childSchema => visitor(childSchema, instance[key], callback))
    // },
    // any: (schema, instance, callback) => {
    //   callback(schema, instance);
    // }
  });
  
  visitor(schema, () => { ; });
  return schema;
}

