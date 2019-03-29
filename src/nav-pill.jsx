import React, { Component } from 'react';

import Form from "../libs/rjsf";
import { shouldRender } from "../libs/rjsf/utils.js";

import { setImmediate } from 'core-js-pure';

import themes from './themes.js';

export function NavPillSelector({ options }) {
  // constructor(props) {
  //   super(props);
  //   this.state = { current: props.options[0].label };
  // }

  // shouldComponentUpdate(nextProps, nextState) {
  //   return shouldRender(this, nextProps, nextState);
  // }

  // onLabelClick = (label, onClick) => {
  //   return event => {
  //     event.preventDefault();
  //     this.setState({ current: label });
  //     setImmediate(() => onClick(label));
  //   };
  // };

  // render() {
    
    const onLabelClick = (label, onClick) => {
      return event => {
        event.preventDefault();
        // this.setState({ current: label });
        if (onClick) { onClick(label); }
      };
    };

    // console.log('[NavPill render()]', this.props.options);
    return (
      <ul className="nav nav-pills">
        {
          options.map((option, i) => {
            return (
              <li
                key={i}
                role="presentation"
                className={ option.active ? "active" : ""}>
                <a href="#" onClick={onLabelClick(option.label, option.onClick)} style={{ textTransform: 'capitalize' }}>
                  {option.icon} {'  ' + option.label}
                </a>
              </li>
            );
          })
        }
      </ul>
    );
  // }
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