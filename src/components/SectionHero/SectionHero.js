import React, { useEffect, useState } from 'react';
import { string } from 'prop-types';
import { FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { NamedLink, Logo, OwnListingLink } from '../../components';
import { CAREGIVER, EMPLOYER } from '../../util/constants';

import css from './SectionHero.module.css';

const SectionHero = props => {
  const [mounted, setMounted] = useState(false);
  const { rootClassName, className, userType, currentUserListing } = props;

  useEffect(() => {
    setMounted(true);
  }, []);

  const classes = classNames(rootClassName || css.root, className);

  const itemsToBrowse = userType === CAREGIVER ? 'jobs' : 'caregivers';

  const geolocation = (currentUserListing && currentUserListing.attributes.geolocation) || {};
  const origin = `origin=${geolocation.lat}%2C${geolocation.lng}`;
  const distance = 'distance=30';
  const location = currentUserListing && currentUserListing.attributes.publicData.location;

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
        {location ? (
          <NamedLink
            name="SearchPage"
            to={{ search: `?${origin}&${distance}&sort=relevant` }}
            className={classNames(css.heroButton, { [css.heroButtonFEDelay]: mounted })}
          >
            <FormattedMessage id="SectionHero.browseButton" values={{ itemsToBrowse }} />
          </NamedLink>
        ) : userType ? (
          currentUserListing ? (
            <OwnListingLink
              listing={currentUserListing}
              listingFetched={!!currentUserListing}
              className={classNames(css.heroButton, { [css.heroButtonFEDelay]: mounted })}
            >
              <FormattedMessage id="SectionHero.finishYourProfileButton" />
            </OwnListingLink>
          ) : (
            <NamedLink
              className={classNames(css.heroButton, { [css.heroButtonFEDelay]: mounted })}
              name="NewListingPage"
            >
              <FormattedMessage id="SectionHero.addYourProfileButton" />
            </NamedLink>
          )
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
