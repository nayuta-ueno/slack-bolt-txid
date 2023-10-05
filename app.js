const { App } = require('@slack/bolt');
const { default: BigNumber } = require('bignumber.js');
const fetch = require('node-fetch');
require('dotenv').config()

const PORT = 3000;
const LOCALE = 'ja-JP';
const {SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET} = process.env;

if (!SLACK_BOT_TOKEN || !SLACK_SIGNING_SECRET) {
    console.log('FAIL: need environment variables: `SLACK_BOT_TOKEN` and `SLACK_SIGNING_SECRET`.');
    return
}

const app = new App({
  token: SLACK_BOT_TOKEN,
  signingSecret: SLACK_SIGNING_SECRET,
});

const mempoolApiTxUrl = txid => `https://mempool.space/api/tx/${txid}`;
const mempoolTxUrl = txid => `https://mempool.space/ja/tx/${txid}`;
const mempoolAddrUrl = addr => `https://mempool.space/address/${addr}`;
const getApiTxUrl = mempoolApiTxUrl;
const getTxUrl = mempoolTxUrl;
const getAddrUrl = mempoolAddrUrl;

app.message(/[0-9a-fA-F]{64}/, async ({ message, say }) => {
  const txid = message.text.match(/[0-9a-fA-F]{64}/);
  const response = await fetch(getApiTxUrl(txid));
  const jsondata = await response.json();
  const blockTime = new Date(jsondata.status.block_time * 1000);
  let result;
  result = `<${getTxUrl(txid)}|${txid}>\n`;
  result += `Date: \`${blockTime.toLocaleDateString(LOCALE)} ${blockTime.toLocaleTimeString(LOCALE)}\`\n`;
  result += `Fee: \`${BigNumber(jsondata.fee).toFormat()}\` sats\n`;
  result += `Is confirmed: \`${jsondata.status.confirmed}\`\n`;
  // vin
  result += '\nvin:\n';
  jsondata.vin.forEach(element => {
      if (element.prevout.scriptpubkey_address) {
          const addr = element.prevout.scriptpubkey_address;
          const value = element.prevout.value;
          // result += `<${getAddrUrl(addr)}|${addr}> \`${BigNumber(value).toFormat()}\` sats\n`;
          result += `${value},${addr}\n`;
      }
  });
  // vout
  result += '\nvout:\n';
  jsondata.vout.forEach(element => {
      if (element.scriptpubkey_address) {
          const addr = element.scriptpubkey_address;
          const value = element.value;
          // result += `<${getAddrUrl(addr)}|${addr}> \`${BigNumber(value).toFormat()}\` sats\n`;
          result += `${value},${addr}\n`;
      }
  });

  await say(`${result}`);
});

(async () => {
  await app.start(PORT);
})();
