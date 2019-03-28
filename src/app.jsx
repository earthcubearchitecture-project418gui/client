import React, { Component } from "react";                 // External deps
import { render } from "react-dom";

import * as R from 'ramda';
import { setImmediate } from 'core-js-pure';

import TriEditor from './tri-editor.jsx';                 // Internal deps
import Form from "../libs/rjsf";
import { shouldRender, deepEquals } from "../libs/rjsf/utils.js";

                                                          // Components
import { NavPillSelector, ThemeSelector } from './nav-pill.jsx';
import { StartPage } from './start-page.jsx';
import { MakeJSONPage } from './make-json-page.jsx';

import BackContext from './back-context.js';              // Local .js
import { sets as SchemaSets } from "./sets/sets.js";
import themes from './themes.js';
import { group, ungroup, createShell } from './funcs.js';

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
    this.state = {back: undefined, callbacks: []};
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
      .then(json => this.setState({ back:json } , () => { console.log(this.state.back); return; this.executeOnRemoteValidation(); } ) )
      .catch(err => console.error(err));  
  }

  invalidate = () => this.setState({ back: undefined });

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

  registerOnRemoteValidation = (callback) => {
    const callbacks = this.state.callbacks.slice();
    callbacks.push(callback);
    this.setState({ callbacks });
    return () => {
      const i = this.state.callbacks.indexOf(callback);
      const callbacks = this.state.callbacks.slice().splice(i, 1);
      this.setState({ callbacks })
    };
  }
  executeOnRemoteValidation = () => this.state.callbacks.map(c => c());

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
        icon: this.verificationImage(),
        // registerOnRemoteValidation: this.registerOnRemoteValidation 
      }} >
        <App retrieveStartValues={this.props.retrieveStartValues}/>
      </BackContext.Provider>
    );
  }
}


class App extends Component {
  // static contextType = BackContext;
  static defaultTheme = "paper";

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
    this.sets = SchemaSets;
    
    let {selectedSet, action} = R.mergeAll([
      props.retrieveStartValues(),
      {
        "set": Object.keys(this.sets)[0],
        "action": 'new'
      }
    ]);

    if ( !Object.keys(this.sets).includes(selectedSet) ) { selectedSet = Object.keys(this.sets)[0]; }
    let selectedGroup;
    // if (action === 'open') { group = 'LOADJSON' } else { group = Object.keys(this.sets[set].schema.groups)[0]}

    this.state = { 
      editorTheme: "default",
      theme: App.defaultTheme,

      liveSettings: {
        validate: true,
        disable: false,
        disableTripleEdit: false
      },

      selectedSet, 
      groups: undefined,
      selectedGroup, 
      formData: undefined, 
      hasUserEdits: false
    };
  }

  //TODO maybe move mount logic in Supereditform to here...
  componentDidMount() {
    const theme = App.defaultTheme;
    this.onThemeSelected(theme, themes[theme]);
  }

  componentDidUpdate() { 
    const { groups, selectedGroup } = this.state;
    if (!groups) { return; }
    if ( !this.state.selectedGroup ) {
      this.setState({ selectedGroup: groups[0] });
    }
  }

  onThemeSelected = (theme, { stylesheet, editor }) => {
    this.setState({ theme, editorTheme: editor ? editor : "default" });
    setImmediate(() => {
      // Side effect!
      document.getElementById("theme").setAttribute("href", stylesheet);
    });
  };

  setLiveSettings = ({ formData }) => this.setState({ liveSettings: formData });
  
  changeSet = selectedSet => {
    if (selectedSet === this.state.selectedSet) { return; }
    this.setState({ selectedSet: selectedSet, selectedGroup: undefined, groups: undefined });  
  };

  updateGroups = groups => this.setState({groups});
  changeGroup = selectedGroup => this.setState({selectedGroup});

  loadExternalFormData = formData => this.setState({formData, hasUserEdits: false});
  userEditedFormData = formData => this.setState({formData, hasUserEdits: true});

  render() {
    const {  selectedSet, selectedGroup, theme, editorTheme, liveSettings } = this.state;
    
    const set = { ...this.sets[this.state.selectedSet] };
    //Replace default formData with user formData
    set.formData = this.state.formData || set.formData;

    const setOptions = Object.keys(this.sets).map(set => ({
      label: set,
      onClick: this.changeSet,
      active: selectedSet === set
    }));

    const groupOptions = (this.state.groups || []).map(group => ({
      label: group,
      onClick: this.changeGroup,
      active: selectedGroup === group
    }));

    const navOptions = [
      { label: 'Load JSON', onClick: () => this.changeSet('LOADJSON'), active: selectedSet === 'LOADJSON' },
      { label: 'Sets >>>',  onClick: () => {} },
      ...setOptions,
      { label: ' <<< Sets | Groups >>>', onClick: () => {} },
      ...groupOptions,
      { label: '<<< Groups', onClick: () => {} },
      { label: 'Make JSON',  onClick: () => this.changeSet('MAKEJSON'), active: selectedSet === 'MAKEJSON' }
    ];

    let main;

    if (this.state.selectedSet === "LOADJSON") {
      main = ( <StartPage 
        shouldChallenge={this.state.hasUserEdits}
        onLoadFormData={this.loadExternalFormData} 
      /> );
    } else if (this.state.selectedSet === "MAKEJSON") {
      main = (
        <MakeJSONPage 
          json={this.state.formData} 
          // josn={fillInMissingIDs(this.sets[this.state.selectedSchema].schema, R.clone(this.state.formData))}
          // onSave={this.saveFile}
          // onValidateClick={this.remoteValidation}
        /> 
      );
    } else {
      main = (
        <Catagorizor
          // ref={this.SEF}
          key={ selectedSet }
          disableCatagorization={false}
          set={set}
          selectedGroup={selectedGroup}
          reportGroups={this.updateGroups}
          onFormDataChange={this.loadExternalFormData}

          throughArgs={{ 
            editorTheme, 
            liveValidate: liveSettings.validate, 
            disableForm: liveSettings.disable, 
            disableTripleEdit: liveSettings.disableTripleEdit
          }}
        />
      );
    }

    return (
      <div>
        <div className="container-fluid">
          <div className="page-header">
            <div className="row">
              <div className="col-sm-2">
                <img src={geocodes_png} style={{width: '200px' }} />
              </div>
              <div className="col-sm-8">
                <NavPillSelector 
                  options={navOptions}
                />
              </div>
              <div className="col-sm-2">
                <Form
                  schema={App.liveSettingsSchema}
                  formData={liveSettings}
                  onChange={this.setLiveSettings} >
                  <div />
                </Form>
              </div>
              {/* <div className="col-sm-2">
                <ThemeSelector 
                  themes={themes}
                  theme={theme} 
                  select={this.onThemeSelected} />
              </div> */}
            </div>
          </div>
        </div>

        { main }
      </div>
    );
  }
}


export class Catagorizor extends Component {
  // static contextType = BackContext;
  constructor(props) {
    super(props);
    console.log('[Catagorizor constructor()]');
  }
  state = { previousReportedGroups: null };

  componentDidMount() {
    const { set: { schema }, reportGroups } = this.props;

    if (!this.props.set.schema.groups) { console.log('[Catagorizer] no schema.groups'); return; }

    const groupKeys = Object.keys(group(schema.properties, schema.groups));
    reportGroups(groupKeys);
    console.log('Reported groups');
  }

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
    let { schema, uiSchema, formData } = set;

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
        onFormDataChange={this.onFormDataChange}
        {...this.props.throughArgs}
      />
    );
  }
}

class SuperEditorForm extends Component {

  state = { form: false }

  componentDidMount() {
    this.load(this.props);
  }

  static getDerivedStateFromProps(props, state) {
    const { schema, form } = state;
    if (form && !deepEquals(props.schema, schema)) {
      return { ...props, form: false };
    }
    return null;
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextState.form === false) { return true; }
    return shouldRender(this, nextProps, nextState);
  }

  componentDidUpdate() {
    if (this.state.form === false) {
      // With form cleared, create new instance
      this.setState({ form: true });  
    }
  }

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
      })
    );
  };

  onSchemaEdited = schema => this.setState({ schema });

  onUISchemaEdited = uiSchema => this.setState({ uiSchema });

  onFormDataEdited = formData => this.setState({ formData });

  onFormDataChange = ({ formData }) =>
    this.setState({ formData }, () => 
      this.props.onFormDataChange(this.state.formData));
 
  render() {
    const {
      schema,
      uiSchema,
      formData,
      validate,
      ArrayFieldTemplate,
      ObjectFieldTemplate,
      transformErrors,
    } = this.state;

    const { 
      liveValidate,
      disableForm,
      editorTheme
    } = this.props;

    return (
      <div className="container-fluid">
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
              }}
              // fields={{ geo: GeoPosition }}
              validate={validate}
              // onBlur={(id, value) =>
              //   console.log(`Touched ${id} with value ${value}`)
              // }
              // onFocus={(id, value) =>
              //   console.log(`Focused ${id} with value ${value}`)
              // }
              transformErrors={transformErrors}
              onError={log("errors")}>
              
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
    "set": params.get('schema')
  };

  const retrieveStartValues = () => {
    const temp = startupDefaults;
    startupDefaults = undefined;
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


