import React from 'react';
import classNames from 'classnames';

import css from './IconCar.module.css';

const IconCar = props => {
  const { rootClassName, className, height, width } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <svg
      className={classes}
      xmlns="http://www.w3.org/2000/svg"
      width={width || '20'}
      height={height || '20'}
      viewBox="0 0 256 256"
    >
      <defs></defs>
      <g
        style={{
          stroke: 'none',
          strokeWidth: 0,
          strokeDasharray: 'none',
          strokeLinecap: 'butt',
          strokeLinejoin: 'miter',
          strokeMiterlimit: 10,
          fillRule: 'nonzero',
          opacity: 1,
        }}
        transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)"
      >
        <path
          d="M 85.152 37.859 l 1.888 -3.468 c 0.714 -1.312 0.683 -2.924 -0.08 -4.207 c -0.739 -1.244 -2.028 -1.987 -3.447 -1.987 h -7.621 l -2.76 -5.684 c -2.816 -5.802 -8.419 -9.406 -14.621 -9.406 H 31.49 c -6.201 0 -11.804 3.604 -14.621 9.406 l -2.76 5.684 H 6.488 c -1.42 0 -2.709 0.743 -3.449 1.988 c -0.762 1.283 -0.792 2.895 -0.079 4.207 l 1.887 3.468 C 1.863 40.761 0 44.81 0 49.291 c 0 4.827 2.164 9.152 5.562 12.081 v 8.274 c 0 3.996 3.123 7.247 6.961 7.247 h 5.675 c 3.839 0 6.962 -3.251 6.962 -7.247 v -4.396 h 39.68 v 4.396 c 0 3.996 3.123 7.247 6.962 7.247 h 5.675 c 3.839 0 6.962 -3.251 6.962 -7.247 v -8.274 C 87.837 58.443 90 54.118 90 49.291 C 90 44.81 88.137 40.761 85.152 37.859 z M 20.467 24.26 c 2.142 -4.412 6.366 -7.153 11.022 -7.153 h 27.02 c 4.657 0 8.881 2.741 11.023 7.153 l 4.405 9.072 H 16.062 L 20.467 24.26 z M 20.919 54.47 h -6.142 c -2.993 0 -5.429 -2.435 -5.429 -5.429 s 2.435 -5.429 5.429 -5.429 h 6.142 c 2.993 0 5.429 2.435 5.429 5.429 S 23.913 54.47 20.919 54.47 z M 53.499 54.223 H 36.501 c -1.104 0 -2 -0.896 -2 -2 s 0.896 -2 2 -2 h 16.998 c 1.104 0 2 0.896 2 2 S 54.604 54.223 53.499 54.223 z M 75.223 54.47 h -6.142 c -2.994 0 -5.429 -2.435 -5.429 -5.429 c 0 -2.994 2.435 -5.429 5.429 -5.429 h 6.142 c 2.994 0 5.429 2.435 5.429 5.429 C 80.652 52.035 78.217 54.47 75.223 54.47 z"
          style={{
            stroke: 'none',
            strokeWidth: 1,
            strokeDasharray: 'none',
            strokeLinecap: ' butt',
            strokeLinejoin: 'miter',
            strokeMiterlimit: 10,
            fillRule: 'nonzero',
            opacity: 1,
          }}
          transform=" matrix(1 0 0 1 0 0) "
          stroke-linecap="round"
        />
      </g>
    </svg>
  );
};

export default IconCar;
