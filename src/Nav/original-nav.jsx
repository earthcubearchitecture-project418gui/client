import React, { Component } from 'react';

import Form from "../../libs/rjsf";
import { shouldRender } from "../../libs/rjsf/utils.js";

import { setImmediate } from 'core-js-pure';

import themes from '../themes.js';

export class NavPillSelector extends Component {
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

export function ThemeSelector({ theme, select }) {
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