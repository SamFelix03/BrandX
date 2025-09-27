import { makeApp } from './server';
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { ethers } from 'ethers';
import { ContractDatabase } from './contract-db';
import * as dotenv from 'dotenv';

// Load environment variables from the correct path
dotenv.config({ path: __dirname + '/../.env' });

// Export contract database for standalone builds
export { ContractDatabase } from './contract-db';
const program = new Command();
program
  .requiredOption(
    '-k --private-key <key>',
    'Private key to sign responses with. Prefix with @ to read from a file'
  )
  .option('-t --ttl <number>', 'TTL for signatures', '300')
  .option('-p --port <number>', 'Port number to serve on', process.env.PORT || '8080');
program.parse(process.argv);
const options = program.opts();
let privateKey = options.privateKey;
if (privateKey.startsWith('@')) {
  privateKey = ethers.utils.arrayify(
    readFileSync(privateKey.slice(1), { encoding: 'utf-8' })
  );
}
const address = ethers.utils.computeAddress(privateKey);
const signer = new ethers.utils.SigningKey(privateKey);
const db = new ContractDatabase();
const app = makeApp(signer, '/', db);
console.log(`🚀 ENS Gateway Server with Contract + Supabase`);
console.log(`🔐 Signer address: ${address}`);
console.log(`🎯 Serving on port ${options.port}`);
app.listen(parseInt(options.port));

module.exports = app;
