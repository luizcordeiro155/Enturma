const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const output = path.join(__dirname, 'EnturmaSetupUX.exe');
const source = path.join(__dirname, 'SetupUX.cs');
for (const mode of ['install', 'update', 'uninstall']) {
  if (!fs.existsSync(path.join(__dirname, '../assets/motion', mode + '.gif'))) throw Error('Render native motion assets first: ' + mode);
}
const windows = process.platform === 'win32';
const compiler = windows ? path.join(process.env.WINDIR || 'C:\\Windows', 'Microsoft.NET/Framework64/v4.0.30319/csc.exe') : 'mcs';
const result = spawnSync(compiler, [windows ? '/nologo' : '-nologo', windows ? '/target:winexe' : '-target:winexe', (windows ? '/out:' : '-out:') + output, (windows ? '/r:' : '-r:') + 'System.Windows.Forms.dll', (windows ? '/r:' : '-r:') + 'System.Drawing.dll', source], { stdio: 'inherit', windowsHide: true });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
console.log('Native installer UI compiled; file operations remain in NSIS.');
