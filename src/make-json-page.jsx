import React, { Component } from 'react';

import * as R from 'ramda';

export function MakeJSONPage(props) {

  return (
    <div className="container-fluid">

      <div className="row margin-y-sm">
        <div className="col-xs-2">
          <button type="button" className="btn btn-info" onClick={props.onValidateClick} > Validate </button>
          <button type="button" className="btn btn-info margin-left-xs" onClick={props.onSave}>Save</button>
        </div>
        <div className="col-xs-8">
            <p className="padding-x-lg padding-y-xs"><b>Validate</b> your JSON.
            Go back to any section that appears in red, and fix any issues. Once issues are resolved, come back here to <b>Save</b> your JSON
            </p>
        </div>
        <div className="col-xs-2"></div>
      </div>
      
      { props.json && (
        <pre> 
          { JSON.stringify(props.json, undefined, 2) }
        </pre> 
      )}

      <div className="row margin-top-sm">
        <div className="col-xs-12">
          <button type="button" className="btn btn-info" onClick={props.onValidateClick} > Validate </button>
          <button type="button" className="btn btn-info margin-left-xs" onClick={props.onSave}>Save</button>
        </div>
      </div>

      <div className="row margin-md "></div>
    </div>
  );
}
