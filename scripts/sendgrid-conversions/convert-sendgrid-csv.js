const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname);
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: `${filePath}/out/Oregon_Nursing_Contact_List.csv`,
  header: [
    { id: 'email', title: 'email' },
    { id: 'firstName', title: 'first_name' },
    { id: 'lastName', title: 'last_name' },
    { id: 'addressLine1', title: 'address_line_1' },
    { id: 'addressLine2', title: 'address_line_2' },
    { id: 'city', title: 'city' },
    { id: 'state', title: 'state_province_region' },
    { id: 'postalCode', title: 'postal_code' },
    { id: 'licenseType', title: 'license_type' },
  ],
});

let contacts = [];

fs.createReadStream(`${filePath}/in/Oregon_Nursing_Mailing_List.csv`)
  .pipe(csv())
  .on('data', row => {
    if (row['Email Address'] !== 'N/A') {
      const contactOut = {
        email: row['Email Address'],
        firstName: row['First Name'],
        lastName: row['Last Name'],
        addressLine1: row['Address 1'],
        addressLine2: row['Address 2'],
        city: row['City'],
        state: row['State'],
        postalCode: row['Postal Code'],
        licenseType: row['License Type'],
      };

      contacts.push(contactOut);
    }
  })
  .on('end', () => {
    csvWriter
      .writeRecords(contacts)
      .then(() => console.log('The CSV file was written successfully'));
    console.log('CSV file successfully processed');
  });
