import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { NamedLink } from '..';

import css from './TermsOfService.module.css';

const marketplaceUrl = process.env.REACT_APP_CANONICAL_ROOT_URL;

const TermsOfService = props => {
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);

  // prettier-ignore
  return (
    <div className={classes}>
      <p className={css.lastUpdated}>Last updated: April, 11 2023</p>

      <p>
        This website, <a href={`https://${marketplaceUrl}`}>www.carevine.us</a> ("Site"), is
        operated by CareVine. The terms "we," "us," and "our" refer to CareVine. By using the Site,
        including its information, tools, and services (collectively, "Services"), you accept and
        agree to comply with these Terms of Service ("Terms"), as well as any additional terms,
        conditions, policies, and notices referenced or accessible via hyperlink.
      </p>

      <p>
        The Terms apply to all users, including browsers, vendors, customers, merchants, and content
        contributors. Review the Terms before accessing or using the Site. If you disagree with the
        Terms, do not access the Site or use the Services. By accessing or using the Site, you
        accept these Terms.
      </p>

      <p>
        Updates or changes to the Terms will be posted on this page, and it is your responsibility
        to check for such changes. Your continued use of or access to the Site constitutes
        acceptance of any changes. New features or tools added to the Site are also subject to these
        Terms.
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
                    Our Service connects Care Searchers with Providers offering care services.
                    Providers create profiles, search and apply for jobs, and communicate with Care
                    Searchers. Care Searchers post jobs, search for Providers, message them, and
                    make payments through our Service.
                  </p>
                </li>
                <li>
                  We use Stripe, Inc.'s payment processing service, enabling Care Searchers to pay
                  Providers via credit card, debit card, or ACH bank transfer. Providers using this
                  service agree to the{' '}
                  <a href="https://stripe.com/connect/account-terms">
                    Stripe Connected Account Agreement
                  </a>
                  , including <a href="https://stripe.com/terms">Stripe Terms of Service</a>.
                  Providers must provide accurate information to CareVine.us and authorize us to
                  share it and transaction information with Stripe. CareVine.us is not liable for
                  payments made through the service and all payments are non-refundable. Providers
                  using this service may qualify for benefits under a CareVine.us-operated program.
                </li>
              </ol>
            </li>
            <li>
              <h2>1.2. Limitations</h2>
              <p>
                Our Services assist users in finding, coordinating, and managing care, unless stated
                otherwise in the Terms or Service. We:
              </p>
              <ul className={classNames(css.nestedList, css.bulletedList)}>
                <li>
                  <p>Do not employ Providers or assume responsibility for their conduct.</p>
                </li>
                <li>
                  <p>Are not responsible for users' compliance with employment and other laws.</p>
                </li>
                <li>
                  <p>Do not control or vet user-generated content for accuracy or reliability.</p>
                </li>
                <li>
                  <p>
                    Are not an employment agency and do not secure employees or job opportunities.
                  </p>
                </li>
                <li>
                  <p>
                    Do not oversee service quality, timing, hours, pay, legality, or other aspects
                    of Provider services, nor require Providers to accept or work jobs.
                  </p>
                </li>
                <li>
                  <p>
                    Do not provide medical, diagnostic, treatment, or clinical services or engage in
                    conduct requiring a professional license.
                  </p>
                </li>
              </ul>
            </li>
            <li>
              <h2>1.3. User Responsibility</h2>
              <p>
                Registered users are responsible for conducting interviews, background checks,
                verifying information accuracy, checking references, and selecting suitable Care
                Searchers or Providers for themselves or their care recipients.
              </p>
            </li>
          </ul>
        </li>
        <li>
          <h1>2. Eligibility</h1>
          <p>
            By using the Site or Services, you warrant that you have the right, authority, and
            capacity to enter into these Terms and will comply with them. You confirm meeting the
            following eligibility requirements:
          </p>
          <ul className={classNames(css.nestedList, css.bulletedList)}>
            <li>
              <p>
                Intending to use the Site and Services for finding or managing care or care-related
                jobs.
              </p>
            </li>
            <li>
              <p>Being 18 years or older; if not, do not register for the Service.</p>
            </li>
            <li>
              <p>Being a legal resident of the United States.</p>
            </li>
            <li>
              <p>
                If registering as a Provider, having legal authorization to work in the United
                States.
              </p>
            </li>
            <li>
              <p>
                Neither you nor any member of your household has engaged in criminal activity, such
                as felonies, violent offenses, abuse, theft, drugs, or any unlawful act involving
                fraud, recklessness, or negligence, and no one is required to register as a sex
                offender with any government entity.
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
                "Content" encompasses material, data, and information uploaded or transmitted
                through the Site or Services. By using CareVine's Site or Services, you agree to:
              </p>
              <ul className={classNames(css.nestedList, css.bulletedList)}>
                <li>
                  <p>
                    Post Content solely for finding or managing care-related jobs or sharing
                    care-related information.
                  </p>
                </li>
                <li>
                  <p>
                    Ensure the accuracy, currency, and completeness of registration information.
                  </p>
                </li>
                <li>
                  <p>
                    Be responsible for your Content; avoid posting or transmitting defamatory,
                    inaccurate, abusive, obscene, offensive, threatening, harassing, racially
                    offensive, illegal material, or anything infringing on others' rights. Do not
                    promote unlawful acts, falsely represent Content's origin, or post unauthorized
                    information about others, including minors.
                  </p>
                </li>
                <li>
                  <p>
                    Acknowledge CareVine's right to review, modify, or remove any Content at its
                    discretion if violating Terms or considered offensive, inappropriate, illegal,
                    or threatening users' safety.
                  </p>
                </li>
                <li>
                  <p>
                    Comply with applicable laws and regulations in using Services and posting
                    Content.
                  </p>
                </li>
              </ul>
              <p>
                CareVine disclaims responsibility for the accuracy or reliability of user-generated
                Content and any liability arising from them. The Site may contain unaffiliated
                authors' opinions or advice, for which they are responsible. CareVine does not
                guarantee the Site's information accuracy or endorse any opinion, advice, or
                statement made by any party. CareVine and its Affiliates are not liable for losses
                or damages resulting from reliance on Site information, user Content, or reviews and
                comments about you.
              </p>
            </li>
            <li>
              <h2>3.2. Prohibited Uses</h2>
              <p>By using CareVine's Site or Services, you agree not to:</p>
              <ul className={classNames(css.nestedList, css.bulletedList)}>
                <li>
                  <p>
                    Use the Site or Services for abusive, threatening, fraudulent, unlawful
                    purposes, or purposes unrelated to care or caregiving.
                  </p>
                </li>
                <li>
                  <p>Harass, abuse, or harm others.</p>
                </li>
                <li>
                  <p>
                    Use another user's account or provide false information during registration or
                    communication.
                  </p>
                </li>
                <li>
                  <p>Interfere with the Services' proper functioning.</p>
                </li>
                <li>
                  <p>
                    Engage in automated system usage or impose an unreasonable load on servers or
                    network infrastructure.
                  </p>
                </li>
                <li>
                  <p>Bypass access restrictions or manipulate data.</p>
                </li>
                <li>
                  <p>
                    Use CareVine's communication systems for unauthorized commercial solicitation.
                  </p>
                </li>
                <li>
                  <p>
                    Publish or link to malicious content that damages or disrupts another user's
                    browser or computer.
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
                CareVine offers background check services to registered Providers from third-party
                agencies for a separate fee, with the Provider's consent. These background checks
                are governed by the Fair Credit Reporting Act (FCRA). CareVine receives a copy of
                each Background Check, and Providers are responsible for providing accurate contact
                information. Results will not be shared without authorization.
              </p>
            </li>
            <li>
              <h2>4.2. Responsibilities of Users of Background Check under FCRA</h2>
              <p>
                Users who request access to background checks must comply with the FCRA and relevant
                state laws. If negative data is found, users must follow required procedural steps.
                More information can be found at{' '}
                <a href="https://www.ftc.gov/tips-advice/business-center/guidance/using-consumer-reports-what-employers-need-know">
                  https://www.ftc.gov/tips-advice/business-center/guidance/using-consumer-reports-what-employers-need-know
                </a>
              </p>
            </li>
            <li>
              <h2>4.3. CareVine May Review and Use Background Checks You Order or Authorize</h2>
              <p>
                By using the Site or Services, you agree that CareVine can review and use any
                Background Checks you order or authorize. CareVine may terminate your membership
                based on the information in the report.
              </p>
              <p>
                If your membership or access to the Site is terminated based on information from a
                Background Check, we will notify you and provide you with the name and contact
                details of the consumer reporting agency that created the report if requested. We
                will also give you a copy of the report unless you have already received a copy or
                have access to it through the consumer reporting agency.
              </p>
            </li>
            <li>
              <h2>
                4.4. CareVine May Regularly Verify Your Identity and the Accuracy of Your
                Representations and Warranties
              </h2>
              <p>
                By registering as a Provider, you authorize CareVine to use third-party services to
                verify your registration data and legal representations. CareVine reserves the right
                to take appropriate action if you violate any terms or are unsuitable for the site.
              </p>
            </li>
            <li>
              <h2>
                4.6. Important Limitations About Background Checks and Release of Liability for
                Results of Background Checks
              </h2>
              <p>
                Background checks have limitations due to legal and reporting systems. CareVine is
                not responsible for any loss, liability, injury, death, damage, or costs resulting
                from your use of the information in a background check. Background checks performed
                by CareVine should not be considered complete, accurate, up-to-date, or conclusive
                evidence of a user's eligibility to use the Services.
              </p>
            </li>
          </ul>
        </li>
        <li>
          <h1>5. Termination</h1>
          <p>
            CareVine reserves the right to terminate your access, remove your profile and/or
            content, and/or close your account without notice for any reason at our sole discretion.
            Reasons may include ineligibility, violation of Terms of Service or Additional Terms,
            unsuitability, or misuse of Site content. Upon termination, CareVine has no obligation
            to provide copies of your content or disclose the reason for termination, if any.
          </p>
        </li>
        <li>
          <h1>6. Privacy</h1>
          <p>
            CareVine processes the information you provide on the Site or through the Services in
            accordance with our
            <NamedLink name="PrivacyPolicyPage">Privacy Policy</NamedLink>. Refer to the full
            Privacy Policy for more details.
          </p>
        </li>
        <li>
          <h1>7. Links to External Sites</h1>
          <p>
            Advertisements, external links, and third-party content on CareVine's website are
            provided for user convenience and reference only, without endorsement by CareVine.
            CareVine has no control over and is not responsible for third-party content or websites,
            which are governed by their respective terms of use and privacy policies. CareVine
            disclaims any responsibility or liability resulting from users' use or viewing of links
            on its website, and users agree to hold CareVine harmless from any liability arising
            from the use of these links.
          </p>
        </li>
        <li>
          <h1>8. Payment and Refund Policy</h1>
          <p>
            Users may be required to pay fees for certain CareVine services or products, including
            recurring subscriptions, one-time fees, or other charges. Users are responsible for any
            applicable state or local sales taxes on purchased services or products.
          </p>
          <p>
            By signing up for a paid membership, subscription, or any service or product with
            recurring fees, users agree to pay associated charges and authorize CareVine or a
            third-party payment processor to charge their chosen payment method. CareVine reserves
            the right to correct any errors or mistakes, even after receiving or requesting payment.
          </p>
          <p>
            For non-recurring fee-based services or products, users authorize CareVine to charge
            their selected payment provider. If users have previously provided credit card details,
            CareVine may charge the same card for additional purchases.
          </p>
          <p>
            Paid memberships and recurring fee-based services/products continue until cancelled by
            the user, renewing automatically at the disclosed rate unless otherwise specified. Users
            can cancel by following instructions on their{' '}
            <NamedLink name="SubscriptionsPage">Subscriptions Page</NamedLink> in{' '}
            <NamedLink name="AccountSettingsPage">Account Settings</NamedLink>. Cancellation fees
            may apply.
          </p>
          <p>
            CareVine may offer promotional offers to certain users. Users will be charged the
            standard subscription price after the promotional period unless cancelled before the
            expiration of the free trial. To avoid charges, users must downgrade or cancel prior to
            the end of the promotional period.
          </p>
          <p>
            All payments for subscriptions, services, or products made on or through CareVine are
            non-refundable, with no refunds or credits for unused or partially used services or
            products, even if users cancel their membership, subscription, service, or product
            during a term, unless otherwise specified in these Terms or at the time of purchase.
          </p>
        </li>
        <li>
          <h1>9. Release of Liability for Conduct and Disputes</h1>
          <p>
            By using this Site or Services, you agree to release and indemnify CareVine and its
            affiliates from any disputes, claims, or actions arising from interactions or
            relationships with other users, or from information, instruction, advice, or services
            provided by third-party users. CareVine and its affiliates disclaim responsibility for
            any harm, legal actions, claims, or controversies resulting from such situations,
            whether known to CareVine or not.
          </p>
        </li>
        <li>
          <h1>10. Disclaimers, Assumption of Risk, Limitations, and Indemnification</h1>
          <ul>
            <li>
              <h2>10.1. Disclaimer of Warranties</h2>
              <p>
                The Site and Services are provided "as is" and "as available," with CareVine and its
                affiliates expressly disclaiming all warranties, express, implied, or statutory,
                including warranties of merchantability, fitness for a particular purpose, or
                non-infringement of intellectual property rights. CareVine does not warrant that the
                Site or Services will meet your requirements, be uninterrupted, timely, secure, or
                error-free, or that the results obtained will be accurate or reliable.
              </p>
            </li>
            <li>
              <h2>10.2. Limitation of Liability</h2>
              <p>
                CareVine and its affiliates shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages, including loss of profits, data, use,
                goodwill, or other intangible losses resulting from (i) your access to, use of, or
                inability to access or use the Site or Services; (ii) any conduct or content of any
                third party on the Site or Services; (iii) any content obtained from the Site or
                Services; and (iv) unauthorized access, use, or alteration of your transmissions or
                content, regardless of the legal theory and whether we have been informed of the
                possibility of such damage, even if a remedy fails its essential purpose.
              </p>
            </li>
            <li>
              <h2>10.3. Assumption of Risk</h2>
              <p>
                CareVine takes measures to promote safety on the platform, but finding care or
                care-related jobs online involves inherent risks. We don't provide training,
                supervision, or monitoring of Care Searchers or Providers and can't guarantee all
                interactions will be safe and respectful.
              </p>
              <p>
                By using the platform and Services, you assume all risks, including injury, illness,
                death, and other risks associated with online or offline interactions with users.
                You agree not to rely solely on our vetting and screening processes for Providers or
                Care Searchers, or any other safety measures.
              </p>
            </li>
            <li>
              <h2>10.4. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless CareVine, its officers, directors,
                employees, agents, licensors, and suppliers from any claims, actions, suits, losses,
                liabilities, damages, costs, and expenses (including attorneys' fees) arising from
                your use of the platform and services, breach of these Terms, or violation of any
                third-party rights.
              </p>
              <p>
                You also agree to cooperate with CareVine in defending such claims. We reserve the
                right to assume the exclusive defense and control of any matter subject to
                indemnification by you, requiring your full cooperation in asserting available
                defenses. This indemnification obligation will survive these Terms and your use of
                the platform and services.
              </p>
            </li>
          </ul>
        </li>
        <li>
          <h1>11. Copyright Notices/Complaints</h1>
          <p>
            CareVine respects intellectual property rights and expects users to do the same. We
            respond to copyright infringement notices that comply with applicable law. If you
            believe your content has been infringed, provide us with:
          </p>
          <ol className={css.nestedList}>
            <li>
              <p>
                The copyright owner's physical or electronic signature or that of an authorized
                representative.
              </p>
            </li>
            <li>
              <p>Identification of the copyrighted work claimed to be infringed.</p>
            </li>
            <li>
              <p>
                Identification of the allegedly infringing material, including information to help
                us locate it.
              </p>
            </li>
            <li>
              <p>Your contact information, including address, phone number, and email.</p>
            </li>
            <li>
              <p>
                A statement asserting your good faith belief that the material's use is
                unauthorized.
              </p>
            </li>
            <li>
              <p>
                A statement, under penalty of perjury, that the notification is accurate and you are
                authorized to act for the copyright owner.
              </p>
            </li>
          </ol>
          <p>
            We may remove allegedly infringing content without notice and, in appropriate cases,
            terminate repeat infringers' accounts.
          </p>
          <p>
            If you believe your content was removed or disabled mistakenly or due to
            misidentification, contact us at{' '}
            <a href="mailto: support@carevine.us">support@carevine.us</a> with:
          </p>
          <ol className={css.nestedList}>
            <li>
              <p>Your contact information, including address, phone number, and email.</p>
            </li>
            <li>
              <p>
                A description of the removed or disabled content and its former location on our
                platform.
              </p>
            </li>
            <li>
              <p>
                A statement asserting your good faith belief that the removal or disabling resulted
                from mistake or misidentification.
              </p>
            </li>
            <li>
              <p>
                A statement consenting to the jurisdiction of the Federal District Court for your
                address's judicial district (or any judicial district where CareVine may be found if
                you reside outside the United States) and accepting service of process from the
                original DMCA notifier or their agent.
              </p>
            </li>
            <li>
              <p>Your physical or electronic signature.</p>
            </li>
          </ol>
          <p>We may reinstate the content in question at our sole discretion.</p>
        </li>
        <li>
          <h1>12. Arbitration</h1>
          <p>
            Any dispute, claim, or controversy arising from your use of CareVine's platform and
            services, including these Terms of Service, shall be resolved exclusively through
            binding arbitration. The arbitration award is final, binding, and enforceable in any
            court with jurisdiction. The award may include attorneys' fees and costs.
          </p>
          <p>
            You and CareVine agree to resolve disputes on an individual basis and not as part of any
            class, consolidated, or representative action. If a claim proceeds in court rather than
            arbitration, both parties waive their right to a jury trial.
          </p>
          <p>
            You and CareVine waive the right to a jury trial or to participate as a plaintiff or
            class member in any class action or representative proceeding. If a court or arbitrator
            deems the class action waiver void or unenforceable, or determines that arbitration can
            proceed on a class basis, the arbitration provision shall be considered null and void,
            and the parties will not have agreed to arbitrate disputes.
          </p>
        </li>
        <li>
          <h1>13. Governing Law and Jurisdiction</h1>
          <p>
            These Terms of Service and any related disputes are governed by and construed in
            accordance with the laws of the State of Wyoming, without regard to conflicts of law
            principles.
          </p>
          <p>
            You agree that any legal action arising from these Terms of Service shall be filed only
            in state or federal courts located in Wyoming. You consent and submit to the personal
            jurisdiction of these courts for litigating any such action.
          </p>
          <p>
            CareVine may seek injunctive or other equitable relief to protect its intellectual
            property rights in a court of competent jurisdiction. Any claim you bring in connection
            with these Terms of Service must be filed within one (1) year after the cause of action
            arises, or it will be barred.
          </p>
          <p>
            If any provision of these Terms of Service is deemed invalid or unenforceable, it will
            be limited or eliminated to the minimum extent necessary, while the remaining provisions
            remain in full force and effect.
          </p>
        </li>
        <li>
          <h1>13. Consent to Elecronic Communication</h1>
          <p>
            By using CareVine's platform and services, you consent to receive electronic
            communications from us, including emails, text messages, push notifications, or other
            means.
          </p>
          <p>
            You agree that electronic communications satisfy any legal requirements for agreements,
            notices, disclosures, and other communications to be in writing.
          </p>
          <p>
            You acknowledge that electronic communications from CareVine are considered received
            when sent, regardless of your access to them.
          </p>
          <p>
            To withdraw consent for electronic communications, contact us using the information
            provided on our platform or in our communications. However, be aware that withdrawing
            consent may affect your ability to use our platform and services.
          </p>
        </li>
        <li>
          <h1>14. Severability</h1>
          <p>
            If any provision of these Terms of Service is found to be unlawful, void, or
            unenforceable, it will still be enforceable to the maximum extent permitted by law. The
            unenforceable portion will be considered severed from these Terms, and this
            determination will not impact the validity or enforceability of the remaining
            provisions.
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
