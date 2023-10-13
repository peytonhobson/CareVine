import React, { useState } from 'react';

import { makeStyles } from '@material-ui/core/styles';
import {
  Page,
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
  ContactSection,
  NamedLink,
} from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import { Box, useMediaQuery } from '@material-ui/core';
import FAQAccordion from './FAQAccordion';
import { isScrollingDisabled } from '../../ducks/UI.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';

import css from './FAQPage.module.css';

import hero from '../../assets/faq-hero.jpg';

const useStyles = makeStyles(theme => ({
  hero: {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('${hero}')`,
    height: '31rem',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
    fontSize: '4rem',
    [theme.breakpoints.down('sm')]: {
      height: 300,
      fontSize: '3em',
    },
  },
  category: {
    padding: '2rem 0',
    borderTop: '1px solid var(--matterColor)',
    '&:first-of-type': {
      borderTop: 'none',
    },
  },
}));

const FAQPage = props => {
  const { scrollingDisabled } = props;

  const [openAccordion, setOpenAccordion] = useState(null);

  const isMobile = useMediaQuery('(max-width:1024px)');

  const classes = useStyles();

  const categories = [
    {
      title: 'General',
      questions: [
        {
          question: 'What is CareVine?',
          answer: (
            <span>
              CareVine is a peer-to-peer marketplace designed to connect private caregivers and care
              seekers. The platform allows both caregivers and care seekers (or their
              representatives) to create listings in specific areas, detailing their care or
              caregiving preferences and requirements. The goal is to facilitate a match between
              caregivers and those in need of care, streamlining the process of finding and booking
              caregiving services.
            </span>
          ),
        },
        {
          question: 'How Does CareVine Work?',
          answer: (
            <span>
              CareVine operates as a platform where caregivers can create profiles showcasing their
              skills, experience, and availability. Similarly, seniors or their families can create
              listings detailing their care needs. Users can then browse these listings, message
              potential matches, and if there's a mutual fit, care seekers or their representatives
              can book the caregiver directly through the platform.
            </span>
          ),
        },
        {
          question: 'How is CareVine different from traditional caregiving agencies?',
          answer: (
            <span>
              Unlike traditional caregiving agencies that typically employ caregivers and assign
              them to clients, CareVine offers a more flexible, user-driven approach. CareVine does
              not employ caregivers but instead provides a platform for them to connect directly
              with those seeking care. This direct connection allows for more personalized matches,
              as both caregivers and care seekers have greater control over their choices.
              Additionally, the peer-to-peer model can often lead to more transparent communication
              and more competitive rates since there's no middleman involved.
            </span>
          ),
        },
      ],
    },
    {
      title: 'For Care Seekers',
      questions: [
        {
          question: 'How do I create a profile?',
          answer: (
            <span>
              To create a profile on CareVine, navigate to the{' '}
              <NamedLink name="SignupPage">Sign Up Page</NamedLink>. You'll be prompted to provide
              relevant details about yourself or the person in need of care. This might include
              personal details, care requirements, preferred schedule, and any other pertinent
              information. Once you've filled out the necessary fields, you can publish your
              listing. It's recommended to provide as much detail as possible to help caregivers
              understand your needs and ensure a good match.
            </span>
          ),
        },
        {
          question: 'How do I find the right caregiver for my needs?',
          answer: (
            <span>
              Once you've created a profile on CareVine, you can browse listings of caregivers in
              your area. Each caregiver's profile will showcase their skills, experience,
              availability, and other relevant details. You can use the platform's search and filter
              features to narrow down potential matches based on your specific requirements. When
              you find a caregiver who seems like a good fit, you can view their full profile for
              more details and decide if you'd like to message them.
            </span>
          ),
        },
        {
          question: 'How do I communicate with potential caregivers?',
          answer: (
            <span>
              CareVine provides an integrated messaging system that allows care seekers to directly
              communicate with caregivers. Once you've identified a caregiver you're interested in,
              you can send them a message through the platform to discuss your needs, ask questions,
              and determine if there's a mutual fit. If you decide that the caregiver is the right
              fit for you or your loved one, you can book them directly on the site by clicking the{' '}
              <strong>Book Now</strong> button on their profile page. It's essential to communicate
              openly and transparently to ensure both parties have a clear understanding of
              expectations and requirements. You can find our guide for interviewing caregivers{' '}
              <NamedLink
                name="BlogPostPage"
                params={{
                  slug:
                    'the-art-of-interviewing-how-to-hire-the-perfect-caregiver-for-private-care',
                }}
              >
                here
              </NamedLink>
              .
            </span>
          ),
        },
      ],
    },
    {
      title: 'For Caregivers',
      questions: [
        {
          question: 'How do I join CareVine as a caregiver?',
          answer: (
            <span>
              To join CareVine as a caregiver, navigate to the{' '}
              <NamedLink name="SignupPage">Sign Up Page</NamedLink>. You'll be prompted to provide
              details about your caregiving experience, skills, availability, and any certifications
              or qualifications you might have. After filling out the necessary fields, you can
              publish your listing publically on the platform. It's beneficial to provide
              comprehensive details to attract potential care seekers looking for your specific
              skills and experience.
            </span>
          ),
        },
        {
          question: 'How do I get paid on the platform?',
          answer: (
            <span>
              CareVine uses a secure payment system (<a href="https://stripe.com">Stripe</a>)to
              facilitate transactions between care seekers and caregivers. Once a care seeker books
              your services, they will make a payment through the platform. After the service is
              provided and the booking period ends, the payment will be processed and transferred to
              your designated bank account or payment method.
            </span>
          ),
        },
        {
          question: 'What are the benefits of joining CareVine as a caregiver?',
          answer: (
            <ul className="list-disc ml-6 mt-4">
              <li>
                <span>
                  <strong className="text-primary">Direct Connection:</strong> You can directly
                  connect with care seekers, allowing for transparent communication and personalized
                  care arrangements. This also means you'll receive the full payment for your
                  services, as there's no middleman involved.
                </span>
              </li>
              <li>
                <strong className="text-primary">Flexibility:</strong> You have the freedom to set
                your rates, schedule, and specify the services you offer.
              </li>
              <li>
                <strong className="text-primary">Secure Payments:</strong> CareVine provides a
                secure payment system, ensuring timely and safe transactions.
              </li>
              <li>
                <strong className="text-primary">Profile Visibility:</strong> Your profile will be
                visible to a wide audience of care seekers, increasing your chances of finding
                suitable job opportunities.
              </li>
              <li>
                <strong className="text-primary">Support:</strong> CareVine offers platform support,
                ensuring a smooth user experience. You can contact us either through the chat box
                located at the bottom right of the screen or by emailing us at{' '}
                <a href="mailto:support@carevine.us">here</a>.
              </li>
            </ul>
          ),
        },
        {
          question: 'How do background checks work for caregivers?',
          answer: (
            <span>
              CareVine prioritizes the safety of its users. As a caregiver, you are required to
              undergo a background check to be able to message care seekers and access your inbox.
              This check is conducted by a third-party agency and will assess any criminal history
              that is publicly available nationally from the past seven years. Once the background
              check is complete and your email is verified, you will have access to all
              functionalities of the site. It's essential to provide accurate information during
              this process, as any discrepancies may result in a failed background check.
            </span>
          ),
        },
      ],
    },
    {
      title: 'Bookings',
      questions: [
        {
          question: 'What is the booking process?',
          answer: (
            <span>
              Once you've identified a caregiver that fits your needs, you can initiate the booking
              process through CareVine's platform by going to the caregiver's profile and clicking
              the <strong>Book Now</strong> button. You can then select the dates and times you
              require care and confirm payment details. The caregiver will be notified of your
              request, and if they accept, both parties will receive a confirmation, and the booking
              can proceed as scheduled.
            </span>
          ),
        },
        {
          question: 'Can I set up a recurring booking with a caregiver?',
          answer: (
            <span>
              CareVine does not currently offer automatically recurring bookings, however, you can
              schedule as many future bookings as you want to fill this need. If you would like to
              set up a recurring booking, you can contact the caregiver directly to discuss your
              needs and schedule.
            </span>
          ),
        },
        {
          question: 'How does the payment system work?',
          answer: (
            <span>
              CareVine uses a secure payment system (<a href="https://stripe.com">Stripe</a>) to
              facilitate transactions. When making a booking, care seekers will be prompted to enter
              their payment details. Payments are held in escrow until the service is provided.
              After the care session is completed, the care seeker has 48 hours to submit any
              disputes. If no disputes are submitted, the payment is released to the caregiver,
              minus any platform and processing fees.
            </span>
          ),
        },
        {
          question: 'What fees are associated with the booking process?',
          answer: (
            <span>
              CareVine charges a service fee for using the platform, which covers the costs of
              maintaining the site, providing support, and processing payments. This fee is 2% of
              the amount paid to caregiver and is added to the total booking cost. In addition, a
              processing fee of is charged by Stripe for each transaction. This fee is 2.9% + $0.30
              for credit card transactions or 0.08% for bank transactions. CareVine recommends using
              bank transactions to avoid additional fees.
            </span>
          ),
        },
        {
          question: 'How do refunds work?',
          answer: (
            <span>
              If a booking is canceled or if there's an issue with the service provided, care
              seekers can request a refund. The conditions and process for refunds can be found in
              CareVine's{' '}
              <a
                href={`${process.env.REACT_APP_CANONICAL_ROOT_URL}/terms-of-service#cancellation-policy`}
              >
                Terms of Service
              </a>
              .
            </span>
          ),
        },
        {
          question: 'How far out in the future can I book a caregiver?',
          answer: (
            <span>
              CareVine allows bookings to be made as far in advance as needed, accommodating care
              seekers who like to plan ahead. However, it's always a good idea to communicate with
              the caregiver directly to ensure they're available for long-term or future bookings.
            </span>
          ),
        },
      ],
    },
    {
      title: 'Safety and Trust',
      questions: [
        {
          question: 'How does CareVine ensure the safety of its users?',
          answer: (
            <span>
              CareVine prioritizes the safety and security of its users. The platform implements
              several measures, including background checks for caregivers, secure payment systems,
              and a robust review and feedback mechanism. Users are also encouraged to communicate
              openly through the platform's messaging system before finalizing any bookings.
            </span>
          ),
        },
        {
          question: 'What is the process for background checks?',
          answer: (
            <span>
              CareVine conducts background checks on caregivers through a third-party agency. These
              checks assess any criminal history that is publicly available nationally from the past
              seven years. If any caregivers fail this background check, they are removed from the
              site immediately, promoting transparency and trust. Caregivers are required to undergo
              these checks to be able to interact with care seekers on the platform.
            </span>
          ),
        },
        {
          question: 'How can I trust the caregivers on the platform?',
          answer: (
            <span>
              CareVine aims to foster trust by implementing background checks and providing a
              platform for transparent reviews and feedback. Care seekers can view caregivers'
              profiles and read reviews from other users. Open communication through the platform's
              messaging system also allows care seekers to ask questions and gauge the suitability
              of a caregiver before making a booking.
            </span>
          ),
        },
        {
          question: 'Are all caregivers on CareVine background checked?',
          answer: (
            <span>
              Caregivers can create profiles on the platform without undergoing a background check,
              however, in order to interact with care seekers, they must pass a background check.
              Caregivers with a gold badge on their profile are continuously monitored by CareVine
              and will be removed from the site if any activity that violates our{' '}
              <NamedLink name="TermsOfServicePage">Terms of Service</NamedLink> is detected.
              Caregivers with basic background checks must renew yearly.
            </span>
          ),
        },
      ],
    },
    {
      title: 'About CareVine',
      questions: [
        {
          question: 'What is the mission of CareVine?',
          answer: (
            <span>
              CareVine's mission is to create a seamless and efficient platform that connects
              caregivers and seniors. By fostering direct connections, CareVine aims to provide
              personalized care solutions that cater to the unique needs of each individual at an
              affordable price. The platform is dedicated to ensuring that seniors receive the best
              possible care while caregivers have a platform to showcase their skills and find
              suitable job opportunities.
            </span>
          ),
        },
        // {
        //   question: 'How was CareVine started?',
        //   answer: (
        //     <span>

        //     </span>
        //   ),
        // },
        {
          question: 'How can I contact CareVine?',
          answer: (
            <span>
              Users can contact us by using the chat box in the bottom right corner of the screen,
              by emailing us at <a href="mailto:support@carevine.us">support@carevine.us</a>, or by
              navigating to the <NamedLink name="ContactUsPage">Contact Page</NamedLink> and
              submitting the form there.
            </span>
          ),
        },
      ],
    },
  ];

  return (
    <Page
      className={css.root}
      scrollingDisabled={scrollingDisabled}
      contentType="website"
      //   description={schemaDescription}
      //   title={schemaTitle}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'WebPage',
        // description: schemaDescription,
        // name: schemaTitle,
        // image: ['/static/images/Blog_Background.png'],
      }}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer currentPage="FAQPage" />
        </LayoutWrapperTopbar>
        <LayoutWrapperMain className={css.mainWrapper}>
          <Box className={classes.hero}>
            <Box>
              <h1 className="text-8xl">FAQ</h1>
            </Box>
          </Box>
          <section className={css.contentWrapper}>
            {categories.map(category => (
              <Box className={classes.category}>
                <h2 className={css.categoryTitle}>{category.title}</h2>
                {category.questions.map(question => (
                  <FAQAccordion
                    summary={question.question}
                    details={question.answer}
                    isOpen={openAccordion === question.question}
                    onChange={(event, isExpanded) => {
                      if (isExpanded) {
                        setOpenAccordion(question.question);
                      } else if (!isExpanded && openAccordion === question.question) {
                        setOpenAccordion(null);
                      }
                    }}
                  />
                ))}
              </Box>
            ))}
          </section>
          <ContactSection
            title={
              <h2
                className="text-6xl text-center"
                style={{ margin: isMobile ? '0 0 2rem 0' : '0 0 4rem 0' }}
              >
                Have more questions?
              </h2>
            }
          />
        </LayoutWrapperMain>
      </LayoutSingleColumn>
      <LayoutWrapperFooter>
        <Footer />
      </LayoutWrapperFooter>
    </Page>
  );
};

const mapStateToProps = state => {
  return {
    scrollingDisabled: isScrollingDisabled(state),
  };
};

export default compose(connect(mapStateToProps))(FAQPage);
