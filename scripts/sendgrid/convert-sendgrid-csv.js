const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname);
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: `${filePath}/out/Oregon_CNA_Contact_List.csv`,
  header: [
    { id: 'email', title: 'email' },
    { id: 'firstName', title: 'first_name' },
    { id: 'lastName', title: 'last_name' },
    { id: 'licenseType', title: 'license_type' },
    { id: 'county', title: 'county' },
  ],
});

let contacts = [];

fs.createReadStream(`${filePath}/out/Oregon_Nursing_Contact_List_Remaining.csv`)
  .pipe(csv())
  .on('data', row => {
    if (row['license_type'] === 'CNA' && !contacts.find(c => c.email === row['email'])) {
      const contactOut = {
        email: row['email'],
        firstName: row.first_name,
        lastName: row.last_name,
        licenseType: row.license_type,
        county: row.county,
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
