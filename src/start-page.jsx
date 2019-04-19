import React, { Component } from 'react';

import * as R from 'ramda';

import { Modal, ErrorModal, VerifyUserAction } from './modal.jsx';
import { findScriptJSONLD } from './funcs.js';
import { arrayCoercion, fillInMissingURLs } from './json-schema-visitors.js';

const nop = () => {};

export default class StartPage extends Component {
  constructor(props) {
    super(props);
    this.fileInputRef = React.createRef();
    this.urlInputRef = React.createRef();
    this.state = { 
      loadedData: undefined, 
      challengeModal: false,
      modalAccepted: undefined,
      
      errorModal: false,
      errorMessage: ''
    
    };
  }

  upload = () => this.props.onLoadFormData(this.state.loadedData);

  handleFetchJSON = () => this.challengeUser({modalAccepted: () => this.fetchJSON(this.upload)});
  fetchJSON = (postVerified) => {
    const self = this;

    if (! this.urlInputRef) { return; }
    const url = this.urlInputRef.current.value;

    fetch(url)
      .then(res => res.text())
      .then(text => {
        try {
          return JSON.parse(text);
        } catch (error) {
          debugger;
          const json = findScriptJSONLD(text);
          return JSON.parse(json);
        }
      })
      .then(obj => self.verifyInput(obj, postVerified) )
      .catch(err => {
        console.error(err)
        this.setState({ errorModal: true, errorMessage: `Remote data is not valid JSON, nor HTML with script[type="application/ld+json"] tag.`});
      });
  }
  
  handleLoadFile = () => this.challengeUser({modalAccepted: () => this.handleAcceptedLoadFile(this.upload) });
  handleAcceptedLoadFile = (postVerified) => {
    const file = this.retrieveSelectedFileName();
    if (!file) { return; }
    this.loadFile(file, postVerified);
  }

  retrieveSelectedFileName = () => {
    let files = this.fileInputRef.current.files;
    if (files.length !== 0) {
      let currentFile = files[0];
      return currentFile;
    }
    return;
  }

  loadFile = (file, postVerified) => {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const instance = JSON.parse(fr.result, undefined, 2);
        this.verifyInput(instance, postVerified);
      } catch(error) {
        console.error(error);
        this.setState({ errorModal: true, errorMessage: `Remote data is not valid JSON.`});
      }
    };
    fr.readAsText(file);
  }

  verifyInput = (instance, postVerified = nop) => {
    const onVerified = () => {
      instance = arrayCoercion(this.props.schema, instance);
      instance = fillInMissingURLs(this.props.schema, instance);
      this.setState({ loadedData: instance }, postVerified);
    };

    const instanceType = instance['@type'];
    const checkType = this.props.checkType.toLowerCase();

    //No check if not object or missing @type
    if (
      !R.is(Object, instance) 
      ||   
      ( R.is(Object, instance) && !instance.hasOwnProperty('@type'))
    ) { 
      console.log('No @type, bypass check');
      return onVerified();
    }

    if (
      (R.is(String, instanceType) && instanceType.toLowerCase() === checkType) 
      ||
      (R.is(Array, instanceType) && !!instanceType.find(v => v.toLowerCase() === checkType))
    ) {
      return onVerified();
    } else {
      console.error('Remote JSON contains invalid @type value : ', instanceType);
      return this.setState({ 
        errorModal: true, 
        errorMessage: `This file type is not a(n) ${checkType} JSON file. 
           Please open an appropiate JSON file.`,
        errorMessage2: 'Current value is : ' + JSON.stringify(instanceType, undefined, 2)
      });
    }
  };
  
  challengeUser = (state) => {
    if (! this.props.shouldChallenge) { 
      if (state.modalAccepted) { state.modalAccepted(); }
      return;
    }
    this.setState({modalAccepted: this.clearModal, ...state, challengeModal: true});
  }
  clearModal = () => this.setState({challengeModal: false, errorModal: false});

  render() {
    const files = R.path(['fileInputRef','current','files'], this);
    let fileName;
    if (files && files.length > 0) { fileName = files[0].name; }

    return (
      <div>
        <Modal show={this.state.challengeModal} >
          <VerifyUserAction 
            onAccept={() => { this.clearModal(); this.state.modalAccepted();}} 
            onCancel={this.clearModal} 
            acceptText="Load"
          />
        </Modal>

        <Modal show={this.state.errorModal} >
          <ErrorModal
            message={this.state.errorMessage}
            message2={this.state.errorMessage2}
            onCancel={this.clearModal} 
          />
        </Modal>

        <div className="container-fluid">
          
          <div className="row">
            <div className="col-xs-11">
              <form className="form-horizontal">
                <div className="form-group">
                  <label className="col-sm-2 control-label "> File: </label>
                  <div className="col-sm-10">
                    <label className="btn btn-info"> 
                      Browse <input type="file" id="file-input" ref={this.fileInputRef} className="form-control hidden" onChange={this.handleLoadFile} />
                    </label>
                    <span className="padding-left-xs"> { fileName } </span>
                  </div>
                </div>
                            
                <div className="form-group">
                  <label htmlFor="inputURL" className="col-sm-2 control-label">URL:</label>
                  <div className="col-sm-10">
                    <div className="input-group">
                      <input type="url" id="inputURL" ref={this.urlInputRef} className="form-control" placeholder="URL" pattern="https://.*" 
                        defaultValue="https://earthcube.isti.com/alexm/bco-dmo-example-FIXED.json" />
                      <span className="input-group-btn">
                        <button className="btn btn-info" type="button" onClick={this.handleFetchJSON}>Load JSON</button>
                      </span>
                    </div>
                  </div>
                </div>
              
              </form>
            </div>
            <div className="col-xs-1"> </div>
          </div>
          <div className="row">
            <div className="col-xs-12">
              { this.state.loadedData && (
                <pre>
                  { JSON.stringify(this.state.loadedData, undefined, 2) }
                </pre>
              )}
            </div>
          </div>
          
        </div>
      </div>
    );
  }
}

