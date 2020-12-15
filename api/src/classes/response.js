/**
 * Response クラス
 */

const corsHeaders = {
    "Access-Control-Allow-Headers" : "Content-Type, X-Api-Key",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,GET"
};

module.exports = class Response {
    constructor(statusCode, body, headers = corsHeaders) {
        this.statusCode = statusCode;
        if (typeof body == "String") {
            this.body = body;
        } else {
            this.body = JSON.stringify(body);
        }
        this.headers = headers;
    }

    get object() {
        return {
            statusCode: this.statusCode,
            body: this.body,
            headers: this.headers
        }
    }
}