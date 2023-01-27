const crypto = require('crypto');

const p24Urls = [
    'https://sandbox.przelewy24.pl',
    'https://secure.przelewy24.pl'
];

function encode(content, algorithm, encoding) {
    const hash = crypto.createHash(algorithm);
    hash.update(content, 'utf8');
    return hash.digest(encoding);
}

module.exports.templateTags = [{
    name: 'injectp24signature',
    displayName: 'Inject Request Signature for p24',
    description: 'create an injection for the p24 sign',
    args: [
        {
            displayName: 'Signature properties',
            type: 'string',
            placeholder: 'Comma separated ordered list of signature properties, e.g. sessionId,merchantId,amount,currency,crc'
        },
    ],
    async run(context, signatureProperties) {
        return signatureProperties;
    }
}];

// A request hook will be run before sending the request to API, but after everything else is finalized
module.exports.requestHooks = [
    (context) => {
        // Validate context
        if (context === null || context === undefined) {
            console.log('[p24 signature] invalid context');
            return;
        }
        // Validate request
        if (!context.hasOwnProperty('request') ||
            context['request'] === null ||
            context['request'] === undefined ||
            context['request'].constructor.name !== 'Object') {
            console.log('[p24 signature] invalid request');
            return;
        }
        const req = context.request;
        // Validate URL
        if (!req.hasOwnProperty('getUrl') ||
            req['getUrl'] == null ||
            req['getUrl'].constructor.name !== 'Function' ||
            !p24Urls.some((url) => req.getUrl().startsWith(url))) {
            console.log('[p24 signature] request is not a p24 request, skipping');
            return;
        }

        console.log('[p24 signature] attempting to sign request');

        if (req.getBody().mimeType !== 'application/json') {
            console.log('[p24 signature] request has no json body, skipping');
            return;
        }

        const crcKey = req.getEnvironmentVariable('p24_crc_key');
        if (crcKey === null || crcKey === undefined) {
            throw new Error('could not find environment variable "p24_crc_key"');
        }

        const body = req.getBody()
        const jsonBody = JSON.parse(body.text)
        if (jsonBody['sign'] === null || jsonBody['sign'] === undefined) {
            throw new Error('could not find "sign" property in request body');
        }

        const signatureProperties = jsonBody['sign'].split(",")
        const signature = signatureProperties.reduce(function (red, key) {
            if (key === 'crc') {
                red[key] = crcKey;
            } else if (key in jsonBody) {
                red[key] = jsonBody[key];
            }
            return red;
        }, {});
        console.log("[p24 signature] retrieved signature properties:", signature)

        const encoded = encode(JSON.stringify(signature), 'sha384', 'hex')

        jsonBody['sign'] = encoded
        body.text = JSON.stringify(jsonBody)
        req.setBody(body)

        console.log("[p24 signature] signed request with signature:", encoded)
    }
];
