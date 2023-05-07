import React from 'react';
import classNames from 'classnames';

import css from './IconSocialMediaPinterest.module.css';

const IconSocialMediaPinterest = props => {
  const { rootClassName, className, height, width } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xlink="http://www.w3.org/1999/xlink"
      className={classes}
      width={width || 10}
      height={height || 17}
      viewBox="0 0 512 512"
      space="preserve"
    >
      <g id="7935ec95c421cee6d86eb22ecd12951c">
        <path
          style={{ display: 'inline ' }}
          d="M220.646,338.475C207.223,408.825,190.842,476.269,142.3,511.5
		c-14.996-106.33,21.994-186.188,39.173-270.971c-29.293-49.292,3.518-148.498,65.285-124.059
		c76.001,30.066-65.809,183.279,29.38,202.417c99.405,19.974,139.989-172.476,78.359-235.054
		C265.434-6.539,95.253,81.775,116.175,211.161c5.09,31.626,37.765,41.22,13.062,84.884c-57.001-12.65-74.005-57.6-71.822-117.533
		c3.53-98.108,88.141-166.787,173.024-176.293c107.34-12.014,208.081,39.398,221.991,140.376
		c15.67,113.978-48.442,237.412-163.23,228.529C258.085,368.704,245.023,353.283,220.646,338.475z"
        ></path>
      </g>
    </svg>
  );
};

export default IconSocialMediaPinterest;
