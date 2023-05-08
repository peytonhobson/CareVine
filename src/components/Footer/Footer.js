import React from 'react';
import { string } from 'prop-types';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import classNames from 'classnames';
import { twitterPageURL } from '../../util/urlHelpers';
import config from '../../config';
import {
  IconSocialMediaFacebook,
  IconSocialMediaInstagram,
  IconSocialMediaTwitter,
  Logo,
  ExternalLink,
  NamedLink,
} from '../../components';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { LISTING_PAGE_PARAM_TYPE_DRAFT, LISTING_PAGE_PARAM_TYPE_NEW } from '../../util/urlHelpers';
import { createSlug } from '../../util/urlHelpers';
import { CAREGIVER, EMPLOYER } from '../../util/constants';

import css from './Footer.module.css';

const newListingStates = [LISTING_PAGE_PARAM_TYPE_NEW, LISTING_PAGE_PARAM_TYPE_DRAFT];
const isDev = process.env.REACT_APP_ENV === 'development';

const renderSocialMediaLinks = intl => {
  const { siteFacebookPage, siteInstagramPage, siteTwitterHandle } = config;
  const siteTwitterPage = twitterPageURL(siteTwitterHandle);

  const goToFb = intl.formatMessage({ id: 'Footer.goToFacebook' });
  const goToInsta = intl.formatMessage({ id: 'Footer.goToInstagram' });
  const goToTwitter = intl.formatMessage({ id: 'Footer.goToTwitter' });

  const fbLink = siteFacebookPage ? (
    <ExternalLink key="linkToFacebook" href={siteFacebookPage} className={css.icon} title={goToFb}>
      <IconSocialMediaFacebook />
    </ExternalLink>
  ) : null;

  const twitterLink = siteTwitterPage ? (
    <ExternalLink
      key="linkToTwitter"
      href={siteTwitterPage}
      className={css.icon}
      title={goToTwitter}
    >
      <IconSocialMediaTwitter />
    </ExternalLink>
  ) : null;

  const instagramLink = siteInstagramPage ? (
    <ExternalLink
      key="linkToInstagram"
      href={siteInstagramPage}
      className={css.icon}
      title={goToInsta}
    >
      <IconSocialMediaInstagram />
    </ExternalLink>
  ) : null;
  return [fbLink, twitterLink, instagramLink].filter(v => v != null);
};

const Footer = props => {
  const {
    rootClassName,
    className,
    intl,
    currentUserListing,
    currentUserListingFetched,
    currentUser,
    fetchCurrentUserInProgress,
  } = props;
  const socialMediaLinks = renderSocialMediaLinks(intl);
  const classes = classNames(rootClassName || css.root, className);

  const isNewListing = newListingStates.includes(currentUserListing?.attributes?.state);

  const geolocation = currentUserListing?.attributes?.geolocation || {};
  const origin = `origin=${geolocation.lat}%2C${geolocation.lng}`;
  const distance = 'distance=30';
  const location = currentUserListing?.attributes?.publicData?.location;
  const userType = currentUser?.attributes?.profile?.metadata?.userType;

  const oppositeUserType =
    userType === EMPLOYER ? CAREGIVER : userType === CAREGIVER ? EMPLOYER : null;

  const searchPageLink = (
    <NamedLink
      className={css.link}
      name="SearchPage"
      to={{
        search: `?${origin}&${distance}&sort=relevant${oppositeUserType &&
          `&listingType=${oppositeUserType}`}`,
      }}
    >
      <FormattedMessage id="Footer.growYourVines" />
    </NamedLink>
  );

  const listingId = currentUserListing?.id?.uuid;
  const title = currentUserListing?.attributes?.title;
  const slug = title && createSlug(title);

  return (
    <div className={classes}>
      <div className={css.topBorderWrapper}>
        <div className={css.content}>
          {/* <div className={css.someLiksMobile}>{socialMediaLinks}</div> */}
          <div className={css.links}>
            <div className={css.organization} id="organization">
              <NamedLink name="LandingPage" className={css.logoLink}>
                <span className={css.logo}>
                  <Logo format="desktop" />
                </span>
              </NamedLink>
              <div className={css.organizationInfo}>
                <p className={css.organizationDescription}>
                  <FormattedMessage id="Footer.organizationDescription" />
                </p>
                {/* <p className={css.organizationCopyright}>
                  <NamedLink name="LandingPage" className={css.copyrightLink}>
                    <FormattedMessage id="Footer.copyright" />
                  </NamedLink>
                </p> */}
              </div>
            </div>
            <div className={css.infoLinks}>
              <ul className={css.list}>
                <li className={css.listItem}>
                  {!fetchCurrentUserInProgress ? (
                    currentUser ? (
                      userType && !isNewListing && currentUserListing ? (
                        searchPageLink
                      ) : slug && listingId ? (
                        <NamedLink
                          name="EditListingPage"
                          params={{
                            id: listingId,
                            slug,
                            type: LISTING_PAGE_PARAM_TYPE_DRAFT,
                            tab: 'photos',
                          }}
                          className={css.link}
                        >
                          <FormattedMessage id="Footer.growYourVines" />
                        </NamedLink>
                      ) : (
                        <NamedLink name="NewListingPage" className={css.link}>
                          <FormattedMessage id="Footer.growYourVines" />
                        </NamedLink>
                      )
                    ) : (
                      <NamedLink name="SignupPage" className={css.link}>
                        <FormattedMessage id="Footer.growYourVines" />
                      </NamedLink>
                    )
                  ) : (
                    <span className={css.link}>
                      <FormattedMessage id="Footer.growYourVines" />
                    </span>
                  )}
                </li>
                <li className={css.listItem}>
                  <NamedLink name="FeedbackPage" className={css.link}>
                    <FormattedMessage id="Footer.toFeedbackPage" />
                  </NamedLink>
                </li>
                {isDev && (
                  <li className={css.listItem}>
                    <NamedLink name="BlogHomePage" className={css.link}>
                      <FormattedMessage id="Footer.toBlog" />
                    </NamedLink>
                  </li>
                )}
              </ul>
            </div>
            <div className={css.infoLinks}>
              <ul className={css.list}>
                <li className={css.listItem}>
                  <NamedLink name="AboutPage" className={css.link}>
                    <FormattedMessage id="Footer.toAboutPage" />
                  </NamedLink>
                </li>
                <li className={css.listItem}>
                  <NamedLink name="ContactUsPage" className={css.link}>
                    <FormattedMessage id="Footer.toContactPage" />
                  </NamedLink>
                </li>
              </ul>
            </div>
            <div className={css.extraLinks}>
              {/* <div className={css.someLinks}>{socialMediaLinks}</div> */}
              <div className={css.legalMatters}>
                <ul className={css.tosAndPrivacy}>
                  <li>
                    <NamedLink name="TermsOfServicePage" className={css.legalLink}>
                      <FormattedMessage id="Footer.termsOfUse" />
                    </NamedLink>
                  </li>
                  <li>
                    <NamedLink name="PrivacyPolicyPage" className={css.legalLink}>
                      <FormattedMessage id="Footer.privacyPolicy" />
                    </NamedLink>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className={css.copyrightAndTermsMobile}>
            <NamedLink name="LandingPage" className={css.organizationCopyrightMobile}>
              <FormattedMessage id="Footer.copyright" />
            </NamedLink>
            <div className={css.tosAndPrivacyMobile}>
              <NamedLink name="PrivacyPolicyPage" className={css.privacy}>
                <FormattedMessage id="Footer.privacy" />
              </NamedLink>
              <NamedLink name="TermsOfServicePage" className={css.terms}>
                <FormattedMessage id="Footer.terms" />
              </NamedLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Footer.defaultProps = {
  rootClassName: null,
  className: null,
};

Footer.propTypes = {
  rootClassName: string,
  className: string,
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const {
    currentUser,
    fetchCurrentUserInProgress,
    currentUserListing,
    currentUserListingFetched,
  } = state.user;

  return {
    currentUser,
    fetchCurrentUserInProgress,
    currentUserListing,
    currentUserListingFetched,
  };
};

export default compose(connect(mapStateToProps), injectIntl)(Footer);
