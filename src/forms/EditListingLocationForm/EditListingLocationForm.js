import React from 'react';
import { bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import { intlShape, injectIntl, FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { propTypes } from '../../util/types';
import {
  autocompleteSearchRequired,
  autocompletePlaceSelected,
  composeValidators,
  requiredFieldArrayRadio,
} from '../../util/validators';
import arrayMutators from 'final-form-arrays';
import { findOptionsForSelectFilter } from '../../util/search';
import {
  Form,
  LocationAutocompleteInputField,
  Button,
  FieldAddSubtract,
  FieldCheckbox,
  FieldRadioButtonGroup,
} from '../../components';
import config from '../../config';
import { CAREGIVER, EMPLOYER } from '../../util/constants';

import css from './EditListingLocationForm.module.css';

const identity = v => v;

export const EditListingLocationFormComponent = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const {
        className,
        disabled,
        ready,
        handleSubmit,
        intl,
        invalid,
        pristine,
        formId,
        saveActionMsg,
        updated,
        updateInProgress,
        fetchErrors,
        filterConfig,
        values,
        userType,
      } = formRenderProps;

      // Address Text Field
      const addressTitleRequiredMessage = 'Address';
      const addressPlaceholderMessage = intl.formatMessage({
        id: 'EditListingLocationForm.addressPlaceholder',
      });
      const addressRequiredMessage = intl.formatMessage({
        id: 'EditListingLocationForm.addressRequired',
      });
      const addressNotRecognizedMessage = intl.formatMessage({
        id: 'EditListingLocationForm.addressNotRecognized',
      });

      // Willing Travel Distance
      const distanceLabel = intl.formatMessage({
        id: 'EditListingLocationForm.distanceLabel',
      });
      const distanceCountLabel = intl.formatMessage({
        id: 'EditListingLocationForm.distanceCountLabel',
      });

      const residenceTypeLabel = intl.formatMessage({
        id: 'EditListingLocationForm.residenceTypeLabel',
      });
      const residenceTypeOptions = findOptionsForSelectFilter('residenceType', filterConfig);
      const residenceTypeRequiredMessage = intl.formatMessage({
        id: 'EditListingLocationForm.residenceTypeRequired',
      });

      const { updateListingError, showListingsError } = fetchErrors || {};
      const errorMessage = updateListingError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingLocationForm.updateFailed" />
        </p>
      ) : null;

      const errorMessageShowListing = showListingsError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingLocationForm.showListingFailed" />
        </p>
      ) : null;

      const nearPublicTransitText = intl.formatMessage({
        id: 'EditListingLocationForm.nearPublicTransitText',
      });
      const nearPublicTransitValues = findOptionsForSelectFilter('nearPublicTransit', filterConfig);
      const nearPublicTransitRequiredMessage = intl.formatMessage({
        id: 'EditListingLocationForm.nearPublicTransitRequired',
      });

      const classes = classNames(css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          {errorMessageShowListing}
          <div className={css.inputContainer}>
            <LocationAutocompleteInputField
              className={css.locationAddress}
              inputClassName={css.locationAutocompleteInput}
              predictionsClassName={css.predictionsRoot}
              validClassName={css.validLocation}
              rootClassName={css.locationAutocompleteRoot}
              name="location"
              label={addressTitleRequiredMessage}
              labelNote={
                <p className="text-xs mt-0 mb-4 p-0">*Only your city and state will be public</p>
              }
              placeholder={addressPlaceholderMessage}
              useDefaultPredictions={false}
              useCurrentLocation={true}
              format={identity}
              valueFromForm={values.location}
              validate={composeValidators(
                autocompleteSearchRequired(addressRequiredMessage),
                autocompletePlaceSelected(addressNotRecognizedMessage)
              )}
              searchType={['address']}
              usePostalCode={true}
              required
            />
          </div>
          {userType === CAREGIVER && (
            <FieldAddSubtract
              id={formId ? `${formId}.travelDistance` : 'travelDistance'}
              rootClassName={css.travelDistance}
              buttonClassName={css.travelDistanceButton}
              fieldClassName={css.addSubtractField}
              name="travelDistance"
              startingCount={values.travelDistance}
              countLabel={distanceCountLabel}
              label={distanceLabel}
              increment={5}
            />
          )}
          {userType === EMPLOYER && (
            <>
              <FieldRadioButtonGroup
                id={formId ? `${formId}.nearPublicTransit` : 'nearPublicTransit'}
                className={css.formMargins}
                name="nearPublicTransit"
                label={nearPublicTransitText}
                options={nearPublicTransitValues}
                required
                inline
                validate={requiredFieldArrayRadio(nearPublicTransitRequiredMessage)}
              />
              <FieldRadioButtonGroup
                id={formId ? `${formId}.residenceType` : 'residenceType'}
                className={css.formMargins}
                name="residenceType"
                label={residenceTypeLabel}
                options={residenceTypeOptions}
                required
                validate={requiredFieldArrayRadio(residenceTypeRequiredMessage)}
              />
            </>
          )}
          {errorMessage}
          <Button
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            ready={submitReady}
          >
            {saveActionMsg}
          </Button>
        </Form>
      );
    }}
  />
);

EditListingLocationFormComponent.defaultProps = {
  selectedPlace: null,
  fetchErrors: null,
  filterConfig: config.custom.filters,
};

EditListingLocationFormComponent.propTypes = {
  intl: intlShape.isRequired,
  onSubmit: func.isRequired,
  saveActionMsg: string.isRequired,
  selectedPlace: propTypes.place,
  disabled: bool.isRequired,
  ready: bool.isRequired,
  updated: bool.isRequired,
  updateInProgress: bool.isRequired,
  fetchErrors: shape({
    showListingsError: propTypes.error,
    updateListingError: propTypes.error,
  }),
  filterConfig: propTypes.filterConfig,
};

export default compose(injectIntl)(EditListingLocationFormComponent);
