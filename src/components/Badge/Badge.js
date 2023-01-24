import classNames from 'classnames';
import React from 'react';
import css from './Badge.module.css';

const Badge = props => {
  const { className, count, maxLevel } = props;

  const maximumNumber = parseInt('9'.repeat(maxLevel > 6 ? 6 : maxLevel), 10);

  const classes = classNames(css.root, className);

  return (
    <div className={classes}>
      <div className={css.badgeText}>{count > maximumNumber ? `${maximumNumber}+` : count}</div>
    </div>
  );
};

export default Badge;
