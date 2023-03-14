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
      viewBox="0 0 70 70"
      height={height || '20'}
      width={width || '20'}
      className={classes}
    >
      <defs>
        <linearGradient
          id="linear-gradient1"
          x1="-6.51"
          y1="-5.21"
          x2="-5.51"
          y2="-5.21"
          gradientTransform="translate(453.96 -329.11) scale(69.85 -69.85)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#bf953f" />
          <stop offset=".06" stopColor="#c7a24a" />
          <stop offset=".16" stopColor="#ddc469" />
          <stop offset=".28" stopColor="#fcf695" />
          <stop offset=".33" stopColor="#ede17f" />
          <stop offset=".43" stopColor="#cdb350" />
          <stop offset=".51" stopColor="#ba9732" />
          <stop offset=".55" stopColor="#b38d28" />
          <stop offset=".6" stopColor="#bc9a35" />
          <stop offset=".71" stopColor="#d4bd5a" />
          <stop offset=".84" stopColor="#fcf695" />
          <stop offset=".87" stopColor="#f8f08f" />
          <stop offset=".9" stopColor="#eee080" />
          <stop offset=".93" stopColor="#ddc667" />
          <stop offset=".96" stopColor="#c6a245" />
          <stop offset="1" stopColor="#aa771c" />
        </linearGradient>
      </defs>
      <g id="Layer_1-2" data-name="Layer 1">
        <g>
          {/* <rect width="70" height="70" fill="url(#linear-gradient1)" /> */}
          <path
            d="m28.62,22.63c-5.25,5.22-10.49,10.43-15.72,15.66l-.14.14c-5.62-5.8-5.56-15.05.16-20.77,5.74-5.74,15.02-5.78,20.82-.12l1.26,1.26,4.19,4.19c1.41,1.41,1.41,3.69,0,5.11-1.41,1.41-3.7,1.41-5.11,0-1.82-1.82-3.65-3.65-5.47-5.47Zm5.74,31.06l3.28,3.28c2.09,2.09-1.09,5.19-3.14,3.14l-3.28-3.28c-2.05-2.06,1.09-5.19,3.14-3.14Zm4.45-4.45l3.28,3.28c1.39,1.4.4,3.79-1.57,3.79-.57,0-1.13-.22-1.57-.65l-3.28-3.28c-2.08-2.08,1.07-5.2,3.14-3.14Zm4.45-4.45l3.28,3.28c1.39,1.39.4,3.79-1.57,3.79-.57,0-1.14-.22-1.57-.65l-3.28-3.28c-2.09-2.09,1.09-5.19,3.14-3.14Zm4.59,1.97l-3.3-3.3c-1.84-2.11,1.04-5.24,3.16-3.12l3.3,3.3c.42.43.64.99.64,1.56,0,1.97-2.4,2.96-3.79,1.57Zm-8.8-3.53c-3.53,3.54-7.05,7.09-10.58,10.62-2.71,2.71-6.1-1.66-3.88-3.88l9.02-9.02,1.98-1.98c.84-.84-.47-2.14-1.31-1.31l-1.98,1.98-6.6,6.6-2.41,2.41c-.54.53-1.24.8-1.94.8-2.44,0-3.66-2.96-1.94-4.68l11-11c.84-.84-.47-2.15-1.31-1.31l-11,11c-.54.53-1.24.8-1.94.8-2.44,0-3.66-2.96-1.94-4.68,4.79-4.79,9.59-9.58,14.4-14.36l4.17,4.17c2.13,2.13,5.59,2.13,7.72,0,2.14-2.14,2.14-5.59,0-7.72l-4.19-4.19c5.79-5.61,15.03-5.58,20.77.16,5.78,5.78,5.78,15.16,0,20.93l-4.3,4.3-.48-.58-3.28-3.28c-2.67-2.67-7.3-.51-6.93,3.28-1.61-.15-2.41.29-3.03.92Z"
            fill="#fff"
            fillRule="evenodd"
          />
        </g>
      </g>
    </svg>
  );
};

export default IconCareVineGold;
