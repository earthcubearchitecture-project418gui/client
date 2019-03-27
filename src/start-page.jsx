import React, { Component } from 'react';

import * as R from 'ramda';

// import Modal from './modal/modal.jsx';

const nop = () => {};

export class StartPage extends Component {
  constructor(props) {
    super(props);
    console.log('[StartPage] | shouldChallenge : ', props.shouldChallenge);
    this.fileInputRef = React.createRef();
    this.urlInputRef = React.createRef();
    this.state = { loadedData: undefined, modalDisplaying: false };
  }

  handleFetchJSON = () => this.challengeUser({modalAccepted: () => this.fetchJSON(this.upload)});
  fetchJSON = (callback = nop) => {
    // fetch('https://earthcube.isti.com/test_file.html')
    // fetch('https://earthcube.isti.com/test_file_json.html')
    
    if (! this.urlInputRef) { return; }

    const url = this.urlInputRef.current.value;
    console.log('input is : ', url);
    fetch(url)
      .then(res => res.json())
      .then(obj => {
        this.setState({ loadedData: obj }, callback);
      })
      .catch(err => console.error(err));
  }
  
  loadFile = (file, callback = nop) => {
    const fr = new FileReader();
    fr.onload = () => {
      const instance = JSON.parse(fr.result, undefined, 2);
      this.setState({loadedData: instance}, callback);
    };
    fr.readAsText(file);
  }

  handleLoadFile = () => this.challengeUser({modalAccepted: () => this.handleAcceptedLoadFile(this.upload) });
  handleAcceptedLoadFile = (callback) => {
    const file = this.retrieveFile();
    if (!file) { return; }
    this.loadFile(file, callback);
  }

  retrieveFile = () => {
    let files = this.fileInputRef.current.files;
    if (files.length !== 0) {
      let currentFile = files[0];
      return currentFile;
    }
    return;
  }

  challengeUser = (state) => {
    if (! this.props.shouldChallenge) { 
      if (state.modalAccepted) { state.modalAccepted(); }
      return;
    }

    this.setState({modalAccepted: this.clearModal, ...state, modalDisplaying: true});
  }

  clearModal = () => this.setState({modalDisplaying: false});

  upload = () => this.props.onLoadFormData(this.state.loadedData);

  render() {
    const files = R.path(['fileInputRef','current','files'], this);
    let fileName;
    if (files && files.length > 0) { fileName = files[0].name; }

    return (
      <div>
        {/* <Modal show={this.state.modalDisplaying} >
          <VerifyUserAction 
            onAccept={() => {console.log('accepted'); this.clearModal(); this.state.modalAccepted();}} 
            onCancel={() => {console.log('cancelled'); this.clearModal(); } } 
          />
        </Modal> */}

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
                        <button className="btn btn-info" type="button" onClick={this.handleFetchJSON}>Fetch</button>
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
              <pre>
                { JSON.stringify(this.state.loadedData, undefined, 2) }
              </pre>
            </div>
          </div>
          
        </div>
      </div>
    );
  }
}

function VerifyUserAction(props) {
  const {onAccept, onCancel} = props;
  
  return (
    <>
      <h4>Are you Sure?</h4>
      <p className="bg-warning padding-sm">This will erase all data currently loaded into the editor.</p>

      <div className="pull-right">
        <button type="button" className="btn-sm btn-default" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn-sm btn-danger margin-left-xs" onClick={onAccept}>Accept</button>
      </div>
    </>
  );
}