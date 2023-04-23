import React, { useRef, useState } from 'react';
import { bool, string } from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { NamedLink, ButtonGroup } from '../../components';
import { CAREGIVER, EMPLOYER } from '../../util/constants';

import caregiverListingImage from '../../assets/caregiver-listing-card.png';
import employerListingsImage from '../../assets/employer-listings.png';

import css from './SectionMarketplaceSummary.module.css';

const buttonGroupOptions = [
  { key: CAREGIVER, label: 'Become a Caregiver' },
  { key: EMPLOYER, label: 'Hire a Caregiver' },
];

const SectionMarketplaceSummary = props => {
  const { rootClassName, className, onScrollIntoView } = props;

  const [userType, setUserType] = useState(CAREGIVER);

  const handleUserTypeChange = userType => {
    setUserType(userType);
  };

  const classes = classNames(rootClassName || css.root, className);
  return (
    <div className={classes}>
      <div className={css.title}>
        <FormattedMessage id="SectionMarketplaceSummary.title" />
      </div>

      <div className={css.userButtons} onClick={onScrollIntoView}>
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
              <div>Caregiving Freedom:</div>
              <div>Your Journey, Your Way</div>
            </h1>
            <div className={css.summaryContent}>
              <p className={css.summaryText}>
                Set your rates, choose your hours, and handpick your clients in your preferred
                location. Showcase your unique skills and passion to our community, unlocking
                endless opportunities. Reimagine your caregiving career with freedom, flexibility,
                and recognition—only at CareVine.
              </p>
            </div>
          </div>
          <div className={css.graphic}>
            <img className={css.graphicImage} src={employerListingsImage} />
          </div>
        </div>
      ) : (
        <div className={css.summaryContainer}>
          <div className={css.summary}>
            <h1 className={css.summaryTitle}>
              <div>Your Care, In Your Hands:</div>
              <div>Find the Perfect Caregiver for You</div>
            </h1>
            <div className={css.summaryContent}>
              <p className={css.summaryText}>
                Discover the seamless solution to finding the perfect caregiver. Tailor your care
                experience by selecting professionals that fit your needs, budget, and location. Our
                user-friendly platform eliminates the middleman, empowering you to take control of
                your care journey. Accessible to all, CareVine puts the power in your hands.
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
