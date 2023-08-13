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
          <p>
            We believe you provide your best care when your needs are met. Who better to know those
            than you? At CareVine you set your rates, schedule, and handpick clients.
          </p>
          <p>
            Connect with those in need of care, secure more job opportunities, and get paid in full,
            directly. Experience a more fulfilling caregiving career with freedom and flexibility at
            CareVine.
          </p>
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
