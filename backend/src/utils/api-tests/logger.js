export function logPass(message) {
    console.log(`PASS: ${message}`);
}

export function logFail(message, extra = '') {
    console.error(`FAIL: ${message}`);
    if (extra) console.error(extra);
}

export function logInfo(message) {
    console.log(`INFO: ${message}`);
}
