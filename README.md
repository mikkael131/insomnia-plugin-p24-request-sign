# insomnia-plugin-p24-request-sign
Insomnia plugin for injecting a signature into the request body of requests to p24 (przelewy24.pl)

# How to use
1. install the plugin `insomnia-plugin-p24-request-sign` in insomnia
2. add the environment variable `p24_crc_key` with your crc key received from p24
3. use the plugin to inject which signature properties to take from the request for the `sign` property, e.g.
    - register transaction:
        ```
        {
            "sign": "{% injectp24signature 'sessionId,merchantId,amount,currency,crc' %}"
        }
        ```
    - verify transaction:
        ```
        {
            "sign": "{% injectp24signature 'sessionId,orderId,amount,currency,crc' %}"
        }
        ```
4. enjoy automated request signing upon sending the request