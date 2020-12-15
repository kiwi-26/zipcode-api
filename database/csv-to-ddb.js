const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient({ region: 'ap-northeast-1' });
const TABLE_NAME = process.argv[2];
const fs = require('fs').promises;

(async () => {
    const buff = await fs.readFile('x-ken-all.csv', 'utf-8');

    const rawdata = buff.split("\n").map((row) => {
        const items = row.split(',').map((item) => { return item.replace(/"/g, '') });
        if (items.length < 8) {
            return null;
        }

        return {
            prefix: items[2].substring(0, 3),
            zipcode: items[2],
            jiscode: items[0],
            pref: items[6],
            city: items[7],
            town: items[8].length > 0 ? items[8] : '-'
        };
    }).filter(v => v);

    let zipcodes = [];
    let zipcodeFlags = {};
    for (const row of rawdata) {
        if (`${row.zipcode}_${row.town}` in zipcodeFlags) {
            continue;
        }

        zipcodes.push(row);
        zipcodeFlags[`${row.zipcode}_${row.town}`] = true;
    }

    let index = 0;
    while (index < zipcodes.length) {
        let sliced = zipcodes.slice(index, index + 25);
        index += 25;

        let params = {RequestItems: {}};
        params.RequestItems[TABLE_NAME] = sliced.map((item) => {
            return { PutRequest: { Item: item }}
        });
        try {
            await documentClient.batchWrite(params).promise();
            console.log(`processed: until line ${index}`);
        } catch (e) {
            console.error(e);
            console.error(sliced);
        }
    }
})();