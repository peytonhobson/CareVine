import React from 'react';

import { compose } from 'redux';
import { connect } from 'react-redux';

import { FormattedMessage, injectIntl } from '../../util/reactIntl';
import { ensureCurrentUser } from '../../util/data';
import { isScrollingDisabled } from '../../ducks/UI.duck';
import {
  LayoutSideNavigation,
  LayoutWrapperMain,
  LayoutWrapperAccountSettingsSideNav,
  LayoutWrapperTopbar,
  LayoutWrapperFooter,
  Footer,
  Page,
  UserNav,
  NamedRedirect,
  PaymentMethods,
} from '../../components';
import { TopbarContainer } from '../../containers';
import { CAREGIVER } from '../../util/constants';

import css from './PaymentMethodsPage.module.css';

const PaymentMethodsPageComponent = props => {
  const { currentUser, intl, scrollingDisabled, currentUserListing, stripeCustomerFetched } = props;

  const ensuredCurrentUser = ensureCurrentUser(currentUser);

  const title = intl.formatMessage({ id: 'PaymentMethodsPage.title' });

  if (ensuredCurrentUser.attributes.profile.metadata?.userType === CAREGIVER) {
    return <NamedRedirect name="LandingPage" />;
  }

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSideNavigation>
        <LayoutWrapperTopbar>
          <TopbarContainer
            currentPage="PaymentMethodsPage"
            desktopClassName={css.desktopTopbar}
            mobileClassName={css.mobileTopbar}
          />
          <UserNav selectedPageName="PaymentMethodsPage" listing={currentUserListing} />
        </LayoutWrapperTopbar>
        <LayoutWrapperAccountSettingsSideNav
          currentTab="PaymentMethodsPage"
          currentUser={currentUser}
        />
        <LayoutWrapperMain>
          <div className={css.content}>
            <h1 className={css.title}>
              <FormattedMessage id="PaymentMethodsPage.heading" />
            </h1>
            <PaymentMethods
              stripeCustomerFetched={stripeCustomerFetched}
              className={css.paymentMethods}
            />
          </div>
        </LayoutWrapperMain>
        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSideNavigation>
    </Page>
  );
};

const mapStateToProps = state => {
  const { currentUser, currentUserListing } = state.user;

  const { stripeCustomerFetched } = state.PaymentMethodsPage;

  return {
    currentUser,
    scrollingDisabled: isScrollingDisabled(state),
    currentUserListing,
    stripeCustomerFetched,
  };
};

const PaymentMethodsPage = compose(
  connect(mapStateToProps),
  injectIntl
)(PaymentMethodsPageComponent);

export default PaymentMethodsPage;
