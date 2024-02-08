const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const axios = require('axios');
const fs = require('fs');

// read the configuration from the config.json file
const config = JSON.parse(fs.readFileSync('config.json'));
config.urls = config.urls ?? [];

const monitoringInterval = config.interval * 1000 || 5 * 60 * 1000; // Default: 300000ms (5 minute)
const retryThreshold = config.threshold || 5; // Default: 5
const RETRY_INTERVAL = 5000; // Default: 5000ms (5 seconds)

const consecutiveFailures = {};
const COLORS = {
    RESET: '\x1b[0m',
    RED: '\x1b[31m',
    GREEN: '\x1b[32m'
};
const sendHttpRequest = (url) => axios.get(url)
    .then((response) => {
        return { url, status: response.status };
    })
    .catch((error) => {
        if (!error.response) {
            return { url, status: error.code, error: 'Could not send request' };
        }
        else {
            return { url, status: error.response.status, error: error.message };
        }
    });

const handleFailure = (url, status) => {
    // Increment the number of consecutive failures for the website
    consecutiveFailures[url] = (consecutiveFailures[url] || 0) + 1;
    // Log the failure, including the status code if available
    console.error(`${COLORS.RED}${new Date().toString()} - [ Failure ] ${consecutiveFailures[url]} for ${url} - Status code: ${status}${COLORS.RESET}`);

    // If the number of consecutive failures is greater than or equal to the threshold, alert the user
    if (consecutiveFailures[url] >= retryThreshold) {
        console.error(`${COLORS.RED}${new Date().toString()} - [ ALERT ] ${url} is down!${COLORS.RESET}`);
    } else {
        // console.log(`Retrying ${url} in ${RETRY_INTERVAL / 1000} seconds...`); // Uncomment to see the retry message
        setTimeout(() => {
            sendHttpRequest(url)
                .then((response) => {
                    if (response.error) {
                        handleFailure(url, response.status);
                    } else {
                        parentPort.postMessage(response);
                    }
                });
        }, RETRY_INTERVAL);
    }
}

const main = () => {
    console.time('monitor');

    for (const url of config.urls) {
        const worker = new Worker(__filename, {
            workerData: { url, threshold: config.threshold }
        });

        worker.on('message', (message) => {
            console.log(`${COLORS.GREEN}${new Date().toString()} - [ Success ] ${message.url} - Status Code: ${message.status}${COLORS.RESET}`);
        });
        worker.on('error', (error) => {
            console.error(`Worker error: ${error}`);
        });
    }

    console.timeEnd('monitor');
}

// Main thread logic
if (isMainThread) {
    main();
    setInterval(() => {
        main();
    }, monitoringInterval);
}
// Worker thread logic
else {
    sendHttpRequest(workerData.url)
        .then((response) => {
            if (response && response.error) {
                handleFailure(workerData.url, response.status);
            } else if (response) {
                parentPort.postMessage(response);
            }
        });
}