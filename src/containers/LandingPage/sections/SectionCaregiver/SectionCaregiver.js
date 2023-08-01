import React from 'react';

import { NamedLink } from '../../../../components';
import caregiverImg from '../../../../assets/LandingPage-Caregiver.jpg';
import { LazyLoadImage } from 'react-lazy-load-image-component';

import css from './SectionCaregiver.module.css';

const SectionCaregiver = () => {
  return (
    <section className={css.caregiverSection}>
      <div className={css.caregiverSectionContent}>
        <div className={css.caregiverSectionCard}>
          <h3 className={css.forCaregivers}>For Caregivers</h3>
          <h2 className={css.caregiverSectionTitle}>
            Caregiving Freedom:<br></br>
            Your Journey, Your Way
          </h2>
          <span>
            Set your rates, choose your hours, and handpick your clients in your preferred location.
            Showcase your unique skills and passion to our community, unlocking endless
            opportunities. Reimagine your caregiving career with freedom, flexibility, and
            recognition—only at CareVine.
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
