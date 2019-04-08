/// Modifies json schema instance, adding '@id'

import * as R from 'ramda';

import createVisitor from 'json-schema-visitor';

const nop = () => {};

export function fillInMissingIDs(schema, instance, options) {
  
  const visitor = createVisitor({
    object: (schema, instance, callback = nop) => {
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
    array: (schema, arr, callback = nop) => {
      if (!arr) { return; }
      callback(schema, arr);
      if (schema.items) { 
        instance.forEach(v => visitor(schema.items, v, callback))
      }
    }
  });
  
  visitor(schema, instance, () => { ; });
  return instance;
}

/** Removes @id property from all objects, and from required array */
export function removeIDs(schema, options) {
  
  const visitor = createVisitor({
    object: (schema, callback = nop) => {
      callback(schema);
      
      // Test if oneOf, ...
      if (! schema.properties) { return; }

      if ( schema.properties['@id'] ) {
        delete schema.properties['@id'];
      }

      if ( schema.required ) { 
        schema.required = R.reject(v => v === '@id', schema.required);
      }

      Object.entries(schema.properties)
        .forEach(([prop, childSchema]) => visitor(childSchema, callback))
    },
    array: (schema, callback = nop) => {
      callback(schema);
      if (schema.items) { visitor(schema.items, callback); }
    }
  });
  
  visitor(schema, () => { ; });
  return schema;
}

export function arrayCoercion(schema, instance) {
  
  const visitor = createVisitor({
    object: (schema, instance, callback = nop) => {
      if (!instance) { return; }
      callback(schema, instance, 'object');

      if (! schema.properties) { return instance; }

      const result = Object.entries(schema.properties)
        .map(([prop, childSchema]) => [prop, visitor(childSchema, instance[prop], callback)] )
        .reduce( (acc, [prop, v]) => {
          // console.log({acc, prop, v});
          
          acc[prop] = v || instance[prop];
          return acc;
        }        
        , {});

      return { ...instance, ...result }; 
      
    },
    array: (schema, instance, callback = nop) => {
      if (!instance) { return; }
      callback(schema, instance, 'array');

      if (
        R.is(Object, instance) && !R.is(Array, instance) //Is object and ...
        &&
        R.is(Object, schema.items) //Suppose to be array of object
      ) {
        console.log('Coercing');
        instance = [R.clone(instance)];
      }
      if (schema.items) { 
        if ( ! R.is(Array, instance) ) {
          console.log('Error, instance not array');
          return instance; 
        }
        instance = instance.map(v => visitor(schema.items, v, callback));
      }
      return instance;
    }
  });
  
  const result = visitor(schema, instance);
  return result;
}