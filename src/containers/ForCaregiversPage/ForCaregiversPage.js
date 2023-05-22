import React, { useEffect, useRef } from 'react';
import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { injectIntl, intlShape } from '../../util/reactIntl';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/UI.duck';
import { propTypes } from '../../util/types';
import config from '../../config';
import {
  Page,
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
  NamedLink,
} from '../../components';
import { TopbarContainer } from '../../containers';
import { useCheckMobileScreen } from '../../util/hooks';
import queryString from 'query-string';

import shareImage from '../../assets/Background_Share_Image.png';
import employerListingsImage from '../../assets/employer-listings.png';
import css from './ForCaregiversPage.module.css';

export const ForCaregiversPageComponent = props => {
  const {
    history,
    intl,
    location,
    scrollingDisabled,
    currentUserListing,
    currentUserListingFetched,
    currentUser,
    currentUserFetched,
    onManageDisableScrolling,
  } = props;

  const isMobile = useCheckMobileScreen();

  const parsedSearchParams = queryString.parse(location.search);
  const { externalPromo } = parsedSearchParams;

  useEffect(() => {
    if (externalPromo) {
      setIsExternalPromoModalOpen(true);
    }
  }, [externalPromo]);

  // Schema for search engines (helps them to understand what this page is about)
  // http://schema.org
  // We are using JSON-LD format
  const siteTitle = config.siteTitle;
  const schemaTitle = intl.formatMessage({ id: 'ForCaregiversPage.schemaTitle' }, { siteTitle });
  const schemaDescription = intl.formatMessage(
    { id: 'ForCaregiversPage.schemaDescription' },
    { siteTitle }
  );
  const schemaImage = `${config.canonicalRootURL}${shareImage}`;

  return (
    <Page
      className={css.root}
      scrollingDisabled={scrollingDisabled}
      contentType="website"
      description={schemaDescription}
      title={schemaTitle}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'WebPage',
        description: schemaDescription,
        name: schemaTitle,
        image: [schemaImage],
      }}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer currentPage="ForCaregiversPage" />
        </LayoutWrapperTopbar>
        <LayoutWrapperMain>
          <div className={css.sectionOne}>
            <div className={css.descriptionContainer}>
              <h1 className={css.title}>
                <div>Caregiving Freedom:</div>
                <div>Your Journey, Your Way</div>
              </h1>
              <p className={css.description}>
                Set your rates, choose your hours, and handpick your clients in your preferred
                location. Showcase your unique skills and passion to our community, unlocking
                endless opportunities. Reimagine your caregiving career with freedom, flexibility,
                and recognition—only at CareVine.
              </p>
              <NamedLink name="SignupPage" className={css.getStartedButton}>
                Get Started
              </NamedLink>
            </div>
            <div className={css.imageContainer}>
              <img src={shareImage} className={css.firstImage} />
            </div>
          </div>
          <div className={css.sectionTwo}>
            <div className={css.descriptionContainer}>
              <h1 className={css.title}>Freedom of Choice</h1>
              <p className={css.description}>
                Pick the jobs you want. Set your own rates. Choose your own hours. CareVine gives
                you the freedom to work on your own terms. We believe that you should be in control
                of your career, and we're here to support you every step of the way.
              </p>
            </div>
            <div className={css.imageContainer}>
              <img src={employerListingsImage} className={css.employerImage} />
            </div>
          </div>
          <div className={css.sectionThree}>
            <div className={css.imageContainerRight}>
              <img src={shareImage} className={css.image} />
            </div>
            <div className={css.descriptionContainerRight}>
              <h1 className={css.title}>Instant Background Checks</h1>
              <p className={css.description}>
                We prioritize safety on our platform for everyone. To ensure this, we conduct
                instant background checks on all caregivers through a third party provider as part
                of the sign up process. This verifies your identity and criminal record, providing
                reassurance for clients and their families. Though it's an extra step, it's crucial
                for trust within our community.
              </p>
            </div>
          </div>
          <div className={css.sectionFour}>
            <div className={css.descriptionContainer}>
              <h1 className={css.title}>Direct Payout</h1>
              <p className={css.description}>
                As a caregiver on our platform, you have the convenience of direct payments through{' '}
                <a to="https://stripe.com/">Stripe</a>. By linking your bank account, you enable
                seamless transactions right on our site. This means, once you're paid for your
                services, the payment is automatically transferred to your bank account. This
                feature simplifies your finances, ensuring you receive your earnings promptly,
                securely, and without fees.
              </p>
            </div>
            <div className={css.imageContainer}>
              <img src={shareImage} className={css.image} />
            </div>
          </div>
        </LayoutWrapperMain>
        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const {
    currentUser,
    currentUserFetched,
    currentUserListing,
    currentUserListingFetched,
  } = state.user;

  return {
    scrollingDisabled: isScrollingDisabled(state),
    currentUser,
    currentUserFetched,
    currentUserListing,
    currentUserListingFetched,
  };
};

const mapDispatchToProps = {
  onManageDisableScrolling: manageDisableScrolling,
};

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const ForCaregiversPage = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(ForCaregiversPageComponent);

export default ForCaregiversPage;
