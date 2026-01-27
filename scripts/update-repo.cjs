const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const PACKAGE_JSON_PATH = path.join(__dirname, '../package.json');
const CHANGELOG_PATH = path.join(__dirname, '../changelog.html');

// Helper to ask questions
const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

// Helper to get Icon based on type
const getIcon = (type) => {
    switch (type.toLowerCase()) {
        case 'fix':
            return `<svg class="icon fix-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>`;
        case 'feature':
            return `<svg class="icon feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>`;
        case 'improvement':
            return `<svg class="icon design-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.156 6.388a15.995 15.995 0 00-4.648 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>`;
        default:
            return `<svg class="icon tech-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.27.96-.12 1.45l-.774.773a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`;
    }
};

const main = async () => {
    try {
        // 1. Read Package Version
        const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
        const currentVersion = pkg.version;
        console.log(`\n🔹 Current Version in package.json: ${currentVersion}\n`);

        // 2. Prompt User
        console.log('📝 Enter Change Details:');
        const type = await ask('Type (fix/feature/improvement/tech): ');
        const svTitle = await ask('Swedish Title (e.g., "Ny Design"): ');
        const arTitle = await ask('Arabic Title (e.g., "تصميم جديد"): ');
        const svDesc = await ask('Swedish Description: ');
        const arDesc = await ask('Arabic Description: ');

        // Confirmation
        console.log('\n--- Review ---');
        console.log(`Type: ${type}`);
        console.log(`Title: ${svTitle} / ${arTitle}`);
        console.log(`Desc: ${svDesc} / ${arDesc}`);
        const confirm = await ask('\nProceed? (y/n): ');

        if (confirm.toLowerCase() !== 'y') {
            console.log('❌ Aborted.');
            rl.close();
            return;
        }

        // 3. Update Changelog
        let changelogContent = fs.readFileSync(CHANGELOG_PATH, 'utf8');

        // New list item HTML
        const newItemHtml = `
                    <li>
                        <span class="change-type ${type.toLowerCase()}">${getIcon(type)}</span>
                        <span>
                            <strong class="sv-text">${svTitle}:</strong>
                            <strong class="ar-text">${arTitle}:</strong>
                            <span class="sv-text">${svDesc}</span>
                            <span class="ar-text">${arDesc}</span>
                        </span>
                    </li>`;

        // Check if current version exists in changelog
        const versionHeaderRegex = new RegExp(`<div class="version-badge">v${currentVersion}</div>`);
        const timelineVersionRegex = new RegExp(`<div class="timeline-version">v${currentVersion}</div>`);

        if (timelineVersionRegex.test(changelogContent)) {
            // Version exists in timeline, append to its list
            // We look for the <ul class="change-list"> immediately following the version div
            // This is a bit tricky with simple string replacement, but since the structure is consistent:
            // Find: <div class="timeline-version">v${currentVersion}</div> ... <ul class="change-list">
            // Replace with: ... <ul class="change-list"> \n ${newItemHtml}

            // A safer regex approach to find the insertion point (start of the list)
            const specificVersionBlockRegex = new RegExp(`(<div class="timeline-version">v${currentVersion}</div>[\\s\\S]*?<ul class="change-list">)`);

            if (specificVersionBlockRegex.test(changelogContent)) {
                changelogContent = changelogContent.replace(specificVersionBlockRegex, `$1${newItemHtml}`);
                console.log(`\n✅ Added item to existing v${currentVersion} section.`);
            } else {
                console.error("⚠️  Could not find list for current version. Please check changelog.html structure.");
                rl.close();
                return;
            }

        } else {
            // Version doesn't exist, create new block
            // Use today's date
            const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

            const newBlockHtml = `
            <!-- Version ${currentVersion} -->
            <div class="timeline-item">
                <span class="timeline-date">${date}</span>
                <div class="timeline-version">v${currentVersion}</div>
                <div class="timeline-title">
                    <svg class="icon feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span class="sv-text">${svTitle}</span>
                    <span class="ar-text">${arTitle}</span>
                </div>
                <ul class="change-list">${newItemHtml}
                </ul>
            </div>`;

            // Insert after <div class="timeline">
            changelogContent = changelogContent.replace('<div class="timeline">', `<div class="timeline">\n${newBlockHtml}`);

            // Also update the hero version badge
            changelogContent = changelogContent.replace(/<div class="version-badge">v.*?<\/div>/, `<div class="version-badge">v${currentVersion}</div>`);

            console.log(`\n✅ Created new v${currentVersion} section.`);
        }

        fs.writeFileSync(CHANGELOG_PATH, changelogContent);
        console.log('📄 changelog.html updated.');

        // 4. Git Operations
        console.log('\n🚀 Executing Git commands...');

        try {
            console.log(' > git add .');
            execSync('git add .', { stdio: 'inherit' });

            const commitMsg = `update: ${svTitle} (${type}) - ${svDesc}`;
            console.log(` > git commit -m "${commitMsg}"`);
            execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });

            console.log(' > git push');
            execSync('git push', { stdio: 'inherit' });

            console.log('\n🎉  Done! Changes pushed successfully.');

        } catch (err) {
            console.error('\n❌ Git command failed:', err.message);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        rl.close();
    }
};

main();
