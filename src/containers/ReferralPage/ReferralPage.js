import React, { useEffect, useState } from 'react';

import {
  Page,
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  GradientButton,
  LayoutWrapperFooter,
  Footer,
  IconEnquiry,
  Modal,
  NamedRedirect,
  GenericError,
  IconWallet,
  IconGift,
  IconEnvelopes,
} from '../../components';
import { TopbarContainer } from '..';
import { injectIntl, FormattedMessage } from '../../util/reactIntl';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/UI.duck';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { ensureCurrentUser } from '../../util/data';
import SentReferral from './SentReferral';
import {
  generateReferralCode,
  sendReferral,
  sendReminder,
  fetchCustomerCreditBalance,
} from './ReferralPage.duck';
import { CAREGIVER } from '../../util/constants';
import { SendReferralForm } from '../../forms';
import {
  Accordion as MuiAccordion,
  AccordionDetails as MuiAccordionDetails,
  AccordionSummary as MuiAccordionSummary,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { compose } from 'redux';

import css from './ReferralPage.module.css';

const ReferralPageComponent = props => {
  const {
    intl,
    scrollingDisabled,
    currentUser,
    onGenerateReferralCode,
    generateReferralCodeError,
    sendReferralInProgress,
    sendReferralError,
    onManageDisableScrolling,
    onSendReferral,
    referralSent,
    onSendReminder,
    sendReminderInProgress,
    sendReminderError,
    reminderSent,
    customerCreditBalance,
    fetchCustomerCreditBalanceError,
    onFetchCustomerCreditBalance,
  } = props;

  const [isSendReferralModalOpen, setIsSendReferralModalOpen] = useState(false);
  const [isCreditsAccordionExpanded, setIsCreditsAccordionExpanded] = useState(false);
  const [isReminderAccordionExpanded, setIsReminderAccordionExpanded] = useState(false);

  const ensuredCurrentUser = ensureCurrentUser(currentUser);
  const { referralCode, userType, referrals = [] } = ensuredCurrentUser.attributes.profile.metadata;
  const stripeCustomerId = ensuredCurrentUser.stripeCustomer?.attributes?.stripeCustomerId;

  if (ensuredCurrentUser.id?.uuid && (userType !== CAREGIVER || !stripeCustomerId)) {
    return <NamedRedirect name="LandingPage" />;
  }

  useEffect(() => {
    if (stripeCustomerId) {
      onFetchCustomerCreditBalance();
      if (!referralCode) {
        onGenerateReferralCode();
      }
    }
  }, [ensuredCurrentUser.id?.uuid]);

  const handleSendReferral = values => {
    const emailKeys = Object.keys(values).filter(key => key.includes('email'));

    const emails = emailKeys.map(key => values[key]);

    onSendReferral(emails);
  };

  const schemaTitle = intl.formatMessage({ id: 'ReferralPage.schemaTitle' });

  const referralsClaimed = referrals.filter(referral => referral.claimed).length;
  const referralsNotClaimed = referrals.length - referralsClaimed;

  // Accordions need to be created in this component because of state change
  // If put in a separate component, the transtion effect goes away due to rerendering
  const AccordionSummary = styled(props => (
    <MuiAccordionSummary expandIcon={<ExpandMoreIcon />} {...props} />
  ))(({ theme }) => ({
    '&.MuiAccordionSummary-root': {
      padding: '1.5rem',
      '&:hover': {
        cursor: 'pointer',
      },
    },
  }));

  const Accordion = styled(props => (
    <MuiAccordion disableGutters elevation={0} square {...props} />
  ))(({ theme }) => ({
    width: '100%',
    borderRadius: '0.5rem',
    boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px',
    marginTop: '2rem',
    '&.MuiAccordion-root:before': {
      display: 'none',
    },
  }));

  const ReferralsSentAccordionSummary = styled(props => (
    <MuiAccordionSummary expandIcon={<ExpandMoreIcon />} {...props} />
  ))(({ theme }) => ({
    '&.MuiAccordionSummary-root': {
      padding: '1.5rem',
      '&:hover': {
        cursor: 'pointer',
      },
    },
  }));

  const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
    padding: '0 1.5rem 1.5rem 1.5rem',
  }));

  const accordionReferralLabel = (
    <div className={css.accordionLabel}>
      <IconWallet height="1.5em" width="1.5em" />
      <h4 className={css.myReferrals}>
        <FormattedMessage id="ReferralPage.myCredits" />
      </h4>
      <p className={css.referralsText}>
        <FormattedMessage
          id="ReferralPage.creditsReceived"
          values={{
            credits: referralsClaimed * 5,
            keepAnEye:
              referralsClaimed === 0 && '- Keep an eye on your email for claimed referrals',
          }}
        />
      </p>
    </div>
  );

  const accordionReferralsSentLabel = (
    <div className={css.accordionLabel}>
      <IconEnvelopes width="1.5em" height="1.5em" />
      <h4 className={css.myReferrals}>
        <FormattedMessage
          id="ReferralPage.referralsSentByEmail"
          values={{
            numberReferrals: referrals ? referrals.length : 0,
            referrals: referrals.length === 1 ? 'referral' : 'referrals',
          }}
        />
      </h4>
    </div>
  );

  const hasGenericError =
    generateReferralCodeError || sendReminderError | fetchCustomerCreditBalanceError;

  const genericErrorText = generateReferralCodeError ? (
    <FormattedMessage id="ReferralPage.generateReferralCodeError" />
  ) : sendReminderError ? (
    <FormattedMessage id="ReferralPage.sendReminderError" />
  ) : fetchCustomerCreditBalanceError ? (
    <FormattedMessage id="ReferralPage.fetchCustomerCreditBalanceError" />
  ) : null;

  return (
    <Page
      className={css.root}
      scrollingDisabled={scrollingDisabled}
      contentType="website"
      title={schemaTitle}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer currentPage="ReferralPage" />
        </LayoutWrapperTopbar>
        <LayoutWrapperMain className={css.mainWrapper}>
          <div className={css.content}>
            <h1 className={css.mainTitle}>
              <FormattedMessage id="ReferralPage.title" />
            </h1>
            <h3>
              <FormattedMessage id="ReferralPage.subTitle" />
            </h3>
            <div className={css.sendCard}>
              <div className={css.iconContainer}>
                <IconGift height="1.5em" width="1.5em" />
              </div>
              <div className={css.shareCareVineContainer}>
                <h3 className={css.shareCareVine}>
                  <FormattedMessage id="ReferralPage.cardTitle" />
                </h3>
                <p className={css.smallLineHeight}>
                  <FormattedMessage id="ReferralPage.cardSubtitle" />
                </p>
                <GradientButton
                  className={css.referralButton}
                  disabled={!referralCode}
                  onClick={() => setIsSendReferralModalOpen(true)}
                >
                  <FormattedMessage id="ReferralPage.senReferralButton" />
                </GradientButton>
              </div>
              <img
                alt="Gift Within a Gift Gifs, 3d Video, Happy Birthday Candles, Gif Gifts, Image Gifts, Diamond Gift, Christmas Gif, Birthday Gif, Moving Image"
                className={css.giftGif}
                elementtiming="closeupImage"
                fetchpriority="auto"
                loading="auto"
                src="https://i.pinimg.com/originals/14/12/58/141258a3d8ac3129bc0e2abb7c3bd78e.gif"
              ></img>
            </div>
            <Accordion
              expanded={isCreditsAccordionExpanded}
              onChange={(e, isExpanded) => setIsCreditsAccordionExpanded(isExpanded)}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                {accordionReferralLabel}
              </AccordionSummary>
              <AccordionDetails>
                <div className={css.referralAccordionContainer}>
                  <div>
                    <img
                      className={css.giftGif}
                      alt="Gift marvel Palm Springs, Graphics Gift, Origami Templates, Box Templates, Gif Gifts, Image Gifts, 3d Christmas, 3d Drawings, Animation Reference"
                      elementtiming="closeupImage"
                      fetchpriority="auto"
                      loading="auto"
                      src="https://i.pinimg.com/originals/fd/2c/1a/fd2c1a96b654e220d09525f006482477.gif"
                    ></img>
                    <p className={classNames(css.smallLineHeight, css.textBold)}>
                      <FormattedMessage id="ReferralPage.firstAccordionTitle" />
                    </p>
                    <p className={classNames(css.smallLineHeight, css.referralInstructions)}>
                      <FormattedMessage id="ReferralPage.firstAccordionSubtitle" />
                    </p>
                  </div>
                  <div style={{ paddingInline: '1rem' }}>
                    <div className={css.referralDisplayContainer}>
                      <div className={css.referralsTotal}>
                        ${referralsClaimed * 5}
                        <p className={css.creditsDisplayText}>
                          <FormattedMessage id="ReferralPage.received" />
                        </p>
                      </div>
                      <div className={css.referralsRemaining}>
                        ${customerCreditBalance}
                        <p className={css.creditsDisplayText}>
                          <FormattedMessage id="ReferralPage.remaining" />
                        </p>
                      </div>
                      <div className={css.referralsPending}>
                        ${referralsNotClaimed * 5}
                        <p className={css.creditsDisplayText}>
                          <FormattedMessage id="ReferralPage.pending" />
                        </p>
                      </div>
                    </div>
                    <GradientButton
                      className={css.sendInvitesButton}
                      disabled={!referralCode}
                      onClick={() => setIsSendReferralModalOpen(true)}
                    >
                      <FormattedMessage id="ReferralPage.sendInvites" />
                    </GradientButton>
                  </div>
                </div>
              </AccordionDetails>
            </Accordion>
            <Accordion
              expanded={isReminderAccordionExpanded}
              onChange={(e, isExpanded) => setIsReminderAccordionExpanded(isExpanded)}
            >
              <ReferralsSentAccordionSummary expandIcon={<ExpandMoreIcon />}>
                {accordionReferralsSentLabel}
              </ReferralsSentAccordionSummary>
              <AccordionDetails>
                {referrals.length > 0 ? (
                  <div className={css.sentReferralAccordionContainer}>
                    {[...referrals].reverse().map(referral => (
                      <SentReferral
                        key={1 / referral.createdAt}
                        referral={referral}
                        onRemind={email => onSendReminder(email)}
                        sendReminderInProgress={sendReminderInProgress}
                        sendReminderError={sendReminderError}
                        reminderSent={reminderSent}
                      />
                    ))}
                  </div>
                ) : (
                  <div className={css.noReferrals}>
                    <IconEnquiry />
                    <p className={css.noReferralsText}>
                      <FormattedMessage id="ReferralPage.noReferrals" />
                    </p>
                  </div>
                )}
              </AccordionDetails>
            </Accordion>
          </div>
        </LayoutWrapperMain>
        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSingleColumn>
      <Modal
        id="ReferralPage.sendReferral"
        isOpen={isSendReferralModalOpen}
        onClose={() => setIsSendReferralModalOpen(false)}
        onManageDisableScrolling={onManageDisableScrolling}
        containerClassName={css.modalContainer}
        className={css.modalContent}
        usePortal
      >
        <h1 className={css.modalTitle}>
          <FormattedMessage id="ReferralPage.sendAReferral" />
        </h1>
        <SendReferralForm
          intl={intl}
          onSubmit={handleSendReferral}
          sendReferralInProgress={sendReferralInProgress}
          sendReferralError={sendReferralError}
          referralSent={referralSent}
          referrals={referrals}
          isSendReferralModalOpen={isSendReferralModalOpen}
        />
      </Modal>
      <GenericError show={hasGenericError} errorText={genericErrorText} />
    </Page>
  );
};

const mapStateToProps = state => {
  const { currentUser, currentUserListing, currentUserListingFetched } = state.user;

  return {
    scrollingDisabled: isScrollingDisabled(state),
    currentUser,
    ...state.ReferralPage,
  };
};

const mapDispatchToProps = {
  onGenerateReferralCode: generateReferralCode,
  onManageDisableScrolling: manageDisableScrolling,
  onSendReferral: sendReferral,
  onSendReminder: sendReminder,
  onFetchCustomerCreditBalance: fetchCustomerCreditBalance,
};

const ReferralPage = compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(ReferralPageComponent);

export default ReferralPage;
