import React, { useEffect, useState } from 'react';
import { bool, func, object, string } from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';
import { ensureOwnListing } from '../../util/data';
import { findOptionsForSelectFilter } from '../../util/search';
import { LISTING_STATE_DRAFT } from '../../util/types';
import { Modal } from '..';
import { EditListingBioForm } from '../../forms';

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
    onGenerateBio,
    generateBioInProgress,
    generateBioError,
    generatedBio,
    onManageDisableScrolling,
    ...rest
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureOwnListing(listing);
  const { description, title, publicData } = currentListing.attributes;

  const [isExplanationModalOpen, setIsExplanationModalOpen] = useState(false);

  useEffect(() => {
    if (currentListing.id && (!description || description === '')) {
      onGenerateBio(currentListing).then(() => {
        setIsExplanationModalOpen(true);
      });
    }
  }, [description]);

  const initialValues = { description: generatedBio || description };

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

  return (
    <div className={classes}>
      <h1 className={css.title}>{panelTitle}</h1>
      <EditListingBioForm
        className={css.form}
        initialValues={initialValues}
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
        generateBioInProgress={generateBioInProgress}
        onManageDisableScrolling={onManageDisableScrolling}
        {...rest}
      />
      <Modal
        id="BioGenerationExplanation"
        isOpen={isExplanationModalOpen}
        onClose={() => setIsExplanationModalOpen(false)}
        onManageDisableScrolling={onManageDisableScrolling}
        usePortal
      >
        <p className={css.modalTitle}>How does this work?</p>
        <p className={css.modalMessage}>
          We used a machine learning algorithm to generate a bio for you based on the information
          you provided in your profile.
        </p>
        <p className={css.modalMessage}>
          It is probably not perfect, but it is a good starting point. You can edit the bio to make
          it more personal.
        </p>
      </Modal>
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
