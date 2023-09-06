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
} from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import { Box, useMediaQuery } from '@material-ui/core';
import FAQAccordion from './FAQAccordion';
import { isScrollingDisabled } from '../../ducks/UI.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';

import css from './FAQPage.module.css';

import blogBackground from '../../assets/blog-background.jpg';
import { useCheckMobileScreen } from '../../util/hooks';

const useStyles = makeStyles(theme => ({
  hero: {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('${blogBackground}')`,
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
          answer:
            'CareVine is a platform that connects caregivers and care seekers. Caregivers can create a profile and list their services, and care seekers can search for caregivers and book services.',
        },
        {
          question: 'How Does CareVine Work?',
          answer:
            'CareVine is a platform that connects caregivers and care seekers. Caregivers can create a profile and list their services, and care seekers can search for caregivers and book services.',
        },
        {
          question: 'How is CareVine different from traditional caregiving agencies?',
          answer:
            'CareVine is a platform that connects caregivers and care seekers. Caregivers can create a profile and list their services, and care seekers can search for caregivers and book services.',
        },
      ],
    },
    {
      title: 'For Care Seekers',
      questions: [
        {
          question: 'How do I create a profile?',
          answer:
            'CareVine is a platform that connects caregivers and care seekers. Caregivers can create a profile and list their services, and care seekers can search for caregivers and book services.',
        },
        {
          question: 'How do I find the right caregiver for my needs?',
          answer:
            'CareVine is a platform that connects caregivers and care seekers. Caregivers can create a profile and list their services, and care seekers can search for caregivers and book services.',
        },
        {
          question: 'How do I communicate with potential caregivers?',
          answer:
            'CareVine is a platform that connects caregivers and care seekers. Caregivers can create a profile and list their services, and care seekers can search for caregivers and book services.',
        },
      ],
    },
    {
      title: 'For Caregivers',
      questions: [
        {
          question: 'How do I join CareVine as a caregiver?',
          answer:
            'CareVine is a platform that connects caregivers and care seekers. Caregivers can create a profile and list their services, and care seekers can search for caregivers and book services.',
        },
        {
          question: 'How do I get paid on the platform?',
          answer:
            'CareVine is a platform that connects caregivers and care seekers. Caregivers can create a profile and list their services, and care seekers can search for caregivers and book services.',
        },
        {
          question: 'What are the benefits of joining CareVine as a caregiver?',
          answer:
            'CareVine is a platform that connects caregivers and care seekers. Caregivers can create a profile and list their services, and care seekers can search for caregivers and book services.',
        },
        {
          question: 'How do background checks work for caregivers?',
          answer:
            'CareVine is a platform that connects caregivers and care seekers. Caregivers can create a profile and list their services, and care seekers can search for caregivers and book services.',
        },
      ],
    },
    {
      title: 'Bookings',
      questions: [
        {
          question: 'What is the booking process?',
          answer:
            'CareVine is a platform that connects caregivers and care seekers. Caregivers can create a profile and list their services, and care seekers can search for caregivers and book services.',
        },
        {
          question: 'Can I set up a recurring booking with a caregiver?',
          answer:
            'CareVine is a platform that connects caregivers and care seekers. Caregivers can create a profile and list their services, and care seekers can search for caregivers and book services.',
        },
        {
          question: 'How does the payment system work?',
          answer:
            'CareVine is a platform that connects caregivers and care seekers. Caregivers can create a profile and list their services, and care seekers can search for caregivers and book services.',
        },
        {
          question: 'What fees are associated with the booking process?',
          answer:
            'CareVine is a platform that connects caregivers and care seekers. Caregivers can create a profile and list their services, and care seekers can search for caregivers and book services.',
        },
        {
          question: 'How do refunds work?',
          answer:
            'CareVine is a platform that connects caregivers and care seekers. Caregivers can create a profile and list their services, and care seekers can search for caregivers and book services.',
        },
        {
          question: 'How far out in the future can I book a caregiver?',
          answer:
            'CareVine is a platform that connects caregivers and care seekers. Caregivers can create a profile and list their services, and care seekers can search for caregivers and book services.',
        },
      ],
    },
    {
      title: 'Safety and Trust',
      questions: [
        {
          question: 'How does CareVine ensure the safety of its users?',
          answer:
            'CareVine is a platform that connects caregivers and care seekers. Caregivers can create a profile and list their services, and care seekers can search for caregivers and book services.',
        },
        {
          question: 'What is the process for background checks?',
          answer:
            'CareVine is a platform that connects caregivers and care seekers. Caregivers can create a profile and list their services, and care seekers can search for caregivers and book services.',
        },
        {
          question: 'How can I trust the caregivers on the platform?',
          answer:
            'CareVine is a platform that connects caregivers and care seekers. Caregivers can create a profile and list their services, and care seekers can search for caregivers and book services.',
        },
        {
          question: 'Are all caregivers on CareVine background checked?',
          answer:
            'CareVine is a platform that connects caregivers and care seekers. Caregivers can create a profile and list their services, and care seekers can search for caregivers and book services.',
        },
      ],
    },
    {
      title: 'About CareVine',
      questions: [
        {
          question: 'What is the mission of CareVine?',
          answer:
            'CareVine is a platform that connects caregivers and care seekers. Caregivers can create a profile and list their services, and care seekers can search for caregivers and book services.',
        },
        {
          question: 'How was CareVine started?',
          answer:
            'CareVine is a platform that connects caregivers and care seekers. Caregivers can create a profile and list their services, and care seekers can search for caregivers and book services.',
        },
        {
          question: 'How can I contact CareVine?',
          answer:
            'CareVine is a platform that connects caregivers and care seekers. Caregivers can create a profile and list their services, and care seekers can search for caregivers and book services.',
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
