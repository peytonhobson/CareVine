import React, { useState } from 'react';
import { intlShape } from '../../util/reactIntl';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';
import config from '../../config';
import { findOptionsForSelectFilter } from '../../util/search';

import { LISTING_STATE_DRAFT } from '../../util/types';
import { ensureListing, convertFilterKeyToLabel } from '../../util/data';
import { EditListingAddCareRecipientForm, EditListingCareRecipientDetailsForm } from '../../forms';
import { InlineTextButton, Modal, IconClose } from '..';

import css from './EditListingCareRecipientDetailsPanel.module.css';

const EditListingCareRecipientDetailsPanel = props => {
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
    onManageDisableScrolling,
    filterConfig,
  } = props;

  const currentListing = ensureListing(listing);

  const [careRecipients, setCareRecipients] = useState(
    currentListing?.attributes?.publicData?.careRecipients || []
  );
  const [isCareRecipientFormVisible, setIsCareRecipientFormVisible] = useState(false);
  const [isCareRecipientsWarningVisible, setIsCareRecipientsWarningVisible] = useState(false);

  const classes = classNames(rootClassName || css.root, className);
  const { publicData } = currentListing.attributes;

  const handleSubmit = values => {
    const { recipientDetails, detailedCareNeeds } = values;

    if (careRecipients.length === 0) {
      // Need to use setTimeout due to bug where scrollTo doesn't work if called immediately
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }, 2);
      setIsCareRecipientsWarningVisible(true);
      return;
    }

    const updatedValues = {
      publicData: {
        careRecipients,
        detailedCareNeeds: detailedCareNeeds.filter(need =>
          findOptionsForSelectFilter('detailedCareNeeds', filterConfig).find(el => el.key === need)
        ),
        recipientDetails,
      },
    };

    onSubmit(updatedValues);
  };

  const handleAddRecipient = values => {
    const { recipientRelationship, gender, age } = values;

    if (isCareRecipientsWarningVisible) {
      setIsCareRecipientsWarningVisible(false);
    }

    const newCareRecipient = {
      recipientRelationship,
      gender,
      age,
    };

    setCareRecipients(prevCareRecipients => [...prevCareRecipients, newCareRecipient]);
    setIsCareRecipientFormVisible(false);
  };

  const onDeleteRecipient = careRecipient => {
    if (careRecipients.length === 1) {
      setIsCareRecipientsWarningVisible(true);
    }

    setCareRecipients(prevCareRecipients => prevCareRecipients.filter(cr => cr !== careRecipient));
  };

  const isPublished = currentListing.id && currentListing.attributes.state !== LISTING_STATE_DRAFT;
  const panelTitle = isPublished ? (
    <FormattedMessage
      id="EditListingCareRecipientDetailsPanel.title"
      values={{
        whoNeedsCare: (
          <span className={css.whoNeedsCareText}>
            <FormattedMessage id="EditListingCareRecipientDetailsPanel.whoNeedsCare" />
          </span>
        ),
      }}
    />
  ) : (
    <FormattedMessage
      id="EditListingCareRecipientDetailsPanel.createListingTitle"
      values={{
        whoNeedsCare: (
          <span className={css.whoNeedsCareText}>
            <FormattedMessage id="EditListingCareRecipientDetailsPanel.whoNeedsCare" />
          </span>
        ),
      }}
    />
  );

  const initialValues = {
    recipientDetails: publicData.recipientDetails,
    detailedCareNeeds: publicData.detailedCareNeeds,
  };

  const formProps = {
    className: css.form,
    initialValues,
    onChange,
    disabled,
    ready,
    updated: panelUpdated,
    updateInProgress,
    fetchErrors: errors,
    intl,
  };

  const addCareFormInitialValues = { age: 'early30s' };

  const addCareFormProps = {
    className: css.form,
    onChange,
    disabled,
    ready,
    initialValues: addCareFormInitialValues,
    updated: panelUpdated,
    updateInProgress,
    fetchErrors: errors,
    intl,
  };

  return (
    <div className={classes}>
      <h1 className={css.title}>{panelTitle}</h1>

      {/* <label>
        <FormattedMessage id={'EditListingCareRecipientDetailsPanel.whoNeedsCareLabel'} />
      </label> */}
      {careRecipients.length === 0 ? (
        <div className={css.noRecipients}>
          <FormattedMessage id="EditListingCareRecipientDetailsPanel.noCareRecipients" />
        </div>
      ) : (
        <div className={css.recipients}>
          {careRecipients.map((recipient, index) => {
            const { recipientRelationship, gender, age } = recipient;
            const recipientRelationshipLabel = convertFilterKeyToLabel(
              'recipientRelationship',
              recipientRelationship
            );
            const genderLabel = convertFilterKeyToLabel('gender', gender);
            const ageLabel = convertFilterKeyToLabel('recipientAge', age);
            return (
              <div key={index} className={css.recipient}>
                <div className={css.recipientHeader}>
                  <button
                    className={css.removeRecipientButton}
                    onClick={() => onDeleteRecipient(recipient)}
                  >
                    <IconClose size="normal" className={css.removeIcon} />
                  </button>
                </div>
                <h3 className={css.recipientLabel}>Recipient {index + 1}:</h3>
                <div className={css.recipientTraitsContainer}>
                  <span className={css.recipientTrait}>
                    Relationship: {recipientRelationshipLabel}
                  </span>
                  <span className={css.recipientTrait}>Gender: {genderLabel}</span>
                  <span className={css.recipientTrait}>Age: {ageLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div>
        <InlineTextButton
          className={css.addRecipientButton}
          onClick={() => setIsCareRecipientFormVisible(true)}
          disabled={disabled}
          ready={ready}
        >
          <FormattedMessage id="EditListingCareRecipientDetailsPanel.addCareRecipient" />
        </InlineTextButton>
        {isCareRecipientsWarningVisible ? (
          <p className={css.error}>
            <FormattedMessage id="EditListingCareRecipientDetailsPanel.careRecipientsWarning" />
          </p>
        ) : null}
      </div>
      <EditListingCareRecipientDetailsForm
        {...formProps}
        saveActionMsg={submitButtonText}
        required={true}
        onSubmit={handleSubmit}
        careRecipients={careRecipients}
      />
      {onManageDisableScrolling && isCareRecipientFormVisible ? (
        <Modal
          id="AddCareRecipientModal"
          isOpen={isCareRecipientFormVisible}
          onClose={() => setIsCareRecipientFormVisible(false)}
          onManageDisableScrolling={onManageDisableScrolling}
          containerClassName={css.modalContainer}
          usePortal
        >
          <EditListingAddCareRecipientForm
            {...addCareFormProps}
            saveActionMsg="Add care recipient"
            required={true}
            onSubmit={handleAddRecipient}
            isFormVisible={isCareRecipientFormVisible}
          />
        </Modal>
      ) : null}
    </div>
  );
};

EditListingCareRecipientDetailsPanel.defaultProps = {
  rootClassName: null,
  className: null,
  listing: null,
  filterConfig: config.custom.filters,
};

const { bool, func, object, string, array } = PropTypes;

EditListingCareRecipientDetailsPanel.propTypes = {
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
  filterConfig: array,
};

export default EditListingCareRecipientDetailsPanel;
