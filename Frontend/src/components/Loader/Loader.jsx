import React from 'react';
import './loader.scss';

const Loader = ({ text = "Loading..." }) => {
  return (
    <div className="loader-container">
      <div className="loader-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      {text && <h2 className="loader-text">{text}</h2>}
    </div>
  );
};

export default Loader;
