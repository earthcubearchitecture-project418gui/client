import * as R from 'ramda';

import datasetSchema from './dataset.json';
import dataset_ui_schema from './dataset-ui.js';
import datasetDefault from './dataset-default.js';

import orgSchema from './organization.json';
import org_ui_schema from './organization-ui.json';
import orgDefault from './org-default.js';

import { OneOfSpliterManager } from './schema-components/geo-component.jsx';

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

export default {
  "dataset": {
    "schema": datasetSchemaFixed,
    "formData": datasetDefault,
    "uiSchema": dataset_ui_schema,
    "fields": { geo: OneOfSpliterManager },
    "exampleURL": `https://earthcube.isti.com/alexm/bco-dmo-dataset.json`,
    "perform_id_removal": true
  },
  "organization": {
    "schema": orgSchema,
    "formData": orgDefault,
    "uiSchema": org_ui_schema,
    "fields": { },
    "exampleURL": `https://earthcube.isti.com/alexm/bco-dmo-org.json`,
    "perform_id_removal": true
  }
};