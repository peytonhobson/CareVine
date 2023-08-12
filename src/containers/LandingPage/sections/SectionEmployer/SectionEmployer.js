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
          <p>
            Finding high quality in-home care shouldn't be difficult. CareVine makes it all a bit
            easier. From the search, to scheduling through payment. Our platform eliminates the
            middleman of traditional caregiving agencies, putting the tools in your hands to find
            and manage care that fits your needs, budget and location.
          </p>
          <p>Communicate with, book and pay caregivers directly on CareVine!</p>
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
