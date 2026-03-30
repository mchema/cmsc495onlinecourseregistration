import { spawn } from 'node:child_process';

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForServer(baseUrl, timeoutMs) {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
        try {
            const res = await fetch(`${baseUrl}/api/health`);
            if (res.ok) {
                return true;
            }
        } catch {
            // ignore while waiting
        }

        await sleep(250);
    }

    return false;
}

export function startServer(serverEntry) {
    const child = spawn('node', [serverEntry], {
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout.setEncoding('utf-8');
    child.stderr.setEncoding('utf-8');

    child.stdout.on('data', (data) => {
        process.stdout.write(`[server] ${data}`);
    });

    child.stderr.on('data', (data) => {
        process.stderr.write(`[server:err] ${data}`);
    });

    return child;
}

export async function stopServer(child) {
    if (!child) return;

    child.kill('SIGINT');
    await sleep(500);
}
