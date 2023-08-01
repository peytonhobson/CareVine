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
            Find the Perfect Caregiver for You
          </h2>
          <span>
            Discover the seamless solution to finding the perfect caregiver. Tailor your care
            experience by selecting professionals that fit your needs, budget, and location. Our
            user-friendly platform eliminates the middleman, empowering you to take control of your
            care journey. Accessible to all, CareVine puts the power in your hands.
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
