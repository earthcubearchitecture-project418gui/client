import React, { Component } from 'react';                 // External deps
import { render } from 'react-dom';

import * as R from 'ramda';

import * as FileSaver from 'file-saver';

import Form from "./libs/rjsf";
import { shouldRender, deepEquals } from "./libs/rjsf/utils.js";

                                                          // Components
import NavPillSelector from './nav-pill.jsx';
import StartPage from './start-page.jsx';
import MakeJSONPage  from './make-json-page.jsx';
import About from './about.jsx';
import { Modal, VerifyUserAction } from './modal.jsx';

import BackContext from './back-context.js';              // Local .js
import SchemaSets  from "./sets/sets.js";
import { group, ungroup, createSchemaShell, stripToTopProperty, mapTopPropertyToGroup, nameCapitalized } from './funcs.js';
import * as JSONvisitors from './json-schema-visitors.js';

import verified_png from './images/verified-green.png';       // Images
import clear_png from './images/clear.png';
import error_png from './images/error.png';
import earthcube_png from './images/logo_earthcube_full_horizontal.png';

import geocodes_png from './images/geofinalLight.png';

const log = type => console.log.bind(console, type);

class Back extends Component {
  constructor(props) {
    super(props);
    this.state = { back: undefined, callbacks: []};
  }

  remoteValidation = (body) => {
    fetch('https://earthcube.isti.com/api/validate_standard', {
      method: 'post',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(json => this.setState({ back:json } , () => { console.log(this.state.back); return; } ) )
      .catch(err => console.error(err));  
  }

  backStatus = () => {
    if (this.state.back) {
      if (this.state.back.valid) {
        return 'pass';
      } else {
        return 'errors';
      }
    } else {
      return 'clear';
    }
  }

  verificationImage = (status) => {
    const backStatus = status || this.backStatus();
    if (backStatus === 'pass') { return verified_png; }
    if (backStatus === 'errors') { return error_png; }
    return clear_png;
  }

  render() {
    return (
      <BackContext.Provider value={{
        response: this.state.back,
        validate: this.remoteValidation, 
        invalidate: this.invalidate, 
        status: this.backStatus(), 
        validationImage: this.verificationImage(),
        // registerOnRemoteValidation: this.registerOnRemoteValidation 
      }} >
        <App 
          retrieveStartValues={this.props.retrieveStartValues}
          errorList={R.pathOr([], ['back','errors'], this.state)}
        />
      </BackContext.Provider>
    );
  }
}

class App extends Component {
  static contextType = BackContext;

  static sets = SchemaSets;
  static defaultSet = "dataset"

  constructor(props) {
    super(props);

    const start = props.retrieveStartValues();
    const selectedSet = (start.set && Object.keys(App.sets).includes(start.set))
      ? start.set : App.defaultSet;

    const selectedGroup = start.action === 'load' ? 'LOADJSON' : Object.keys(App.sets[selectedSet].schema.groups)[0];
    const disableLoadJSON = start.action === 'new';

    this.state = { 
      liveValidate: true,

      selectedSet, 
      selectedGroup, 
      formData: undefined, 

      disableLoadJSON,

      attemptedRemoteValidation: false,

      challengeModal: false,
      modalAccepted: undefined,
    };
  }

  static getDerivedStateFromProps({errorList = []}, state) {
    if (!state.attemptedRemoteValidation) { return { errorList: undefined, validGroups: undefined, errorGroups: undefined }; }

    if (!deepEquals(errorList, state.errorList)) {
      const errorGroups = [];
      const groups = App.sets[state.selectedSet].schema.groups;

      const invalidTopProperties = stripToTopProperty(errorList);

      invalidTopProperties.forEach((top, i) => {
        const group = mapTopPropertyToGroup(top, groups);
        if (group === false) { 
          console.error('[App getDerivedState()] an error reported by the backend could not be matched to a group.', invalidTopProperties[i]); 
          return;
        }
        if (!errorGroups.includes(group)) { errorGroups.push(group); }
      });

      // Now filter for those groups that are valid
      const validGroups = Object.keys(groups).filter(g => !errorGroups.includes(g));
      return { errorList: errorList, validGroups, errorGroups };
    }
    return null;
  }
  invalidate = (group = '') => this.setState( ({validGroups, errorGroups}) => {
    if (validGroups) { validGroups = R.reject(v => v === group, validGroups); }
    if (errorGroups) { errorGroups = R.reject(v => v === group, errorGroups); }

    return { validGroups, errorGroups };
  });

  get set() { return App.sets[this.state.selectedSet]; }
  groups = () => this.set.schema.groups;
  groupKeys = () => Object.keys(this.groups());

  // For NavPill
  setLiveSettings = ({ formData }) => this.setState({ liveSettings: formData });
  changeSet = selectedSet => {
    if (selectedSet === this.state.selectedSet) { this.setState({ selectedGroup: undefined }); }
    else { this.setState({ selectedSet: selectedSet, selectedGroup: undefined, groups: undefined, formData: undefined }); }
  };
  changeGroup = selectedGroup => this.setState({selectedGroup });
  
  // For Catagorizor
  // updateGroups = groups => this.setState({groups});
  userEditedFormData = formData => { this.setState({formData}, () => this.invalidate(this.state.selectedGroup)); };
  onSubmit = () => {
    const groupKeys = Object.keys(group(this.set.schema.properties, this.set.schema.groups)); 
    const index = groupKeys.indexOf(this.state.selectedGroup);
    if (index + 1 < groupKeys.length) {
      this.setState({selectedGroup: groupKeys[index + 1]}, () => window.scrollTo(0, 0));
    } else if (index + 1 === groupKeys.length) {
      this.setState({selectedGroup: "MAKEJSON"}, () => window.scrollTo(0, 0));
    }
  };

  // For StartPage
  loadExternalFormData = (formData, loadedFrom) => this.setState({formData, loadedFrom, attemptedRemoteValidation: false}); 
  
  // For MakeJSONPage
  saveFile = () => {
    var blob = new Blob([JSON.stringify(this.outputFormData(), undefined, 2)], {type: "text/plain;charset=utf-8"});
    FileSaver.saveAs(blob, "geocodes-" + this.state.selectedSet + ".json");
  };
  outputFormData = () => {
    let instance = this.fillInMissingIDs();
    if (!instance) { return null; }

    const defaultProps = { '@type': nameCapitalized(this.state.selectedSet) };
    if (this.state.selectedSet == 'dataset') {
      defaultProps.isAccessibleForFree = false; 

      // console.log(Object.hasOwnProperty.call(instance, 'isAccessibleForFree'), instance.isAccessibleForFree !== false, instance.isAccessibleForFree !== true);
      if ( Object.hasOwnProperty.call(instance, 'isAccessibleForFree'), 
        instance.isAccessibleForFree !== false, 
        instance.isAccessibleForFree !== true
      ) {
        instance.isAccessibleForFree = false;
      }
    }
    return R.mergeAll( [defaultProps, instance, R.pick(['@context'], this.set.schema)] );
  };
  fillInMissingIDs = () => {
    try {
      return JSONvisitors.fillInMissingIDs(this.set.schema, R.clone(this.state.formData || {}), { 'url' : 'http://example.org' });
    } catch (err) {
      return null;
    }
  };
  
  // For Back context
  remoteValidation = () => {
    this.setState({ attemptedRemoteValidation: true, errorList: undefined, validGroups: undefined, errorGroups: undefined}, () => 
      this.context.validate({
        schema: this.state.selectedSet,
        doc: this.fillInMissingIDs()
      })
    );
  };

  //For Home button
  handleHomeClick = () => this.challengeUser({modalAccepted: () =>  window.location.assign('https://earthcube.isti.com/theui/')});
  challengeUser = state => {
    if (!this.state.formData) { state.modalAccepted(); return; }
    this.setState({modalAccepted: this.clearModal(), ...state, challengeModal: true});
  }
  clearModal = () => this.setState({challengeModal: false, modalAccepted: undefined});

  render() {
    const { 
      selectedSet, selectedGroup, 
      liveValidate,
      validGroups = [], errorGroups = []
    } = this.state;
    
    const set = R.clone(this.set);
    //Replace default formData with user formData
    set.formData = this.state.formData || set.formData;

    let groupKeys;
    if (set.schema.groups) { groupKeys = Object.keys(group(set.schema.properties, set.schema.groups)); }
    else { return (<h5> Error: Group information not found in schema.</h5>); }

    const groupOptions = groupKeys.map(group => ({
      label: group,
      onClick: this.changeGroup,
      active: selectedGroup === group,
      icon: '' + (errorGroups.includes(group) ? '🛑' : '') + (validGroups.includes(group) ? '✅' : '')
    }));

    let navOptions = [
      { label: 'Home', onClick: () => this.handleHomeClick() },
      { label: 'Load JSON', onClick: () => this.changeGroup('LOADJSON'), active: selectedGroup === 'LOADJSON' },
      ...groupOptions,
      { label: 'Generate JSON-LD', onClick: () => this.changeGroup('MAKEJSON'), active: selectedGroup === 'MAKEJSON' }
    ];
    if (this.state.disableLoadJSON) { navOptions = navOptions.filter(option => option.label !== 'Load JSON'); }

    let main;
    if (selectedGroup === "LOADJSON") {
      main = ( <StartPage 
        shouldChallenge={!! this.state.formData}
        loadedFrom={this.state.loadedFrom}
        exampleURL={set.exampleURL}
        checkType={selectedSet}
        schema={set.schema}  // change to forwarded annon func
        onLoadFormData={this.loadExternalFormData} 
      /> );
    } else if (selectedGroup === "MAKEJSON") {
      const obj = this.outputFormData();
      main = (
        <MakeJSONPage 
          id_insertion_passed={!!obj}
          obj={obj || R.clone(this.state.formData)}
          remoteResponse={this.context.response}
          validationImage={this.context.validationImage}
          onValidate={this.remoteValidation}
          onSave={this.saveFile}
        /> 
      );
    } else if (selectedGroup === 'ABOUT') {
      main = ( <About /> );
    } else {
      main = (
        <Catagorizor
          key={ selectedSet }
          disableCatagorization={false}
          set={{...set, schema: JSONvisitors.removeIDs(R.clone(set.schema))}}
          selectedGroup={selectedGroup}
          // reportGroups={this.updateGroups}
          onFormDataChange={this.userEditedFormData}

          throughArgs={{ 
            liveValidationEnabled: liveValidate,
            delayLiveValidateUserInput: !this.state.attemptedRemoteValidation,
            onSubmit: this.onSubmit
          }}
        />
      );
    }

    return (
      <>
        <Modal show={this.state.challengeModal} >
          <VerifyUserAction 
            onAccept={this.state.modalAccepted} 
            onCancel={this.clearModal} 
          />
        </Modal>

        <div className="navbar navbar-default navbar-fixed-top container-fluid">
          <div className="container-fluid">
            <div className="navbar-header">
              
              <a className="navbar-brand" onClick={() => this.changeGroup('ABOUT')}>
                <img src={geocodes_png} />
              </a>
              <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar-collapse-1" aria-expanded="false" style={{marginTop: '2rem'}}>
                <span className="sr-only">Toggle navigation</span>
                <span className="icon-bar"></span>
                <span className="icon-bar"></span>
                <span className="icon-bar"></span>
              </button>
            </div>
            <div className="collapse navbar-collapse" id="navbar-collapse-1">
              <NavPillSelector  options={navOptions} />        
            </div>

          </div>
        </div>

        <div className="main">
          { main }
        </div>

        <div className="margin-y-lg" style={{ textAlign: 'center' }} >
          <a href="http://www.earthcube.org" >
            <img src={earthcube_png}  style={{ height: '5.25rem' }}/>
          </a>
        </div>

      </>
    );
  }
}

// Convert to function (higher order function ? )
// export class Catagorizor extends Component {

function Catagorizor(props) {
  // render() {

    const isEnabled = () => {
      const { set, selectedGroup, disableCatagorization } = props;
      return  !disableCatagorization && selectedGroup && set.schema.groups; 
    }
  
    const onFormDataChange = formData => {
      if (isEnabled()) {
        const next = R.mergeAll([set.formData, formData])
        props.onFormDataChange(next);
      } else {
        props.onFormDataChange(formData);
      }
    };

    
    const subSchema = (schema, selectedGroup) => {
      // const { schema } = props;
      const groups = group(schema.properties, schema.groups);
      const sub = createSchemaShell(schema);
      sub.properties = groups[selectedGroup];
      sub.required = R.intersection(schema.required, Object.keys(groups[selectedGroup]));
      return sub;
    }
  
    const subFormData = (schema, selectedGroup, formData) => {
      const groups = group(schema.properties, schema.groups);    
      const keys = Object.keys(groups[selectedGroup]);
      return R.pick(keys, formData);
    }
   
    const ui_sub_schema = (schema, selectedGroup, uiSchema) => {
      const groups = group(schema.properties, schema.groups);
      const selectedGroupKeys = Object.keys(groups[selectedGroup]);
      return R.pick(selectedGroupKeys, uiSchema);
    };

    let { set, selectedGroup } = props;
    let { schema, uiSchema, formData, fields } = set;

    if (isEnabled()) {
      schema = subSchema(set.schema, selectedGroup);
      formData = subFormData(set.schema, selectedGroup, set.formData);
      uiSchema = ui_sub_schema(set.schema, selectedGroup, set.uiSchema);
      // console.log('[Catagorizor render()] | Subsections :', {schema, formData, uiSchema});
    } else {
      // if (disableCatagorization) { console.log('[Catagorizor render()] | Disabled'); }
      // if (!selectedGroup) { console.log('[Catagorizor render()] | No Selected Catagory'); }
    }

    return (
      <SuperEditorForm
        schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        fields={fields}
        onFormDataChange={onFormDataChange}
        {...props.throughArgs}
      />
    );
  // }
}

/** For Bugfix JIRA 198/199. Used to suppress toggle of live validation on first render. */
let SuperEditForm_single_supress = true;

class SuperEditorForm extends Component {

  state = { form: false /* , suppressNextPropagation: true  */}

  componentDidMount() {
    this.load(this.props);
  }

  // From original playground, could likely be reduced/removed
  load = data => {
    // Reset the ArrayFieldTemplate whenever you load new data
    const { ArrayFieldTemplate, ObjectFieldTemplate } = data;
    // uiSchema is missing on some examples. Provide a default to
    // clear the field in all cases.
    const { uiSchema = {} } = data;
    // force resetting form component instance
    this.setState({ form: false }, _ =>
      this.setState({
        ...data,
        form: true,
        ArrayFieldTemplate,
        ObjectFieldTemplate,
        uiSchema,
        liveValidationEnabled: false
      })
    );
  };

  //TODO performance enhance by passing string of schema, instead of brute force deepEquals
  static getDerivedStateFromProps(props, state) {
    const { schema } = state;
    if ( !deepEquals(props.schema, schema) ) {
      return { ...props, form: false, liveValidationEnabled: false, errorBox: false ,  userEditedFormData: false /* , suppressNextPropagation: true  */ };
    }
    return null;
  }

  static getDerivedStateFromError(error) {
    console.error('Supereditform ', error);
    return { form: true, errorBox: true, formData: {} };
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextState.form === false) { return true; }
    return shouldRender(this, nextProps, nextState);
  }

  componentDidUpdate() {
    // console.log('[SuperEditorForm compDidUpdate()]');
    if (this.state.form === false && this.state.errorBox === false) {
      // With form cleared, create new instance
      this.setState({ form: true });  
    }
  }

  onSchemaEdited = schema => this.setState({ schema });
  onUISchemaEdited = uiSchema => this.setState({ uiSchema });
  onFormDataEdited = formData => this.setState({ formData });
  onFormDataChange = ({ formData }) => {
    console.log('[SuperEditForm onFormDataChange()]' ,formData);
    
    // Potential Performance Hit
    // if (!R.equals(formData, this.state.formData)) {
      if (SuperEditForm_single_supress) { SuperEditForm_single_supress = false; return; }

      this.setState({ formData , userEditedFormData: true }, () => {
        // if (this.state.suppressNextPropagation) { this.setState({suppressNextPropagation: false}); }
        // else { this.props.onFormDataChange(this.state.formData); }
  
        this.props.onFormDataChange(this.state.formData); 
      });
    // 
  };
 
  render() {
    const {
      schema,
      uiSchema,
      formData,
      fields,
      validate,
      ArrayFieldTemplate,
      ObjectFieldTemplate,
      transformErrors,
    } = this.state;

    let liveValidate = false;

    if (this.props.liveValidationEnabled) {
      if ( ! this.props.delayLiveValidateUserInput) { liveValidate = true;}
      else {
        if ( this.props.delayLiveValidateUserInput && this.state.userEditedFormData ) { liveValidate = true; }
      }
    }

    return (
      <div className="container-fluid margin-bottom-lg">
      
        { this.state.errorBox && (
            <p className="col-xs-offset-1 col-xs-10 padding-y-xs bg-warning" style={{textAlign: 'center', fontSize: '16px'}}>
              The JSON data for this group is malformed and an error occurred while attempting to render the form. The data will be overwritten with your new input here.
            </p>
        )}

        <div className="col-sm-12" >
          {this.state.form && (
            <Form
              ArrayFieldTemplate={ArrayFieldTemplate}
              ObjectFieldTemplate={ObjectFieldTemplate}
              
              liveValidate={liveValidate}
              noHtml5Validate={true}
              validate={validate}
              
              schema={schema}
              uiSchema={uiSchema}
              fields={fields}
              formData={formData}
              
              preValidation={ formData => { 
                console.log(formData);
                // Optional object with required properies hack
                // https://github.com/mozilla-services/react-jsonschema-form/issues/675
                if ( formData.publisher && formData.publisher.name === undefined && formData.publisher.url === undefined ) 
                  { formData.publisher = undefined; }
                // "User experience" hack
                let res = JSONvisitors.removeArrayBlanks(schema, R.clone(formData)); 
                return [res, !R.equals(res, formData)];
              }}
    
              onChange={this.onFormDataChange}
              onSubmit={({ formData, formDataChanged }, e) => {
                // console.log("submitted formData", formData);
                // console.log("submit event", e);
                if ( formData.publisher && formData.publisher.name === undefined && formData.publisher.url === undefined ) 
                { formData.publisher = {}; formDataChanged = true; }

                if (formDataChanged) { this.onFormDataChange(formData); }
                this.props.onSubmit();
              }}
              // onBlur={(id, value) =>
              //   console.log(`Touched ${id} with value ${value}`)
              // }
              // onFocus={(id, value) =>
              //   console.log(`Focused ${id} with value ${value}`)
              // }
              transformErrors={transformErrors}
              onError={() => window.scrollTo(0,0)}>
              
              <div style={{ textAlign: 'center' }}>
                <button type="submit" className="btn btn-info btn-lg">
                  Validate & Continue
                </button>
              </div>

            </Form>
          )}

        </div>
      </div>
    );
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);

  let startupDefaults = {
    "action": params.get('action'),
    "set": params.get('set')
  };

  // console.log({startupDefaults});

  const retrieveStartValues = () => {
    console.log('[retrieveStartValues] HIT');
    const temp = startupDefaults;
    startupDefaults = {};
    return temp;
  }

  render(
    <Back retrieveStartValues={retrieveStartValues}/>
    , 
    document.getElementById("app")
  ); 

});


