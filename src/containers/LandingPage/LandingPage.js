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
  SectionHero,
  SectionHowItWorks,
  SectionLocations,
  SectionMarketplaceSummary,
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
  Modal,
} from '../../components';
import { TopbarContainer } from '../../containers';
import { EMPLOYER } from '../../util/constants';
import { useCheckMobileScreen } from '../../util/hooks';
import queryString from 'query-string';

import shareImage from '../../assets/Background_Share_Image.png';
import css from './LandingPage.module.css';

export const LandingPageComponent = props => {
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

  const [isExternalPromoModalOpen, setIsExternalPromoModalOpen] = React.useState(false);

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
  const schemaTitle = intl.formatMessage({ id: 'LandingPage.schemaTitle' }, { siteTitle });
  const schemaDescription = intl.formatMessage({ id: 'LandingPage.schemaDescription' });
  const schemaImage = `${config.canonicalRootURL}${shareImage}`;

  const userType = currentUser?.attributes.profile.metadata.userType;

  const contentRef = useRef(null);

  const scrollToContent = () => {
    if (contentRef.current) {
      const elementHeight = contentRef.current.offsetTop - 20;
      window.scrollTo({ top: elementHeight, behavior: 'smooth' });
    }
  };

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
          <TopbarContainer currentPage="LandingPage" />
        </LayoutWrapperTopbar>
        <LayoutWrapperMain>
          <div className={css.heroContainer}>
            <SectionHero
              className={css.hero}
              history={history}
              location={location}
              userType={userType}
              currentUserListing={currentUserListing}
              currentUserFetched={currentUserFetched}
              scrollToContent={scrollToContent}
              currentUser={currentUser}
            />
          </div>
          <div id="how-it-works" className={css.anchorDiv}></div>
          <ul className={css.sections} ref={contentRef}>
            <li className={css.section}>
              <div className={css.sectionContent}>
                {currentUser ? (
                  <SectionHowItWorks
                    currentUser={currentUser}
                    currentUserListing={currentUserListing}
                    currentUserListingFetched={currentUserListingFetched}
                  />
                ) : (
                  <SectionMarketplaceSummary onScrollIntoView={scrollToContent} />
                )}
              </div>
            </li>
          </ul>
        </LayoutWrapperMain>
        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSingleColumn>
      <Modal
        id="LandingPage.externalPromoModal"
        isOpen={isExternalPromoModalOpen}
        onClose={() => setIsExternalPromoModalOpen(false)}
        usePortal
        onManageDisableScrolling={onManageDisableScrolling}
        containerClassName={css.modalContainer}
        scrollLayerClassName={css.modalScrollLayer}
      >
        <h2 className={css.modalTitle}>Welcome to CareVine!</h2>
        <p className={css.modalMessage}>
          Thank you for joining our community of dedicated caregivers.
        </p>

        <p className={css.modalMessage}>
          As a token of our appreciation, enjoy 50% off our premium subscription,{' '}
          <span className={css.goldenText}>CareVine Gold</span>, using the promo code:
        </p>

        <div className={css.promoContainer}>
          <h1>YOUAREGOLDEN</h1>
        </div>

        <p className={css.modalMessage}>Happy caregiving!</p>
      </Modal>
    </Page>
  );
};

LandingPageComponent.defaultProps = {
  currentUserListing: null,
  currentUserListingFetched: false,
};

LandingPageComponent.propTypes = {
  scrollingDisabled: bool.isRequired,
  currentUserListing: propTypes.ownListing,
  currentUserListingFetched: bool,

  // from withRouter
  history: object.isRequired,
  location: object.isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
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
const LandingPage = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(LandingPageComponent);

export default LandingPage;
