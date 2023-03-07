import React, { useEffect, useState } from 'react';
import { string } from 'prop-types';
import { FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { NamedLink, Logo } from '../../components';
import { CAREGIVER, EMPLOYER } from '../../util/constants';

import css from './SectionHero.module.css';

const SectionHero = props => {
  const [mounted, setMounted] = useState(false);
  const { rootClassName, className, userType } = props;

  useEffect(() => {
    setMounted(true);
  }, []);

  const classes = classNames(rootClassName || css.root, className);

  const itemsToBrowse = userType === CAREGIVER ? 'jobs' : 'caregivers';

  let title = null;

  switch (userType) {
    case EMPLOYER:
      title = 'SectionHero.titleEmployer';
      break;
    case CAREGIVER:
      title = 'SectionHero.titleCaregiver';
      break;
    default:
      title = 'SectionHero.title';
  }

  return (
    <div className={classes}>
      <div className={css.heroContent}>
        {userType ? (
          <h1 className={classNames(css.heroMainTitle, { [css.heroMainTitleFEDelay]: mounted })}>
            <FormattedMessage id={title} />
          </h1>
        ) : (
          <Logo format="hero" className={css.logo} alt="CareVine" />
        )}
        <h2 className={classNames(css.heroSubTitle, { [css.heroSubTitleFEDelay]: mounted })}>
          <FormattedMessage id="SectionHero.subTitle" />
        </h2>
        {/* Change this to use current location w/ mapbox */}
        {userType ? (
          <NamedLink
            name="SearchPage"
            to={{
              search:
                'address=United%20States%20of%20America&bounds=71.540724%2C-66.885444%2C18.765563%2C-179.9distance=0',
            }}
            className={classNames(css.heroButton, { [css.heroButtonFEDelay]: mounted })}
          >
            <FormattedMessage id="SectionHero.browseButton" values={{ itemsToBrowse }} />
          </NamedLink>
        ) : (
          <NamedLink
            name="SignupPage"
            className={classNames(css.heroButton, { [css.heroButtonFEDelay]: mounted })}
          >
            <FormattedMessage id="SectionHero.getStartedButton" values={{ itemsToBrowse }} />
          </NamedLink>
        )}
      </div>
    </div>
  );
};

SectionHero.defaultProps = { rootClassName: null, className: null };

SectionHero.propTypes = {
  rootClassName: string,
  className: string,
};

export default SectionHero;
