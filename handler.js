'use strict';

const Airtable = require('airtable');
const AWS = require('aws-sdk');

const AIRTABLE_ENDPOINT_URL = 'https://api.airtable.com';
const AIRTABLE_API_KEY = 'keynOng3Atf1bDNX8';
const AIRTABLE_BASE_ID = 'appGFsofy6xpVRK0K';

const getAirtableBase = () => {
  Airtable.configure({
    endpointUrl: AIRTABLE_ENDPOINT_URL,
    apiKey: AIRTABLE_API_KEY,
  });
  const base = Airtable.base(AIRTABLE_BASE_ID);

  return base;
};

const fetchAirtableEntities = async (entityName) => {
  const entities = [];
  const airtableBase = getAirtableBase();

  await airtableBase(entityName)
    .select({
      pageSize: 100,
    })
    .all()
    .then((records) => {
      records.forEach((record) => {
        // normalise the kitchen sink object to { id: xyz, ProductName: abc, etc}
        // strips the rich handling (e.g. .update())
        const { id, fields } = record;
        entities.push({ id, ...fields });
      });
    })
    .catch((error) => {
      throw error;
    });
  console.log(entityName, 'Entities loaded: ', entities.length);
  return entities;
};

module.exports.hello = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Go Serverless v2.0! Your function executed successfully!',
        input: event,
      },
      null,
      2
    ),
  };
};

module.exports.importRedirects = async () => {
  const redirects = await fetchAirtableEntities('Redirects');
  const s3 = new AWS.S3();

  const params = {
      Bucket : 'arn:aws:s3:us-east-2:894773716314:accesspoint/import-redirects',
      Key : 'redirects.json',
      Body : JSON.stringify(redirects)
  }
  
  s3.putObject(params, function(err, redirects) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(redirects);           // successful response
  });
  
  return redirects;
};

