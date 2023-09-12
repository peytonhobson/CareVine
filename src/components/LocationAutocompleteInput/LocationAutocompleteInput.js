import React, { Component } from 'react';
import { func, object, shape, string, bool } from 'prop-types';
import { Field } from 'react-final-form';
import { ValidationError } from '../../components';
import LocationAutocompleteInputImpl from './LocationAutocompleteInputImpl.js';

import css from './LocationAutocompleteInput.module.css';

class LocationAutocompleteInputComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
    };

    this.onChangeLoading = this.onChangeLoading.bind(this);
  }

  onChangeLoading = () => {
    this.setState(prevState => {
      const isLoading = !prevState.isLoading;
      return { isLoading };
    });
  };

  render() {
    /* eslint-disable no-unused-vars */
    const { rootClassName, labelClassName, required, formValues, ...restProps } = this.props;
    const {
      input,
      label,
      labelNote,
      meta,
      valueFromForm,
      useCurrentLocation,
      ...otherProps
    } = restProps;
    /* eslint-enable no-unused-vars */

    const value = typeof valueFromForm !== 'undefined' ? valueFromForm : input.value;
    const locationAutocompleteProps = {
      label,
      meta,
      ...otherProps,
      input: { ...input, value: formValues?.location || value },
      useCurrentLocation,
      onChangeLoading: this.onChangeLoading,
    };
    const labelInfo = label ? (
      <label className={labelClassName} htmlFor={input.name}>
        {label}
        {required && <span className={css.error}>*</span>}
        {labelNote}
      </label>
    ) : null;

    return (
      <div className={rootClassName}>
        {labelInfo}
        <LocationAutocompleteInputImpl {...locationAutocompleteProps} />
        {!this.state.isLoading && <ValidationError fieldMeta={meta} />}
      </div>
    );
  }
}

LocationAutocompleteInputComponent.defaultProps = {
  rootClassName: null,
  labelClassName: null,
  type: null,
  label: null,
  useCurrentLocation: false,
};

LocationAutocompleteInputComponent.propTypes = {
  rootClassName: string,
  labelClassName: string,
  input: shape({
    onChange: func.isRequired,
    name: string.isRequired,
  }).isRequired,
  label: string,
  meta: object.isRequired,
  useCurrentLocation: bool,
};

export default LocationAutocompleteInputImpl;

export const LocationAutocompleteInputField = props => {
  return <Field component={LocationAutocompleteInputComponent} {...props} />;
};
