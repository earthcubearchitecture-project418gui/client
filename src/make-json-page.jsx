import React, { Component } from 'react';

import ErrorList from './libs/rjsf/components/ErrorList.js';

import * as R from 'ramda';

export default function MakeJSONPage({json, remoteResponse = {}, validationImage, onValidate, onSave}) {
  json = JSON.stringify(json || {}, undefined, 2);

  // let errorList;
  // if (remoteResponse.valid === false) {
  //   const transformed = remoteResponse.errors.map(err => ({ stack: err.message }) );
  //   errorList = ( <ErrorList errors={transformed} /> );
  // }

  return (
    <div className="container-fluid">
      {/* <div className="row ">
        <div className="col-xs-12">
          { errorList }
        </div>
      </div> */}
      <div className="row margin-y-sm">
        <div className="col-xs-3">
          <button type="button" className="btn btn-info margin-xs" onClick={onValidate} > Validate </button>
          <button type="button" className="btn btn-info margin-xs" onClick={onSave}>Save</button>
          <span className="verification-img margin-sm" >
            <img src={validationImage} />
          </span>
   
        </div>
        <div className="col-xs-6">
            <p className="padding-x-lg padding-y-xs"><b>Validate</b> your JSON.
            Go back to any section that appears in red, and fix any issues. Once issues are resolved, come back here to <b>Save</b> your JSON
            </p>
        </div>
        {/* <div className="col-xs-2"></div> */}
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
        <button type="button" className="btn btn-info margin-xs" onClick={onValidate} > Validate </button>
          <button type="button" className="btn btn-info margin-xs" onClick={onSave}>Save</button>
        </div>
      </div>

    </div>
  );
}
