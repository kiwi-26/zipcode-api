const Response = require('../classes/response.js');
const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();

exports.find = async (event) => {
  const table = process.env.TABLE_NAME;
  let zipcode = '';
  if (event.queryStringParameters && event.queryStringParameters.zipcode) {
    zipcode = event.queryStringParameters.zipcode;
  }

  if (zipcode.length != 7) {
    return new Response(400, 'Zipcode should be by 7 chars.');
  }

  try {
    const result = await documentClient.query({
      TableName: table,
      KeyConditionExpression: 'zipcode = :zipcode',
      ExpressionAttributeValues: {
        ':zipcode': zipcode
      }
    }).promise();

    if (result.Items.length == 0) {
      return new Response(404, 'Not found.');
    }

    return new Response(200, result.Items[0]);
  } catch (error) {
    console.error(error);
    return new Response(500, error);
  }
};