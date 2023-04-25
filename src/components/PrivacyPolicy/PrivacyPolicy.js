import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import css from './PrivacyPolicy.module.css';

const PrivacyPolicy = props => {
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);

  // prettier-ignore
  return (
    <div className={classes}>
      <p className={css.lastUpdated}>Last updated: April 11, 2023</p>

      <h2>Welcome to CareVine's Privacy Policy - Your Privacy Matters to Us!</h2>
      <p>
        At CareVine, we care about your privacy and want to provide an engaging and enjoyable
        experience on our website. To make our policy easy to understand, we've outlined our
        commitment to protecting your privacy below:
      </p>

      <ul>
        <li>🔒 We only ask for personal data when we really need it.</li>
        <li>
          🔒 We never share your personal data, except to follow the law, improve our products, or
          protect our rights.
        </li>
        <li>🔒 We store personal data only when needed for our services.</li>
      </ul>

      <p>Now, let's dive deeper into how we handle your data:</p>

      <h2>🌐 Website Visitors:</h2>
      <p>
        When you visit our website, we collect non-personal information (browser type, language,
        referring site, date, and time) to better understand how you interact with our site.
        Occasionally, we might share aggregated, non-personal data, such as trends in website usage.
      </p>
      <p>
        We also collect potentially personal data like IP addresses for logged-in users. We only
        disclose IP addresses and other personal data under certain conditions, such as legal
        requirements or to protect our rights.
      </p>

      <h2>📝 Gathering of Personally-Identifying Information:</h2>
      <p>
        Sometimes, we need to collect personally-identifying information (PII) to provide our
        services. We only collect PII when necessary and do not disclose it, except as described
        below. You can always choose not to provide PII, but it might limit your website activities.
      </p>

      <h2>📊 Aggregated Statistics:</h2>
      <p>
        We may collect and share visitor behavior statistics without disclosing PII to protect your
        privacy.
      </p>

      <h2>🛡️ Protection of Personally-Identifying Information:</h2>
      <p>
        We only share PII with employees, contractors, and affiliated organizations that need the
        information and promise not to disclose it. By using our website, you agree to the transfer
        of PII to parties outside your home country. We won't rent or sell PII and will only
        disclose it for legal reasons or to protect others' rights.
      </p>

      <h2>💌 Communication:</h2>
      <p>
        Registered users may receive occasional emails about new features, feedback requests, or
        updates on CareVine products. We aim to minimize these emails. If you contact us, we might
        publish your message to clarify your request or help other users.
      </p>

      <h2>🔐 Security:</h2>

      <p>
        We take reasonable steps to protect against unauthorized access, use, alteration, or
        destruction of PII.
      </p>

      <h2>🍪 Cookies:</h2>
      <p>
        A cookie is a string of information that a website stores on a visitor’s computer, and that
        the visitor’s browser provides to the website each time the visitor returns. We use cookies
        to identify and track visitors and their preferences. You can refuse cookies, but some
        website features may not work properly. Our policy covers cookies by CareVine, not
        third-party advertisers.
      </p>

      <h2>🚀 Business Transfers:</h2>
      <p>
        If CareVine is acquired or goes bankrupt, your information may be transferred to a third
        party. By using our website, you accept the possibility of such transfers.
      </p>

      <h2>📢 Ads:</h2>
      <p>
        Advertisers may set cookies to gather information about you. Our policy doesn't cover
        third-party advertisers' cookie usage.
      </p>

      <h2>🔧 Privacy Policy Changes:</h2>
      <p>
        We may change our policy from time to time. Please check this page frequently for updates.
        By continuing to use our website, you accept any changes to our policy.
      </p>
      <p>
        Thank you for trusting CareVine with your data. We promise to keep your privacy at the
        forefront of our work.{' '}
      </p>
    </div>
  );
};

PrivacyPolicy.defaultProps = {
  rootClassName: null,
  className: null,
};

const { string } = PropTypes;

PrivacyPolicy.propTypes = {
  rootClassName: string,
  className: string,
};

export default PrivacyPolicy;
