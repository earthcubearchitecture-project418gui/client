import React, { Component } from "react";                 // External deps
import { render } from "react-dom";

import * as R from 'ramda';
import { setImmediate } from 'core-js-pure';

import * as FileSaver from 'file-saver';

import TriEditor from './tri-editor.jsx';                 // Internal deps
import Form from "./libs/rjsf";
import { shouldRender, deepEquals } from "./libs/rjsf/utils.js";

                                                          // Components
import { NavPillSelector, ThemeSelector } from './nav-pill.jsx';
import { StartPage } from './start-page.jsx';
import { MakeJSONPage } from './make-json-page.jsx';

import BackContext from './back-context.js';              // Local .js
import { sets as SchemaSets } from "./sets/sets.js";
import themes from './themes.js';
import { group, ungroup, createShell, stripToTopProperty, mapTopPropertyToGroup } from './funcs.js';
import { fillInMissingIDs, removeIDs } from './json-schema-visitors.js';

import verified_png from './images/verified.png';       // Images
import clear_png from './images/clear.png';
import error_png from './images/error.png';

import geocodes_png from './images/geofinalLight.png';

import 'codemirror/lib/codemirror.css'                    // CSS
import "codemirror/mode/javascript/javascript";

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
          errorList={R.path(['back','errors'], this.state)}
          />
      </BackContext.Provider>
    );
  }
}


class App extends Component {
  static contextType = BackContext;

  static defaults = {
    theme: "superhero",
    set: "dataset"
  };

  static liveSettingsSchema = {
    type: "object",
    properties: {
      validate: { type: "boolean", title: "Live validation" },
      disable: { type: "boolean", title: "Disable whole form" },
      disableTripleEdit: { type: "boolean", title: "Disable Tri-Edit" }
    },
  };
  
  constructor(props) {
    super(props);
    this.sets = SchemaSets; // TODO: change to App.sets

    const start = props.retrieveStartValues();
    const selectedSet = (start.set && Object.keys(this.sets).includes(start.set))
      ? start.set 
      : App.defaults.set;

    const selectedGroup = start.action === 'load' ? 'LOADJSON' : Object.keys(this.sets[selectedSet].schema.groups)[0];
    const disableLoadJSON = start.action === 'new';

    this.state = { 
      editorTheme: "default",
      theme: App.defaults.theme,

      liveSettings: {
        validate: true,
        disable: false,
        disableTripleEdit: true
      },

      selectedSet, 
      selectedGroup, 
      formData: undefined, 

      // visitedGroups: [],

      disableLoadJSON
    };
  }
  
  componentDidMount() {
    const theme = App.defaults.theme;
    this.onThemeSelected(theme, themes[theme]);
  }

  componentDidUpdate() { 
    // const { groups, selectedGroup } = this.state;
    // if (!groups) { return; }
    // if ( !this.state.selectedGroup ) {
    //   debugger;
    //   this.setState({ selectedGroup: groups[0] });
    // }
    // const { selectedGroup, visitedGroups = [] } = this.state;
    // if ( ! visitedGroups.includes(selectedGroup)) { this.setState({visitedGroups: [selectedGroup, ...visitedGroups]}); }
  }

  static getDerivedStateFromProps(props, state) {
    if (!props.errorList) { return { errorList: undefined, validGroups: undefined, errorGroups: undefined }; }

    if (!deepEquals(props.errorList, state.errorList)) {
      const errorList = props.errorList;
      const errorGroups = [];
      //TODO: SchemaSets -> App.sets
      const groups = SchemaSets[state.selectedSet].schema.groups;

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
      return { errorList: props.errorList, validGroups, errorGroups };
    }
    return null;
  }
  invalidate = (group = '') => this.setState( ({validGroups, errorGroups}) => {
    if (validGroups) { validGroups = R.reject(v => v === group, validGroups); }
    if (errorGroups) { errorGroups = R.reject(v => v === group, errorGroups); }

    return { validGroups, errorGroups };
  });

  // For NavPill
  setLiveSettings = ({ formData }) => this.setState({ liveSettings: formData });
  changeSet = selectedSet => {
    if (selectedSet === this.state.selectedSet) { this.setState({ selectedGroup: undefined }); }
    else { this.setState({ selectedSet: selectedSet, selectedGroup: undefined, groups: undefined, formData: undefined, visitedGroups: [] }); }
  };
  changeGroup = selectedGroup => {
    // const { selectedGroup: prevSelectedGroup, visitedGroups = [] } = this.state;
    // if ( ! visitedGroups.includes(prevSelectedGroup)) { visitedGroups.push(prevSelectedGroup) }

    this.setState({selectedGroup /*, visitedGroups */ });
  };
  onThemeSelected = (theme, { stylesheet, editor }) => {
    this.setState({ theme, editorTheme: editor ? editor : "default" });
    setImmediate(() => {
      // Side effect!
      document.getElementById("theme").setAttribute("href", stylesheet);
    });
  };
  
  // For Catagorizor
  // updateGroups = groups => this.setState({groups});
  userEditedFormData = formData => this.setState({formData}, () => this.invalidate(this.state.selectedGroup));
  onSubmit = () => {
    const set = this.sets[this.state.selectedSet];
    const groupKeys = Object.keys(group(set.schema.properties, set.schema.groups)); 
    // const groups  = Object.keys(this.state.groups);
    const index = groupKeys.indexOf(this.state.selectedGroup);
    if (index + 1 < groupKeys.length) {
      this.setState({selectedGroup: groupKeys[index + 1]}, () => window.scrollTo(0, 0));
    } else if (index + 1 === groupKeys.length) {
      this.setState({selectedGroup: "MAKEJSON"}, () => window.scrollTo(0, 0));
    }
  };

  // For StartPage
  loadExternalFormData = formData => this.setState({formData});
  
  // For MakeJSONPage
  saveFile = () => {
    var blob = new Blob([JSON.stringify(this.state.formData, undefined, 2)], {type: "text/plain;charset=utf-8"});
    FileSaver.saveAs(blob, "ucar-json-instance.json");
  }
  fillInMissingIDs = () => fillInMissingIDs(this.sets[this.state.selectedSet].schema, R.clone(this.state.formData || {}), { 'url' : 'http://example.org' });
  
  // For Back context
  remoteValidation = () => {
    console.log('[App remoteValidation()]');
    this.setState({ errorList: undefined, validGroups: undefined, errorGroups: undefined}, () => 
      this.context.validate({
        schema: this.state.selectedSet,
        doc: this.fillInMissingIDs()
      })
    );
  };

  render() {
    const { 
      selectedSet, selectedGroup, 
      theme, editorTheme, liveSettings,
      validGroups = [], errorGroups = []
    } = this.state;
    
    const set = { ...this.sets[this.state.selectedSet] };
    //Replace default formData with user formData
    set.formData = this.state.formData || set.formData;

    // const invalidTopProperties = stripToTopProperty(R.pathOr([], ['context','response','errors'], this));
    
    // const setOptions = Object.keys(this.sets).map(set => ({
    //   label: set,
    //   onClick: this.changeSet,
    //   active: selectedSet === set
    // }));

    let groupKeys;
    if (set.schema.groups) { groupKeys = Object.keys(group(set.schema.properties, set.schema.groups)); }

    // const errorGroups = this.context.errorGroups(set.schema.groups);
    const groupOptions = groupKeys.map(group => ({
      label: group,
      onClick: this.changeGroup,
      active: selectedGroup === group,
      icon: '' + (errorGroups.includes(group) ? '🛑' : '') + (validGroups.includes(group) ? '✅' : '')
    }));

    const navOptions = [
      { label: 'Load JSON', onClick: () => this.changeGroup('LOADJSON'), active: selectedGroup === 'LOADJSON' },
      ...groupOptions,
      { label: 'Save JSON',  onClick: () => this.changeGroup('MAKEJSON'), active: selectedGroup === 'MAKEJSON' }
    ];
    if (this.state.disableLoadJSON) { navOptions.shift(); }

    if (!groupKeys) { navOptions.unshift({ label: 'Group information not found in schema.' }); }

    let main;
    if (this.state.selectedGroup === "LOADJSON") {
      main = ( <StartPage 
        shouldChallenge={!! this.state.formData}
        checkType={selectedSet}
        onLoadFormData={this.loadExternalFormData} 
      /> );
    } else if (this.state.selectedGroup === "MAKEJSON") {
      main = (
        <MakeJSONPage 
          // json={this.state.formData} 
          json={this.fillInMissingIDs()}
          remoteResponse={this.context.response}
          validationImage={this.context.validationImage}
          onValidateClick={this.remoteValidation}
          onSave={this.saveFile}
        /> 
      );
    } else {
      main = (
        <Catagorizor
          key={ selectedSet }
          disableCatagorization={false}
          set={{...set, schema: removeIDs(R.clone(set.schema))}}
          selectedGroup={selectedGroup}
          // reportGroups={this.updateGroups}
          onFormDataChange={this.userEditedFormData}

          throughArgs={{ 
            editorTheme, 
            liveValidate: liveSettings.validate,
            // prevVisited: this.state.visitedGroups.includes(selectedGroup), 
            disableForm: liveSettings.disable, 
            disableTripleEdit: liveSettings.disableTripleEdit,
            onSubmit: this.onSubmit
          }}
        />
      );
    }

    return (
      <>
        <div className="navbar navbar-default navbar-fixed-top container-fluid">
          <div className="container-fluid">
            <div className="navbar-header">
              
              <a className="navbar-brand" href="https://www.earthcube.org/geocodes">
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
              {/* <ul className="nav navbar-nav navbar-right">
                <li><a href="#">Link</a></li>
                <li className="dropdown">
                  <a href="#" className="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Dropdown <span className="caret"></span></a>
                  <ul className="dropdown-menu">
                    <li><a href="#">Action</a></li>
                    <li><a href="#">Another action</a></li>
                    <li><a href="#">Something else here</a></li>
                    <li role="separator" className="divider"></li>
                    <li><a href="#">Separated link</a></li>
                  </ul>
                </li>
              </ul> */}
            </div>
          </div>
        </div>

        <div className="main">
          { main }
        </div>
      </>
    );
  }
}


export class Catagorizor extends Component {
  // static contextType = BackContext;
 
  state = { previousReportedGroups: null };

  // componentDidMount() {
  //   const { set: { schema }, reportGroups } = this.props;

  //   if (!this.props.set.schema.groups) { console.log('[Catagorizer] no schema.groups'); return; }

  //   const groupKeys = Object.keys(group(schema.properties, schema.groups));
  //   reportGroups(groupKeys);
  //   console.log('Reported groups');
  // }

  isEnabled = () => {
    const { set, selectedGroup, disableCatagorization } = this.props;
    return  !disableCatagorization && selectedGroup && set.schema.groups; 
  }

  transformedFormData = () => group(this.props.set.formData, this.props.set.schema.groups);
  restoreInstance = transformed => ungroup(transformed, this.props.set.schema.groups);

  onFormDataChange = formData => {
    if (this.isEnabled()) {
      let next = this.transformedFormData();
      next[this.props.selectedGroup] = formData;
      this.props.onFormDataChange(this.restoreInstance(next));
    } else {
      this.props.onFormDataChange(formData);
    }
  };

  render() {

    const subSchema = (schema, selectedGroup) => {
      // const { schema } = this.props;
      const groups = group(schema.properties, schema.groups);
      const shell = createShell(schema);
      shell.properties = groups[selectedGroup];
      shell.required = R.intersection(schema.required, Object.keys(groups[selectedGroup]));
      return shell;
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

    let { set, selectedGroup } = this.props;
    let { schema, uiSchema, formData, fields } = set;

    if (this.isEnabled()) {
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
        onFormDataChange={this.onFormDataChange}
        {...this.props.throughArgs}
      />
    );
  }
}

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
        liveValidate: false
      })
    );
  };

  static getDerivedStateFromProps(props, state) {
    const { schema, form } = state;
    if (form && !deepEquals(props.schema, schema)) {
      return { ...props, form: false, liveValidate: false /* , suppressNextPropagation: true  */ };
    }
    return null;
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextState.form === false) { return true; }
    return shouldRender(this, nextProps, nextState);
  }

  componentDidUpdate() {
    // console.log('[SuperEditorForm compDidUpdate()]');
    if (this.state.form === false) {
      // With form cleared, create new instance
      this.setState({ form: true });  
    }
  }

  onSchemaEdited = schema => this.setState({ schema });

  onUISchemaEdited = uiSchema => this.setState({ uiSchema });

  onFormDataEdited = formData => this.setState({ formData });

  onFormDataChange = ({ formData }) => {
    this.setState({ formData , liveValidate: this.props.liveValidate }, () => {
      // if (this.state.suppressNextPropagation) { this.setState({suppressNextPropagation: false}); }
      // else { this.props.onFormDataChange(this.state.formData); }

      // Potential Performance Hit
      if (!R.equals(this.state.formData, this.props.formData)) { 
        this.props.onFormDataChange(this.state.formData); 
      }
    });
  };
 
  render() {
    const {
      schema,
      uiSchema,
      formData,
      fields,
      validate,
      liveValidate,
      ArrayFieldTemplate,
      ObjectFieldTemplate,
      transformErrors,
    } = this.state;

    const { 
      disableForm,
      editorTheme
    } = this.props;

    return (
      <div className="container-fluid margin-bottom-lg">
        { !this.props.disableTripleEdit && (
          <TriEditor 
            editor={editorTheme}
            schema={schema}
            uiSchema={uiSchema}
            formData={formData}

            onSchemaEdited={this.onSchemaEdited}
            onUISchemaEdited={this.onUISchemaEdited}
            onFormDataEdited={this.onFormDataEdited}
          /> 
        )}
        <div className={ this.props.disableTripleEdit ? "col-sm-12" : "col-sm-5" }>
          {this.state.form && (
            <Form
              ArrayFieldTemplate={ArrayFieldTemplate}
              ObjectFieldTemplate={ObjectFieldTemplate}
              liveValidate={liveValidate}
              disabled={disableForm}
              schema={schema}
              uiSchema={uiSchema}
              formData={formData}
              onChange={this.onFormDataChange}
              onSubmit={({ formData }, e) => {
                console.log("submitted formData", formData);
                console.log("submit event", e);
                this.props.onSubmit();
              }}
              fields={fields}
              validate={validate}
              // onBlur={(id, value) =>
              //   console.log(`Touched ${id} with value ${value}`)
              // }
              // onFocus={(id, value) =>
              //   console.log(`Focused ${id} with value ${value}`)
              // }
              transformErrors={transformErrors}
              onError={log("errors")}>
              
              <div style={{ textAlign: 'center' }}>
                {/* <button type="button" className="btn btn-info margin-right-xs" onClick={() => this.setState({liveValidate: !!this.props.liveValidate})}>
                  Validate
                </button> */}
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

  // let sticky;
  // setTimeout(() => {
  //   sticky = document.querySelector('#navbar').offsetTop;
  // }, 500);

  // window.addEventListener('scroll', scroll);


  // function scroll(e) {
  //   const nav = document.querySelector('#navbar');
  //   const buffer = document.querySelector('#nav-buffer');

  //   if (!nav) { return; }

  //   if (window.pageYOffset  >= sticky){
  //     nav.classList.add('navbar-fixed-top');
  //     buffer.classList.remove('hidden');
  //   } else if (window.pageYOffset <= sticky) {
  //     nav.classList.remove('navbar-fixed-top');
  //     buffer.classList.add('hidden');
  //   }
  // }

  // const raf = window.requestAnimationFrame;
  // let lastScrollTop = window.scrollY;
  // raf(loop);
  // function loop() {
  //   let scrollTop = window.scrollY;
  //   if (lastScrollTop === scrollTop) {
  //       raf(loop);
  //       return;
  //   } else {
  //       lastScrollTop = scrollTop;

  //       // fire scroll function if scrolls vertically
  //       scroll();
  //       raf(loop);
  //   }
  // }

  // setTimeout(() => {
  //   document.querySelector('#file-input').click();
  // }, 1000);
  
});


