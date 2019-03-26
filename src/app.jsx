import React, { Component } from "react";
import { render } from "react-dom";

import TriEditor from './tri-editor.jsx';
import themes from './themes.js';

import { shouldRender } from "../libs/rjsf/utils.js";
import { sets } from "./samples";
import Form from "../libs/rjsf";

import { setImmediate } from 'core-js-pure';

import 'codemirror/lib/codemirror.css'
import "codemirror/mode/javascript/javascript";


const log = type => console.log.bind(console, type);

class NavPillSelector extends Component {
  constructor(props) {
    super(props);
    this.state = { current: props.options[0] };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  onLabelClick = (label, i) => {
    return event => {
      event.preventDefault();
      this.setState({ current: label });
      setImmediate(() => this.props.onSelected(label, i));
    };
  };

  render() {
    return (
      <ul className="nav nav-pills">
        { this.props.options.map((label, i) => (
          <li
            key={i}
            role="presentation"
            className={this.state.current === label ? "active" : ""}>
            <a href="#" onClick={this.onLabelClick(label,i)} style={{ textTransform: 'capitalize' }}>
              {label}
            </a>
          </li>
        )) }        

        {/* Object.keys(this.props.options).map((label, i) => {
          return (
            <li
              key={i}
              role="presentation"
              className={this.state.current === label ? "active" : ""}>
              <a href="#" onClick={this.onLabelClick(label)} style={{ textTransform: 'capitalize' }}>
                {label}
              </a>
            </li>
          );
        }) */}
      </ul>
    );
  }
}

function ThemeSelector({ theme, select }) {
  const themeSchema = {
    type: "string",
    enum: Object.keys(themes),
  };
  return (
    <Form
      schema={themeSchema}
      formData={theme}
      onChange={({ formData }) => select(formData, themes[formData])}>
      <div />
    </Form>
  );
}

class Condor extends Component {
  static defaultSet() { return sets.simple; }

  constructor(props) {
    super(props);
    // initialize state with Simple data sample
    const { schema, uiSchema, formData, validate } = Condor.defaultSet();
    this.state = {
      form: false,
      schema,
      uiSchema,
      formData,
      validate,
      editor: "default",
      // theme: "default",
    };
  }

  componentDidMount() {
    this.load(Condor.defaultSet());
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
    console.log('[App render()]');
    
    const {
      schema,
      uiSchema,
      formData,
      // liveSettings,
      validate,
      // theme,
      editor,
      ArrayFieldTemplate,
      ObjectFieldTemplate,
      transformErrors,
    } = this.state;

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
          editor={editor}
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
              liveValidate={this.props.liveValidate}
              disabled={this.props.disable}
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

class App extends Component {
  static liveSettingsSchema = {
    type: "object",
    properties: {
      validate: { type: "boolean", title: "Live validation" },
      disable: { type: "boolean", title: "Disable whole form" },
    },
  };

  static defaultTheme = "paper"
  
  condor = React.createRef();

  state = {
    editor: "default",
    theme: App.defaultTheme,

    liveSettings: {
      validate: true,
      disable: false,
    }
  };

  componentDidMount() {
    const theme = App.defaultTheme;
    this.onThemeSelected(theme, themes[theme]);
  }

  // load = data => {
  //   console.log('Data:', data);
  //   // Reset the ArrayFieldTemplate whenever you load new data
  //   const { ArrayFieldTemplate, ObjectFieldTemplate } = data;
  //   // uiSchema is missing on some examples. Provide a default to
  //   // clear the field in all cases.
  //   const { uiSchema = {} } = data;
  //   // force resetting form component instance
  //   this.setState({ form: false }, _ =>
  //     this.setState({
  //       ...data,
  //       form: true,
  //       ArrayFieldTemplate,
  //       ObjectFieldTemplate,
  //       uiSchema,
  //     })
  //   );
  // };

  load = data => {
    if (this.condor && this.condor.current) {
      this.condor.current.load(data);
    }
  }
  
  setLiveSettings = ({ formData }) => this.setState({ liveSettings: formData });

  onThemeSelected = (theme, { stylesheet, editor }) => {
    this.setState({ theme, editor: editor ? editor : "default" });
    setImmediate(() => {
      // Side effect!
      document.getElementById("theme").setAttribute("href", stylesheet);
    });
  };

  render() {
    const { theme, liveSettings } = this.state;

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
                <ThemeSelector theme={theme} select={this.onThemeSelected} />
              </div>
            </div>
          </div>
        </div>

        <Condor
          ref={this.condor}
          liveValidate={liveSettings.validate}
          disable={liveSettings.disable}
        />
      </div>
    );
  }
}


render(<App />, document.getElementById("app"));
