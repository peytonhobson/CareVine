import React from 'react';
import queryString from 'query-string';
import { intlShape } from '../../util/reactIntl';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';

import { LISTING_STATE_DRAFT } from '../../util/types';
import { ensureListing } from '../../util/data';
import { EditListingFeaturesForm, EditListingAdditionalDetailsForm } from '../../forms';
import { ListingLink } from '..';

import css from './EditListingAdditionalDetailsPanel.module.css';

const EditListingAdditionalDetailsPanel = props => {
  const {
    rootClassName,
    className,
    listing,
    isNewListingFlow,
    disabled,
    ready,
    onSubmit,
    onChange,
    panelUpdated,
    updateInProgress,
    errors,
    intl,
    submitButtonText,
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureListing(listing);
  const { publicData } = currentListing.attributes;

  const isPublished = currentListing.id && currentListing.attributes.state !== LISTING_STATE_DRAFT;
  const panelTitle = isPublished ? (
    <FormattedMessage
      id="EditListingAdditionalDetailsPanel.title"
      values={{
        additionalDetails: (
          <span className={css.additionalDetailsText}>
            <FormattedMessage id="EditListingAdditionalDetailsPanel.additionalDetails" />
          </span>
        ),
      }}
    />
  ) : (
    <FormattedMessage
      id="EditListingAdditionalDetailsPanel.createListingTitle"
      values={{
        additionalDetails: (
          <span className={css.additionalDetailsText}>
            <FormattedMessage id="EditListingAdditionalDetailsPanel.additionalDetails" />
          </span>
        ),
      }}
    />
  );

  const {
    certificationsAndTraining,
    additionalInfo,
    covidVaccination,
    languagesSpoken,
  } = publicData;
  const initialValues = {
    certificationsAndTraining,
    additionalInfo,
    covidVaccination,
    languagesSpoken,
  };

  const formProps = {
    className: css.form,
    onChange,
    disabled,
    initialValues,
    ready,
    updated: panelUpdated,
    updateInProgress,
    fetchErrors: errors,
    intl,
  };

  return (
    <div className={classes}>
      <h1 className={css.title}>{panelTitle}</h1>
      <EditListingAdditionalDetailsForm
        {...formProps}
        saveActionMsg={submitButtonText}
        required={true}
        onSubmit={values => {
          const {
            certificationsAndTraining,
            additionalInfo,
            covidVaccination,
            languagesSpoken,
          } = values;

          const updatedValues = {
            publicData: {
              certificationsAndTraining,
              additionalInfo,
              covidVaccination,
              languagesSpoken,
            },
          };

          onSubmit(updatedValues);
        }}
      />
    </div>
  );
};

EditListingAdditionalDetailsPanel.defaultProps = {
  rootClassName: null,
  className: null,
  listing: null,
};

const { bool, func, object, string, shape } = PropTypes;

EditListingAdditionalDetailsPanel.propTypes = {
  rootClassName: string,
  className: string,

  // We cannot use propTypes.listing since the listing might be a draft.
  listing: object,

  disabled: bool.isRequired,
  ready: bool.isRequired,
  onSubmit: func.isRequired,
  onChange: func.isRequired,
  submitButtonText: string.isRequired,
  panelUpdated: bool.isRequired,
  updateInProgress: bool.isRequired,
  errors: object.isRequired,
  intl: intlShape.isRequired,
};

export default EditListingAdditionalDetailsPanel;
