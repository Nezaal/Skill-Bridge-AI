import React from 'react';
import { LoaderIcon } from 'lucide-react';
import './loader.scss';

const Loader = ({ text = "Loading..." }) => {
  return (
    <div className="loader-container">
      <div className="spinner-wrapper">
        <LoaderIcon className="spinner-icon" size={48} strokeWidth={2} />
      </div>
      {text && <h2 className="loader-text">{text}</h2>}
    </div>
  );
};

export default Loader;