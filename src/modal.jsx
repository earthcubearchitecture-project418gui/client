import React from 'react';

import modalStyles from './css/modal.css';
import backDropStyles from './css/backdrop.css';

// import Backdrop from '../backdrop/backdrop.jsx';

export const Backdrop = (props) => (
  props.show ? <div className={backDropStyles.Backdrop}></div> : null
);

export const Modal = (props) => (
  <>
    <Backdrop show={props.show} />
    <div 
      className={modalStyles.Modal} 
      style={{ 
        transform: props.show ? 'translateY(0)' : 'translateY(-100vh)' ,
        opacity: props.show ? '1' : '0'
      }} 
    >
      { props.children }
    </div>

  </>
);


