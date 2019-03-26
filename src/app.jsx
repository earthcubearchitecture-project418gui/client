import React, { Component } from "react";
import { render } from "react-dom";

import TriEditor from './tri-editor.jsx';
import Form from "../libs/rjsf";
import { shouldRender } from "../libs/rjsf/utils.js";

import * as R from 'ramda';
import { setImmediate } from 'core-js-pure';

import { NavPillSelector, ThemeSelector } from './Nav/original-nav.jsx';

import BackContext from './back-context.js';
import themes from './themes.js';
import { sets as SchemaSets } from "./samples";

import 'codemirror/lib/codemirror.css'
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
    
    let {schema, action} = R.mergeAll([
      props.retrieveStartValues(),
      {
        "schema": Object.keys(this.sets)[0],
        "action": 'new'
      }
    ]);

    if ( !Object.keys(this.sets).includes(schema) ) { schema = Object.keys(this.sets)[0]; }
    let group;
    // if (action === 'open') { group = 'LOADJSON' } else { group = Object.keys(this.sets[schema].schema.groups)[0]}

    // const defaultInstance = this.sets[schema].default;

    this.state = { 
      editorTheme: "default",
      theme: App.defaultTheme,

      liveSettings: {
        validate: true,
        disable: false,
      },

      schema, 
      group, 
      formData: {}, 
      hasUserEdits: false
    };
  }

  //TODO move mount logic in Supereditform to here...
  componentDidMount() {
    const theme = App.defaultTheme;
    this.onThemeSelected(theme, themes[theme]);
  }

  load = data => {
    if (this.superEditForm && this.superEditForm.current) {
      this.superEditForm.current.load(data);
    }
  }
  
  setLiveSettings = ({ formData }) => this.setState({ liveSettings: formData });

  onThemeSelected = (theme, { stylesheet, editor }) => {
    this.setState({ theme, editorTheme: editor ? editor : "default" });
    setImmediate(() => {
      // Side effect!
      document.getElementById("theme").setAttribute("href", stylesheet);
    });
  };

  render() {
    const { theme, editorTheme, liveSettings } = this.state;
    const sets = this.sets;

    return (
      <div>
        <div className="container-fluid">
          <div className="page-header">
            <div className="row">
              <div className="col-sm-8">
                <NavPillSelector 
                  options={Object.keys(sets)}
                  onSelected={(label) => this.load(sets[label])} />
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

        <SuperEditorForm
          ref={this.superEditForm}
          editorTheme={editorTheme}
          liveValidate={liveSettings.validate}
          disable={liveSettings.disable}
        />
      </div>
    );
  }
}


class SuperEditorForm extends Component {
  static defaultSet() { return SchemaSets.simple; }

  constructor(props) {
    super(props);
    // initialize state with Simple data sample
    const { schema, uiSchema, formData, validate } = SuperEditorForm.defaultSet();
    this.state = {
      form: false,
      schema,
      uiSchema,
      formData,
      validate,
      // editor: "default",
      // theme: "default",
    };
  }

  componentDidMount() {
    this.load(SuperEditorForm.defaultSet());
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
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

  onSchemaEdited = schema => this.setState({ schema, shareURL: null });

  onUISchemaEdited = uiSchema => this.setState({ uiSchema, shareURL: null });

  onFormDataEdited = formData => this.setState({ formData, shareURL: null });

  onFormDataChange = ({ formData }) =>
    this.setState({ formData, shareURL: null });

  // onThemeSelected = (theme, { stylesheet, editor }) => {
  //   this.setState({ theme, editor: editor ? editor : "default" });
  //   setImmediate(() => {
  //     // Side effect!
  //     document.getElementById("theme").setAttribute("href", stylesheet);
  //   });
  // };

  // setLiveSettings = ({ formData }) => this.setState({ liveSettings: formData });

  render() {
    console.log('[SuperEditorForm render()]');
    
    const {
      schema,
      uiSchema,
      formData,
      // liveSettings,
      validate,
      // theme,
      // editor,
      ArrayFieldTemplate,
      ObjectFieldTemplate,
      transformErrors,
    } = this.state;

    const { 
      liveValidate,
      disableForm,
      editorTheme
    } = this.props;

    // const liveSettingsSchema = {
    //   type: "object",
    //   properties: {
    //     validate: { type: "boolean", title: "Live validation" },
    //     disable: { type: "boolean", title: "Disable whole form" },
    //   },
    // };

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
    "schema": params.get('schema')
  };

  const retrieveStartValues = () => {
    const temp = startupDefaults;
    startupDefaults = undefined;
    return temp;
  }

  render(
    <App retrieveStartValues={retrieveStartValues}/>
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


