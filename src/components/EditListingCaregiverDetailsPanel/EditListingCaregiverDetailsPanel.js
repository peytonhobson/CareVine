import React, { useState } from 'react';
import { intlShape } from '../../util/reactIntl';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';

import { LISTING_STATE_DRAFT } from '../../util/types';
import { ensureListing } from '../../util/data';
import { EditListingCaregiverDetailsForm } from '../../forms';
import { ListingLink } from '..';

import css from './EditListingCaregiverDetailsPanel.module.css';
import { isArray } from 'lodash';

const EditListingCaregiverDetailsPanel = props => {
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
      id="EditListingCaregiverDetailsPanel.title"
      values={{
        idealCaregiver: (
          <span className={css.caregiverTitleText}>
            <FormattedMessage id="EditListingCaregiverDetailsPanel.idealCaregiver" />
          </span>
        ),
      }}
    />
  ) : (
    <FormattedMessage
      id="EditListingCaregiverDetailsPanel.createListingTitle"
      values={{
        idealCaregiver: (
          <span className={css.caregiverTitleText}>
            <FormattedMessage id="EditListingCaregiverDetailsPanel.idealCaregiver" />
          </span>
        ),
      }}
    />
  );

  const {
    certificationsAndTraining,
    additionalInfo,
    languagesSpoken,
    idealCaregiverDetails,
  } = publicData;

  const providedLanguagesSpoken =
    languagesSpoken && isArray(languagesSpoken)
      ? languagesSpoken.filter(lang => lang === 'english' || lang === 'spanish')
      : [];
  const additionalLanguagesSpoken =
    languagesSpoken && isArray(languagesSpoken)
      ? languagesSpoken.filter(lang => lang !== 'english' && lang !== 'spanish')
      : [];
  const initialValues = {
    certificationsAndTraining,
    additionalInfo,
    languagesSpoken: {
      provided: providedLanguagesSpoken,
      additional: additionalLanguagesSpoken,
    },
    idealCaregiverDetails,
  };

  const [initialState, setInitialState] = useState(initialValues);

  const formProps = {
    className: css.form,
    onChange,
    disabled,
    initialValues: initialState,
    ready,
    updated: panelUpdated,
    updateInProgress,
    fetchErrors: errors,
    intl,
  };

  return (
    <div className={classes}>
      <h1 className={css.title}>{panelTitle}</h1>
      <EditListingCaregiverDetailsForm
        {...formProps}
        saveActionMsg={submitButtonText}
        required={true}
        onSubmit={values => {
          const {
            certificationsAndTraining,
            additionalInfo,
            languagesSpoken,
            idealCaregiverDetails = ' ',
          } = values;

          const updatedValues = {
            publicData: {
              certificationsAndTraining,
              additionalInfo,
              languagesSpoken: [...languagesSpoken.provided, ...languagesSpoken.additional],
              idealCaregiverDetails,
            },
          };

          setInitialState({
            certificationsAndTraining,
            additionalInfo,
            languagesSpoken: {
              provided: languagesSpoken.provided,
              additional: languagesSpoken.additional,
            },
            idealCaregiverDetails,
          });

          onSubmit(updatedValues);
        }}
      />
    </div>
  );
};

EditListingCaregiverDetailsPanel.defaultProps = {
  rootClassName: null,
  className: null,
  listing: null,
};

const { bool, func, object, string, shape } = PropTypes;

EditListingCaregiverDetailsPanel.propTypes = {
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

export default EditListingCaregiverDetailsPanel;
