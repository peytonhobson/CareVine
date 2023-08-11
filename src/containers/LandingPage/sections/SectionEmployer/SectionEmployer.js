import React from 'react';

import { NamedLink } from '../../../../components';
import employerImg from '../../../../assets/LandingPage-Employer.jpg';
import { LazyLoadImage } from 'react-lazy-load-image-component';

import css from './SectionEmployer.module.css';

const SectionEmployer = () => {
  return (
    <section className={css.employerSection}>
      <div className={css.employerSectionContent}>
        <div className={css.employerSectionCard}>
          <h2 className={css.employerSectionTitle}>
            Your Care, In Your Hands:<br></br>
            Find the Perfect<br></br> Caregiver for{' '}
            <span className={css.marketplaceColor}>You</span>
          </h2>
          <span>
            Find the right caregiver easily. Tailor your care experience by selecting professionals
            that fit your needs, budget, and location. With CareVine, you can connect directly with
            professionals, skipping the hassle and extra fees of middlemen. Simple, direct, and made
            for everyone. Take control of your care with CareVine.
          </span>
          <div className={css.getStartedLinkContainer}>
            <NamedLink name="SignupPage" className={css.getStartedButton}>
              Get Started
            </NamedLink>
          </div>
        </div>
        <div className={css.employerSectionImageContainer}>
          <LazyLoadImage
            className={css.employerSectionImage}
            src={employerImg}
            alt="Two people embracing."
          />
        </div>
      </div>
    </section>
  );
};

export default SectionEmployer;
