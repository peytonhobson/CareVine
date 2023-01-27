import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { Modal } from '../';
import { ensureOwnListing } from '../../util/data';
import { LISTING_STATE_DRAFT } from '../../util/types';
import { FormattedMessage } from 'react-intl';
import { ConsentModalForm, EditListingBackgroundCheckForm } from '../../forms';
import moment from 'moment';

import css from './EditListingBackgroundCheckPanel.module.css';

const EditListingBackgroundCheckPanel = props => {
  const {
    className,
    rootClassName,
    listing,
    onAuthenticateCreateUser,
    disabled,
    ready,
    onSubmit,
    onChange,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    errors,
    intl,
    currentUser,
    authenticateCreateUserError,
    authenticateCreateUserInProgress,
    onManageDisableScrolling,
  } = props;

  const [showConsentModal, setShowConsentModal] = useState(false);

  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureOwnListing(listing);
  const { description, title, publicData } = currentListing.attributes;
  const userAttributes = currentUser.attributes;

  const isPublished = currentListing.id && currentListing.attributes.state !== LISTING_STATE_DRAFT;
  const panelTitle = <FormattedMessage id="EditListingBackgroundCheckPanel.createListingTitle" />;

  const authenticateUserAccessCode =
    !!currentUser &&
    !!currentUser.attributes.profile.metadata &&
    currentUser.attributes.profile.metadata.authenticateUserAccessCode;

  useEffect(() => {
    if (authenticateUserAccessCode) {
      setShowConsentModal(true);
    }
  }, [authenticateUserAccessCode]);

  const handleSubmit = values => {
    const {
      firstName,
      middleName,
      lastName,
      dob,
      email,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      ssn,
    } = values;

    const addressLine2String = addressLine2 ? `, ${addressLine2}` : '';

    const userInfo = {
      firstName,
      middleName,
      lastName,
      dob: moment(dob.date).format('DD-MM-YYYY'),
      email,
      phone: phone.replace(/-/g, ''),
      streetName: addressLine1,
      address: `${addressLine1}${addressLine2String}`,
      city,
      state,
      zipCode,
      ssn: ssn.replace(/-/g, ''),
    };

    onAuthenticateCreateUser(userInfo, currentUser.id.uuid);
  };

  const initialValues = {
    firstName: userAttributes.profile.firstName,
    lastName: userAttributes.profile.lastName,
    email: userAttributes.email,
    city: publicData.location.city,
    state: publicData.location.state,
    zipCode: publicData.location.zipcode,
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
    authenticateCreateUserError,
    authenticateCreateUserInProgress,
    authenticateUserAccessCode,
  };

  // const userFullName = listing?.author?.attributes.profile.displayName;

  return (
    <div className={classes}>
      <h1 className={css.title}>{panelTitle}</h1>
      <EditListingBackgroundCheckForm
        {...formProps}
        onSubmit={handleSubmit}
        saveActionMsg="Submit"
      />
      {showConsentModal && (
        <Modal
          id="EditListingBackgroundCheckPanel.consentModal"
          isOpen={showConsentModal}
          onClose={() => setShowConsentModal(false)}
          onManageDisableScrolling={onManageDisableScrolling}
          containerClassName={css.consentModal}
          noClose
          usePortal
        >
          <ConsentModalForm onSubmit={() => {}} currentUser={currentUser} />
        </Modal>
      )}
    </div>
  );
};

export default EditListingBackgroundCheckPanel;
