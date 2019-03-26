import React, { Component } from "react";
import { render } from "react-dom";

import TriEditor from './tri-editor.jsx';
import themes from './themes.js';

import { shouldRender } from "../libs/rjsf/utils.js";
import { samples } from "./samples";
import Form from "../libs/rjsf";


function setImmediate(callback) {
  setTimeout(callback, 1);
}

const log = type => console.log.bind(console, type);


// const themes = {
//   default: {
//     stylesheet:
//       "//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css",
//   },
//   cerulean: {
//     stylesheet:
//       "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/cerulean/bootstrap.min.css",
//   },
//   cosmo: {
//     stylesheet:
//       "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/cosmo/bootstrap.min.css",
//   },
//   cyborg: {
//     stylesheet:
//       "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/cyborg/bootstrap.min.css",
//     editor: "blackboard",
//   },
//   darkly: {
//     stylesheet:
//       "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/darkly/bootstrap.min.css",
//     editor: "mbo",
//   },
//   flatly: {
//     stylesheet:
//       "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/flatly/bootstrap.min.css",
//     editor: "ttcn",
//   },
//   journal: {
//     stylesheet:
//       "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/journal/bootstrap.min.css",
//   },
//   lumen: {
//     stylesheet:
//       "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/lumen/bootstrap.min.css",
//   },
//   paper: {
//     stylesheet:
//       "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/paper/bootstrap.min.css",
//   },
//   readable: {
//     stylesheet:
//       "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/readable/bootstrap.min.css",
//   },
//   sandstone: {
//     stylesheet:
//       "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/sandstone/bootstrap.min.css",
//     editor: "solarized",
//   },
//   simplex: {
//     stylesheet:
//       "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/simplex/bootstrap.min.css",
//     editor: "ttcn",
//   },
//   slate: {
//     stylesheet:
//       "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/slate/bootstrap.min.css",
//     editor: "monokai",
//   },
//   spacelab: {
//     stylesheet:
//       "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/spacelab/bootstrap.min.css",
//   },
//   "solarized-dark": {
//     stylesheet:
//       "//cdn.rawgit.com/aalpern/bootstrap-solarized/master/bootstrap-solarized-dark.css",
//     editor: "dracula",
//   },
//   "solarized-light": {
//     stylesheet:
//       "//cdn.rawgit.com/aalpern/bootstrap-solarized/master/bootstrap-solarized-light.css",
//     editor: "solarized",
//   },
//   superhero: {
//     stylesheet:
//       "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/superhero/bootstrap.min.css",
//     editor: "dracula",
//   },
//   united: {
//     stylesheet:
//       "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/united/bootstrap.min.css",
//   },
//   yeti: {
//     stylesheet:
//       "//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/yeti/bootstrap.min.css",
//     editor: "eclipse",
//   },
// };

// class GeoPosition extends Component {
//   constructor(props) {
//     super(props);
//     this.state = { ...props.formData };
//   }

//   onChange(name) {
//     return event => {
//       this.setState({ [name]: parseFloat(event.target.value) });
//       setImmediate(() => this.props.onChange(this.state));
//     };
//   }

//   render() {
//     const { lat, lon } = this.state;
//     return (
//       <div className="geo">
//         <h3>Hey, I'm a custom component</h3>
//         <p>
//           I'm registered as <code>geo</code> and referenced in
//           <code>uiSchema</code> as the <code>ui:field</code> to use for this
//           schema.
//         </p>
//         <div className="row">
//           <div className="col-sm-6">
//             <label>Latitude</label>
//             <input
//               className="form-control"
//               type="number"
//               value={lat}
//               step="0.00001"
//               onChange={this.onChange("lat")}
//             />
//           </div>
//           <div className="col-sm-6">
//             <label>Longitude</label>
//             <input
//               className="form-control"
//               type="number"
//               value={lon}
//               step="0.00001"
//               onChange={this.onChange("lon")}
//             />
//           </div>
//         </div>
//       </div>
//     );
//   }
// }

 

class Selector extends Component {
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

// class CopyLink extends Component {
//   onCopyClick = event => {
//     this.input.select();
//     document.execCommand("copy");
//   };

//   render() {
//     const { shareURL, onShare } = this.props;
//     if (!shareURL) {
//       return (
//         <button className="btn btn-default" type="button" onClick={onShare}>
//           Share
//         </button>
//       );
//     }
//     return (
//       <div className="input-group">
//         <input
//           type="text"
//           ref={input => (this.input = input)}
//           className="form-control"
//           defaultValue={shareURL}
//         />
//         <span className="input-group-btn">
//           <button
//             className="btn btn-default"
//             type="button"
//             onClick={this.onCopyClick}>
//             <i className="glyphicon glyphicon-copy" />
//           </button>
//         </span>
//       </div>
//     );
//   }
// }

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
    const hash = document.location.hash.match(/#(.*)/);
    if (hash && typeof hash[1] === "string" && hash[1].length > 0) {
      try {
        this.load(JSON.parse(atob(hash[1])));
      } catch (err) {
        alert("Unable to load form setup data.");
      }
    } else {
      this.load(samples.Simple);
    }
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

  onShare = () => {
    const { formData, schema, uiSchema } = this.state;
    const {
      location: { origin, pathname },
    } = document;
    try {
      const hash = btoa(JSON.stringify({ formData, schema, uiSchema }));
      this.setState({ shareURL: `${origin}${pathname}#${hash}` });
    } catch (err) {
      this.setState({ shareURL: null });
    }
  };

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
          <h1>react-jsonschema-form</h1>
          <div className="row">
            <div className="col-sm-8">
              <Selector onSelected={this.load} />
            </div>
            <div className="col-sm-2">
              <Form
                schema={liveSettingsSchema}
                formData={liveSettings}
                onChange={this.setLiveSettings}>
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
