import React from 'react';

import { intlShape } from '../../util/reactIntl';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../util/types';
import { ensureListing, ensureCurrentUser } from '../../util/data';
import { EditListingFeaturesForm } from '../../forms';
import { CAREGIVER, EMPLOYER } from '../../util/constants';
import { findOptionsForSelectFilter } from '../../util/search';
import config from '../../config';

import css from './EditListingCareNeedsPanel.module.css';

const EditListingCareTypesPanel = props => {
  const {
    className,
    currentUser,
    disabled,
    errors,
    intl,
    listing,
    onChange,
    onSubmit,
    panelUpdated,
    ready,
    rootClassName,
    submitButtonText,
    updateInProgress,
    filterConfig,
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureListing(listing);
  const { publicData } = currentListing.attributes;

  const user = ensureCurrentUser(currentUser);
  const userType = user.attributes?.profile.metadata.userType;

  const isPublished = currentListing.id && currentListing.attributes.state !== LISTING_STATE_DRAFT;
  const panelTitle =
    userType === EMPLOYER ? (
      isPublished ? (
        <FormattedMessage
          id="EditListingCareNeedsPanel.employerTitle"
          values={{
            careNeeds: (
              <span className={css.careNeeds}>
                <FormattedMessage id="EditListingCareNeedsPanel.careNeeds" />
              </span>
            ),
          }}
        />
      ) : (
        <FormattedMessage
          id="EditListingCareNeedsPanel.employerCreateListingTitle"
          values={{
            careNeeds: (
              <span className={css.careNeeds}>
                <FormattedMessage id="EditListingCareNeedsPanel.careNeeds" />
              </span>
            ),
          }}
        />
      )
    ) : isPublished ? (
      <FormattedMessage
        id="EditListingCareNeedsPanel.caregiverTitle"
        values={{
          services: (
            <span className={css.careNeeds}>
              <FormattedMessage id="EditListingCareNeedsPanel.services" />
            </span>
          ),
        }}
      />
    ) : (
      <FormattedMessage
        id="EditListingCareNeedsPanel.caregiverCreateListingTitle"
        values={{
          services: (
            <span className={css.careNeeds}>
              <FormattedMessage id="EditListingCareNeedsPanel.services" />
            </span>
          ),
        }}
      />
    );

  const careTypes =
    publicData &&
    publicData.careTypes &&
    publicData.careTypes.filter(careType =>
      findOptionsForSelectFilter('careTypes', filterConfig).find(option => option.key === careType)
    );
  const initialValues = { careTypes };

  const careTypesFeaturesLabel = intl.formatMessage(
    userType === CAREGIVER
      ? { id: 'EditListingCareNeedsPanel.caregiverFormLabel' }
      : { id: 'EditListingCareNeedsPanel.employerFormLabel' }
  );

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
      <EditListingFeaturesForm
        {...formProps}
        saveActionMsg={submitButtonText}
        onSubmit={values => {
          const { careTypes } = values;

          const updatedValues = {
            publicData: { careTypes },
            title: currentListing.attributes.title ? currentListing.attributes.title : 'Title',
          };
          onSubmit(updatedValues);
        }}
        name="careTypes"
        label={careTypesFeaturesLabel}
        required={true}
      />
    </div>
  );
};

EditListingCareTypesPanel.defaultProps = {
  rootClassName: null,
  className: null,
  listing: null,
  filterConfig: config.custom.filters,
};

const { bool, func, object, string, shape } = PropTypes;

EditListingCareTypesPanel.propTypes = {
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

export default EditListingCareTypesPanel;
