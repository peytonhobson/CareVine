import React from 'react';

import { ContactSectionForm } from '../../forms';
import classNames from 'classnames';

import css from './EmployersInfoPage.module.css';

const ContactSection = props => {
  const { className, rootClassName, title } = props;

  const classes = classNames(rootClassName || css.contactSectionRoot, className);

  return (
    <section className={classes}>
      {title}
      <ContactSectionForm onSubmit={() => {}} className={css.contactSectionForm} />
    </section>
  );
};

export default ContactSection;
