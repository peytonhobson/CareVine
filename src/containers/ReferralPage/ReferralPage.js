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
} from '../../components';
import InfoIcon from '@mui/icons-material/Info';
import { TopbarContainer } from '..';
import { injectIntl, intlShape } from '../../util/reactIntl';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/UI.duck';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { ensureCurrentUser } from '../../util/data';
import SentDiscount from './SentDiscount';
import { generateReferralCode } from './ReferralPage.duck';

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
  } = props;

  const [isSendDiscountModalOpen, setIsSendDiscountModalOpen] = useState(false);

  const ensuredCurrentUser = ensureCurrentUser(currentUser);
  const referralCode = ensuredCurrentUser.attributes.profile.metadata.referralCode;

  useEffect(() => {
    if (!referralCode && ensuredCurrentUser.id?.uuid) {
      onGenerateReferralCode();
    }
  }, [ensuredCurrentUser.id?.uuid]);

  const schemaTitle = intl.formatMessage({ id: 'ReferralPage.schemaTitle' });

  const sentDiscounts = [
    {
      id: 'discount1',
      email: 'peyton.hobson1@gmail.com',
      claimed: false,
      lastReminder: new Date(),
    },
    {
      id: 'discount2',
      email: 'clairkaji@gmail.com',
      claimed: true,
      lastReminder: new Date() - 359200000,
    },
  ];

  const discountsClaimed = sentDiscounts.filter(discount => discount.claimed);

  const accordionStyles = {
    width: '100%',
    borderRadius: '0.5rem',
    boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px',
    marginTop: '2rem',
    '&.MuiAccordion-root:before': {
      display: 'none',
    },
  };

  const summaryDiscountStyles = {
    '&.MuiAccordionSummary-root': {
      padding: '1.5rem',
      '&:hover': {
        cursor: 'pointer',
      },
    },
  };

  const summaryDiscountSentStyles = {
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

  const accordionDiscountLabel = (
    <div className={css.accordionLabel}>
      {/* TODO: Swap out icon */}
      <IconCar />
      <h4 className={css.myDiscounts}>My Discounts</h4>
      {/* Make discount number dynamic */}
      <p className={css.discountsText}>
        {discountsClaimed.length} {discountsClaimed.length === 1 ? 'discount' : 'discounts'}{' '}
        received{discountsClaimed.length === 0 && '- Keep an eye on your email for discounts'}
      </p>
    </div>
  );

  const accordionDiscountsSentLabel = (
    <div className={css.accordionLabel}>
      {/* TODO: Swap out icon */}
      <IconCar />
      <h4 className={css.myDiscounts}>
        {sentDiscounts ? sentDiscounts.length : 0} Discounts sent by e-mail
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
                  className={css.discountButton}
                  disabled={!referralCode}
                  inProgress={generateReferralCodeInProgress}
                  onClick={() => setIsSendDiscountModalOpen(true)}
                >
                  Send Discount
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
              summaryStyles={summaryDiscountStyles}
              detailStyles={detailStyles}
              label={accordionDiscountLabel}
            >
              <div className={css.discountAccordionContainer}>
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
                  <p className={classNames(css.smallLineHeight, css.discountInstructions)}>
                    Begin receiving discounted subscription months by sending discounts to other
                    caregivers.
                  </p>
                </div>
                <div style={{ paddingInline: '1rem' }}>
                  <div className={css.discountDisplayContainer}>
                    {/* TODO: Make numbers dynamic */}
                    <div className={css.discountsReceived}>
                      0<p style={{ margin: 0 }}>Received</p>
                    </div>
                    <div className={css.discountsPending}>
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
                          Once other caregivers accept your invitations, your discounts will move
                          from pending to received. This amount is the total discounts you've
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
              summaryStyles={summaryDiscountSentStyles}
              detailStyles={detailStyles}
              label={accordionDiscountsSentLabel}
            >
              {sentDiscounts.length > 0 ? (
                <div className={css.sentDiscountAccordionContainer}>
                  {sentDiscounts.map(discount => (
                    <SentDiscount key={discount.id} discount={discount} />
                  ))}
                </div>
              ) : (
                <div className={css.noDiscounts}>
                  <IconEnquiry />
                  <p className={css.noDiscountsText}>You haven't sent any discounts yet.</p>
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
        id="ReferralPage.sendDiscount"
        isOpen={isSendDiscountModalOpen}
        onClose={() => setIsSendDiscountModalOpen(false)}
        onManageDisableScrolling={onManageDisableScrolling}
        containerClassName={css.modalContainer}
        className={css.modalContent}
        usePortal
      ></Modal>
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
};

const ReferralPage = compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(ReferralPageComponent);

export default ReferralPage;
