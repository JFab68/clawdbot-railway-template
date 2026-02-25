const fs = require('fs');
const https = require('https');
const { spawn } = require('child_process');
const path = require('path');

const configPath = '/data/.clawdbot/openclaw.json';
const skillDir = '/data/workspace-email-ops/skills/email-triage';
const skillPath = path.join(skillDir, 'SKILL.md');

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

async function start() {
    let needsFix = false;
    try {
        if (fs.existsSync(configPath)) {
            const stats = fs.statSync(configPath);
            if (stats.size === 0) {
                console.log('[BOOTSTRAP] config is 0 bytes. Needs fix.');
                needsFix = true;
            } else {
                const content = fs.readFileSync(configPath, 'utf8');
                if (content.trim() === '') {
                    needsFix = true;
                } else {
                    console.log('[BOOTSTRAP] config found and has content.');
                }
            }
        } else {
            needsFix = true;
        }
    } catch (err) {
        needsFix = true;
    }

    // Forcefully overwrite everything to ensure it's correct from our recent remote push
    console.log('[BOOTSTRAP] Downloading pristine config from GitHub to /data volume...');
    await downloadFile('https://raw.githubusercontent.com/JFab68/clawdbot-railway-template/main/openclaw_remote.json', configPath);
    console.log('[BOOTSTRAP] Downloaded openclaw.json');

    console.log('[BOOTSTRAP] Downloading updated email-triage skill to /data volume...');
    await downloadFile('https://raw.githubusercontent.com/JFab68/clawdbot-railway-template/main/email-triage-skill.md', skillPath);
    console.log('[BOOTSTRAP] Downloaded SKILL.md');

    // Write Gog credentials if provided in env vars
    const gogConfigDir = '/root/.config/gogcli';
    if (process.env.GOG_CREDENTIALS || process.env.GOG_AUTH_TOKEN) {
        fs.mkdirSync(gogConfigDir, { recursive: true });
        if (process.env.GOG_CREDENTIALS) {
            fs.writeFileSync(path.join(gogConfigDir, 'credentials.json'), process.env.GOG_CREDENTIALS);
            console.log('[BOOTSTRAP] Wrote GOG_CREDENTIALS to disk.');
        }
        if (process.env.GOG_AUTH_TOKEN) {
            fs.writeFileSync(path.join(gogConfigDir, 'token.json'), process.env.GOG_AUTH_TOKEN);
            console.log('[BOOTSTRAP] Wrote GOG_AUTH_TOKEN to disk.');
        }
    }

    // Launch main server
    console.log('[BOOTSTRAP] Handing over execution to OpenClaw...');
    const child = spawn(process.execPath, ['src/server.js'], { stdio: 'inherit', env: process.env });
    child.on('exit', (code) => process.exit(code || 0));
}

start();
