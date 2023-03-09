import React, { useRef, useState } from 'react';
import { bool, string } from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { NamedLink, ButtonGroup } from '../../components';
import { CAREGIVER, EMPLOYER } from '../../util/constants';

import createProfileImage from '../../assets/profile-preview.png';
import employerListingImage from '../../assets/employer-listing-card.png';
import caregiverInquiryMessage from '../../assets/caregiver-inquiry-message.png';
import employerCareTypes from '../../assets/employer-care-types.png';
import caregiverListingImage from '../../assets/caregiver-listing-card.png';
import employerInquiryMessage from '../../assets/employer-inquiry-message.png';

import css from './SectionHowItWorks.module.css';

const buttonGroupOptions = [
  { key: CAREGIVER, label: 'Find a job' },
  { key: EMPLOYER, label: 'Hire a caregiver' },
];

const SectionHowItWorks = props => {
  const { rootClassName, className, currentUser } = props;

  const currentUserType = currentUser?.attributes?.profile?.metadata?.userType;

  const buttonGroupRef = useRef(null);
  const [userType, setUserType] = useState(currentUserType);

  const handleUserTypeChange = userType => {
    setUserType(userType);
  };

  const scrollIntoView = () => {
    buttonGroupRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const classes = classNames(rootClassName || css.root, className);
  return (
    <div className={classes}>
      {!currentUser ? (
        <>
          <div className={css.title}>
            <FormattedMessage id="SectionHowItWorks.titleLineOne" />
          </div>

          <div className={css.userButtons} ref={buttonGroupRef} onClick={scrollIntoView}>
            <ButtonGroup
              className={css.buttonGroup}
              initialSelect={CAREGIVER}
              onChange={handleUserTypeChange}
              options={buttonGroupOptions}
              rootClassName={css.buttonGroupRoot}
              selectedClassName={css.buttonGroupSelected}
            />
          </div>
        </>
      ) : (
        <div className={css.authTitle} ref={buttonGroupRef} onClick={scrollIntoView}>
          <FormattedMessage id="SectionHowItWorks.titleAuthenticated" />
        </div>
      )}

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
