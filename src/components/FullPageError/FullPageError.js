import React from 'react';

import css from './FullPageError.module.css';

const FullPageError = props => {
  const { errorHeading, errorDescription } = props;

  return (
    <div className={css.root}>
      <div className={css.content}>
        <div className={css.number}>Error</div>
        <h1 className={css.heading}>{errorHeading}</h1>
        <p className={css.description}>{errorDescription}</p>
      </div>
    </div>
  );
};

export default FullPageError;
