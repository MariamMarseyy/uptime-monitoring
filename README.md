# Uptime Monitoring
## Description
This is a Node.js script to monitor the uptime of a list of websites.

The application logs the status of the websites to the console and sends an alert to the console when a website is down.

## Installation

Before running the application, ensure you have Node.js and npm (Node Package Manager) installed on your system.

1. Clone this repository to your local machine: 
 ```bash
   git clone https://github.com/MariamMarseyy/uptime-monitoring.git
```
2. Change directory to the root of the project:
 ```bash
   cd uptime-monitoring
```
3. Install the required dependencies:
 ```bash
   npm install
```
4. Run the application:
 ```bash
   node monitor.js
```

## Usage
The application reads the list of websites to monitor from the `config.json` file. 
The `config.json` file contains`
- An array of urls, representing websites to monitor. `urls`
- Monitoring interval in seconds. `interval`
- The number of times to retry a failed request before sending an alert. `threshold`

### Additional Case
If you set `interval` less than the main function execution time, the next cycle will work when the main function is done.

We can use the following code with nested `setTimeout` instead of `setInterval`

If we want to wait for the `main` function to complete before starting the next one

because `setInterval` will start the next function even if the previous one is still running.

```javascript
setTimeout(function nestedFunction() {
   main();
   setTimeout(nestedFunction, interval);
}, interval);
```
