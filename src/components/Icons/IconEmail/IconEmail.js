import React from 'react';

import css from './IconEmail.module.css';

const IconEmail = props => {
  const { className, height, width } = props;

  return (
    <svg
      className={className || css.root}
      width={width || 20}
      height={height || 20}
      viewBox="0 -2.5 20 20"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xlink="http://www.w3.org/1999/xlink"
    >
      <g fillRule="evenodd">
        <g id="Dribbble-Light-Preview" transform="translate(-300.000000, -922.000000)">
          <g id="icons" transform="translate(56.000000, 160.000000)">
            <path
              d="M262,764.291 L254,771.318 L246,764.281 L246,764 L262,764 L262,764.291 Z M246,775 L246,766.945 L254,773.98 L262,766.953 L262,775 L246,775 Z M244,777 L264,777 L264,762 L244,762 L244,777 Z"
              id="email-[#1573]"
            ></path>
          </g>
        </g>
      </g>
    </svg>
  );
};

export default IconEmail;
