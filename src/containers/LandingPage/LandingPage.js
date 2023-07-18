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
  Button,
  NamedLink,
  IconArrowHead,
  IconReviewUser,
  IconUserProfile,
  IconCaregiver,
  IconCalendarHeart,
} from '../../components';
import { TopbarContainer } from '../../containers';
import { EMPLOYER } from '../../util/constants';
import { useCheckMobileScreen, useIsSsr } from '../../util/hooks';
import queryString from 'query-string';
import { Card, CardContent, CardMedia, Typography, CardActionArea } from '@mui/material';
import { makeStyles } from '@material-ui/core/styles';
import BlogCardGrid from './BlogCardGrid';

import shareImage from '../../assets/Background_Share_Image.png';
import tempImg from '../../assets/Magnify-BG.png';
import css from './LandingPage.module.css';

const isDev = process.env.REACT_APP_ENV === 'development';

const useStyles = makeStyles(theme => ({
  cityCard: {
    transition: 'all 0.2s ease-in 0s !important',
    '&:hover': {
      transform: 'scale(1.05)',
    },
    borderRadius: 'var(--borderRadius) !important',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      marginBottom: '2rem',
    },
    [theme.breakpoints.only('md')]: {
      width: '15rem',
    },
    [theme.breakpoints.up('lg')]: {
      width: '20rem',
    },
  },
  cityImage: {
    maxHeight: '12rem',
    [theme.breakpoints.down('sm')]: {
      maxHeight: '15rem',
    },
  },
}));

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
  const classes = useStyles();

  const parsedSearchParams = queryString.parse(location.search);
  const { externalPromo } = parsedSearchParams;

  useEffect(() => {
    if (externalPromo) {
      setIsExternalPromoModalOpen(true);
    }
  }, [externalPromo]);

  const isSsr = useIsSsr();

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
      const elementHeight = contentRef.current.offsetTop - (isMobile ? 20 : 60);
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
          <div className={css.content}>
            <section className={css.employerSection} ref={contentRef}>
              <div className={css.employerSectionContent}>
                <div className={css.employerSectionCard}>
                  <h2 className={css.employerSectionTitle}>
                    Your Care, In Your Hands:<br></br>
                    Find the Perfect Caregiver for You
                  </h2>
                  <span>
                    Discover the seamless solution to finding the perfect caregiver. Tailor your
                    care experience by selecting professionals that fit your needs, budget, and
                    location. Our user-friendly platform eliminates the middleman, empowering you to
                    take control of your care journey. Accessible to all, CareVine puts the power in
                    your hands.
                  </span>
                  <div className={css.getStartedLinkContainer}>
                    <NamedLink name="SignupPage" className={css.getStartedButton}>
                      Get Started
                    </NamedLink>
                  </div>
                </div>
                <div className={css.employerSectionImageContainer}>
                  <img src={tempImg} className={css.employerSectionImage} />
                </div>
              </div>
            </section>

            <section className={css.stepsSection}>
              <div className={css.stepsSectionCard}>
                <div className={css.step}>
                  <IconUserProfile width="3.5em" height="3.5em" />
                  <h2 className={css.stepTitle}>
                    Craft Your Personal<br></br> Profile
                  </h2>
                  <p>Begin your journey by creating a personalized profile.</p>
                </div>
                <IconArrowHead
                  direction={isMobile ? 'down' : 'right'}
                  height="3em"
                  width="3em"
                  className={css.stepArrow}
                />
                <div className={css.step}>
                  <IconCaregiver width="3.5em" height="3.5em" />
                  <h2 className={css.stepTitle}>
                    Discover Your Ideal<br></br> Caregiver
                  </h2>
                  <p>Browse through our network of experienced caregivers.</p>
                </div>
                <IconArrowHead
                  direction={isMobile ? 'down' : 'right'}
                  height="3em"
                  width="3em"
                  className={css.stepArrow}
                />

                <div className={css.step}>
                  <IconCalendarHeart width="3.5em" height="3.5em" />
                  <h2 className={css.stepTitle}>
                    Book Your<br></br> Care
                  </h2>
                  <p className={css.stepSubText}>
                    Book your perfect caregiver using our hassle-free booking system.
                  </p>
                </div>
              </div>
            </section>

            <section className={css.caregiverSection}>
              <div className={css.employerSectionContent}>
                <div className={css.employerSectionCard}>
                  <h3 className={css.forCaregivers}>For Caregivers</h3>
                  <h2 className={css.employerSectionTitle}>
                    Caregiving Freedom:<br></br>
                    Your Journey, Your Way
                  </h2>
                  <span>
                    Set your rates, choose your hours, and handpick your clients in your preferred
                    location. Showcase your unique skills and passion to our community, unlocking
                    endless opportunities. Reimagine your caregiving career with freedom,
                    flexibility, and recognition—only at CareVine.
                  </span>
                  <div className={css.getStartedLinkContainer}>
                    <NamedLink name="ForCaregiversPage" className={css.getStartedButton}>
                      Learn More
                    </NamedLink>
                  </div>
                </div>
                <div className={css.employerSectionImageContainer}>
                  <img src={tempImg} className={css.employerSectionImage} />
                </div>
              </div>
            </section>

            <section className={css.blogSection}>
              <h2 className={css.contentTitle}>Recent Blog Posts</h2>
              {!isSsr && <BlogCardGrid />}
            </section>

            <section className={css.citySection}>
              <div className={css.citySectionContent}>
                <h1 className={css.contentTitle} style={{ color: 'var(--matterColor)' }}>
                  Available across the Country
                </h1>
                <div className={css.cityCardContainer}>
                  <Card className={classes.cityCard}>
                    <CardActionArea>
                      <CardMedia
                        component="img"
                        image={tempImg}
                        alt="Portland"
                        className={classes.cityImage}
                      />
                      <CardContent>
                        <h2 className={css.cityName}>Portland</h2>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                  <Card className={classes.cityCard}>
                    <CardActionArea>
                      <CardMedia
                        component="img"
                        image={tempImg}
                        alt="Miami"
                        className={classes.cityImage}
                      />
                      <CardContent>
                        <h2 className={css.cityName}>Miami</h2>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                  <Card className={classes.cityCard}>
                    <CardActionArea>
                      <CardMedia
                        component="img"
                        image={tempImg}
                        alt="Orlando"
                        className={classes.cityImage}
                      />
                      <CardContent>
                        <h2 className={css.cityName}>Orlando</h2>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </div>
              </div>
            </section>
          </div>
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
