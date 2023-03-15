import React from 'react';
import config from '../../config';
import { twitterPageURL } from '../../util/urlHelpers';
import { StaticPage, TopbarContainer } from '../../containers';
import {
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
  ExternalLink,
} from '../../components';

import css from './AboutPage.module.css';
import image from './about-us-1056.jpg';

const AboutPage = () => {
  const { siteTwitterHandle, siteFacebookPage } = config;
  const siteTwitterPage = twitterPageURL(siteTwitterHandle);

  // prettier-ignore
  return (
    <StaticPage
      title="About Us"
      schema={{
        '@context': 'http://schema.org',
        '@type': 'AboutPage',
        description: 'About Yogatime',
        name: 'About page',
      }}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer />
        </LayoutWrapperTopbar>

        <LayoutWrapperMain className={css.staticPageWrapper}>
          <h1 className={css.pageTitle}>Look for care or accelerate your career</h1>
          <img className={css.coverImage} src={image} alt="My first ice cream." />

          <div className={css.contentWrapper}>
            <div className={css.contentMain}>
              <h2>
                Each of us is unique and has specific needs when it comes to caregiving. We
                understand that finding the right caregiver for you or your loved one can be a
                daunting task, which is why we created our peer-to-peer marketplace for caregivers
                and families.
              </h2>

              <p>
                At our marketplace, we strive to connect families with compassionate and skilled
                caregivers who can provide the personalized care and support they need. We believe
                that everyone deserves access to quality care, and our platform makes it easy to
                find caregivers who can meet your specific needs.
              </p>

              <p>
                If you are a caregiver looking to expand your client base, our platform offers you
                the opportunity to reach thousands of families in need of care. By joining our
                marketplace, you can grow your business and earn extra income by offering your
                services to those who need them.
              </p>

              <p>
                Thank you for considering our marketplace as your go-to resource for caregiving
                needs. Don't hesitate to reach out to us to learn more about how we can help you
                find the right caregiver or grow your business as a caregiver. You can also follow
                us on <ExternalLink href={siteFacebookPage}>Facebook</ExternalLink> and{' '}
                <ExternalLink href={siteTwitterPage}>Twitter</ExternalLink> to stay up-to-date on
                our latest news and updates.
              </p>
            </div>
          </div>
        </LayoutWrapperMain>

        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSingleColumn>
    </StaticPage>
  );
};

export default AboutPage;
