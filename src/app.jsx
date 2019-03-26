import React, { Component } from "react";
import { render } from "react-dom";

import TriEditor from './tri-editor.jsx';
import themes from './themes.js';

import { shouldRender } from "../libs/rjsf/utils.js";
import { samples } from "./samples";
import Form from "../libs/rjsf";

import { setImmediate } from 'core-js-pure';

const log = type => console.log.bind(console, type);

class NavPillSelector extends Component {
  constructor(props) {
    super(props);
    this.state = { current: "Simple" };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  onLabelClick = label => {
    return event => {
      event.preventDefault();
      this.setState({ current: label });
      setImmediate(() => this.props.onSelected(samples[label]));
    };
  };

  render() {
    return (
      <ul className="nav nav-pills">
        {Object.keys(samples).map((label, i) => {
          return (
            <li
              key={i}
              role="presentation"
              className={this.state.current === label ? "active" : ""}>
              <a href="#" onClick={this.onLabelClick(label)}>
                {label}
              </a>
            </li>
          );
        })}
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

class App extends Component {
  constructor(props) {
    super(props);
    // initialize state with Simple data sample
    const { schema, uiSchema, formData, validate } = samples.Simple;
    this.state = {
      form: false,
      schema,
      uiSchema,
      formData,
      validate,
      editor: "default",
      theme: "default",
      liveSettings: {
        validate: true,
        disable: false,
      },
      shareURL: null,
    };
  }

  componentDidMount() {
    // const hash = document.location.hash.match(/#(.*)/);
    // if (hash && typeof hash[1] === "string" && hash[1].length > 0) {
    //   try {
    //     this.load(JSON.parse(atob(hash[1])));
    //   } catch (err) {
    //     alert("Unable to load form setup data.");
    //   }
    // } else {
      this.load(samples.Simple);
    // }
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

  onThemeSelected = (theme, { stylesheet, editor }) => {
    this.setState({ theme, editor: editor ? editor : "default" });
    setImmediate(() => {
      // Side effect!
      document.getElementById("theme").setAttribute("href", stylesheet);
    });
  };

  setLiveSettings = ({ formData }) => this.setState({ liveSettings: formData });

  onFormDataChange = ({ formData }) =>
    this.setState({ formData, shareURL: null });

  render() {
    const {
      schema,
      uiSchema,
      formData,
      liveSettings,
      validate,
      theme,
      editor,
      ArrayFieldTemplate,
      ObjectFieldTemplate,
      transformErrors,
    } = this.state;

    const liveSettingsSchema = {
      type: "object",
      properties: {
        validate: { type: "boolean", title: "Live validation" },
        disable: { type: "boolean", title: "Disable whole form" },
      },
    };

    return (
      <div className="container-fluid">
        <div className="page-header">
          <div className="row">
            <div className="col-sm-8">
              <NavPillSelector 
                options={["dataset", "org"]}
                onSelected={this.load} />
            </div>
            <div className="col-sm-2">
              <Form
                schema={liveSettingsSchema}
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
              liveValidate={liveSettings.validate}
              disabled={liveSettings.disable}
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

render(<App />, document.getElementById("app"));
