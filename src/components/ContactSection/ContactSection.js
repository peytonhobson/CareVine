import React, { useState } from 'react';

import { ContactSectionForm } from '../../forms';
import classNames from 'classnames';
import { sendgridStandardEmail } from '../../util/api';

import css from './ContactSection.module.css';

const ContactSection = props => {
  const { className, rootClassName, title } = props;

  const [sendContactEmailInProgress, setSendContactEmailInProgress] = useState(false);
  const [sendContactEmailError, setSendContactEmailError] = useState(false);
  const [sendContactEmailSuccess, setSendContactEmailSuccess] = useState(false);

  const classes = classNames(rootClassName || css.root, className);

  const handleSubmit = async values => {
    setSendContactEmailInProgress(true);

    const { name, email, message } = values;

    try {
      await sendgridStandardEmail({
        fromEmail: 'admin-notification@carevine-mail.us',
        receiverEmail: 'peyton.hobson@carevine.us',
        subject: 'User "Contact Us" Submission',
        html: `User Name: ${name} <br><br> User Email: ${email} <br><br> Message: ${message}`,
      });
      setSendContactEmailInProgress(false);
      setSendContactEmailSuccess(true);
    } catch (e) {
      setSendContactEmailError(true);
      setSendContactEmailInProgress(false);
    }
  };

  return (
    <section className={classes}>
      {title}
      <ContactSectionForm
        onSubmit={handleSubmit}
        className={css.form}
        onChange={() => setSendContactEmailError(false)}
        sendContactEmailInProgress={sendContactEmailInProgress}
        sendContactEmailError={sendContactEmailError}
        sendContactEmailSuccess={sendContactEmailSuccess}
      />
    </section>
  );
};

export default ContactSection;
