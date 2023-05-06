import React, { useMemo } from 'react';
import { bool, func } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { ensureCurrentUser } from '../../util/data';
import classNames from 'classnames';
import {
  LayoutSingleColumn,
  LayoutWrapperMain,
  LayoutWrapperTopbar,
  LayoutWrapperFooter,
  Footer,
  Page,
  IconConfirm,
} from '../../components';
import { TopbarContainer } from '..';
import { ContactUsForm } from '../../forms';
import { sendContactEmail } from './ContactUsPage.duck';

import css from './ContactUsPage.module.css';

export const ContactUsPageComponent = props => {
  const {
    currentUser,
    scrollingDisabled,
    sendContactEmailInProgress,
    sendContactEmailError,
    sendContactEmailSuccess,
    onSendContactEmail,
    intl,
  } = props;

  const showContactForm = useMemo(() => {
    if (typeof window !== 'undefined') {
      // Perform localStorage action
      const lastMessageTime = localStorage.getItem('carevineLastContactMessage');
      return !sendContactEmailSuccess && lastMessageTime < Date.now() - 1000 * 60 * 60 * 24;
    }

    return null;
  }, [sendContactEmailSuccess]);

  const user = ensureCurrentUser(currentUser);
  const email = user?.attributes?.email;

  const handleSubmit = values => {
    const { email, message } = values;

    onSendContactEmail(email, message).then(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    });
  };

  const metaDescription =
    "Get in touch with the CareVine team today. Contact us for any questions or inquiries about seeking care or finding caregiving opportunities. We're here to help!";

  const metaTitle = 'Contact Us | CareVine';

  return (
    <Page
      title="Contact Us | CareVine"
      scrollingDisabled={scrollingDisabled}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'WebPage',
        description: metaDescription,
        name: metaTitle,
      }}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer currentPage="ContactUsPage" />
        </LayoutWrapperTopbar>
        <LayoutWrapperMain className={css.mainWrapper}>
          <h1 className={css.mainTitle}>Contact Us</h1>
          {showContactForm ? (
            <ContactUsForm
              className={css.form}
              currentUser={user}
              onSubmit={handleSubmit}
              initialValues={{ email }}
              sendContactEmailError={sendContactEmailError}
              sendContactEmailInProgress={sendContactEmailInProgress}
            />
          ) : (
            <div className={css.confirmationContainer}>
              <IconConfirm className={css.iconConfirm} />
              <div className={css.confirmationText}>Message Sent</div>
              <p className={classNames(css.confirmationText, css.small)}>
                We have received your message and will get back to you as soon as possible.
              </p>
            </div>
          )}
        </LayoutWrapperMain>
        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSingleColumn>
    </Page>
  );
};

ContactUsPageComponent.defaultProps = {
  currentUser: null,
};

ContactUsPageComponent.propTypes = {
  currentUser: propTypes.currentUser,
  scrollingDisabled: bool.isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  // Topbar needs user info.
  const { currentUser } = state.user;
  const {
    sendContactEmailInProgress,
    sendContactEmailError,
    sendContactEmailSuccess,
  } = state.ContactUsPage;

  return {
    currentUser,
    sendContactEmailInProgress,
    sendContactEmailError,
    sendContactEmailSuccess,
  };
};

const mapDispatchToProps = dispatch => ({
  onSendContactEmail: (email, message) => dispatch(sendContactEmail(email, message)),
});

const ContactUsPage = compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(ContactUsPageComponent);

export default ContactUsPage;
