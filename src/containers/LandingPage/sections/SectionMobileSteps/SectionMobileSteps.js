import React from 'react';

import { IconArrowHead } from '../../../../components';

import css from './SectionMobileSteps.module.css';

const SectionMobileSteps = () => {
  return (
    <section className={css.root}>
      <div className={css.card}>
        <div className={css.stepsContainer}>
          <div className={css.step}>
            <h2 className={css.stepIcon}>1</h2>
            <h3>
              Craft Your<br></br> Personal Profile
            </h3>
          </div>
          <IconArrowHead direction="down" height="3em" width="3em" className={css.arrow} />
          <div className={css.step}>
            <h2 className={css.stepIcon}>2</h2>
            <h3>
              Discover Your <br></br> Ideal Caregiver
            </h3>
          </div>
          <IconArrowHead direction="down" height="3em" width="3em" className={css.arrow} />
          <div className={css.step}>
            <h2 className={css.stepIcon}>3</h2>
            <h3>Book Your Care</h3>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionMobileSteps;
