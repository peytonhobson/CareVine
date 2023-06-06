import React, { useEffect, useState } from 'react';

import { bool } from 'prop-types';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import css from './GenericError.module.css';

const GenericError = props => {
  const { show, errorText } = props;

  const [isShowing, setIsShowing] = useState(show);

  useEffect(() => {
    if (show) {
      setIsShowing(true);
      setTimeout(() => {
        setIsShowing(false);
      }, 5000);
    }
  }, [show]);

  const classes = classNames(css.genericError, {
    [css.genericErrorVisible]: isShowing,
  });

  return (
    <div className={classes}>
      <div className={css.genericErrorContent}>
        <p className={css.genericErrorText}>{errorText}</p>
      </div>
    </div>
  );
};

GenericError.propTypes = {
  show: bool.isRequired,
};

export default GenericError;
