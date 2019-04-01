
import * as R from 'ramda';

import datasetSchema from './dataset.json';
import datasetSchemaGU from './dataset-gu.js';
import datasetSchemaGroupMain from './dataset-group-main.js';

import dataset_ui_schema from './dataset-ui.js';
import datasetBCODMOexample from './bcodmo-dataset.json';
import datasetDefault from './dataset-default.json';

import orgSchema from './organizations.json';
import org_ui_schema from './organizations-ui.json';
import orgBCODMOexample from './bcodmo-org.json';
import orgDefault from './org-default.json';

import { GeoComponent, OneOfSpliter, OneOfSpliterManager } from './schema-components/geo-component.jsx';

import { removeIDs } from '../../json-schema-visitors.js';

/// IMPORTANT FIX 
// Remove spatialCoverage.geo from schema, brakes react-jsonschema-form
// Uses custom component for rendering instead

let datasetSchemaFixed = R.clone(datasetSchema);
const path = ['properties', 'spatialCoverage', 'items', 'properties', 'geo'];
if (R.hasPath(path, datasetSchemaFixed)) {
  const geo = R.omit(['oneOf'], R.path(path, datasetSchemaFixed));
  // console.log('geo changed:', geo);
  datasetSchemaFixed = R.assocPath(path, geo, datasetSchemaFixed);
} else {
  console.error('Geo not found!!!');
}

// removeIDs(datasetSchemaFixed);

// const orgSchemaFixed = R.clone(orgSchema);
// removeIDs(orgSchemaFixed);


export default {
  "dataset": {
    "schema": datasetSchemaFixed,
    "examples": [datasetBCODMOexample],
    "formData": datasetDefault,
    "uiSchema": dataset_ui_schema,
    "fields": { geo: OneOfSpliterManager },
    "perform_id_removal": true
  },
  "dataset-ground-up": {
    "schema": datasetSchemaGU,
    "examples": [datasetBCODMOexample],
    "formData": {},
    "uiSchema": dataset_ui_schema,
    // "fields": { geo: OneOfSpliterManager }
  },
  "dataset-group-main": {
    "schema": datasetSchemaGroupMain,
    "examples": [datasetBCODMOexample],
    "formData": {},
    "uiSchema": dataset_ui_schema,
    // "fields": { geo: OneOfSpliterManager }
  },
  "organizations": {
    "schema": orgSchema,
    "examples": [orgBCODMOexample],
    "formData": orgDefault,
    "uiSchema": org_ui_schema,
    "fields": { },
    "perform_id_removal": true
  }
};