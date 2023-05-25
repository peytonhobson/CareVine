import React, { useRef, useState } from 'react';
import { bool, string } from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { NamedLink } from '../../components';
import { CAREGIVER } from '../../util/constants';

import createProfileImage from '../../assets/profile-preview.jpg';
import employerListingImage from '../../assets/employer-listing-card.jpg';
import caregiverInquiryMessage from '../../assets/caregiver-inquiry-message.jpg';
import employerCareTypes from '../../assets/employer-care-types.jpg';
import caregiverListingImage from '../../assets/caregiver-listing-card.jpg';
import employerInquiryMessage from '../../assets/employer-inquiry-message.jpg';

import css from './SectionHowItWorks.module.css';

const SectionHowItWorks = props => {
  const { rootClassName, className, currentUser } = props;

  const userType = currentUser?.attributes?.profile?.metadata?.userType;

  const buttonGroupRef = useRef(null);

  const scrollIntoView = () => {
    buttonGroupRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const classes = classNames(rootClassName || css.root, className);
  return (
    <div className={classes}>
      <div className={css.authTitle} ref={buttonGroupRef} onClick={scrollIntoView}>
        <FormattedMessage id="SectionHowItWorks.titleAuthenticated" />
      </div>

      {userType === CAREGIVER ? (
        <div className={css.steps}>
          <div className={css.step}>
            <h1 className={css.stepTitle}>
              <FormattedMessage id="SectionHowItWorks.part1TitleCaregiver" />
            </h1>
            <div className={css.stepContent}>
              <p className={css.stepText}>
                <FormattedMessage id="SectionHowItWorks.part1TextCaregiver" />
              </p>
              <img className={css.createProfileImage} src={createProfileImage} />
            </div>
          </div>

          <div className={css.step}>
            <h1 className={css.stepTitle}>
              <FormattedMessage id="SectionHowItWorks.part2TitleCaregiver" />
            </h1>
            <div className={css.stepContent}>
              <p className={css.stepText}>
                <FormattedMessage id="SectionHowItWorks.part2TextCaregiver" />
              </p>
              <img className={css.employerListingImage} src={employerListingImage} />
            </div>
          </div>

          <div className={css.step}>
            <h1 className={css.stepTitle}>
              <FormattedMessage id="SectionHowItWorks.part3TitleCaregiver" />
            </h1>
            <div className={css.stepContent}>
              <p className={css.stepText}>
                <FormattedMessage id="SectionHowItWorks.part3TextCaregiver" />
              </p>
              <img className={css.caregiverInquiryImage} src={caregiverInquiryMessage} />
            </div>
          </div>
        </div>
      ) : (
        <div className={css.steps}>
          <div className={css.step}>
            <h1 className={css.stepTitle}>
              <FormattedMessage id="SectionHowItWorks.part1TitleEmployer" />
            </h1>
            <div className={css.stepContent}>
              <p className={css.stepText}>
                <FormattedMessage id="SectionHowItWorks.part1TextEmployer" />
              </p>
              <img className={css.createProfileImage} src={employerCareTypes} />
            </div>
          </div>

          <div className={css.step}>
            <h1 className={css.stepTitle}>
              <FormattedMessage id="SectionHowItWorks.part2TitleEmployer" />
            </h1>
            <div className={css.stepContent}>
              <p className={css.stepText}>
                <FormattedMessage id="SectionHowItWorks.part2TextEmployer" />
              </p>
              <img className={css.caregiverListingImage} src={caregiverListingImage} />
            </div>
          </div>

          <div className={css.step}>
            <h1 className={css.stepTitle}>
              <FormattedMessage id="SectionHowItWorks.part3TitleEmployer" />
            </h1>
            <div className={css.stepContent}>
              <p className={css.stepText}>
                <FormattedMessage id="SectionHowItWorks.part3TextEmployer" />
              </p>
              <img className={css.caregiverInquiryImage} src={employerInquiryMessage} />
            </div>
          </div>
        </div>
      )}

      {!currentUser && (
        <div className={css.getStartedLink}>
          <NamedLink name="SignupPage" className={css.getStartedButton}>
            <FormattedMessage id="SectionHowItWorks.getStartedButton" />
          </NamedLink>
        </div>
      )}
    </div>
  );
};

SectionHowItWorks.defaultProps = {
  rootClassName: null,
  className: null,
  currentUserListing: null,
  currentUserListingFetched: false,
};

SectionHowItWorks.propTypes = {
  rootClassName: string,
  className: string,
  currentUserListing: propTypes.ownListing,
  currentUserListingFetched: bool,
};

export default SectionHowItWorks;
