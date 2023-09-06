import React from 'react';
import { intlShape } from '../../util/reactIntl';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';

import { LISTING_STATE_DRAFT } from '../../util/types';
import { ensureListing } from '../../util/data';
import { EditListingExperienceForm } from '../../forms';
import { findOptionsForSelectFilter } from '../../util/search';
import config from '../../config';

import css from './EditListingExperiencePanel.module.css';

const EditListingExperiencePanel = props => {
  const {
    rootClassName,
    className,
    listing,
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
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureListing(listing);
  const { publicData } = currentListing.attributes;

  const isPublished = currentListing.id && currentListing.attributes.state !== LISTING_STATE_DRAFT;
  const panelTitle = isPublished ? (
    <FormattedMessage
      id="EditListingExperiencePanel.title"
      values={{
        experience: (
          <span className={css.experienceText}>
            <FormattedMessage id="EditListingExperiencePanel.experience" />
          </span>
        ),
      }}
    />
  ) : (
    <FormattedMessage
      id="EditListingExperiencePanel.createListingTitle"
      values={{
        experience: (
          <span className={css.experienceText}>
            <FormattedMessage id="EditListingExperiencePanel.experience" />
          </span>
        ),
      }}
    />
  );

  const { experienceLevel, experienceAreas } = publicData;
  const initialValues = { experienceAreas, experienceLevel };

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
      <EditListingExperienceForm
        {...formProps}
        saveActionMsg={submitButtonText}
        onSubmit={values => {
          const { experienceLevel, experienceAreas } = values;

          const updatedValues = {
            publicData: {
              experienceLevel,
              experienceAreas:
                experienceAreas?.filter(area =>
                  findOptionsForSelectFilter('experienceAreas', filterConfig)?.find(
                    el => el.key === area
                  )
                ) || null,
            },
          };
          onSubmit(updatedValues);
        }}
        name="experience"
        initialValuesEqual={() => true}
      />
    </div>
  );
};

EditListingExperiencePanel.defaultProps = {
  rootClassName: null,
  className: null,
  listing: null,
  filterConfig: config.custom.filters,
};

const { bool, func, object, string, shape } = PropTypes;

EditListingExperiencePanel.propTypes = {
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

export default EditListingExperiencePanel;
