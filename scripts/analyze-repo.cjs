const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.gemini', '.agent'];
const IGNORE_FILES = ['package-lock.json', 'yarn.lock', '.DS_Store'];

let stats = {
    totalFiles: 0,
    totalLines: 0,
    fileTypes: {},
    issues: {
        todos: 0,
        fixmes: 0,
        notchReferences: 0
    }
};

function scanDir(directory) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
        const fullPath = path.join(directory, file);
        const relativePath = path.relative(ROOT_DIR, fullPath);

        if (IGNORE_FILES.includes(file)) continue;

        let stat;
        try {
            stat = fs.statSync(fullPath);
        } catch (e) {
            continue;
        }

        if (stat.isDirectory()) {
            if (IGNORE_DIRS.includes(file)) continue;
            scanDir(fullPath);
        } else {
            analyzeFile(fullPath, relativePath);
        }
    }
}

function analyzeFile(filePath, relativePath) {
    const ext = path.extname(filePath).toLowerCase();

    // Skip binary or non-text files roughly
    if (['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.mp3', '.wav', '.mp4'].includes(ext)) {
        return;
    }

    stats.totalFiles++;
    stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').length;
        stats.totalLines += lines;

        // Check for issues
        const lowerContent = content.toLowerCase();

        // Count TODOs
        const todoCount = (content.match(/TODO:/g) || []).length;
        stats.issues.todos += todoCount;

        // Count FIXMEs
        const fixmeCount = (content.match(/FIXME:/g) || []).length;
        stats.issues.fixmes += fixmeCount;

        // Check for Notch reference (should be 0 now!)
        // Ignore this script itself to avoid false positive
        if (content.includes('body.iphone-view::before') && !filePath.includes('analyze-repo.cjs')) {
            console.warn(`⚠️  WARNING: Found "Notch" reference in ${relativePath}`);
            stats.issues.notchReferences++;
        }

    } catch (e) {
        // Error reading file, skip
    }
}

console.log('🔍 Starting Repository Analysis...\n');
const startTime = Date.now();

scanDir(ROOT_DIR);

const endTime = Date.now();
const duration = ((endTime - startTime) / 1000).toFixed(2);

console.log('----------------------------------------');
console.log(`📊 Analysis Complete in ${duration}s`);
console.log('----------------------------------------');
console.log(`📂 Total Files Scanned: ${stats.totalFiles}`);
console.log(`📝 Total Lines of Code: ${stats.totalLines.toLocaleString()}`);
console.log('\n📁 File Breakdown:');
Object.entries(stats.fileTypes)
    .sort(([, a], [, b]) => b - a)
    .forEach(([ext, count]) => {
        if (ext) console.log(`   ${ext.padEnd(8)} : ${count}`);
    });

console.log('\nbeep Integrity Check:');
console.log(`   TODOs Found       : ${stats.issues.todos}`);
console.log(`   FIXMEs Found      : ${stats.issues.fixmes}`);
if (stats.issues.notchReferences === 0) {
    console.log(`   Notch References  : ✅ 0 (Clean)`);
} else {
    console.log(`   Notch References  : ❌ ${stats.issues.notchReferences} (Not clean!)`);
}

console.log('----------------------------------------');
