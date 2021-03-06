import React, { Component } from 'react';

import * as R from 'ramda';

import { Modal, ErrorModal, VerifyUserAction, JSONErrorModal } from './modal.jsx';
import { findScriptJSONLD } from './funcs.js';
import { arrayCoercion, geoLatLonCoercion, fillInMissingURLs } from './json-schema-visitors.js';

const errorMessages = {
  noNetwork: "Either network connectivity failed, or due to the server's security policy, this web page can't read the remote web page. Please instead download the web page source yourself, save the JSON LD into a .json file, and open and edit that.",
  invalid_json_or_html: `Remote data is not valid JSON, nor HTML with script[type="application/ld+json"] tag.`
}

export default class StartPage extends Component {
  constructor(props) {
    super(props);
    this.fileInputRef = React.createRef();
    this.urlInputRef = React.createRef();
    this.state = { 
      loadedFrom: undefined,
      loadedData: undefined, 
      modalAccepted: undefined,
      errorMessage: '',
      
      challengeModal: false,
      errorModal: false,
      json_error_modal: false, 
    };
  }

  handleFetchJSON = () => {
    const value = this.urlInputRef.current.value;
    if (value.startsWith('http') && !value.startsWith('https')) { return this.forceUpdate(); }
    this.challengeUser({modalAccepted: () => this.fetchJSON()});
  };
  fetchJSON = () => {
    const self = this;

    if (! this.urlInputRef) { return; }
    const url = this.urlInputRef.current.value;

    fetch(url)
      .then(res => res.text())
      .then(text => 
        new Promise((resolve, reject) => {
          let obj;
          try { 
            obj = JSON.parse(text);
          } catch (error) { }
          if (!obj) {
            try {
              obj = JSON.parse(findScriptJSONLD(text));
            } catch (error) { }
          }
          if (!obj) { reject('invalid'); }
          
          const instance = self.verifyInput(obj);
          if (!instance) { reject('invalid'); }
          this.props.onLoadFormData(instance, url);

          return null;
        })
        .catch(err => {
          console.error(err, err.message);
          this.setState({ errorModal: true, errorMessage: errorMessages.invalid_json_or_html });
        })
      )
      .catch(err => {
        console.error(err, err.message);
        this.setState({ errorModal: true, errorMessage: errorMessages.noNetwork });
      });
  }
  
  handleLoadFile = () => this.challengeUser({modalAccepted: () => this.handleAcceptedLoadFile() });
  handleAcceptedLoadFile = () => {
    const file = this.retrieveSelectedFileName();
    if (!file) { return; }
    this.loadFile(file);
  };
  retrieveSelectedFileName = () => {
    let files = this.fileInputRef.current.files;
    if (files.length !== 0) {
      let currentFile = files[0];
      return currentFile;
    }
    return;
  };
  loadFile = (file) => {
    const fr = new FileReader();
    fr.onload = () => {
      let instance;
      try {
        instance = JSON.parse(fr.result, undefined, 2);
      } catch(error) {
        this.setState({ json_error_modal: true, errorMessage: `Remote data is not valid JSON.`});
      }
      instance = this.verifyInput(instance);
        // if (!instance) { throw new Error(); }
      if (instance) {
        this.props.onLoadFormData(instance, file.name);
      }
    };
    fr.readAsText(file);
  };

  // TODO refactor, return boolean, lift postVerified
  verifyInput = (instance) => {
    const postVerified = () => {
      instance = arrayCoercion(this.props.schema, instance);
      instance = geoLatLonCoercion(this.props.schema, instance);
      instance = fillInMissingURLs(this.props.schema, instance);
      this.setState({ loadedData: instance });
      return instance;
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
      return postVerified();
    }

    if (
      (R.is(String, instanceType) && instanceType.toLowerCase() === checkType) 
      ||
      (R.is(Array, instanceType) && !!instanceType.find(v => v.toLowerCase() === checkType))
    ) {
      return postVerified();
    } else {
      console.error('Remote JSON contains invalid @type value : ', instanceType);
      this.setState({ 
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
  clearModal = () => this.setState({challengeModal: false, errorModal: false, json_error_modal: false});

  render() {
    const files = R.path(['fileInputRef','current','files'], this);
    let fileName;
    if (files && files.length > 0) { fileName = files[0].name; }

    let url_msg;
    if (this.urlInputRef.current) {
      const value = this.urlInputRef.current.value;
      if (value.startsWith('http') && !value.startsWith('https')) { url_msg = 'Warning: http:// will not work in secure environment.' }
    }

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

        <Modal show={this.state.json_error_modal} >
          <JSONErrorModal
            message={this.state.errorMessage}
            onCancel={this.clearModal} 
          />
        </Modal>

        <div className="container-fluid">
          
          <div className="row">
            <div className="col-xs-11">
              <form className="form-horizontal">
                
                { this.props.loadedFrom && 
                  <div className="form-group">
                    <label className="col-sm-2 control-label "> Loaded From: </label>
                    <div className="col-sm-10">
                      {/* <label className="btn btn-info"> 
                        Browse <input type="file" id="file-input" ref={this.fileInputRef} className="form-control hidden" onChange={this.handleLoadFile} />
                      </label> */}
                      <span className="padding-left-xs" style={{verticalAlign: '-webkit-baseline-middle'}}> { this.props.loadedFrom } </span>
                    </div>
                  </div>
                }

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
                        defaultValue={this.props.exampleURL} />
                      <span className="input-group-btn">
                        <button className="btn btn-info" type="button" onClick={this.handleFetchJSON}>Load JSON</button>
                      </span>
                    </div>
                    <div>
                      {url_msg}
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
