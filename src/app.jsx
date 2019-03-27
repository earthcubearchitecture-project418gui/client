import React, { Component } from "react";                 // External deps
import { render } from "react-dom";

import * as R from 'ramda';
import { setImmediate } from 'core-js-pure';

import TriEditor from './tri-editor.jsx';                 // Internal deps
import Form from "../libs/rjsf";
import { shouldRender, deepEquals } from "../libs/rjsf/utils.js";

                                                          // Components
import { NavPillSelector, ThemeSelector } from './nav-pill.jsx';

import BackContext from './back-context.js';              // Local .js
import { sets as SchemaSets } from "./samples";
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
  static contextType = BackContext;
  static defaultTheme = "paper";

  static liveSettingsSchema = {
    type: "object",
    properties: {
      validate: { type: "boolean", title: "Live validation" },
      disable: { type: "boolean", title: "Disable whole form" },
    },
  };
  
  superEditForm = React.createRef();

  constructor(props) {
    super(props);
    this.sets = SchemaSets;
    
    let {set, action} = R.mergeAll([
      props.retrieveStartValues(),
      {
        "set": Object.keys(this.sets)[0],
        "action": 'new'
      }
    ]);

    if ( !Object.keys(this.sets).includes(set) ) { set = Object.keys(this.sets)[0]; }
    let selectedGroup;
    // if (action === 'open') { group = 'LOADJSON' } else { group = Object.keys(this.sets[set].schema.groups)[0]}

    // const defaultInstance = this.sets[schema].default;

    this.state = { 
      editorTheme: "default",
      theme: App.defaultTheme,

      liveSettings: {
        validate: true,
        disable: false,
      },

      set, 
      selectedGroup, 
      formData: {}, 
      hasUserEdits: false
    };
  }

  set = () => this.sets[this.state.set];

  //TODO maybe move mount logic in Supereditform to here...
  componentDidMount() {
    const theme = App.defaultTheme;
    this.onThemeSelected(theme, themes[theme]);
  }

  loadSet = label => {
    this.setState({ set: label })
    // const set = this.sets[label];
    // if (this.superEditForm && this.superEditForm.current) {
    //   this.superEditForm.current.load(set);
    // }
  }
  
  setLiveSettings = ({ formData }) => this.setState({ liveSettings: formData });

  onThemeSelected = (theme, { stylesheet, editor }) => {
    this.setState({ theme, editorTheme: editor ? editor : "default" });
    setImmediate(() => {
      // Side effect!
      document.getElementById("theme").setAttribute("href", stylesheet);
    });
  };

  updateCatagories = (catagories) => {
    this.setState({catagories});
  };

  changeCatagory = (selectedGroup) => {
    this.setState({selectedGroup});
  }

  render() {
    console.log('[App render()]');
    const { theme, editorTheme, liveSettings } = this.state;
    // const throughArgs = R.pick(['theme', 'editorTheme', 'liveSettings'], this.state);
    
    const set = this.set();
    const throughArgs = { editorTheme, liveValidate: liveSettings.validate, disableForm: liveSettings.disable };

    const setOptions = Object.keys(this.sets).map(set => ({
      label: set,
      onClick: this.loadSet
    }));

    const catagoryOptions = (this.state.catagories || []).map(cat => ({
      label: cat,
      onClick: this.changeCatagory
    }));

    return (
      <div>
        <div className="container-fluid">
          <div className="page-header">
            <div className="row">
              <div className="col-sm-2">
                <img src={geocodes_png} style={{width: '200px' }} />
              </div>
              <div className="col-sm-6">
                <NavPillSelector 
                  options={[ ...setOptions, ...catagoryOptions ]}
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
              <div className="col-sm-2">
                <ThemeSelector 
                  themes={themes}
                  theme={theme} 
                  select={this.onThemeSelected} />
              </div>
            </div>
          </div>
        </div>

        <Catagorizor
          disableCatagorization={false}
          reportGroups={this.updateCatagories}
          selectedGroup={this.state.selectedGroup}
          set={set}
          throughArgs={throughArgs}
        />
      </div>
    );
  }
}


export class Catagorizor extends Component {
  // static contextType = BackContext;

  state = { previousReportedGroups: null };

  // SEF = React.createRef();

  componentDidUpdate() {
    if (!this.isEnabled()) {return;}
    const { set: {schema}, reportGroups } = this.props;
    const groupKeys = Object.keys(group(schema.properties, schema.groups));
    if (reportGroups && !R.equals(groupKeys, this.state.previousReportedGroups)) {
      this.setState({previousReportedGroups : groupKeys}, () =>  reportGroups(this.state.previousReportedGroups)); 
      console.log('Reported catagories');
    }
  }

  isEnabled = () => {
    const { set, selectedGroup, disableCatagorization } = this.props;
    if ( ! set.schema.groups ) { return false; }
    if (disableCatagorization && !selectedGroup) { return false; }
    return true;
  }

  // transformedInstance = () => group(this.props.formData, this.props.schema.groups);
  // restoreInstance = transformed => ungroup(transformed, this.props.schema.groups);
  
  // currentGroups = () => group(this.props.schema.properties, this.props.schema.groups);
  // currentProperties = () => this.currentGroups()[this.props.selectedGroup];
  // currentFormData = () => this.transformedInstance()[this.props.selectedGroup];

  // propperties = (groups, selectedGroup)

  // subSchema = (schema, selectedGroup) => {
  //   // const { schema } = this.props;
  //   const groups = group(schema.properties, schema.groups);
  //   const shell = createShell(schema);
  //   shell.properties = groups[selectedGroup];
  //   return shell;
  // }

  // subFormData = (schema, selectedGroup, formData) => {
  //   const groups = group(schema.properties, schema.groups);    
  //   const keys = Object.keys(groups[selectedGroup]);
  //   return R.pick(keys, formData);
  // }

 
  // ui_sub_schema = (schema, selectedGroup, uiSchema) => {
  //   const groups = group(schema.properties, schema.groups);
  //   const selectedGroupKeys = Object.keys(groups[selectedGroup]);
  //   return R.pick(selectedGroupKeys, uiSchema);
  // };

  /// Copied behaviour from library example
  /// Reset <Form /> on each update
  // setStateResetForm = ( obj ) => this.setState({ form: false }, _ => this.setState({...obj, form: true}) );

  // onFormDataChange = subData => {
  //   let next = this.transformedInstance();
  //   next[this.props.selectedGroup] = subData.formData;
  //   this.props.onChange(this.restoreInstance(next));
  // };

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

    let { set, selectedGroup, disableCatagorization } = this.props;
    let { schema, uiSchema, formData } = set;

    if ( ! set.schema.groups ) { disableCatagorization = true; }

    if (!disableCatagorization && selectedGroup) {
      schema = subSchema(set.schema, selectedGroup);
      formData = subFormData(set.schema, selectedGroup, set.formData);
      uiSchema = ui_sub_schema(set.schema, selectedGroup, set.uiSchema);
      console.log('[Catagorizor render()] | Subsections :', {schema, formData, uiSchema});
    } else {
      if (disableCatagorization) { console.log('[Catagorizor render()] | Disabled'); }
      if (!selectedGroup) { console.log('[Catagorizor render()] | No Selected Catagory'); }
    }

    return (
      <p> blank </p>
      // <SuperEditorForm
      //   // ref={this.SEF}
      //   // key={ ''+ (disableCatagorization||false) + (selectedGroup||'') }
        
      //   schema={schema}
      //   uiSchema={uiSchema}
      //   formData={formData}
      //   {...this.props.throughArgs}
      // />
    );

  }
}

class SuperEditorForm extends Component {
  // static defaultSet() { return SchemaSets.simple; }

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
    this.setState({ formData });
 
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
        <TriEditor 
          editor={editorTheme}
          schema={schema}
          uiSchema={uiSchema}
          formData={formData}

          onSchemaEdited={this.onSchemaEdited}
          onUISchemaEdited={this.onUISchemaEdited}
          onFormDataEdited={this.onFormDataEdited}
        />
        <div className="col-sm-5">
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
              onBlur={(id, value) =>
                console.log(`Touched ${id} with value ${value}`)
              }
              onFocus={(id, value) =>
                console.log(`Focused ${id} with value ${value}`)
              }
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


