import React, { Component } from 'react';

import { UnControlled as CodeMirror } from "react-codemirror2";

import { setImmediate } from 'core-js-pure';

import { shouldRender } from "./libs/rjsf/utils.js";

const fromJson = json => JSON.parse(json);
const toJson = val => JSON.stringify(val, null, 2);


const cmOptions = {
  theme: "default",
  height: "auto",
  viewportMargin: Infinity,
  mode: {
    name: "javascript",
    json: true,
    statementIndent: 2,
  },
  lineNumbers: true,
  lineWrapping: true,
  indentWithTabs: false,
  tabSize: 2,
};

export default class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = { valid: true, code: props.code };
  }

  componentWillReceiveProps(props) {
    this.setState({ valid: true, code: props.code });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  onCodeChange = (editor, metadata, code) => {
    let _, valid;
    try {
      _ = fromJson(code);
      valid = true;
    } catch (e) {
      _ = code;
      valid = false;
    }

    this.setState({ valid, code }, () => {
      // debugger;
      if (this.state.valid && this.props.onChange) { 
        this.props.onChange( fromJson(this.state.code) ); 
      } 
    });
    
    // setImmediate(() => {
    //   try {
    //     this.props.onChange(fromJson(this.state.code));
    //   } catch (err) {
    //     debugger;
    //     this.setState({ valid: false, code });
    //   }
    // });
  };

  render() {

    const { title, theme } = this.props;
    const icon = this.state.valid ? "ok" : "remove";
    const cls = this.state.valid ? "valid" : "invalid";
    return (
      <div className="panel panel-default">
        <div className="panel-heading">
          <span className={`${cls} glyphicon glyphicon-${icon}`} />
          {" " + title}
        </div>
        <CodeMirror
          value={this.state.code}
          onChange={this.onCodeChange}
          autoCursor={false}
          options={Object.assign({}, cmOptions, { theme })}
        />
      </div>
    );
  }
}