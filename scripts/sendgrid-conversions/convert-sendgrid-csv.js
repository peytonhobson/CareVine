const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname);
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: `${filePath}/out/Oregon_Nursing_Contact_List2.csv`,
  header: [
    { id: 'email', title: 'email' },
    { id: 'firstName', title: 'first_name' },
    { id: 'lastName', title: 'last_name' },
    { id: 'county', title: 'county' },
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
        county: row['County'],
        licenseType: row['License Type'],
      };

      contacts.push(contactOut);
    }
  })
  .on('end', () => {
    console.log(contacts.length);
    csvWriter
      .writeRecords(contacts)
      .then(() => console.log('The CSV file was written successfully'));
    console.log('CSV file successfully processed');
  });
