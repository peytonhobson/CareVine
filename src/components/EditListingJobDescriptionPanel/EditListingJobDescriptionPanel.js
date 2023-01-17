import React from 'react';
import { intlShape } from '../../util/reactIntl';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';

import { LISTING_STATE_DRAFT } from '../../util/types';
import { ensureListing } from '../../util/data';
import { EditListingJobDescriptionForm } from '../../forms';
import { ListingLink } from '..';

import css from './EditListingJobDescriptionPanel.module.css';

const AVAILABILITY_PLAN_TYPE_SELECT_DATES = 'availability-plan/selectDates';
const AVAILABILITY_PLAN_TYPE_RECURRING = 'availability-plan/recurring';
const AVAILABILITY_PLAN_TYPE_24HOUR = 'availability-plan/24hour';

const SELECT_DATES = 'Select Dates';
const RECURRING = 'Recurring';
const TWENTY_FOUR_HOUR = '24 Hour Care';

const generateTitle = (currentListing, intl) => {
  let careScheduleType = null;
  const availabilityPlan = currentListing.attributes.publicData.availabilityPlan;

  switch (availabilityPlan.type) {
    case AVAILABILITY_PLAN_TYPE_SELECT_DATES:
      careScheduleType = SELECT_DATES;
      break;
    case AVAILABILITY_PLAN_TYPE_RECURRING:
      careScheduleType = RECURRING;
      break;
    case AVAILABILITY_PLAN_TYPE_24HOUR:
      careScheduleType = TWENTY_FOUR_HOUR;
      break;
    default:
      careScheduleType = null;
  }

  let relationships = null;

  const careRecipients = currentListing.attributes.publicData.careRecipients;

  if (careRecipients.length > 0) {
    relationships = careRecipients.map(recipient => recipient.recipientRelationship);
  }

  let relationshipString = null;

  relationships.forEach((relationship, index) => {
    const capitalizedRelationship = relationship.charAt(0).toUpperCase() + relationship.slice(1);
    if (index === 0) {
      relationshipString = capitalizedRelationship;
    } else if (index === relationships.length - 1) {
      relationshipString = `${relationshipString} and ${capitalizedRelationship}`;
    } else {
      relationshipString = `${relationshipString}, ${capitalizedRelationship}`;
    }
  });

  const city = currentListing.attributes.publicData.location.city;

  return `${careScheduleType} Care Needed for ${relationshipString} in ${city}`;
};

const EditListingJobDescriptionPanel = props => {
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
      id="EditListingJobDescriptionPanel.title"
      values={{
        jobDescription: (
          <span className={css.caregiverTitleText}>
            <FormattedMessage id="EditListingJobDescriptionPanel.jobDescription" />
          </span>
        ),
      }}
    />
  ) : (
    <FormattedMessage
      id="EditListingJobDescriptionPanel.createListingTitle"
      values={{
        jobDescription: (
          <span className={css.caregiverTitleText}>
            <FormattedMessage id="EditListingJobDescriptionPanel.jobDescription" />
          </span>
        ),
      }}
    />
  );

  const title = generateTitle(currentListing);
  const description = publicData && publicData.description;
  const initialValues = { title, description };

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
      <EditListingJobDescriptionForm
        {...formProps}
        saveActionMsg={submitButtonText}
        required={true}
        onSubmit={values => {
          const { title, description } = values;

          const updatedValues = {
            title,
            description,
          };

          onSubmit(updatedValues);
        }}
      />
    </div>
  );
};

EditListingJobDescriptionPanel.defaultProps = {
  rootClassName: null,
  className: null,
  listing: null,
};

const { bool, func, object, string, shape } = PropTypes;

EditListingJobDescriptionPanel.propTypes = {
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

export default EditListingJobDescriptionPanel;
