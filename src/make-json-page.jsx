import React, { Component } from 'react';

import * as R from 'ramda';

export function MakeJSONPage({json, onValidateClick, onSave}) {
  json = JSON.stringify(json || {}, undefined, 2);

  return (
    <div className="container-fluid">

      <div className="row margin-y-sm">
        <div className="col-xs-2">
          <button type="button" className="btn btn-info" onClick={onValidateClick} > Validate </button>
          <button type="button" className="btn btn-info margin-left-xs" onClick={onSave}>Save</button>
        </div>
        <div className="col-xs-8">
            <p className="padding-x-lg padding-y-xs"><b>Validate</b> your JSON.
            Go back to any section that appears in red, and fix any issues. Once issues are resolved, come back here to <b>Save</b> your JSON
            </p>
        </div>
        <div className="col-xs-2"></div>
      </div>

      <div className="row margin-y-sm">
        <div className="col-xs-12">
          <pre> 
            { json }
          </pre> 
        </div>
      </div>

      <div className="row margin-top-sm">
        <div className="col-xs-12">
          <button type="button" className="btn btn-info" onClick={onValidateClick} > Validate </button>
          <button type="button" className="btn btn-info margin-left-xs" onClick={onSave}>Save</button>
        </div>
      </div>

    </div>
  );
}
