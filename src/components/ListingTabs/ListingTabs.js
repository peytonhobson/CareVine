import React, { useState, useRef } from 'react';
import { CAREGIVER } from '../../util/constants';
import { BookingPanel } from '..';
import config from '../../config';

import { ButtonTabNavHorizontal } from '..';
import {
  AdditionalInfoSection,
  AvailabilitySection,
  BioSection,
  CaregiverPreferencesSection,
  CareRecipientsSection,
  CareScheduleSection,
  CertificationsSection,
  JobDescriptionSection,
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
  'Care Recipients(s)',
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

  const listingType = listing?.attributes?.metadata?.listingType;

  const [selectedTab, setSelectedTab] = useState(
    listingType === CAREGIVER ? 'Availability' : 'Job Description'
  );
  const availabilityRef = useRef(null);
  const bioRef = useRef(null);
  const servicesRef = useRef(null);
  const certificationsAndTrainingRef = useRef(null);
  const additionalInfoRef = useRef(null);
  const jobDescriptionRef = useRef(null);
  const careScheduleRef = useRef(null);
  const careRecipientsRef = useRef(null);
  const caregiverPreferencesRef = useRef(null);

  const { publicData } = listing.attributes;
  const { availabilityPlan } = publicData;

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
        break;
      case 'Job Description':
        jobDescriptionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      case 'Care Schedule':
        careScheduleRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      case 'Care Recipients(s)':
        careRecipientsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      case 'Caregiver Preferences':
        caregiverPreferencesRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      default:
        break;
    }
    setSelectedTab(tab);
  };

  const tabs = getTabs(listingType, onClick, selectedTab);

  const entries = availabilityPlan?.entries;

  const renderSection = (section, key) => {
    switch (section) {
      case 'Availability':
        return <AvailabilitySection key={key} entries={entries} ref={availabilityRef} />;
      case 'Bio':
        return <BioSection key={key} listing={listing} ref={bioRef} />;
      case 'Services':
        return (
          <ServicesSection
            key={key}
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
            key={key}
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
            key={key}
            listing={listing}
            currentUserListing={currentUserListing}
            filterConfig={config.custom.filters}
            findLabel={findLabel}
            ref={additionalInfoRef}
          />
        );
      case 'Job Description':
        return (
          <JobDescriptionSection
            listing={listing}
            key={key}
            ref={jobDescriptionRef}
            currentUserListing={currentUserListing}
            findLabel={findLabel}
            filterConfig={config.custom.filters}
          />
        );
      case 'Care Schedule':
        return (
          <CareScheduleSection
            key={key}
            availabilityPlan={availabilityPlan}
            filterConfig={config.custom.filters}
            ref={careScheduleRef}
          />
        );
      case 'Care Recipients(s)':
        return (
          <CareRecipientsSection
            key={key}
            listing={listing}
            currentUserListing={currentUserListing}
            filterConfig={config.custom.filters}
            findLabel={findLabel}
            ref={careRecipientsRef}
          />
        );
      case 'Caregiver Preferences':
        return (
          <CaregiverPreferencesSection
            key={key}
            listing={listing}
            currentUserListing={currentUserListing}
            filterConfig={config.custom.filters}
            findLabel={findLabel}
            ref={caregiverPreferencesRef}
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
      {tabs.map((tab, index) => {
        return renderSection(tab.text, index);
      })}
    </>
  );
};

export default ListingTabs;
