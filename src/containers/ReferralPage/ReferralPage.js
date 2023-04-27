import React, { useEffect, useState } from 'react';

import {
  Page,
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  Accordion,
  GradientButton,
  IconCar,
  IconCalendar,
  LayoutWrapperFooter,
  Footer,
  InlineTextButton,
  InfoTooltip,
  IconEnquiry,
  Modal,
  NamedRedirect,
} from '../../components';
import InfoIcon from '@mui/icons-material/Info';
import { TopbarContainer } from '..';
import { injectIntl, intlShape } from '../../util/reactIntl';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/UI.duck';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { ensureCurrentUser } from '../../util/data';
import SentReferral from './SentReferral';
import { generateReferralCode, sendReferral } from './ReferralPage.duck';
import { CAREGIVER } from '../../util/constants';
import { SendReferralForm } from '../../forms';

import { compose } from 'redux';

import css from './ReferralPage.module.css';

const ReferralPageComponent = props => {
  const {
    intl,
    scrollingDisabled,
    currentUser,
    onGenerateReferralCode,
    generateReferralCodeInProgress,
    generateReferralCodeError,
    sendReferralInProgress,
    sendReferralError,
    onManageDisableScrolling,
    onSendReferral,
    referralSent,
  } = props;

  const [isSendReferralModalOpen, setIsSendReferralModalOpen] = useState(false);

  const ensuredCurrentUser = ensureCurrentUser(currentUser);
  const { referralCode, userType, referrals = [] } = ensuredCurrentUser.attributes.profile.metadata;

  if (ensuredCurrentUser.id?.uuid && userType !== CAREGIVER) {
    return <NamedRedirect name="LandingPage" />;
  }

  useEffect(() => {
    if (!referralCode && ensuredCurrentUser.id?.uuid) {
      onGenerateReferralCode();
    }
  }, [ensuredCurrentUser.id?.uuid]);

  const schemaTitle = intl.formatMessage({ id: 'ReferralPage.schemaTitle' });

  const referralsClaimed = referrals.filter(referral => referral.claimed);

  const accordionStyles = {
    width: '100%',
    borderRadius: '0.5rem',
    boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px',
    marginTop: '2rem',
    '&.MuiAccordion-root:before': {
      display: 'none',
    },
  };

  const summaryReferralStyles = {
    '&.MuiAccordionSummary-root': {
      padding: '1.5rem',
      '&:hover': {
        cursor: 'pointer',
      },
    },
  };

  const summaryReferralSentStyles = {
    '&.MuiAccordionSummary-root': {
      padding: '1.5rem',
      '&:hover': {
        cursor: 'pointer',
      },
    },
  };

  const detailStyles = {
    padding: '0 1.5rem 1.5rem 1.5rem',
  };

  const accordionReferralLabel = (
    <div className={css.accordionLabel}>
      {/* TODO: Swap out icon */}
      <IconCar />
      <h4 className={css.myReferrals}>My Referrals</h4>
      {/* Make referral number dynamic */}
      <p className={css.referralsText}>
        {referralsClaimed.length} {referralsClaimed.length === 1 ? 'referral' : 'referrals'}{' '}
        received{' '}
        {referralsClaimed.length === 0 && '- Keep an eye on your email for claimed referrals'}
      </p>
    </div>
  );

  const accordionReferralsSentLabel = (
    <div className={css.accordionLabel}>
      {/* TODO: Swap out icon */}
      <IconCar />
      <h4 className={css.myReferrals}>
        {referrals ? referrals.length : 0} {referrals.length === 1 ? 'referral' : 'referrals'} sent
        by e-mail
      </h4>
    </div>
  );

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
            <h1 className={css.mainTitle}>Refer a Friend</h1>
            <h3>Invite your friends to CareVine and get rewards when they subscribe.</h3>
            <div className={css.sendCard}>
              <div className={css.iconContainer}>
                {/* TODO: Swap out icon */}
                <IconCar />
              </div>
              <div className={css.shareCareVineContainer}>
                <h3 className={css.shareCareVine}>Share CareVine and get 50% off</h3>
                <p className={css.smallLineHeight}>
                  Give friends 50% off on their first month of CareVine Gold and you'll also receive
                  a month 50% off when they use your code.
                </p>
                <GradientButton
                  className={css.referralButton}
                  disabled={!referralCode}
                  onClick={() => setIsSendReferralModalOpen(true)}
                >
                  Send Referral
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
              accordionStyles={accordionStyles}
              summaryStyles={summaryReferralStyles}
              detailStyles={detailStyles}
              label={accordionReferralLabel}
            >
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
                    Remember to keep an eye on your email.
                  </p>
                  <p className={classNames(css.smallLineHeight, css.referralInstructions)}>
                    Begin receiving referraled subscription months by sending referrals to other
                    caregivers.
                  </p>
                </div>
                <div style={{ paddingInline: '1rem' }}>
                  <div className={css.referralDisplayContainer}>
                    {/* TODO: Make numbers dynamic */}
                    <div className={css.referralsReceived}>
                      0<p style={{ margin: 0 }}>Received</p>
                    </div>
                    <div className={css.referralsPending}>
                      0<p style={{ margin: 0 }}>Pending</p>
                    </div>
                  </div>
                  <div className={css.tooltipContainer}>
                    <InfoTooltip
                      className={css.tooltip}
                      icon={
                        <>
                          <InfoIcon />
                          <InlineTextButton className={css.whatIsThisButton}>
                            What is this?
                          </InlineTextButton>
                        </>
                      }
                      title={
                        <p className={css.smallLineHeight}>
                          Once other caregivers accept your invitations, your referrals will move
                          from pending to received. This amount is the total referrals you've
                          received, not your remaining balance.
                        </p>
                      }
                    />
                  </div>
                  <GradientButton className={css.sendInvitesButton}>Send Invites</GradientButton>
                </div>
              </div>
            </Accordion>
            <Accordion
              accordionStyles={accordionStyles}
              summaryStyles={summaryReferralSentStyles}
              detailStyles={detailStyles}
              label={accordionReferralsSentLabel}
            >
              {referrals.length > 0 ? (
                <div className={css.sentReferralAccordionContainer}>
                  {referrals.map(referral => (
                    <SentReferral key={referral.id} referral={referral} />
                  ))}
                </div>
              ) : (
                <div className={css.noReferrals}>
                  <IconEnquiry />
                  <p className={css.noReferralsText}>You haven't sent any referrals yet.</p>
                </div>
              )}
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
        <h1 className={css.modalTitle}>Send a Referral</h1>
        <SendReferralForm
          intl={intl}
          onSubmit={values => onSendReferral(values.email)}
          sendReferralInProgress={sendReferralInProgress}
          sendReferralError={sendReferralError}
          referralSent={referralSent}
          referrals={referrals}
        />
      </Modal>
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
};

const ReferralPage = compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(ReferralPageComponent);

export default ReferralPage;
