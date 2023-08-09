import React from 'react';

import { NamedLink } from '../../../../components';
import caregiverImg from '../../../../assets/LandingPage-Caregiver.jpg';
import { LazyLoadImage } from 'react-lazy-load-image-component';

import css from './SectionCaregiver.module.css';

const SectionCaregiver = ({ isMobile }) => {
  return (
    <section className={css.caregiverSection}>
      <div className={css.caregiverSectionContent}>
        <div className={css.caregiverSectionCard}>
          <h3 className={css.forCaregivers}>For Caregivers</h3>
          <h2 className={css.caregiverSectionTitle}>
            Caregiving Freedom:<br></br>
            Your Journey,{isMobile ? <br></br> : null} Your Way
          </h2>
          <span>
            Set your rates, choose your hours, and handpick clients near you. Connect with seniors
            in need of care, secure more job opportunities, and keep more of your pay without
            middlemen taking a cut. Experience a caregiving career with more freedom and flexibility
            at CareVine.
          </span>
          <div className={css.getStartedLinkContainer}>
            <NamedLink name="ForCaregiversPage" className={css.getStartedButton}>
              Learn More
            </NamedLink>
          </div>
        </div>
        <div className={css.caregiverSectionImageContainer}>
          <LazyLoadImage
            className={css.caregiverSectionImage}
            src={caregiverImg}
            alt="Person smiling."
          />
        </div>
      </div>
    </section>
  );
};

export default SectionCaregiver;
