import React from 'react';
import { bool, func, object, string } from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';
import { ensureOwnListing } from '../../util/data';
import { findOptionsForSelectFilter } from '../../util/search';
import { LISTING_STATE_DRAFT } from '../../util/types';
import { ListingLink } from '..';
import { EditListingBioForm } from '../../forms';
import config from '../../config';

import css from './EditListingBioPanel.module.css';

const EditListingBioPanel = props => {
  const {
    className,
    rootClassName,
    listing,
    disabled,
    ready,
    onSubmit,
    onChange,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    errors,
    ...rest
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureOwnListing(listing);
  const { description, title, publicData } = currentListing.attributes;

  const isPublished = currentListing.id && currentListing.attributes.state !== LISTING_STATE_DRAFT;
  const panelTitle = isPublished ? (
    <FormattedMessage
      id="EditListingDescriptionPanel.title"
      values={{
        bio: (
          <span className={css.bioText}>
            <FormattedMessage id="EditListingDescriptionPanel.bio" />
          </span>
        ),
      }}
    />
  ) : (
    <FormattedMessage
      id="EditListingDescriptionPanel.createListingTitle"
      values={{
        bio: (
          <span className={css.bioText}>
            <FormattedMessage id="EditListingDescriptionPanel.bio" />
          </span>
        ),
      }}
    />
  );

  // const userFullName = listing?.author?.attributes.profile.displayName;

  return (
    <div className={classes}>
      <h1 className={css.title}>{panelTitle}</h1>
      <EditListingBioForm
        className={css.form}
        initialValues={{ description }}
        saveActionMsg={submitButtonText}
        onSubmit={values => {
          const { description } = values;

          const updateValues = {
            description,
          };

          onSubmit(updateValues);
        }}
        onChange={onChange}
        disabled={disabled}
        ready={ready}
        updated={panelUpdated}
        updateInProgress={updateInProgress}
        fetchErrors={errors}
        {...rest}
      />
    </div>
  );
};

EditListingBioPanel.defaultProps = {
  className: null,
  rootClassName: null,
  errors: null,
  listing: null,
};

EditListingBioPanel.propTypes = {
  className: string,
  rootClassName: string,

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
};

export default EditListingBioPanel;
