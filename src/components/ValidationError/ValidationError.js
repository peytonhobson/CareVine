import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import css from './ValidationError.module.css';

/**
 * This component can be used to show validation errors next to form
 * input fields. The component takes the final-form Field component
 * `meta` object as a prop and infers if an error message should be
 * shown.
 */
const ValidationError = props => {
  const { rootClassName, className, fieldMeta, hideError } = props;
  const { touched, error } = fieldMeta;
  const classes = classNames(rootClassName || css.root, className);

  return touched && error && !hideError ? <div className={classes}>{error}</div> : null;
};

ValidationError.defaultProps = { rootClassName: null, className: null };

export default ValidationError;
