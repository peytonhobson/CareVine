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

import css from './SectionMarketplaceSummary.module.css';

const buttonGroupOptions = [
  { key: CAREGIVER, label: 'Become a Caregiver' },
  { key: EMPLOYER, label: 'Hire a caregiver' },
];

const SectionMarketplaceSummary = props => {
  const { rootClassName, className, currentUser } = props;

  const buttonGroupRef = useRef(null);
  const [userType, setUserType] = useState(CAREGIVER);

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
      <div className={css.title}>
        <FormattedMessage id="SectionMarketplaceSummary.title" />
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

      {userType === CAREGIVER ? (
        <div className={css.summaryContainer}>
          <div className={css.summary}>
            <h1 className={css.summaryTitle}>
              <FormattedMessage id="SectionMarketplaceSummary.summaryTitleCaregiver" />
            </h1>
            <div className={css.summaryContent}>
              <p className={css.summaryText}>
                <FormattedMessage id="SectionMarketplaceSummary.summaryTextCaregiver" />
              </p>
            </div>
          </div>
          <div className={css.graphic}>
            <img className={css.graphicImage} src={employerListingImage} />
          </div>
        </div>
      ) : (
        <div className={css.summaryContainer}>
          <div className={css.summary}>
            <h1 className={css.summaryTitle}>
              <FormattedMessage id="SectionMarketplaceSummary.summaryTitleEmployer" />
            </h1>
            <div className={css.summaryContent}>
              <p className={css.summaryText}>
                <FormattedMessage id="SectionMarketplaceSummary.summaryTextEmployer" />
              </p>
            </div>
          </div>
          <div className={css.graphic}>
            <img className={css.graphicImage} src={caregiverListingImage} />
          </div>
        </div>
      )}

      <div className={css.getStartedLink}>
        <NamedLink name="SignupPage" className={css.getStartedButton}>
          <FormattedMessage id="SectionMarketplaceSummary.getStartedButton" />
        </NamedLink>
      </div>
    </div>
  );
};

export default SectionMarketplaceSummary;
