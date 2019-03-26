import React, { Component } from "react";                 // External deps
import { render } from "react-dom";

import * as R from 'ramda';
import { setImmediate } from 'core-js-pure';

import TriEditor from './tri-editor.jsx';                 // Internal deps
import Form from "../libs/rjsf";
import { shouldRender, deepEquals } from "../libs/rjsf/utils.js";

                                                          // Components
import { NavPillSelector, ThemeSelector } from './Nav/original-nav.jsx';

import BackContext from './back-context.js';              // Local .js
import themes from './themes.js';
import { sets as SchemaSets } from "./samples";

import verified_png from './images/verified.png';       // Images
import clear_png from './images/clear.png';
import error_png from './images/error.png';

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
    let group;
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
      group, 
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

  load = label => {
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

  render() {
    console.log('[App render()]');
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
                  onSelected={this.load} 
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

        <SuperEditorForm
          // ref={this.superEditForm}
          set={this.set()}
          editorTheme={editorTheme}
          liveValidate={liveSettings.validate}
          disableForm={liveSettings.disable}
        />
      </div>
    );
  }
}


class SuperEditorForm extends Component {
  static defaultSet() { return SchemaSets.simple; }

  state = { form: false }

  componentDidMount() {
    this.load(this.props.set);
  }

  static getDerivedStateFromProps(props, state) {
    const { schema, form } = state;
    const { set } = props
    const omit = () => R.omit(['set'],props);
    if (form && !deepEquals(set.schema, schema)) {
      return { ...set, ...omit(), form: false };
    }
    return { ...omit() };
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


