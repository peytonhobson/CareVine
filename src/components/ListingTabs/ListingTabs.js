import React from 'react';
import { CAREGIVER } from '../../util/constants';

import { ButtonTabNavHorizontal } from '..';

import css from './ListingTabs.module.css';

const caregiverTabs = ['Bio', 'Services', 'Availability', 'Experience', 'Additional Details'];
const employerTabs = ['Bio', 'Services', 'Qualifications', 'Safety', 'Recommendations'];

const ListingTabs = props => {
  const { currentUser, listing } = props;

  const userType = currentUser?.attributes?.profile?.publicData?.userType;

  const tabs = userType === CAREGIVER ? caregiverTabs : employerTabs;

  return (
    <ButtonTabNavHorizontal
      tabs={tabs}
      rootClassName={css.nav}
      tabRootClassName={css.tabRoot}
      tabContentClass={css.tabContent}
      tabClassName={css.tab}
    />
  );
};

export default ListingTabs;
