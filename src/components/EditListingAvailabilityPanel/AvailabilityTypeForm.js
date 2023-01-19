import React, { useState, useEffect } from 'react';

import classNames from 'classnames';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { compose } from 'redux';
import { bool, func, shape, string } from 'prop-types';
import config from '../../config';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';

import { findOptionsForSelectFilter } from '../../util/search';
import { propTypes } from '../../util/types';
import { FieldCheckboxGroup, Form } from '../../components';
import { requiredFieldArrayCheckbox } from '../../util/validators';

import css from './EditListingAvailabilityPanel.module.css';

const AvailabilityTypeForm = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const {
        className,
        filterConfig,
        handleSubmit,
        intl,
        rootClassName,
        onChange,
        form,
      } = formRenderProps;

      const checkboxLabel = intl.formatMessage({ id: 'AvailabilityTypeForm.checkboxLabel' });

      const handleOnChange = e => {
        const formValues = form.getState().values;
        onChange(formValues);
      };

      const options = findOptionsForSelectFilter('availabilityTypes', filterConfig);
      return (
        <Form onSubmit={handleSubmit} onChange={handleOnChange}>
          <FieldCheckboxGroup
            className={css.features}
            id="availabilityTypes"
            name="availabilityTypes"
            options={options}
            label={checkboxLabel}
            onChange={onChange}
            required
            inline
          />
        </Form>
      );
    }}
  />
);

AvailabilityTypeForm.defaultProps = {
  rootClassName: null,
  className: null,
  filterConfig: config.custom.filters,
};

AvailabilityTypeForm.propTypes = {
  rootClassName: string,
  className: string,

  filterConfig: propTypes.filterConfig,
  intl: intlShape.isRequired,
};

export default compose(injectIntl)(AvailabilityTypeForm);
