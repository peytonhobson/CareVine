import React, { useState, useRef } from 'react';
import { CAREGIVER } from '../../util/constants';
import { BookingPanel } from '..';
import config from '../../config';

import { ButtonTabNavHorizontal } from '..';
import {
  AdditionalInfoSection,
  AvailabilitySection,
  BioSection,
  CertificationsSection,
  SectionCard,
  ServicesSection,
} from './Sections';

import css from './ListingTabs.module.css';
import { findOptionsForSelectFilter } from '../../util/search';

const caregiverTabs = [
  'Availability',
  'Bio',
  'Services',
  'Certifications/Training',
  'Additional Info',
];
const employerTabs = [
  'Job Description',
  'Care Schedule',
  'Care Recipients',
  'Caregiver Preferences',
];

const findLabel = (key, options) => {
  const found = options.find(option => option.key === key);
  return found ? found.label : null;
};

const getTabs = (listingType, onClick, selected) => {
  const tabText = listingType === CAREGIVER ? caregiverTabs : employerTabs;

  return tabText.map(tab => {
    return {
      text: tab,
      selected: selected === tab,
      onClick: () => onClick(tab),
    };
  });
};

const ListingTabs = props => {
  const { listing, onManageDisableScrolling, currentUserListing } = props;

  const [selectedTab, setSelectedTab] = useState('Availability');
  const availabilityRef = useRef(null);
  const bioRef = useRef(null);
  const servicesRef = useRef(null);
  const certificationsAndTrainingRef = useRef(null);
  const additionalInfoRef = useRef(null);

  const { publicData } = listing.attributes;
  const { availabilityPlan } = publicData;

  const listingType = listing?.attributes?.metadata?.listingType;
  const onClick = tab => {
    switch (tab) {
      case 'Availability':
        availabilityRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      case 'Bio':
        bioRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      case 'Services':
        servicesRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      case 'Certifications/Training':
        certificationsAndTrainingRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        break;
      case 'Additional Info':
        additionalInfoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      default:
        break;
    }
    setSelectedTab(tab);
  };

  const tabs = getTabs(listingType, onClick, selectedTab);

  const entries = availabilityPlan?.entries;

  const renderSection = section => {
    switch (section) {
      case 'Availability':
        return <AvailabilitySection entries={entries} ref={availabilityRef} />;
      case 'Bio':
        return <BioSection listing={listing} ref={bioRef} />;
      case 'Services':
        return (
          <ServicesSection
            listing={listing}
            currentUserListing={currentUserListing}
            filterConfig={config.custom.filters}
            findLabel={findLabel}
            ref={servicesRef}
          />
        );
      case 'Certifications/Training':
        return (
          <CertificationsSection
            listing={listing}
            currentUserListing={currentUserListing}
            filterConfig={config.custom.filters}
            findLabel={findLabel}
            ref={certificationsAndTrainingRef}
          />
        );
      case 'Additional Info':
        return (
          <AdditionalInfoSection
            listing={listing}
            currentUserListing={currentUserListing}
            filterConfig={config.custom.filters}
            findLabel={findLabel}
            ref={additionalInfoRef}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <ButtonTabNavHorizontal
        tabs={tabs}
        rootClassName={css.nav}
        tabRootClassName={css.tabRoot}
        tabContentClass={css.tabContent}
        tabClassName={css.tab}
      />
      {tabs.map(tab => {
        return renderSection(tab.text);
      })}
    </>
  );
};

export default ListingTabs;
