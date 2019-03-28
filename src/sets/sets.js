import arrays from "./samples/arrays";
import anyOf from "./samples/anyOf";
import oneOf from "./samples/oneOf";
import nested from "./samples/nested";
import numbers from "./samples/numbers";
import simple from "./samples/simple";
import widgets from "./samples/widgets";
import ordering from "./samples/ordering";
import references from "./samples/references";
import custom from "./samples/custom";
import errors from "./samples/errors";
import large from "./samples/large";
import date from "./samples/date";
import validation from "./samples/validation";
import files from "./samples/files";
import single from "./samples/single";
import customArray from "./samples/customArray";
import customObject from "./samples/customObject";
import alternatives from "./samples/alternatives";
import propertyDependencies from "./samples/propertyDependencies";
import schemaDependencies from "./samples/schemaDependencies";
import additionalProperties from "./samples/additionalProperties";

// import datasetSchema from './schema/dataset.json';
import schemas from './schema/schemas.js';

export const sets = {
  simple: simple,
  // Nested: nested,
  arrays: arrays,
  // Numbers: numbers,
  // Widgets: widgets,
  // Ordering: ordering,
  // References: references,
  // Custom: custom,
  // Errors: errors,
  // Large: large,
  // "Date & time": date,
  // Validation: validation,
  // Files: files,
  // Single: single,
  // "Custom Array": customArray,
  // "Custom Object": customObject,
  // Alternatives: alternatives,
  // "Property dependencies": propertyDependencies,
  // "Schema dependencies": schemaDependencies,
  // "Additional Properties": additionalProperties,
  // "Any Of": anyOf,
  // "One Of": oneOf,

  ...schemas
};
