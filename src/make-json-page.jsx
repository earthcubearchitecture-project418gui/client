import React, { Component } from 'react';

import ErrorList from './libs/rjsf/components/ErrorList.js';

import * as R from 'ramda';

export default function MakeJSONPage({json, id_insertion_passed, validationImage, onValidate, onSave}) {

  json = JSON.stringify(json || {}, undefined, 2);

  let errorList;
  if (!id_insertion_passed) {
    errorList = (
      <div className="row ">
        <div className="col-xs-offset-1 col-xs-10">
          <div className="panel panel-danger errors">
            <div className="panel-heading">
              <h4 className="panel-title">ID INSERTION FAILED. Validation by server is prohibited.</h4>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      
      { errorList }
      
      <div className="row margin-y-sm">
        <div className="col-xs-3">
          <button type="button" className="btn btn-info margin-xs" onClick={onValidate} disabled={!id_insertion_passed}> Validate </button>
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
        <button type="button" className="btn btn-info margin-xs" onClick={onValidate} disabled={!id_insertion_passed}> Validate </button>
          <button type="button" className="btn btn-info margin-xs" onClick={onSave}>Save</button>
        </div>
      </div>

    </div>
  );
}
