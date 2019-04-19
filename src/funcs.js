
import * as R from 'ramda';

export function nameCapitalized(name) { return name.charAt(0).toUpperCase() + name.slice(1); }

export function getBCODOM() {
  // fetch('https://earthcube.isti.com/test_file.html')
  // fetch('https://earthcube.isti.com/test_file_json.html')
  return fetch('https://www.bco-dmo.org/')
    .then(res => res.text())
    .then(html => {
      // console.log(html);
      const json = findScriptJSONLD(html);
      // console.log(json);
      // console.log(JSON.parse(json));
      return JSON.parse(json);
    })
    .catch(err => console.error(err));
}

export function findScriptJSONLD(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // console.log(doc.body);

  const script_ld_json = doc.querySelector(`script[type="application/ld+json"]`);

  // console.log(script_ld_json);
  // console.log(script_ld_json.innerHTML);

  return script_ld_json.innerHTML;
}

export function retrieveErrors(errorList, dataPath) {
  let result = errorList
    .filter(err => err.dataPath === dataPath)
    .map(err => err.message);
  
  console.log(result);
  return result;
}

export function morphDataPath(path) { return '/' + path.slice(5).replace(/_/g, '/'); }



/**
 * Returns top property identified in data path, for each string
 * @param {Array.<string>} errors 
 */
export function stripToTopProperty(errors) {
  function format(err) {
    const noSlash = err.dataPath.slice(1);
    const i = noSlash.indexOf('/');
    if (i !== -1) {
      return noSlash.slice(0, i);
    } else {
      return noSlash;
    }
  }

  function required(err) {
    if (err.schemaPath === '#/required') {
      return err.params && err.params.missingProperty;
    }
    if (err.schemaPath.startsWith('#/properties')) {
      return format(err);
    }
  }

  const res = errors
    .map(err => {
      if (err.keyword === "format") { return format(err); }
      if (err.keyword === "required") { return required(err); }
      if (err.keyword === "type") { return format(err); }
    })
    .filter(v => v !== undefined);
  console.log('[stripToTopProperty()] : ', res);
  return res;
}

export function mapTopPropertyToGroup(prop, groups) {
  for (let g in groups) {
    const assocProps = groups[g];
    const isFound = assocProps.includes(prop);
    if (isFound) { return g; }
  }
  return false;
}

export function group( obj, groups ) {
  let cats = Object.keys(groups);
  let res = R.zipObj(cats, cats.map(c => R.pick(groups[c], obj)));
  return res;
}

export function ungroup(obj) { return R.mergeAll(Object.values(obj)); }

export function createSchemaShell(schema) { return  R.pick(["$schema", "title", "description", "type"], schema) }
