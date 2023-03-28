import React from 'react';
import { intlShape } from '../../util/reactIntl';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';

import { LISTING_STATE_DRAFT } from '../../util/types';
import { ensureListing } from '../../util/data';
import { EditListingJobDescriptionForm } from '../../forms';
import config from '../../config';
import { findOptionsForSelectFilter } from '../../util/search';

import css from './EditListingJobDescriptionPanel.module.css';

const AVAILABILITY_PLAN_TYPE_SELECT_DATES = 'oneTime';
const AVAILABILITY_PLAN_TYPE_RECURRING = 'repeat';
const AVAILABILITY_PLAN_TYPE_24HOUR = '24hour';

const SELECT_DATES = 'One Time Care';
const RECURRING = 'Repeat Care';
const TWENTY_FOUR_HOUR = '24 Hour Care';

const convertFilterKeyToLabel = (key, property, filter) => {
  const filterOption = findOptionsForSelectFilter(property, filter).find(data => {
    return key === data.key;
  });

  return filterOption ? filterOption.label : null;
};

const generateTitle = (currentListing, filterConfig) => {
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
    relationships = careRecipients.map(recipient =>
      convertFilterKeyToLabel(
        recipient.recipientRelationship,
        'recipientRelationship',
        filterConfig
      )
    );
  }

  const pluralizeRelationshipsIfMultiple = relationships => {
    const relationshipsCountMap = relationships.reduce((acc, relationship) => {
      if (acc[relationship]) {
        acc[relationship] += 1;
      } else {
        acc[relationship] = 1;
      }
      return acc;
    }, {});

    return Object.keys(relationshipsCountMap).map(key => {
      if (relationshipsCountMap[key] > 1) {
        return `${key}s`;
      } else {
        return key;
      }
    });
  };

  const pluralizedRelationships = pluralizeRelationshipsIfMultiple(relationships);

  let relationshipString = null;

  pluralizedRelationships.forEach((relationship, index) => {
    const capitalizedRelationship =
      relationship
        .replace('My ', '')
        .charAt(0)
        .toUpperCase() + relationship.replace('My ', '').slice(1);
    if (index === 0) {
      relationshipString = capitalizedRelationship;
    } else if (index === pluralizedRelationships.length - 1) {
      const comma = pluralizedRelationships.length > 2 ? ',' : '';
      relationshipString = `${relationshipString}${comma} and ${capitalizedRelationship}`;
    } else {
      relationshipString = `${relationshipString}, ${capitalizedRelationship}`;
    }
  });

  const city = currentListing?.attributes?.publicData?.location?.city;

  return `${careScheduleType} Needed for ${
    !relationshipString.startsWith('Myself') ? 'My' : ''
  } ${relationshipString} in ${city}`;
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
    filterConfig,
    ...rest
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureListing(listing);
  const { publicData, description, title } = currentListing.attributes;

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

  const initialTitle = title !== 'Title' ? title : generateTitle(currentListing, filterConfig);
  const initialValues = { title: initialTitle, description };

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
    ...rest,
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
  filterConfig: config.custom.filters,
};

const { bool, func, object, string, shape, filterConfig } = PropTypes;

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
  filterConfig: filterConfig,
};

export default EditListingJobDescriptionPanel;
