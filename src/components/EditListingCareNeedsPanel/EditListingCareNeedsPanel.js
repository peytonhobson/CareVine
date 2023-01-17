import React from 'react';

import { intlShape } from '../../util/reactIntl';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../util/types';
import { ensureListing, ensureCurrentUser } from '../../util/data';
import { EditListingFeaturesForm } from '../../forms';
import { CAREGIVER } from '../../util/constants';

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
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureListing(listing);
  const { publicData } = currentListing.attributes;

  const isPublished = currentListing.id && currentListing.attributes.state !== LISTING_STATE_DRAFT;
  const panelTitle = isPublished ? (
    <FormattedMessage
      id="EditListingCareNeedsPanel.title"
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
      id="EditListingCareNeedsPanel.createListingTitle"
      values={{
        careNeeds: (
          <span className={css.careNeeds}>
            <FormattedMessage id="EditListingCareNeedsPanel.careNeeds" />
          </span>
        ),
      }}
    />
  );

  const user = ensureCurrentUser(currentUser);
  const userType = user.attributes?.profile.metadata.userType;

  const careNeeds = publicData && publicData.careNeeds;
  const initialValues = { careNeeds };

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
