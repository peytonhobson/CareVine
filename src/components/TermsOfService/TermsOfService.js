import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { NamedLink } from '..';

import css from './TermsOfService.module.css';

const TermsOfService = props => {
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);

  // prettier-ignore
  return (
    <div className={classes}>
      <p className={css.lastUpdated}>Last updated: March, 25 2023</p>

      <p>
        This website is operated by CareVine. Throughout the site, where “Site” shall mean
        www.carevine.us, the terms “we”, “us” and “our” refer to CareVine. CareVine offers this
        website, including all information, tools and services available from this site to you, the
        user, conditioned upon your acceptance of all terms, conditions, policies and notices stated
        here.
      </p>

      <p>
        By visiting our site and/or purchasing something from us, you engage in our “Service” and
        agree to be bound by the following terms and conditions (“Terms of Service”, “Terms”),
        including those additional terms and conditions and policies referenced herein and/or
        available by hyperlink. These Terms of Service apply to all users of the site, including
        without limitation users who are browsers, vendors, customers, merchants, and/ or
        contributors of content.
      </p>

      <p>
        Please read these Terms of Service carefully before accessing or using our website. By
        accessing or using any part of the site, you agree to be bound by these Terms of Service. If
        you do not agree to all the terms and conditions of this agreement, then you may not access
        the website or use any services. If these Terms of Service are considered an offer,
        acceptance is expressly limited to these Terms of Service.
      </p>

      <p>
        Any new features or tools which are added to the current store shall also be subject to the
        Terms of Service. You can review the most current version of the Terms of Service at any
        time on this page. We reserve the right to update, change or replace any part of these Terms
        of Service by posting updates and/or changes to our website. It is your responsibility to
        check this page periodically for changes. Your continued use of or access to the website
        following the posting of any changes constitutes acceptance of those changes.
      </p>

      <ul className={css.mainList}>
        <li>
          <h1>1. Services, Limitations, and User Responsibilities</h1>
          <ul>
            <li>
              <h2>1.1. Services</h2>
              <ol type="a" className={css.nestedList} style={{ marginLeft: '1rem' }}>
                <li>
                  <p>
                    Our Service connects Care Searchers with Providers who want to offer care
                    services. Providers can create profiles, search and apply for jobs, and
                    communicate with Care Searchers. Similarly, Care Searchers can post jobs, search
                    for Providers, message them, and make payments through our Service.
                  </p>
                </li>
                <li>
                  We utilize a third-party payment processing service provided by Stripe, Inc.,
                  which enables Care Searchers to pay Providers through credit card, debit card, or
                  ACH bank transfer. Providers who use the payment service also agree to be bound by
                  the{' '}
                  <a href="https://stripe.com/connect/account-terms">
                    Stripe Connected Account Agreement
                  </a>
                  , which includes the{' '}
                  <a href="https://stripe.com/terms">Stripe Terms of Service</a>. As a condition of
                  using this payment service, Providers agree to provide accurate information to
                  CareVine.us and authorize us to share it and transaction information with Stripe.
                  CareVine.us does not assume liability or responsibility for any payments made
                  through the payment service, and all payments made are non-refundable.
                  Additionally, Providers who use this service may qualify for benefits under a
                  program operated by CareVine.us.
                </li>
              </ol>
            </li>
            <li>
              <h2>1.2. Limitations</h2>
              <p>
                Our Services assist our users in searching, coordinating, and managing care for
                their care recipients, unless explicitly stated otherwise in the Terms or the
                Service itself.
              </p>
              <ul className={classNames(css.nestedList, css.bulletedList)}>
                <li>
                  <p>
                    We do not employ any Providers and are not responsible for their conduct,
                    whether online or offline.
                  </p>
                </li>
                <li>
                  <p>
                    Care Searchers are responsible for complying with all applicable employment and
                    other laws related to any employment relationship they establish.
                  </p>
                </li>
                <li>
                  <p>
                    User-generated content from Care Searchers and Providers is not controlled or
                    vetted by us for accuracy, and we disclaim any responsibility for the accuracy
                    or reliability of this information.
                  </p>
                </li>
                <li>
                  <p>
                    We are not an employment agency and do not secure or procure employees or
                    employment opportunities for any users.
                  </p>
                </li>
                <li>
                  <p>
                    We do not monitor or oversee the quality, timing, hours, pay, legality, or any
                    other aspect of services delivered by Providers, nor do we require Providers to
                    accept or work any jobs.
                  </p>
                </li>
                <li>
                  <p>
                    We do not provide any medical, diagnostic, treatment, or clinical services, nor
                    do we engage in any conduct that requires a professional license.
                  </p>
                </li>
              </ul>
            </li>
            <li>
              <h2>1.3. User Responsibilities</h2>
              <p>
                Users who have registered on our platform are entirely responsible for conducting
                interviews, performing background checks, verifying the accuracy of information
                provided, checking references, and choosing an appropriate Care Searcher or Provider
                for themselves or their care recipient.
              </p>
            </li>
          </ul>
        </li>
        <li>
          <h1>2. Eligibility</h1>
          <p>
            By requesting to use, registering to use, and/or using the Site or the Services, you
            represent and warrant that you have the right, authority, and capacity to enter into
            these Terms and will abide by all terms and conditions. Additionally, you confirm that
            you meet the following eligibility requirements:
          </p>
          <ul className={classNames(css.nestedList, css.bulletedList)}>
            <li>
              <p>
                You intend to use the Site and Services exclusively for the purpose of finding or
                managing care or care-related jobs.
              </p>
            </li>
            <li>
              <p>
                You are 18 years of age or older. If you do not meet this requirement, please do not
                register for the Service.
              </p>
            </li>
            <li>
              <p>
                The Services are currently only available to legal residents of the United States.
              </p>
            </li>
            <li>
              <p>
                If you are registering as a Provider, you must be legally authorized to work within
                the United States.
              </p>
            </li>
            <li>
              <p>
                You and any member of your household have never been the subject of any criminal
                activity, such as any felony, violent criminal offense, sexual, physical, or
                emotional abuse or neglect, theft, drugs, or any unlawful act that involves fraud,
                reckless, or negligent conduct. Additionally, you or any member of your household is
                not currently required to register as a sex offender with any government entity.
              </p>
            </li>
          </ul>
        </li>
        <li>
          <h1>3. User Conduct</h1>
          <ul>
            <li>
              <h2>3.1. Registration and Content restrictions</h2>
              <p>
                These rules apply to "Content," which includes all material, data, and information,
                such as communications, images, sounds, and videos that you upload or transmit
                through the Site or Services.
              </p>
              <ul className={classNames(css.nestedList, css.bulletedList)}>
                <li>
                  <p>
                    You may only post, upload, or transmit Content for the purpose of finding or
                    managing care or care-related jobs or for finding or sharing information related
                    to care.
                  </p>
                </li>
                <li>
                  <p>
                    It is your responsibility to ensure that the information you provide during
                    registration for the Site and Services is accurate, current, and complete.
                  </p>
                </li>
                <li>
                  <p>
                    You are responsible for any Content you post or transmit to other users on the
                    Site. You must not post or transmit any defamatory, inaccurate, abusive,
                    obscene, profane, offensive, sexually-oriented, threatening, harassing, racially
                    offensive, or illegal material, or any material that infringes another party's
                    rights. You must not advocate or promote any unlawful acts or falsely represent
                    that any Content comes from CareVine. All information provided to CareVine or
                    other users must be accurate and genuine. You warrant that you have the right
                    and authority to post information about yourself or others, including minors,
                    and have obtained appropriate authorization where necessary.
                  </p>
                </li>
                <li>
                  <p>
                    You acknowledge and consent that CareVine reserves the right to review, modify,
                    and remove any Content, in whole or in part, at its sole discretion. CareVine
                    may take such actions if the Content is deemed to violate the Terms, or if it is
                    considered offensive, inappropriate, or illegal, or if it poses a threat to the
                    safety of users or others.
                  </p>
                </li>
                <li>
                  <p>
                    Your use of the Services, including but not limited to the Content you post on
                    the Site, must be in accordance with any and all applicable laws and
                    regulations.
                  </p>
                </li>
              </ul>
              <p>
                As user-generated content, we do not control or verify the accuracy of any Content
                provided by Providers or Care Searchers on or off the Site. We expressly disclaim
                any responsibility for the accuracy or reliability of such Content, including any
                misstatements, misrepresentations, or defamatory statements. Users are responsible
                for any such statements made by or on behalf of them on the Site or elsewhere, and
                agree to hold CareVine harmless from any liability arising from such statements.
              </p>
              <p>
                The Site may contain opinions, advice, statements, or other information provided by
                authors who are not affiliated with CareVine. These authors are solely responsible
                for the content they provide. CareVine does not guarantee the accuracy,
                completeness, or usefulness of any information on the Site or available through the
                Service, nor does it endorse or accept responsibility for the accuracy or
                reliability of any opinion, advice, or statement made by any party on the Site or
                through the Service. CareVine and its Affiliates will not be held responsible for
                any loss or damage resulting from your reliance on information or other content
                posted on the Site or transmitted by any user, or from reviews or comments made
                about you by other users on the Site.
              </p>
            </li>
            <li>
              <h2>3.2. Prohibited Uses</h2>
              <p>
                By using the Site or Services of CareVine, you agree that you will not under any
                circumstances:
              </p>
              <ul className={classNames(css.nestedList, css.bulletedList)}>
                <li>
                  <p>
                    Use the Site or Services in a way that is abusive, threatening, fraudulent,
                    unlawful, or unrelated to care or caregiving
                  </p>
                </li>
                <li>
                  <p>Harass, abuse, harm, or attempt to do so to another person or group</p>
                </li>
                <li>
                  <p>
                    Use another user's account or provide false information during registration or
                    communication
                  </p>
                </li>
                <li>
                  <p>
                    Interfere or attempt to interfere with the proper functioning of the Services
                  </p>
                </li>
                <li>
                  <p>
                    Make any automated use of the system or take any action that may impose an
                    unreasonable load on our servers or network infrastructure
                  </p>
                </li>
                <li>
                  <p>Bypass any measures to restrict access to the Services or manipulate data</p>
                </li>
                <li>
                  <p>
                    Use the communication systems provided by CareVine for any commercial
                    solicitation purposes not expressly permitted
                  </p>
                </li>
                <li>
                  <p>
                    Publish or link to malicious content to damage or disrupt another user's browser
                    or computer.
                  </p>
                </li>
              </ul>
            </li>
          </ul>
        </li>
        <li>
          <h1>4. Background Checks</h1>
          <ul>
            <li>
              <h2>4.1. Providers Can Order or Authorize Background Checks about Themselves</h2>
              <p>
                CareVine provides background check services to registered Providers from third-party
                consumer reporting agencies for a separate fee, subject to the consent of the
                Provider being checked.
              </p>
              <p>
                Each of these Background Checks is regulated by the Fair Credit Reporting Act
                (“FCRA”), and the background reports resulting from these services are considered
                “consumer reports” under FCRA. Consumer reports may contain information on your
                character, general reputation, personal characteristics, and mode of living,
                including but not limited to consumer credit, criminal history, workers’
                compensation, driving, employment, military, civil, and educational data and
                reports.
              </p>
              <p>
                CareVine receives a copy of each ordered or authorized Background Check and is
                governed by Section 4.3 below. It is the Provider's responsibility to ensure
                accurate contact information is provided as sensitive information will be sent to
                CareVine.
              </p>
              <p>
                If a Provider orders a Background Check on themselves through CareVine, it may be
                indicated in their profile but results will not be shared without specific
                authorization.
              </p>
            </li>
            <li>
              <h2>4.2. Responsibilities of Users of Background Check under FCRA</h2>
              <p>
                The federal Fair Credit Reporting Act and state laws govern the use of background
                check reports obtained through the Site. End users who order or request access to a
                Care Searcher's background check must agree to the End User Certification, which
                requires compliance with relevant laws and outlines key legal obligations. If
                negative data is found and adverse action is taken, certain procedural steps must be
                taken, including notifying the subject of the report and allowing them to contest
                the accuracy or completeness of the report. CareVine may provide a mechanism for
                requesting that the consumer reporting agency complete these steps, but if not, the
                user is responsible for making the required notifications themselves. In cases where
                the subject contests the report, the hiring process must be suspended while the
                agency investigates. Additional details on these steps can be found at{' '}
                <a href="https://www.ftc.gov/tips-advice/business-center/guidance/using-consumer-reports-what-employers-need-know">
                  https://www.ftc.gov/tips-advice/business-center/guidance/using-consumer-reports-what-employers-need-know
                </a>
                , depending on the specific background check ordered through CareVine.
              </p>
            </li>
            <li>
              <h2>4.3. CareVine May Review and Use Background Checks You Order or Authorize</h2>
              <p>
                By using the Site or Services as an individual Provider and registering for it, and
                after obtaining your authorization, you acknowledge and agree that CareVine reserves
                the right to review and utilize any Background Checks you have ordered or authorized
                about yourself. This is done with the purpose of safeguarding the safety and
                integrity of our Site and users. In some cases, this may be considered an employment
                purpose according to the FCRA. CareVine has the authority to terminate your
                membership based on the information presented in the report, even if the information
                was dismissed later on.
              </p>
              <p>
                If your membership or access to the Site is terminated based on information from a
                Background Check, we will notify you and provide you with the name and contact
                details of the consumer reporting agency that created the report if requested. We
                will also give you a copy of the report unless you have already received a copy or
                have access to it through the consumer reporting agency. You hereby acknowledge and
                agree that CareVine is not responsible for the quality, accuracy, or reliability of
                the information included in these Background Checks. Any inaccuracies in the report
                must be addressed with the consumer reporting agency that issued it and not
                CareVine.
              </p>
            </li>
            <li>
              <h2>
                4.4. CareVine May Regularly Verify Your Identity and the Accuracy of Your
                Representations and Warranties
              </h2>
              <p>
                When you register as a Provider on CareVine, you give the site authorization to use
                third-party service providers to verify that your registration data is accurate and
                that any legal representations in Section 2 (such as complaints, arrests, sex
                offender status, etc.) are true. These verification checks may include information
                from national criminal databases, sex offender registries, media streams, terrorist
                watch lists, law enforcement reports, and other sources.
              </p>
              <p>
                CareVine reserves the right to take appropriate action, including suspending or
                terminating your membership, if it determines that you have violated any
                representation or warranty or any other provision of the terms or are not suitable
                for the site.
              </p>
              <p>
                You acknowledge that CareVine does not have control over the quality, accuracy, or
                reliability of the information included in a verification check. The site generally
                does not share the results of a verification check with third parties, except for
                law enforcement or other safety-related purposes as required by applicable laws.
              </p>
              <p>
                By agreeing to these terms, you allow CareVine to conduct the verification checks
                described above if you are a Provider. If you do not want these verification checks
                to occur, you should not use CareVine.
              </p>
            </li>
            <li>
              <h2>
                4.6. Important Limitations About Background Checks and Release of Liability for
                Results of Background Checks
              </h2>
              <p>
                It's important to note that background checks have limitations due to legal and
                reporting systems, as well as the accuracy and completeness of the information
                provided by the person being checked. If the candidate provides incorrect
                information, the criminal check may not be accurate. Even the most comprehensive
                background check may not reveal all criminal records in all jurisdictions.
              </p>
              <p>
                If you decide to use or share the information provided by a background check, you
                agree to do so in accordance with applicable laws. CareVine is not responsible for
                any loss, liability, injury, death, damage, or costs that may result from your use
                of the information contained in a background check.
              </p>
              <p>
                CareVine is not obligated to perform background checks on Registered Users, and the
                checks performed should not be considered complete, accurate, up-to-date, or
                conclusive evidence of the accuracy of any information provided by the user or their
                eligibility to use the Services.
              </p>
            </li>
          </ul>
        </li>
        <li>
          <h1>5. Termination</h1>
          <p>
            CareVine may terminate your access to all or part of our platform and services, remove
            your profile and/or any content posted by or about you, and/or terminate your account,
            with or without notice, for any reason or no reason, in our sole discretion. This
            includes, but is not limited to, if we determine that you are not eligible to use our
            services, have violated any terms in these Terms of Service or any Additional Terms, are
            not suitable for participation as a Registered User, or have misused or misappropriated
            Site content.
          </p>
          <p>
            Upon termination, CareVine is not obligated to provide you with a copy of any content
            posted by or about you on our platform. If we terminate your registration, we are not
            obligated to notify you of the reason, if any, for your termination.
          </p>
        </li>
        <li>
          <h1>6. Privacy</h1>
          <p>
            CareVine uses the information you provide on the Site or via the Services or in
            accordance with our <NamedLink name="PrivacyPolicyPage">Privacy Policy</NamedLink>. For
            more information, see our full Privacy Policy.
          </p>
        </li>
        <li>
          <h1>7. Links to External Sites</h1>
          <p>
            The inclusion of advertisements, external links, and third-party content on CareVine's
            website is solely for users' convenience and reference, and does not indicate CareVine's
            endorsement of such sites, content, products, advertising, or other materials. CareVine
            does not have control over the third-party content or websites and is not responsible
            for them. The terms of use and privacy policies of the respective owners of such sites
            and content govern them, not CareVine's Privacy Policy or these Terms.
          </p>
          <p>
            CareVine explicitly disclaims any responsibility or liability arising from users' use or
            viewing of links on its website. Users agree to hold CareVine harmless from any
            liability that may arise from the use of links that appear on the website.
          </p>
        </li>
        <li>
          <h1>8. Payment and Refund Policy</h1>
          <p>
            To access certain CareVine services or products, users may be required to pay a
            recurring subscription, one-time, or other fees. The user is responsible for all
            applicable state or local sales taxes associated with the services or products
            purchased.
          </p>
          <ul>
            <li>
              <h2>8.1. Billing and Payment</h2>
              <p>
                By signing up for a CareVine paid membership subscription or any Service or product
                that involves recurring fees, you agree to pay all the charges associated with the
                selected subscription, Service, or product, as specified on the Site at the time of
                providing your payment information. You also authorize CareVine or a third-party
                payment processor, acting on our behalf, to charge your chosen payment method as per
                the terms of your chosen subscription, Service, or product. CareVine reserves the
                right to rectify any errors or mistakes that may occur, even after it has received
                or requested payment.
              </p>
              <p>
                If you choose to purchase any non-recurring fee-based Services or product offerings,
                you authorize CareVine to charge your selected payment provider for the purchased
                Services or products. If you have previously made purchases and provided your credit
                card details, CareVine may charge the same credit card for additional Services or
                products that you purchase.
              </p>
            </li>
            <li>
              <h2>8.2. Automatic Subscription Renewal and Cancellation</h2>
              <p>
                Paid memberships and recurring fee-based services/products continue until cancelled
                by user. Paid memberships renew automatically for an equivalent term at the
                disclosed rate, unless otherwise provided. Recurring fees for other
                services/products are charged at specified intervals until cancelled.
              </p>
              <p>
                You can cancel your paid membership by following instructions on your{' '}
                <NamedLink name="SubscriptionsPage">Subscriptions Page</NamedLink> in{' '}
                <NamedLink name="AccountSettingsPage">Account Settings</NamedLink>. If you cancel,
                you can still use your subscription until the end of the current term. Cancellation
                fees may apply and will be disclosed at sign-up.
              </p>
            </li>
            <li>
              <h2>8.3. Promotional Offers</h2>
              <p>
                CareVine may offer promotional offer to certain users from time-to-time. If a user
                signs up with a promotional offer unless he or she cancels before the expiration of
                the free trial period, the user will be charged the price then in effect for a
                subscription to the Service, unless otherwise informed by CareVine at the time of
                original subscription. If a user does not want to continue with the Service after
                the expiration of the promotional period, the Care Searcher or Provider must
                downgrade or cancel their subscription prior to the end of the promotional period.
              </p>
            </li>
            <li>
              <h2>8.4. Refund Policy</h2>
              <p>
                Except as set forth in these Terms or as described on the Site at the time you make
                a purchase, all payments for subscriptions, services or products made on or through
                the Site or Services are non-refundable, and there are no refunds or credits for
                unused or partially used subscriptions, services or products, even if you cancel
                your membership or a subscription, service, or product in the middle of a term.
              </p>
            </li>
          </ul>
        </li>
        <li>
          <h1>9. Release of Liability for Conduct and Disputes</h1>
          <p>
            By using this Site or our Services, you acknowledge and agree to release and indemnify
            CareVine and its affiliates from any disputes or claims that may arise from the actions
            or relationship between you and other users of the Site or from any information,
            instruction, advice, or services provided by other third-party users. CareVine and its
            affiliates explicitly disclaim any responsibility for any harm, legal actions, claims,
            or controversies that may result from the aforementioned situations, whether or not they
            are known to CareVine.
          </p>
        </li>
        <li>
          <h1>10. Disclaimers, Assumption of Risk, Limitations, and Indemnification</h1>
          <ul>
            <li>
              <h2>10.1. Disclaimer of Warranties</h2>
              <p>
                The Site and our Services are provided on an “as is” and “as available” basis.
                CareVine and its affiliates expressly disclaim any and all warranties, whether
                express, implied, or statutory, including without limitation, any warranties of
                merchantability, fitness for a particular purpose, or non-infringement of
                intellectual property rights. CareVine makes no warranty that the Site or our
                Services will meet your requirements, that the Site or our Services will be
                uninterrupted, timely, secure, or error-free, or that the results that may be
                obtained from the use of the Site or our Services will be accurate or reliable.
              </p>
            </li>
            <li>
              <h2>10.2. Limitation of Liability</h2>
              <p>
                In no event shall CareVine or its affiliates be liable for any indirect, incidental,
                special, consequential, or punitive damages, including without limitation, loss of
                profits, data, use, goodwill, or other intangible losses, resulting from (i) your
                access to or use of or inability to access or use the Site or our Services; (ii) any
                conduct or content of any third party on the Site or our Services; (iii) any content
                obtained from the Site or our Services; and (iv) unauthorized access, use, or
                alteration of your transmissions or content, whether based on warranty, contract,
                tort (including negligence), or any other legal theory, whether or not we have been
                informed of the possibility of such damage, and even if a remedy set forth herein is
                found to have failed of its essential purpose.
              </p>
            </li>
            <li>
              <h2>10.3. Assumption of Risk</h2>
              <p>
                While CareVine takes certain steps to promote the safety of our platform and
                services, it's important to acknowledge that finding care or care-related jobs
                online comes with inherent risks. We do not provide training, supervision, or
                monitoring of Care Searchers or Providers, and we cannot guarantee that all
                interactions with other Registered Users, site visitors, or their families will
                always be safe and respectful.
              </p>
              <p>
                By using our platform and services, you agree to assume all risks, including but not
                limited to injury, illness, death, and all other risks associated with online or
                offline interactions with other users. You also agree not to rely solely on our
                vetting and screening processes for Providers or Care Searchers, or any other steps
                we take to promote safety.
              </p>
            </li>
            <li>
              <h2>10.4. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless CareVine and its officers, directors,
                employees, agents, licensors, and suppliers, from and against any claims, actions,
                suits or proceedings, as well as any and all losses, liabilities, damages, costs and
                expenses (including reasonable attorneys' fees) arising out of or in connection with
                your use of our platform and services, your breach or violation of these Terms of
                Service, or your violation of any rights of any third party.
              </p>
              <p>
                You further agree to cooperate with CareVine in the defense of any such claims. We
                reserve the right to assume the exclusive defense and control of any matter subject
                to indemnification by you, in which event you will fully cooperate with us in
                asserting any available defenses. This indemnification obligation will survive these
                Terms of Service and your use of our platform and services.
              </p>
            </li>
          </ul>
        </li>
        <li>
          <h1>11. Copyright Notices/Complaints</h1>
          <p>
            CareVine respects the intellectual property rights of others and expects its users to do
            the same. We will respond to notices of alleged copyright infringement that comply with
            applicable law and are properly provided to us. If you believe that your content has
            been copied in a way that constitutes copyright infringement, please provide us with the
            following information:
          </p>
          <ol className={css.nestedList}>
            <li>
              <p>
                A physical or electronic signature of the copyright owner or a person authorized to
                act on their behalf.
              </p>
            </li>
            <li>
              <p>Identification of the copyrighted work claimed to have been infringed.</p>
            </li>
            <li>
              <p>
                Identification of the material that is claimed to be infringing or to be the subject
                of infringing activity and that is to be removed or access to which is to be
                disabled, and information reasonably sufficient to permit us to locate the material.
              </p>
            </li>
            <li>
              <p>
                Your contact information, including your address, telephone number, and an email
                address.
              </p>
            </li>
            <li>
              <p>
                A statement by you that you have a good faith belief that use of the material in the
                manner complained of is not authorized by the copyright owner, its agent, or the
                law.
              </p>
            </li>
            <li>
              <p>
                A statement that the information in the notification is accurate, and, under penalty
                of perjury, that you are authorized to act on behalf of the copyright owner.
              </p>
            </li>
          </ol>
          <p>
            We reserve the right to remove content alleged to be infringing without prior notice and
            at our sole discretion. In appropriate circumstances, CareVine will also terminate a
            user's account if the user is determined to be a repeat infringer.
          </p>
          <p>
            If you believe that your content has been removed or disabled by mistake or
            misidentification, please contact us at{' '}
            <a href="mailto: support@carevine.us">support@carevine.us</a> and provide us with the
            following information:
          </p>
          <ol className={css.nestedList}>
            <li>
              <p>
                Your contact information, including your address, telephone number, and an email
                address.
              </p>
            </li>
            <li>
              <p>
                A description of the content that was removed or disabled, and the location on our
                platform where it previously appeared.
              </p>
            </li>
            <li>
              <p>
                A statement by you that you have a good faith belief that the content was removed or
                disabled as a result of mistake or misidentification.
              </p>
            </li>
            <li>
              <p>
                A statement that you consent to the jurisdiction of the Federal District Court for
                the judicial district in which your address is located (or if you reside outside the
                United States, for any judicial district in which CareVine may be found), and that
                you will accept service of process from the person who provided the original DMCA
                notification or an agent of such person.
              </p>
            </li>
            <li>
              <p>Your physical or electronic signature.</p>
            </li>
          </ol>
          <p>
            We may, in our sole discretion, reinstate the content in question in appropriate
            circumstances.
          </p>
        </li>
        <li>
          <h1>12. Arbitration</h1>
          <p>
            In the event of any dispute, claim, or controversy arising out of or relating to your
            use of CareVine's platform and services, including but not limited to these Terms of
            Service, and whether such dispute, claim, or controversy is based on contract, tort,
            statute, or any other legal theory, such dispute, claim, or controversy shall be
            resolved exclusively through binding arbitration.
          </p>
          <p>
            The arbitration award shall be final and binding, and judgment on the award rendered by
            the arbitrator may be entered in any court having jurisdiction thereof. The arbitration
            award may include attorneys' fees and costs, and may be enforced by any court having
            jurisdiction.
          </p>
          <p>
            You and CareVine agree that any dispute resolution proceedings will be conducted only on
            an individual basis and not in a class, consolidated or representative action. If for
            any reason a claim proceeds in court rather than in arbitration, we each waive any right
            to a jury trial.
          </p>
          <p>
            You acknowledge and agree that you and CareVine are each waiving the right to a trial by
            jury or to participate as a plaintiff or class member in any purported class action or
            representative proceeding. If any court or arbitrator determines that the class action
            waiver set forth in this paragraph is void or unenforceable for any reason or that
            arbitration can proceed on a class basis, then the arbitration provision set forth above
            shall be deemed null and void in its entirety and the parties shall be deemed to have
            not agreed to arbitrate disputes.
          </p>
        </li>
        <li>
          <h1>13. Governing Law and Jurisdiction</h1>
          <p>
            These Terms of Service, and any dispute arising out of or relating to them, shall be
            governed by and construed in accordance with the laws of the State of Wyoming, without
            giving effect to any principles of conflicts of law.
          </p>
          <p>
            You agree that any action at law or in equity arising out of or relating to these Terms
            of Service shall be filed only in the state or federal courts located in the state of
            Wyoming, and you hereby consent and submit to the personal jurisdiction of such courts
            for the purposes of litigating any such action.
          </p>
          <p>
            Notwithstanding the foregoing, CareVine may seek injunctive or other equitable relief to
            protect its intellectual property rights in any court of competent jurisdiction. Any
            claim by you that may arise in connection with these Terms of Service must be brought
            within one (1) year after the cause of action arises, or such claim or cause of action
            shall be barred.
          </p>
          <p>
            If any provision of these Terms of Service is held to be invalid or unenforceable, then
            such provision shall be limited or eliminated to the minimum extent necessary, and the
            remaining provisions of these Terms of Service shall remain in full force and effect.
          </p>
        </li>
        <li>
          <h1>13. Consent to Elecronic Communication</h1>
          <p>
            By using CareVine's platform and services, you consent to receive communications from us
            electronically. We may communicate with you by email, text message, push notification,
            or other electronic means.
          </p>
          <p>
            You agree that all agreements, notices, disclosures, and other communications that we
            provide to you electronically satisfy any legal requirement that such communications be
            in writing.
          </p>
          <p>
            You further agree that any electronic communication from CareVine to you is deemed to be
            received by you when it is sent, regardless of whether you receive or access the
            communication.
          </p>
          <p>
            If at any time you wish to withdraw your consent to receive electronic communications
            from CareVine, please contact us using the information provided on our platform or in
            our communications to you. However, please note that withdrawing your consent to receive
            electronic communications may impact your ability to use our platform and services.
          </p>
        </li>
        <li>
          <h1>14. Severability</h1>
          <p>
            In the event that any provision of these Terms of Service is determined to be unlawful,
            void or unenforceable, such provision shall nonetheless be enforceable to the fullest
            extent permitted by applicable law, and the unenforceable portion shall be deemed to be
            severed from these Terms of Service, such determination shall not affect the validity
            and enforceability of any other remaining provisions.
          </p>
        </li>
        <li>
          <h1>15. Contact Information</h1>
          <p>
            Questions about the Terms of Service should be sent to{' '}
            <a href="mailto: support@carevine.us">support@carevine.us</a>
          </p>
        </li>
      </ul>
    </div>
  );
};

TermsOfService.defaultProps = {
  rootClassName: null,
  className: null,
};

const { string } = PropTypes;

TermsOfService.propTypes = {
  rootClassName: string,
  className: string,
};

export default TermsOfService;
