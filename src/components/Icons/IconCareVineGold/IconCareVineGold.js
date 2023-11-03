import React from 'react';
import classNames from 'classnames';

import css from './IconCareVineGold.module.css';

const IconCareVineGold = props => {
  const { rootClassName, className, height, width } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <svg
      id="Layer_2"
      data-name="Layer 2"
      xmlns="http://www.w3.org/2000/svg"
      xlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 74.82 70.91"
      height={height || '20'}
      width={width || '20'}
      className={classes}
    >
      <defs>
        <linearGradient
          id="linear-gradient"
          x1="0"
          y1="35.45"
          x2="74.82"
          y2="35.45"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#c93" />
          <stop offset=".06" stopColor="#d3a63d" />
          <stop offset=".16" stopColor="#e6cb5a" />
          <stop offset=".27" stopColor="#fcf67c" />
          <stop offset=".32" stopColor="#f2e871" />
          <stop offset=".43" stopColor="#dbc456" />
          <stop offset=".57" stopColor="#b58a2a" />
          <stop offset=".57" stopColor="#b38728" />
          <stop offset=".81" stopColor="#fcf67c" />
          <stop offset=".85" stopColor="#f9f178" />
          <stop offset=".89" stopColor="#f2e36d" />
          <stop offset=".93" stopColor="#e6cc5b" />
          <stop offset=".98" stopColor="#d6ad43" />
          <stop offset="1" stopColor="#c93" />
        </linearGradient>
      </defs>
      <g id="Layer_1-2" dataName="Layer 1">
        <g>
          {/* <rect y="0" width="74.82" height="70.91" rx="5" ry="5" fill="url(#linear-gradient)" /> */}
          <path
            d="m30.87,20.67c-5.38,5.34-10.75,10.69-16.11,16.04l-.14.15c-5.76-5.94-5.7-15.42.17-21.29,5.88-5.88,15.4-5.93,21.33-.12l1.29,1.29,4.3,4.3c1.44,1.44,1.44,3.79,0,5.23-1.45,1.44-3.79,1.44-5.23,0-1.87-1.87-3.74-3.74-5.61-5.6Zm5.88,31.83l3.36,3.36c2.14,2.14-1.12,5.32-3.22,3.22l-3.36-3.36c-2.1-2.11,1.12-5.32,3.22-3.22Zm4.56-4.56l3.37,3.36c1.43,1.43.41,3.89-1.61,3.89-.58,0-1.16-.22-1.61-.67l-3.37-3.36c-2.13-2.13,1.1-5.33,3.22-3.22Zm4.56-4.56l3.37,3.37c1.43,1.43.41,3.89-1.61,3.89-.58,0-1.17-.22-1.61-.67l-3.37-3.37c-2.14-2.14,1.12-5.32,3.22-3.22Zm4.7,2.02l-3.38-3.38c-1.88-2.16,1.06-5.37,3.24-3.2l3.38,3.38c.43.44.65,1.02.65,1.6,0,2.02-2.45,3.04-3.89,1.61Zm-9.01-3.62c-3.61,3.63-7.23,7.26-10.85,10.89-2.78,2.77-6.25-1.71-3.98-3.98l9.25-9.25,2.03-2.03c.86-.86-.48-2.2-1.34-1.34l-2.03,2.03-6.77,6.77-2.47,2.47c-.55.55-1.27.82-1.99.82-2.5,0-3.76-3.04-1.99-4.8l11.27-11.27c.86-.86-.48-2.2-1.34-1.34l-11.27,11.27c-.55.55-1.27.82-1.99.82-2.5,0-3.76-3.04-1.99-4.8,4.91-4.91,9.83-9.82,14.76-14.71l4.27,4.27c2.19,2.19,5.73,2.19,7.91,0,2.19-2.19,2.19-5.73,0-7.92l-4.3-4.29c5.93-5.75,15.4-5.72,21.28.17,5.93,5.93,5.93,15.53,0,21.45l-4.41,4.41-.49-.59-3.36-3.36c-2.74-2.74-7.48-.52-7.11,3.36-1.65-.16-2.47.3-3.11.94Z"
            fill="#fff"
            fillRule="evenodd"
          />
        </g>
      </g>
    </svg>
  );
};

export default IconCareVineGold;
