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

// Standard Modals

export const VerifyUserAction = ({onAccept, onCancel, acceptText = 'Ok', cancelText = 'Cancel'}) => {
  return (
    <>
      <h4>Are you Sure?</h4>
      <p className="padding-sm">This will erase all data currently loaded into the editor.</p>

      <div className="pull-right">
        <button type="button" className="btn-sm btn-info" onClick={onCancel}>{cancelText}</button>
        <button type="button" className="btn-sm btn-info margin-left-xs" onClick={onAccept}>{acceptText}</button>
      </div>
    </>
  );
};

export const ErrorModal = props => {
  const msg = props.message || 'An error has occurred while loading this file';
  const msg2 = props.message2;
  return (
    <>
      <h5 style={{ fontWeight: 800 }}>Error</h5>
      <br />
      <div  style={{color: '#111'}}>
        <p className="padding-sm" >
          {msg}
        </p>
        <p className="padding-sm" >
          {msg2}
        </p>
      </div>

      <div className="pull-right">
        <button type="button" className="btn-sm btn-default" onClick={props.onCancel}>OK</button>
      </div>
    </>
  );
};


export function JSONErrorModal(props)  {
  const msg = props.message || 'An error has occurred while loading this file';
  return (
    <>
      <h5 style={{ fontWeight: 800 }}>Error</h5>
      <br />
      <div  style={{color: '#111'}}>
        <p className="padding-sm" >
          {msg}
        </p>

        <p className="padding-sm" >
          There are many web and desktop tools to assist in correcting JSON.
          <a href="https://jsonlint.com/" style={{fontWeight: 800}}> https://jsonlint.com </a>
        </p>
      </div>

      <div className="pull-right">
        <button type="button" className="btn-sm btn-default" onClick={props.onCancel}>OK</button>
      </div>
    </>
  );
};