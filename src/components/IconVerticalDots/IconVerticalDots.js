import React from 'react';

import classNames from 'classnames';

import css from './IconVerticalDots.module.css';

const IconVerticalDots = props => {
  const { rootClassName, className, fillColor, height, width } = props;
  const classes = classNames(rootClassName || css.root, className);
  return (
    <svg
      className={classes}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 29.96 122.88"
      height={height}
      width={width}
    >
      <title>3-vertical-dots</title>
      <path
        style={{ fillRule: 'evenodd' }}
        d="M15,0A15,15,0,1,1,0,15,15,15,0,0,1,15,0Zm0,92.93a15,15,0,1,1-15,15,15,15,0,0,1,15-15Zm0-46.47a15,15,0,1,1-15,15,15,15,0,0,1,15-15Z"
      />
    </svg>
  );
};

export default IconVerticalDots;
