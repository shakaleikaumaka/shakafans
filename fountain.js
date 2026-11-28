/* ── fountain.js · THE UNIVERSE FOUNTAIN of blessings · v0.1.0 (28 Nov 2026) ─────────────────────────────────────────────
 * WHY: Shaka, 28 Nov 2026 14:45 BKK — "it needs to be more easy and intuitive for people to connect their wallet, give me a
 * gift on any chain, and stripe, donation flow to me not with a small magnet but a universe fountain of blessings".
 * The small magnet (#cmag 🧲, 54 px) and the little 🌊 card were four doors in one corner. This is ONE big, calm sheet:
 *
 *   1 · pick HOW      💳 card · Apple Pay · Google Pay (Stripe)   🔌 wallet on any of the chains below   🌍 from an exchange / another chain
 *   2 · pick the amount and the chain (Base is gas-free; every other chain is a plain USDC transfer from the visitor's own wallet)
 *   3 · the wallet signs — the page never sees a key; the gift can only ever go to PAYTO (pinned here AND in the kill-switch file)
 *   4 · 🌊 mahalo — a burst of blessings and a link to the receipt
 *
 * LAWS it keeps: nothing third-party loads until a tap (Stripe / Jumper / the wallet app are plain links the visitor taps; the
 * wallet picker OWH, its QR library and the passkey hook are fetched only when "Wallet" is opened) · no storage, no cookies, no
 * tracking, no analytics · network data never becomes markup (textContent only; tx hashes pass a 64-hex test) · NO COVERED TEXT
 * (this is a sheet the visitor ASKED for; every entry button stays tiny and carries its ✕) · one ✕ / Esc / tap outside closes ·
 * machines say they are machines · Lane A/B words stay honest · ʻŌlelo-friendly (plain DOM text, no text in canvas).
 * Kill switch: https://frames.opensourceorchestra.org/fountain-config.json {enabled, disabledChains[], message} — fail closed for
 * crypto sends, never for card links; the payee address is NOT configurable.
 * Built by Open Source Orchestra: Shaka Lei Kaumaka & the AI ʻohana (https://opensourceorchestra.org)
 * SPDX-License-Identifier: GPL-3.0-or-later */
(function (W) {
  'use strict';
  var D = W.document;
  if (W.OSOFountain && W.OSOFountain.version) return;                       // idempotent: the first copy on a page wins
  var VERSION = '0.1.0';

  /* ═══ 1 · FACTS (pinned; the only place money addresses live) ═══════════════════════════════════════════════════════ */
  var PAYTO = '0x25965899f4600b3AA5362ee4f34be95E5E62c934';                 // osoartist.eth — the ONE address (Shaka's law 23 Nov 2026)
  var ENS = 'osoartist.eth';
  var BASE_ID = 8453;
  // PayAI's facilitator cannot be called from a browser (OPTIONS /verify → 404, no CORS: Safari said "Load failed", 28 Nov 2026) —
  // this is the gift-rail Worker's Base lane: same x402 request/reply shapes, CORS on, payee/asset/amount pinned (oso-gift-rail v1.1).
  var FACILITATOR = 'https://gift-rail.opensourceorchestra.org/base';
  var RESOURCE = 'https://shakaleikaumaka.com/x402-bless.json';
  var HEDERA = '0.0.11347291';                                              // HBAR, by hand (already on the gift rail)
  var LINKS = {
    once: 'https://buy.stripe.com/fZu4gzgO144P6qC5EL0co0c',                 // Stripe · "Bless the Pool — as much as your heart desires" (customer chooses the amount) — verified 28 Nov
    tide: { 3: 'https://buy.stripe.com/aFacN52Xb7h16qC8QX0co05', 5: 'https://buy.stripe.com/4gMaEXdBP44P3eqgjp0co06', 10: 'https://buy.stripe.com/5kQfZh55j1WH8yK2sz0co07',
            25: 'https://buy.stripe.com/6oUeVdbtHdFp2am2sz0co08', 50: 'https://buy.stripe.com/dRm7sL2XbdFp9CO0kr0co09' },   // Stripe · "The Steady Tide 🌊" monthly — each amount verified on the live page 28 Nov
    onceFixed: {},                                                         // { 5: url, 10: url, 20: url, 50: url } — one-time fixed-amount Stripe links the day Shaka makes them (Stripe cannot prefill the open link by URL — verified 28 Nov); empty = the open link
    paypal: 'https://paypal.me/Shakalei', venmo: 'https://venmo.com/u/jordanham', venmoUser: 'jordanham', paypalUser: 'Shakalei',
    fans: 'https://shakafans.com/',
    pool: 'https://blessingpool.com/', lanes: 'https://blessingpool.com/#lanes', ledger: 'https://opensourceorchestra.org/dao/',
    x402: RESOURCE, share: 'https://blessingpool.com/', home: 'https://opensourceorchestra.org', license: 'https://www.gnu.org/licenses/gpl-3.0.html'
  };
  var TIDES = [3, 5, 10, 25, 50];
  var CONFIG_URL = 'https://frames.opensourceorchestra.org/fountain-config.json';
  var OWH_URL = 'https://frames.opensourceorchestra.org/lib/owh.js';
  var FRAMES_ORIGIN = 'https://frames.opensourceorchestra.org';
  var MIN_USD_CHAIN = 1, MIN_USD_BASE = 0.01, MAX_USD = 1000;
  var CHAINS = /*@CHAINS@*/[{"chainId":1,"key":"ethereum","name":"Ethereum","nativeCurrency":{"name":"Ether","symbol":"ETH","decimals":18},"rpcUrls":["https://ethereum-rpc.publicnode.com"],"explorer":"https://etherscan.io","usdc":{"address":"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48","symbol":"USDC","decimals":6,"name":"USD Coin"},"add":{"chainName":"Ethereum Mainnet","nativeCurrency":{"name":"Ether","symbol":"ETH","decimals":18},"rpcUrls":["https://ethereum-rpc.publicnode.com","https://eth.drpc.org","https://rpc.mevblocker.io"],"blockExplorerUrls":["https://etherscan.io"]},"note":""},{"chainId":8453,"key":"base","name":"Base","nativeCurrency":{"name":"Ether","symbol":"ETH","decimals":18},"rpcUrls":["https://mainnet.base.org"],"explorer":"https://basescan.org","usdc":{"address":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913","symbol":"USDC","decimals":6,"name":"USD Coin"},"add":{"chainName":"Base","nativeCurrency":{"name":"Ether","symbol":"ETH","decimals":18},"rpcUrls":["https://mainnet.base.org","https://base-rpc.publicnode.com","https://base.drpc.org"],"blockExplorerUrls":["https://basescan.org"]},"note":""},{"chainId":10,"key":"optimism","name":"OP Mainnet","nativeCurrency":{"name":"Ether","symbol":"ETH","decimals":18},"rpcUrls":["https://mainnet.optimism.io"],"explorer":"https://optimistic.etherscan.io","usdc":{"address":"0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85","symbol":"USDC","decimals":6,"name":"USD Coin"},"add":{"chainName":"OP Mainnet","nativeCurrency":{"name":"Ether","symbol":"ETH","decimals":18},"rpcUrls":["https://mainnet.optimism.io","https://optimism-rpc.publicnode.com","https://optimism.drpc.org"],"blockExplorerUrls":["https://optimistic.etherscan.io"]},"note":""},{"chainId":42161,"key":"arbitrum","name":"Arbitrum One","nativeCurrency":{"name":"Ether","symbol":"ETH","decimals":18},"rpcUrls":["https://arb1.arbitrum.io/rpc"],"explorer":"https://arbiscan.io","usdc":{"address":"0xaf88d065e77c8cC2239327C5EDb3A432268e5831","symbol":"USDC","decimals":6,"name":"USD Coin"},"add":{"chainName":"Arbitrum One","nativeCurrency":{"name":"Ether","symbol":"ETH","decimals":18},"rpcUrls":["https://arb1.arbitrum.io/rpc","https://arbitrum-one-rpc.publicnode.com","https://arbitrum.drpc.org"],"blockExplorerUrls":["https://arbiscan.io"]},"note":""},{"chainId":480,"key":"worldchain","name":"World Chain","nativeCurrency":{"name":"Ether","symbol":"ETH","decimals":18},"rpcUrls":["https://worldchain-mainnet.g.alchemy.com/public"],"explorer":"https://worldscan.org","usdc":{"address":"0x79A02482A880bCE3F13e09Da970dC34db4CD24d1","symbol":"USDC","decimals":6,"name":"USDC"},"add":{"chainName":"World Chain","nativeCurrency":{"name":"Ether","symbol":"ETH","decimals":18},"rpcUrls":["https://worldchain-mainnet.g.alchemy.com/public"],"blockExplorerUrls":["https://worldscan.org"]},"note":"World Chain has one reliable public node; if your wallet cannot add it, pick Base."},{"chainId":130,"key":"unichain","name":"Unichain","nativeCurrency":{"name":"Ether","symbol":"ETH","decimals":18},"rpcUrls":["https://mainnet.unichain.org"],"explorer":"https://uniscan.xyz","usdc":{"address":"0x078D782b760474a361dDA0AF3839290b0EF57AD6","symbol":"USDC","decimals":6,"name":"USDC"},"add":{"chainName":"Unichain","nativeCurrency":{"name":"Ether","symbol":"ETH","decimals":18},"rpcUrls":["https://mainnet.unichain.org","https://unichain-rpc.publicnode.com","https://unichain.drpc.org"],"blockExplorerUrls":["https://uniscan.xyz"]},"note":""},{"chainId":57073,"key":"ink","name":"Ink","nativeCurrency":{"name":"Ether","symbol":"ETH","decimals":18},"rpcUrls":["https://rpc-gel.inkonchain.com"],"explorer":"https://explorer.inkonchain.com","usdc":{"address":"0x2D270e6886d130D724215A266106e6832161EAEd","symbol":"USDC","decimals":6,"name":"USDC"},"add":{"chainName":"Ink","nativeCurrency":{"name":"Ether","symbol":"ETH","decimals":18},"rpcUrls":["https://rpc-gel.inkonchain.com","https://rpc-qnd.inkonchain.com","https://ink-rpc.publicnode.com"],"blockExplorerUrls":["https://explorer.inkonchain.com"]},"note":""},{"chainId":42220,"key":"celo","name":"Celo","nativeCurrency":{"name":"CELO","symbol":"CELO","decimals":18},"rpcUrls":["https://forno.celo.org"],"explorer":"https://celoscan.io","usdc":{"address":"0xcebA9300f2b948710d2653dD7B07f33A8B32118C","symbol":"USDC","decimals":6,"name":"USDC"},"add":{"chainName":"Celo Mainnet","nativeCurrency":{"name":"CELO","symbol":"CELO","decimals":18},"rpcUrls":["https://forno.celo.org","https://celo-rpc.publicnode.com","https://celo.drpc.org"],"blockExplorerUrls":["https://celoscan.io"]},"note":""},{"chainId":59144,"key":"linea","name":"Linea","nativeCurrency":{"name":"Linea Ether","symbol":"ETH","decimals":18},"rpcUrls":["https://rpc.linea.build"],"explorer":"https://lineascan.build","usdc":{"address":"0x176211869cA2b568f2A7D4EE941E073a821EE1ff","symbol":"USDC","decimals":6,"name":"USDC"},"add":{"chainName":"Linea","nativeCurrency":{"name":"Linea Ether","symbol":"ETH","decimals":18},"rpcUrls":["https://rpc.linea.build","https://linea-rpc.publicnode.com","https://linea.drpc.org"],"blockExplorerUrls":["https://lineascan.build"]},"note":"Linea is a slow chain (about 10 s per block) — your wallet may take a moment to confirm."},{"chainId":324,"key":"zksync","name":"ZKsync Era","nativeCurrency":{"name":"Ether","symbol":"ETH","decimals":18},"rpcUrls":["https://mainnet.era.zksync.io"],"explorer":"https://explorer.zksync.io","usdc":{"address":"0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4","symbol":"USDC","decimals":6,"name":"USDC"},"add":{"chainName":"zkSync Mainnet","nativeCurrency":{"name":"Ether","symbol":"ETH","decimals":18},"rpcUrls":["https://mainnet.era.zksync.io","https://zksync.drpc.org","https://zksync.api.onfinality.io/public"],"blockExplorerUrls":["https://explorer.zksync.io"]},"note":"ZKsync Era is a slow chain (about 10 s per block) and its gas is priced differently — Base is cheaper for small gifts."},{"chainId":137,"key":"polygon","name":"Polygon PoS","nativeCurrency":{"name":"POL","symbol":"POL","decimals":18},"rpcUrls":["https://polygon-bor-rpc.publicnode.com"],"explorer":"https://polygonscan.com","usdc":{"address":"0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359","symbol":"USDC","decimals":6,"name":"USD Coin"},"add":{"chainName":"Polygon Mainnet","nativeCurrency":{"name":"POL","symbol":"POL","decimals":18},"rpcUrls":["https://polygon-bor-rpc.publicnode.com","https://polygon.drpc.org","https://polygon.gateway.tenderly.co"],"blockExplorerUrls":["https://polygonscan.com"]},"note":""},{"chainId":56,"key":"bnb","name":"BNB Smart Chain","nativeCurrency":{"name":"BNB Chain Native Token","symbol":"BNB","decimals":18},"rpcUrls":["https://bsc-dataseed1.bnbchain.org"],"explorer":"https://bscscan.com","usdc":{"address":"0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d","symbol":"USDC","decimals":18,"name":"USD Coin"},"add":{"chainName":"BNB Smart Chain Mainnet","nativeCurrency":{"name":"BNB Chain Native Token","symbol":"BNB","decimals":18},"rpcUrls":["https://bsc-dataseed1.bnbchain.org","https://bsc-rpc.publicnode.com","https://bsc-dataseed.bnbchain.org"],"blockExplorerUrls":["https://bscscan.com"]},"note":"BNB Chain has no Circle-native USDC: this is Binance-Peg USDC, a bridged stablecoin held 1:1 by Binance."}]/*@END@*/;                                      // build.mjs inlines the verified mainnet table (tip-chains.json ∩ USDC)
  var POPULAR = [8453, 1, 42161, 10, 137, 130, 57073];                               // shown first; the rest sit behind "more chains"

  /* ═══ 2 · PURE CORE (no DOM) — exported as OSOFountain._core and unit-tested ═════════════════════════════════════════ */
  function isAddr(s) { return typeof s === 'string' && /^0x[0-9a-fA-F]{40}$/.test(s); }
  function pad32(hex) { hex = String(hex).replace(/^0x/, '').toLowerCase(); if (!/^[0-9a-f]*$/.test(hex) || hex.length > 64) throw new Error('bad hex'); return new Array(65 - hex.length).join('0') + hex; }
  function toUnits(usd, decimals) {                                          // "12.34" | 12.34 → BigInt, exact (no float), ≤ `decimals` places
    var m = /^(\d+)(?:\.(\d+))?$/.exec(String(usd).trim()); if (!m) throw new Error('bad amount');
    var frac = (m[2] || ''); if (frac.length > decimals) frac = frac.slice(0, decimals);
    while (frac.length < decimals) frac += '0';
    return BigInt(m[1] + frac);
  }
  function fromUnits(units, decimals, places) {
    var s = BigInt(units).toString(); while (s.length <= decimals) s = '0' + s;
    var a = s.slice(0, s.length - decimals), b = s.slice(s.length - decimals).slice(0, places == null ? 2 : places);
    return b ? a + '.' + b : a;
  }
  function transferData(to, units) { if (!isAddr(to)) throw new Error('bad address'); return '0xa9059cbb' + pad32(to) + pad32(BigInt(units).toString(16)); }
  function balanceData(who) { if (!isAddr(who)) throw new Error('bad address'); return '0x70a08231' + pad32(who); }
  function abiString(hex) {                                                  // decode an ABI-encoded `string` return value ('' on anything odd)
    try { hex = String(hex || '').replace(/^0x/, ''); if (hex.length < 128) return ''; var len = parseInt(hex.slice(64, 128), 16); if (!(len >= 0 && len < 64) || hex.length < 128 + len * 2) return ''; var out = ''; for (var i = 0; i < len; i++) out += String.fromCharCode(parseInt(hex.substr(128 + i * 2, 2), 16)); return out; } catch (e) { return ''; }
  }
  function chainHex(id) { return '0x' + Number(id).toString(16); }
  function chainById(id) { for (var i = 0; i < CHAINS.length; i++) if (CHAINS[i].chainId === id) return CHAINS[i]; return null; }
  function eip681(c, usd) { return 'ethereum:' + c.usdc.address + '@' + c.chainId + '/transfer?address=' + PAYTO + '&uint256=' + toUnits(usd, c.usdc.decimals).toString(); }
  function jumperUrl(fromChain) {                                            // Jumper honours toChain/toToken/toAddress (verified 28 Nov); the visitor picks token + amount there
    var b = chainById(BASE_ID), u = 'https://jumper.xyz/?toChain=' + BASE_ID + '&toToken=' + b.usdc.address + '&toAddress=' + PAYTO;
    return fromChain ? u + '&fromChain=' + fromChain : u;
  }
  function tideFor(usd) {                                                    // nearest monthly amount (ties go up: a blessing rounds up)
    var best = TIDES[0], d = Infinity; for (var i = 0; i < TIDES.length; i++) { var x = Math.abs(TIDES[i] - usd); if (x < d || (x === d && TIDES[i] > best)) { d = x; best = TIDES[i]; } }
    return best;
  }
  function stripeUrl(freq, usd) { return freq === 'monthly' ? LINKS.tide[tideFor(usd)] : (LINKS.onceFixed[usd] || LINKS.once); }
  function amtStr(usd) { var n = Math.round(Number(usd) * 100) / 100; return n % 1 === 0 ? String(n) : n.toFixed(2); }
  function paypalUrl(usd) { return 'https://paypal.me/' + LINKS.paypalUser + '/' + amtStr(usd) + 'USD'; }                       // PayPal.me/<user>/<amount><CUR> — verified 28 Nov: shows "$10.00 USD · Send"
  function venmoUrl(usd) { return 'https://venmo.com/' + LINKS.venmoUser + '?txn=pay&amount=' + amtStr(usd) + '&audience=private&note=' + encodeURIComponent('Aloha 🌊 thank you for the music'); }   // Venmo payment links — verified 28 Nov: "Sign in to pay … $10"
  var US_TZ = /^(America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Indiana\/.*|Kentucky\/.*|North_Dakota\/.*|Menominee|Juneau|Sitka|Nome|Yakutat|Adak)|Pacific\/Honolulu|US\/.*)$/;
  function venmoLikely(langs, tz) {                                          // Venmo only works for US accounts: show it when the browser says US (language region or time zone); everyone else gets PayPal full-width
    try { for (var i = 0; i < (langs || []).length; i++) if (/[-_]US$/i.test(String(langs[i]))) return true; } catch (e) {}
    return US_TZ.test(String(tz || ''));
  }
  function hostOf(u) { return String(u).replace(/^https?:\/\//, '').replace(/\/$/, ''); }
  function txUrl(c, hash) { return /^0x[0-9a-fA-F]{64}$/.test(hash || '') && c && /^https:\/\//.test(c.explorer || '') ? c.explorer.replace(/\/$/, '') + '/tx/' + hash : null; }
  function short(a) { return a.slice(0, 6) + '…' + a.slice(-4); }
  function checkUsd(usd, c) {                                                // → '' when fine, else a human reason
    if (!(usd > 0) || !isFinite(usd)) return 'pick an amount above zero';
    if (usd > MAX_USD) return 'for gifts above $' + MAX_USD + ' please write to aloha@myagentohana.com — we want to thank you properly';
    var min = c && c.chainId === BASE_ID ? MIN_USD_BASE : MIN_USD_CHAIN;
    if (usd < min) return c && c.chainId !== BASE_ID ? 'on ' + c.name + ' the gas would eat a gift under $' + MIN_USD_CHAIN + ' — Base is gas-free for tiny gifts' : 'the smallest gift is $' + MIN_USD_BASE;
    return '';
  }
  function parseHandoff(href, surface) {                                    // ?osogift=<surface>:<usd>:<rail>:go  — the way back from a wallet app (same format as OWH.pending)
    try {
      var u = new URL(href), v = u.searchParams.get('osogift'); if (!v) return null;
      var p = v.split(':'); if (p[0] !== surface) return null;
      var usd = parseFloat(p[1]), sane = usd >= 0.001 && usd <= MAX_USD; if (!sane) usd = 10;
      var rail = /^c\d+$/.test(p[2] || '') && chainById(Number(p[2].slice(1))) ? p[2] : '';
      return { usd: usd, rail: rail, go: sane && p[3] === 'go' && usd <= 10 };           // a link may open the sheet at any amount, but only starts the wallet prompt up to $10
    } catch (e) { return null; }
  }
  var core = { abiString: abiString, parseHandoff: parseHandoff, PAYTO: PAYTO, CHAINS: CHAINS, LINKS: LINKS, TIDES: TIDES, isAddr: isAddr, pad32: pad32, toUnits: toUnits, fromUnits: fromUnits, transferData: transferData, balanceData: balanceData,
               chainHex: chainHex, chainById: chainById, eip681: eip681, jumperUrl: jumperUrl, tideFor: tideFor, stripeUrl: stripeUrl, paypalUrl: paypalUrl, venmoUrl: venmoUrl, venmoLikely: venmoLikely, amtStr: amtStr, hostOf: hostOf, txUrl: txUrl, checkUsd: checkUsd, short: short };
  if (!D) { W.OSOFountain = { version: VERSION, _core: core }; return; }   // node unit tests: no DOM → core only

  /* ═══ 3 · SMALL HELPERS ═════════════════════════════════════════════════════════════════════════════════════════════ */
  var T = function (k, d) { var s = W.OSOFountain && W.OSOFountain.strings && W.OSOFountain.strings[k]; return typeof s === 'string' ? s : d; };
  function h(tag, attrs, kids) {
    var n = D.createElement(tag), k;
    for (k in (attrs || {})) { var v = attrs[k]; if (v === true) n.setAttribute(k, ''); else if (v !== false && v != null) n.setAttribute(k, v); }
    (kids || []).forEach(function (c) { if (c != null && c !== false) n.appendChild(typeof c === 'string' ? D.createTextNode(c) : c); });
    return n;
  }
  function esc(v) { return String(v == null ? '' : v); }                     // we never use innerHTML for dynamic data: textContent only
  function sameOrFrames(u) { try { var o = new URL(u, W.location.href).origin; return o === W.location.origin || o === FRAMES_ORIGIN; } catch (e) { return false; } }
  function errMsg(e) { return (e && (e.message || e.reason || (e.data && e.data.message))) ? String(e.message || e.reason || e.data.message) : String(e); }
  function isMobile() { var ua = (W.navigator || {}).userAgent || ''; return /iPad|iPhone|iPod|Android/i.test(ua) || ((W.navigator || {}).platform === 'MacIntel' && (W.navigator || {}).maxTouchPoints > 1); }

  /* ═══ 4 · KILL SWITCH (fail closed for crypto, never for the card links) ═══════════════════════════════════════════ */
  var cfgCache = null, cfgAt = 0, cfgUrl = CONFIG_URL;
  function loadConfig(force) {
    if (!force && cfgCache && Date.now() - cfgAt < 60000) return cfgCache;
    var fail = { ok: false, enabled: false, disabled: [], message: T('cfg.fail', 'the blessing switchboard could not be read, so wallet gifts rest for a moment (cards still work) 🌺') };
    var p = new Promise(function (resolve) {
      var done = false, to = setTimeout(function () { settle(fail); }, 6000);
      function settle(v) { if (done) return; done = true; clearTimeout(to); resolve(v); }   // exactly once: timeout, malformed, network error and success can never leave the promise hanging
      W.fetch(cfgUrl + (cfgUrl.indexOf('?') < 0 ? '?t=' : '&t=') + Date.now(), { cache: 'no-store', credentials: 'omit' }).then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); }).then(function (j) {
        if (!j || typeof j.enabled !== 'boolean' || (j.payTo && String(j.payTo).toLowerCase() !== PAYTO.toLowerCase())) throw new Error('malformed');   // a config that names another payee is refused outright
        settle({ ok: true, enabled: j.enabled, disabled: Array.isArray(j.disabledChains) ? j.disabledChains.map(Number) : [], message: typeof j.message === 'string' ? j.message.slice(0, 200) : '' });
      }).catch(function () { settle(fail); });
    });
    cfgCache = p; cfgAt = Date.now(); p.then(function (v) { if (!v.ok && cfgCache === p) cfgCache = null; });   // a failure is retried on the next look, a success is kept for a minute
    return p;
  }

  /* ═══ 5 · THE FOUNTAIN (canvas; decorative; paused when hidden/closed; one still frame for reduced motion) ═══════ */
  var PAL = [[251, 226, 160], [127, 216, 164], [201, 168, 255], [124, 200, 255]];       // gold · mint · violet · sky
  function makeFx(cv) {
    var ctx = cv.getContext('2d'), w = 1, hh = 1, dpr = 1, ps = [], rip = [], twink = [], bg = null, sprites = [], raf = 0, last = 0, power = 0.8, tint = 0, run = false;
    var reduce = false, seen = true, io = null; try { reduce = W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    try { if (W.IntersectionObserver) { io = new W.IntersectionObserver(function (en) { seen = !!en[en.length - 1].isIntersecting; }); io.observe(cv); } } catch (e) {}
    function sprite(c) {                                                    // one soft glow per colour, drawn with drawImage (far cheaper than a path fill per drop)
      var n = Math.max(8, Math.round(24 * dpr)), k = D.createElement('canvas'); k.width = k.height = n; var g = k.getContext('2d'), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
      gr.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',1)'); gr.addColorStop(0.35, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',.5)'); gr.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)'); g.fillStyle = gr; g.fillRect(0, 0, n, n); return k;
    }
    function size() {
      var r = cv.getBoundingClientRect(); dpr = Math.min(W.devicePixelRatio || 1, 1.5); w = Math.max(1, r.width); hh = Math.max(1, r.height);
      cv.width = Math.round(w * dpr); cv.height = Math.round(hh * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bg = D.createElement('canvas'); bg.width = cv.width; bg.height = cv.height; var b = bg.getContext('2d'); b.setTransform(dpr, 0, 0, dpr, 0, 0);   // the still sky: stars + basin glow, painted ONCE
      for (var i = 0; i < 40; i++) { b.fillStyle = 'rgba(245,239,230,' + (0.22 + Math.random() * 0.45).toFixed(2) + ')'; var q = Math.random() * 1.1 + 0.25; b.fillRect(Math.random() * w, Math.random() * hh * 0.78, q, q); }
      var g = b.createRadialGradient(w / 2, hh * 0.9, 2, w / 2, hh * 0.9, Math.max(w, hh) * 0.62); g.addColorStop(0, 'rgba(251,226,160,.34)'); g.addColorStop(0.45, 'rgba(201,168,255,.10)'); g.addColorStop(1, 'rgba(201,168,255,0)'); b.fillStyle = g; b.fillRect(0, 0, w, hh);
      b.strokeStyle = 'rgba(251,226,160,.20)'; b.lineWidth = 1; b.beginPath(); b.ellipse(w / 2, hh * 0.9, w * 0.3, hh * 0.05, 0, 0, 6.283); b.stroke();
      twink = []; for (var j = 0; j < 9; j++) twink.push({ x: Math.random() * w, y: Math.random() * hh * 0.7, p: Math.random() * 6.28 });
      sprites = PAL.map(sprite); ps = []; rip = [];
    }
    function jet(x, scale, bias, n) {                                       // one jet of the fountain: rises, arcs outward, falls back into the basin
      for (var i = 0; i < n; i++) {
        var a = (-90 + bias + (Math.random() - 0.5) * 58) * Math.PI / 180, v = (3.0 + Math.random() * 1.9) * (0.78 + power * 0.32) * scale;
        ps.push({ x: x + (Math.random() - 0.5) * 10, y: hh * 0.8, vx: Math.cos(a) * v * 0.9, vy: Math.sin(a) * v, l: 1, d: 0.016 + Math.random() * 0.008, s: 1.1 + Math.random() * 1.7 * power, c: (tint + (Math.random() * 3 | 0)) % 4 });
      }
    }
    function emit(n, burst) {
      if (burst) {                                                          // the thank-you: sparkles flung out of the basin (gentle: additive light saturates fast)
        for (var i = 0; i < n; i++) { var a = Math.random() * Math.PI * 2, v = 1.2 + Math.random() * 3.4, rr = Math.random() * 12; ps.push({ x: w / 2 + Math.cos(a) * rr, y: hh * 0.55 + Math.sin(a) * rr * 0.5, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.6, l: 0.8, d: 0.014 + Math.random() * 0.006, s: 0.7 + Math.random() * 1.3, c: (tint + (Math.random() * 3 | 0)) % 4 }); }
        if (ps.length > 260) ps.splice(0, ps.length - 260); return;
      }
      jet(w / 2, 1, 0, n); if (Math.random() < 0.38) jet(w * 0.32, 0.7, -14, 1); if (Math.random() < 0.38) jet(w * 0.68, 0.7, 14, 1);
      if (ps.length > 150) ps.splice(0, ps.length - 150);
    }
    function draw(t) {
      ctx.clearRect(0, 0, w, hh); ctx.drawImage(bg, 0, 0, w, hh);
      for (var i = 0; i < twink.length; i++) { var s = twink[i]; ctx.fillStyle = 'rgba(245,239,230,' + (0.3 + 0.4 * Math.sin(t / 900 + s.p)).toFixed(2) + ')'; ctx.fillRect(s.x, s.y, 1.3, 1.3); }
      for (var r = rip.length - 1; r >= 0; r--) { var q = rip[r]; q.r += 0.9; q.a -= 0.012; if (q.a <= 0) { rip.splice(r, 1); continue; } ctx.strokeStyle = 'rgba(251,226,160,' + q.a.toFixed(3) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(w / 2, hh * 0.9, q.r, q.r * 0.22, 0, 0, 6.283); ctx.stroke(); }
      ctx.globalCompositeOperation = 'lighter';
      for (var j = ps.length - 1; j >= 0; j--) {
        var p = ps[j]; p.vy += 0.052; p.x += p.vx; p.y += p.vy; p.l -= p.d;
        if (p.l <= 0 || p.y > hh * 0.93) { if (p.y > hh * 0.88 && p.l > 0 && rip.length < 6 && Math.random() < 0.06) rip.push({ r: 4, a: 0.35 }); ps[j] = ps[ps.length - 1]; ps.pop(); continue; }
        var rr = p.s * 3.2; ctx.globalAlpha = Math.min(1, p.l * 1.1); ctx.drawImage(sprites[p.c], p.x - rr, p.y - rr, rr * 2, rr * 2);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    function frame(t) {
      if (!run) return; raf = W.requestAnimationFrame(frame);
      if (D.hidden || !seen || t - last < 48) return;                       // ≈20 fps is plenty for water; nothing is drawn while the sky is scrolled out of view
      last = t; if (Math.random() < 0.85) emit(power > 1.1 ? 2 : 1); draw(t);
    }
    return {
      start: function () { size(); if (reduce) { for (var i = 0; i < 36; i++) { emit(1); var p = ps[ps.length - 1]; for (var k = 0; k < 14 + (i * 3) % 18; k++) { p.vy += 0.052; p.x += p.vx; p.y += p.vy; } } draw(1500); return; } if (run) return; run = true; raf = W.requestAnimationFrame(frame); },
      stop: function () { run = false; if (raf) W.cancelAnimationFrame(raf); raf = 0; if (io) { io.disconnect(); io = null; } },
      resize: function () { size(); if (reduce) draw(1500); },
      power: function (usd) { power = Math.max(0.5, Math.min(1.5, 0.5 + Math.log(Math.max(1, usd)) / Math.log(10) * 0.5)); },
      tint: function (i) { tint = i % 4; },
      burst: function () { if (reduce) { emit(60, true); for (var k = 0; k < 14; k++) for (var q = 0; q < ps.length; q++) { var p = ps[q]; p.x += p.vx * 3; p.y += p.vy * 3 + 1; } draw(1500); return; } emit(150, true); }
    };
  }

  /* ═══ 6 · STYLE ═════════════════════════════════════════════════════════════════════════════════════════════════════ */
  var CSS = [
    '.ofn-ovl{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:flex-end;justify-content:center;background:rgba(5,2,12,.74);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);animation:ofn-fade .18s ease-out}',
    '.ofn,.ofn *{box-sizing:border-box}',
    '.ofn{--bg:#0b0710;--bg2:#150d22;--bg3:#1c1230;--line:#4a3565;--ink:#f5efe6;--mute:#9d97c9;--soft:#cdbce8;--mint:#7fd8a4;--gold:#fbe2a0;--vio:#c9a8ff;color:var(--ink);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:left;-webkit-text-size-adjust:100%}',
    '.ofn button,.ofn a{font-family:inherit;touch-action:manipulation;-webkit-tap-highlight-color:rgba(127,216,164,.25)}',
    '.ofn-sheet{position:relative;display:flex;flex-direction:column;width:100%;max-width:540px;max-height:94vh;max-height:94dvh;background:radial-gradient(120% 60% at 50% -8%,#2d1a4e 0%,#170e26 46%,#0b0710 100%);border:1px solid var(--line);border-bottom:0;border-radius:22px 22px 0 0;box-shadow:0 -16px 60px rgba(124,75,168,.38);overflow:hidden;animation:ofn-up .28s cubic-bezier(.2,.8,.2,1)}',
    '@media(min-width:640px){.ofn-ovl{align-items:center}.ofn-sheet{border-radius:22px;border-bottom:1px solid var(--line);max-height:90vh}}',
    '.ofn-page{display:flex;flex-direction:column;width:100%;max-width:560px;margin:0 auto;background:radial-gradient(120% 60% at 50% -8%,#2d1a4e 0%,#170e26 46%,#0b0710 100%);border:1px solid var(--line);border-radius:22px;overflow:hidden}',
    '.ofn-sky{position:relative;flex:none;height:150px;background:linear-gradient(#08040f,#150b27 72%,#1a0f2e)}',
    '.ofn-sky canvas{position:absolute;left:0;top:0;width:100%;height:100%;display:block}',
    '.ofn-x{position:absolute;top:8px;right:8px;z-index:3;width:44px;height:44px;border-radius:50%;background:rgba(11,7,16,.6);border:1px solid var(--line);color:var(--ink);font-size:18px;line-height:1;cursor:pointer}',
    '.ofn-x:focus-visible,.ofn-back:focus-visible,.ofn-stream:focus-visible,.ofn-chip:focus-visible,.ofn-cta:focus-visible,.ofn-sm:focus-visible,.ofn summary:focus-visible{outline:2px solid var(--mint);outline-offset:2px}',
    '.ofn-body{flex:1 1 auto;overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:12px 16px 6px}',
    '.ofn-h{text-wrap:balance;margin:2px 0 2px;text-align:center;font:700 22px/1.25 Georgia,"Iowan Old Style","Times New Roman",serif;color:var(--gold);letter-spacing:.2px}',
    '.ofn-sub{margin:0 0 14px;text-align:center;color:var(--soft);font-size:13.5px;text-wrap:balance}',
    '.ofn-back{display:inline-flex;align-items:center;gap:6px;min-height:44px;margin:0 0 4px -6px;padding:6px 10px;background:none;border:0;color:var(--mute);font-size:14px;cursor:pointer}',
    '.ofn-streams{display:grid;gap:10px;margin:0}',
    '.ofn-home .ofn-h{font-size:30px}',
    '.ofn-chips.big{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}',
    '.ofn-chips.big .ofn-chip{min-width:0;min-height:60px;font-size:21px;font-weight:700;padding:6px}',
    '.ofn-oth{display:flex;align-items:center;gap:8px;margin:8px 0 0;color:var(--mute);font-size:13px}',
    '.ofn-oth .ofn-amt{width:120px}',
    '.ofn-cta.big{min-height:68px;margin-top:14px;font-size:17px;justify-content:flex-start;gap:12px;padding:10px 14px;text-align:left}',
    '.ofn-cta .i{flex:none;font-size:28px;line-height:1}',
    '.ofn-cta b{text-wrap:balance}',
    '.ofn-cta b{display:block;font-weight:800}',
    '.ofn-cta small{display:block;margin-top:1px;font-size:12.5px;font-weight:500;opacity:.88}',
    '.ofn-duo{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}',
    '.ofn-duo.one{grid-template-columns:1fr}',
    '.ofn-cta.alt{margin:0;min-height:60px;background:var(--bg3);border:1px solid var(--line);box-shadow:none;font-size:17px;gap:10px;justify-content:flex-start;padding:8px 14px;text-align:left}',
    '.ofn-cta.alt .i{font-size:26px}',
    '.ofn-cta.alt:hover,.ofn-cta.alt:active{border-color:var(--mint)}',
    '.ofn-lb{display:inline-flex;align-items:center;min-height:44px;padding:8px 2px;background:none;border:0;color:var(--gold);font-size:13.5px;text-decoration:underline;text-underline-offset:3px;cursor:pointer}',
    '.ofn-stage{text-align:center}',
    '.ofn-stage .ofn-qr{width:min(76vw,46vh,400px);margin:6px auto 0;padding:14px}',
    '.ofn-host{margin:14px 0 2px;font:800 clamp(30px,9.5vw,56px)/1.08 system-ui,-apple-system,sans-serif;color:var(--gold);letter-spacing:-.5px;word-break:break-all}',
    '.ofn-stream{display:flex;align-items:center;gap:14px;width:100%;min-height:68px;padding:12px 14px;border-radius:16px;background:linear-gradient(135deg,rgba(28,18,48,.95),rgba(21,13,34,.95));border:1px solid var(--line);color:var(--ink);text-align:left;cursor:pointer;transition:border-color .15s,transform .15s}',
    '.ofn-stream:hover,.ofn-stream:active{border-color:var(--mint);transform:translateY(-1px)}',
    '.ofn-stream .i{flex:none;font-size:28px;line-height:1;width:34px;text-align:center}',
    '.ofn-stream b{display:block;font-size:16px;font-weight:700}',
    '.ofn-stream small{display:block;margin-top:1px;color:var(--mute);font-size:12.5px;line-height:1.35}',
    '.ofn-stream .go{margin-left:auto;color:var(--mute);font-size:20px}',
    '.ofn-more{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 14px;margin:12px 0 4px;font-size:13px}',
    '.ofn-more a{color:var(--gold);padding:8px 2px;min-height:44px;display:inline-flex;align-items:center;text-decoration:underline;text-underline-offset:3px}',
    '.ofn-lab{margin:12px 0 6px;font-size:13px;font-weight:700;color:var(--soft);letter-spacing:.2px}',
    '.ofn-chips{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 4px}',
    '.ofn-chip{min-width:58px;min-height:44px;padding:8px 14px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font-size:15px;font-weight:600;cursor:pointer}',
    '.ofn-chip[aria-pressed="true"]{border-color:var(--mint);color:var(--mint);background:rgba(127,216,164,.09)}',
    '.ofn-chip small{display:block;font-size:10.5px;font-weight:500;color:var(--mute);margin-top:-1px}',
    '.ofn-chip[aria-pressed="true"] small{color:var(--mint)}',
    '.ofn-chip[disabled]{opacity:.45;cursor:not-allowed}',
    '.ofn-chainbtn{display:flex;align-items:center;gap:6px;width:100%;min-height:48px;padding:8px 14px;margin-top:10px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font-size:15px;text-align:left;cursor:pointer}',
    '.ofn-chainbtn .k{color:var(--mute)}',
    '.ofn-chainbtn small{color:var(--mint);font-size:13px}',
    '.ofn-chainbtn .v{margin-left:auto;color:var(--mute)}',
    '.ofn-chain .ofn-lab{display:none}',
    '.ofn-chips:not(.big) .ofn-chip{min-width:52px;padding:8px 10px}',
    '.ofn-amt{width:92px;min-height:44px;padding:8px 10px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font-size:16px}',
    '.ofn-amt:focus{outline:2px solid var(--mint);outline-offset:1px}',
    '.ofn-cta{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:54px;margin:14px 0 0;padding:12px 16px;border-radius:16px;border:0;background:linear-gradient(90deg,#0052ff,#7c4ba8 58%,#d98cff);color:#fff;font-size:16.5px;font-weight:700;text-decoration:none;cursor:pointer;box-shadow:0 6px 22px rgba(124,75,168,.4)}',
    '.ofn-cta.gold{background:linear-gradient(90deg,#c9892a,#fbe2a0);color:#2a1748;box-shadow:0 6px 22px rgba(251,226,160,.25)}',
    '.ofn-cta[aria-disabled="true"],.ofn-cta:disabled{opacity:.5;cursor:wait}',
    '.ofn-sm{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:44px;padding:8px 14px;border-radius:12px;background:var(--bg3);color:var(--mint);border:1px solid var(--mint);font-size:13.5px;font-weight:600;text-decoration:none;cursor:pointer}',
    '.ofn-note{margin:10px 0 0;color:var(--mute);font-size:12.5px;line-height:1.5}',
    '.ofn-note a{color:var(--gold)}',
    '.ofn-st{min-height:20px;margin:10px 0 0;color:var(--soft);font-size:13.5px;line-height:1.5;word-break:break-word}',
    '.ofn-st:empty{display:none}',
    '.ofn-st a{color:var(--mint)}',
    '.ofn-card{margin:10px 0 0;padding:12px;border-radius:14px;background:var(--bg);border:1px solid var(--line)}',
    '.ofn-card h4{margin:0 0 6px;font-size:14px;color:var(--soft)}',
    '.ofn-addr{margin:6px 0 0;padding:9px 10px;border-radius:10px;background:#07040c;border:1px solid var(--line);color:#cfc6e8;font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all}',
    '.ofn-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}',
    '.ofn-qr{margin:12px auto 0;width:200px;max-width:100%;padding:10px;background:#fff;border-radius:12px;line-height:0;color:#111;font:13px system-ui,sans-serif}',
    '.ofn-qr svg{display:block;width:100%;height:auto}',
    '.ofn-seg{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 8px}',
    '.ofn details{margin:12px 0 0;border-top:1px solid #2c2140;padding-top:6px;font-size:13px;color:var(--soft)}',
    '.ofn summary{cursor:pointer;min-height:44px;display:flex;align-items:center;color:var(--mute);font-size:13.5px}',
    '.ofn details p{margin:4px 0 8px;line-height:1.55}',
    '.ofn details a{color:var(--gold)}',
    '.ofn-foot{flex:none;padding:8px 16px calc(10px + env(safe-area-inset-bottom,0px));border-top:1px solid #2c2140;color:#8b84ad;font-size:11px;line-height:1.45;text-align:center;background:rgba(11,7,16,.55)}',
    '.ofn-foot a{color:#a99fd0}',
    '.ofn-thanks{text-align:center;padding:6px 0 4px}',
    '.ofn-thanks .big{font:700 30px/1.15 Georgia,serif;color:var(--gold);margin:4px 0 6px}',
    '.ofn [hidden]{display:none!important}',
    '.ofn .owh{margin-top:10px}',
    '.ofn [data-ofn-nobase] .owh-pick>.owh-b[style*="margin-top"]{display:none!important}',
    '@keyframes ofn-up{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}',
    '@keyframes ofn-fade{from{opacity:0}to{opacity:1}}',
    '@media(prefers-reduced-motion:reduce){.ofn-sheet,.ofn-ovl{animation:none}.ofn-stream{transition:none}}',
    '@media(max-height:700px){.ofn-sky{height:96px}.ofn-home .ofn-h{font-size:26px}.ofn-home .ofn-sub{margin-bottom:6px}.ofn-home .ofn-lab{margin-top:4px}.ofn-chips.big .ofn-chip{min-height:54px}.ofn-oth{margin-top:4px}.ofn-cta.big{margin-top:10px;min-height:62px}.ofn-duo{margin-top:8px}.ofn-stream{min-height:60px}}',
    '@media(max-height:600px){.ofn-sky{height:72px}.ofn-chips.big .ofn-chip{min-height:52px}.ofn-oth{display:none}}'
  ].join('\n');
  function injectCss() { if (D.getElementById('ofn-css')) return; var s = h('style', { id: 'ofn-css' }); s.textContent = CSS; D.head.appendChild(s); }

  /* ═══ 7 · STATE + RENDER ════════════════════════════════════════════════════════════════════════════════════════════ */
  var UI = null;                                                            // the one open instance {root, body, fx, S, close()}
  var CHIPS = [5, 10, 20, 50];

  function instance(opts, mode) {
    if (opts.pending === true) opts.pending = pending(opts.surface || 'fountain');
    var S = { usd: opts.pending && opts.pending.usd > 0 ? opts.pending.usd : opts.usd > 0 ? opts.usd : 10, step: 'home', freq: 'once', chain: BASE_ID, gasless: true, busy: false, surface: opts.surface || 'fountain', picker: null, pickerChain: 0, moreChains: false, chainOpen: false, qrOn: false, qrAddrOnly: false, lastFocus: opts.from || D.activeElement, owh: null };
    var railIn = (opts.pending && opts.pending.rail) || opts.rail;
    if (railIn && /^c\d+$/.test(railIn) && chainById(Number(railIn.slice(1)))) { S.chain = Number(railIn.slice(1)); S.gasless = S.chain === BASE_ID; }
    var overlay = mode === 'sheet';
    var root = h('div', { class: 'ofn ' + (overlay ? 'ofn-sheet' : 'ofn-page'), role: overlay ? 'dialog' : 'region', 'aria-labelledby': 'ofn-t' });
    if (overlay) { root.setAttribute('aria-modal', 'true'); }
    var cv = h('canvas', { 'aria-hidden': 'true' });
    var sky = h('div', { class: 'ofn-sky' }, [cv]);
    var x = overlay ? h('button', { type: 'button', class: 'ofn-x', 'aria-label': T('close', 'Close') }, ['✕']) : null;
    var body = h('div', { class: 'ofn-body' });
    var foot = h('div', { class: 'ofn-foot' }, [
      h('span', {}, [T('foot', '🌺 A gift, not a purchase. This sheet was built by Open Source Orchestra: Shaka Lei Kaumaka & the AI ʻohana — a machine made it · ')]),
      h('a', { href: LINKS.license, target: '_blank', rel: 'noopener' }, ['GPL-3.0-or-later'])
    ]);
    if (x) root.appendChild(x); root.appendChild(sky); root.appendChild(body); root.appendChild(foot);
    var fx = makeFx(cv); fx.power(S.usd);

    var api = { root: root, S: S, fx: fx, body: body };
    function go(step) { S.step = step; render(); try { body.scrollTop = 0; } catch (e) {} var hh = body.querySelector('[data-focus]'); if (hh) { try { hh.focus({ preventScroll: true }); } catch (e) {} } }
    api.go = go;
    function title(txt, sub) { return [h('h2', { class: 'ofn-h', id: 'ofn-t', tabindex: '-1', 'data-focus': '1' }, [txt]), sub ? h('p', { class: 'ofn-sub' }, [sub]) : null]; }
    function back(label) { var b = h('button', { type: 'button', class: 'ofn-back' }, ['← ' + (label || T('back', 'back'))]); b.addEventListener('click', function () { go('home'); }); return b; }
    function chip(label, pressed, onClick, sub) { var b = h('button', { type: 'button', class: 'ofn-chip', 'aria-pressed': pressed ? 'true' : 'false' }, [label, sub ? h('small', {}, [sub]) : null]); b.addEventListener('click', onClick); return b; }
    function cta(label, href, cls) { var a = h('a', { class: 'ofn-cta' + (cls ? ' ' + cls : ''), href: href, target: '_blank', rel: 'noopener noreferrer' }, [label]); return a; }
    function status() { return h('div', { class: 'ofn-st', role: 'status', 'aria-live': 'polite' }); }
    function say(el, msg) { el.textContent = msg || ''; }
    function copyBtn(text, label, doneLabel) {
      var b = h('button', { type: 'button', class: 'ofn-sm' }, [label || '📋 ' + T('copy', 'copy')]);
      b.addEventListener('click', function () {
        function ok() { b.textContent = doneLabel || ('✅ ' + T('copied', 'copied — mahalo!')); setTimeout(function () { b.textContent = label || '📋 ' + T('copy', 'copy'); }, 2200); }
        if (W.navigator.clipboard && W.navigator.clipboard.writeText) W.navigator.clipboard.writeText(text).then(ok, function () { legacy(); });
        else legacy();
        function legacy() { var ta = h('textarea', { readonly: true, style: 'position:fixed;left:-9999px;top:0;opacity:0' }); ta.value = text; D.body.appendChild(ta); ta.select(); try { D.execCommand('copy'); ok(); } catch (e) {} ta.remove(); }
      });
      return b;
    }
    function amountPicker(onChange, big) {
      var wrap = h('div', {});
      var chips = h('div', { class: 'ofn-chips' + (big ? ' big' : ''), role: 'group', 'aria-label': T('amount', 'amount in US dollars') });
      var inp = h('input', { class: 'ofn-amt', type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder: T('other', 'other $'), 'aria-label': T('otheramt', 'another amount in US dollars'), maxlength: '7' });
      function paint() {
        chips.textContent = '';
        CHIPS.forEach(function (v) { chips.appendChild(chip('$' + v, S.usd === v && !inp.value, function () { S.usd = v; inp.value = ''; fx.power(S.usd); paint(); onChange(); })); });
        if (!big) chips.appendChild(inp);
      }
      inp.addEventListener('input', function () {
        var v = inp.value.replace(/[^0-9.]/g, ''); if (v !== inp.value) inp.value = v;
        var n = /^\d+(\.\d{0,2})?$/.test(v) ? parseFloat(v) : NaN;
        if (n > 0) { S.usd = n; fx.power(S.usd); Array.prototype.forEach.call(chips.querySelectorAll('.ofn-chip'), function (c) { c.setAttribute('aria-pressed', 'false'); }); onChange(); }
      });
      paint(); wrap.appendChild(h('div', { class: 'ofn-lab' }, [T('howmuch', 'How much aloha?')])); wrap.appendChild(chips);
      if (big) wrap.appendChild(h('label', { class: 'ofn-oth' }, [T('or', 'or another amount'), inp]));
      return wrap;
    }
    function streamBtn(icon, t1, t2, step, tint) { var b = h('button', { type: 'button', class: 'ofn-stream' }, [h('span', { class: 'i', 'aria-hidden': 'true' }, [icon]), h('span', {}, [h('b', {}, [t1]), h('small', {}, [t2])]), h('span', { class: 'go', 'aria-hidden': 'true' }, ['›'])]); b.addEventListener('click', function () { fx.tint(tint); fx.burst(); go(step); }); return b; }
    function linkBtn(label, onClick) { var b = h('button', { type: 'button', class: 'ofn-lb' }, [label]); b.addEventListener('click', onClick); return b; }
    function drawQrInto(box, text, label) {
      function fail() { box.textContent = '(QR unavailable — copy the address instead)'; }
      function draw() { try { var q = W.__owhQR(0, 'M'); q.addData(text); q.make(); box.innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); var sv = box.firstChild; if (sv && sv.setAttribute) { sv.setAttribute('role', 'img'); sv.setAttribute('aria-label', label); } } catch (e) { fail(); } }
      if (W.__owhQR) return draw(); box.textContent = '…';
      var u = (opts.qrUrl && sameOrFrames(opts.qrUrl)) ? opts.qrUrl : FRAMES_ORIGIN + '/lib/owh-qr.min.js'; var sc = h('script', { src: u, async: true }); sc.onload = draw; sc.onerror = fail; D.head.appendChild(sc);
    }
    var wake = null;
    function keepAwake(on) {                                                // on stage the phone must not go dark while the audience scans
      try { if (on && !wake && W.navigator.wakeLock) { W.navigator.wakeLock.request('screen').then(function (l) { wake = l; l.addEventListener('release', function () { wake = null; }); }).catch(function () {}); } else if (!on && wake) { var l2 = wake; wake = null; l2.release().catch(function () {}); } } catch (e) {}
    }
    api.dispose = function () { keepAwake(false); };

    /* ── step: home — ONE screen. The biggest buttons are what a fan already has in their pocket ──────────────────── */
    function stepHome() {
      var box = h('div', {});
      title(opts.title || T('title', 'Bless Shaka & the ʻohana'), opts.sub || T('sub', 'Any amount, any way — thank you for the music 🎶')).forEach(function (n) { if (n) box.appendChild(n); });
      var stripe = h('a', { class: 'ofn-cta big', target: '_blank', rel: 'noopener noreferrer' }, [h('span', { class: 'i', 'aria-hidden': 'true' }, ['💳']), h('span', {}, [h('b', {}, [T('apple', 'Apple Pay · Google Pay')]), h('small', { 'data-sub': '1' })])]);
      var venmo = h('a', { class: 'ofn-cta alt', target: '_blank', rel: 'noopener noreferrer' }), paypal = h('a', { class: 'ofn-cta alt', target: '_blank', rel: 'noopener noreferrer' });
      function duo(a, icon, name, href, ok) { a.setAttribute('href', href); a.textContent = ''; a.appendChild(h('span', { class: 'i', 'aria-hidden': 'true' }, [icon])); a.appendChild(h('span', {}, [h('b', {}, [name]), h('small', {}, [ok ? '$' + amtStr(S.usd) : T('any', 'any amount')])])); }
      function paint() {
        var ok = S.usd >= 0.01 && S.usd <= MAX_USD;
        stripe.setAttribute('href', stripeUrl('once', S.usd));
        stripe.querySelector('[data-sub]').textContent = LINKS.onceFixed[S.usd] ? T('stripe.fixed', 'or card · one tap · $' + amtStr(S.usd)) : T('stripe.open', 'or card · choose the amount next');
        duo(venmo, '💜', 'Venmo', ok ? venmoUrl(S.usd) : LINKS.venmo, ok); duo(paypal, '🅿️', 'PayPal', ok ? paypalUrl(S.usd) : LINKS.paypal, ok);
      }
      var tz = ''; try { tz = W.Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
      var us = venmoLikely((W.navigator.languages && W.navigator.languages.length ? W.navigator.languages : [W.navigator.language]), tz);
      paint(); box.appendChild(amountPicker(paint, true)); box.appendChild(stripe); box.appendChild(h('div', { class: 'ofn-duo' + (us ? '' : ' one') }, us ? [venmo, paypal] : [paypal]));
      var wal = streamBtn('🔌', T('s.wallet', 'Crypto wallet'), T('s.wallet.sub', 'Any of ' + CHAINS.length + ' chains · Base is gas-free'), 'wallet', 1); wal.style.marginTop = '10px'; box.appendChild(wal);
      box.appendChild(h('div', { class: 'ofn-more' }, [
        linkBtn('🌍 ' + T('s.other.short', 'Exchange or other chain'), function () { fx.tint(3); go('other'); }),
        linkBtn('🌊 ' + T('s.monthly', 'Give monthly'), function () { S.freq = 'monthly'; go('card'); }),
        linkBtn('▦ ' + T('s.qr', 'QR for a friend'), function () { go('stage'); }),
        h('a', { href: LINKS.x402, target: '_blank', rel: 'noopener noreferrer' }, ['🤖 ' + T('agents', 'agents (x402)')])
      ]));
      box.appendChild(whereBox()); return [box];
    }
    function whereBox() {
      var d = h('details', {}, [h('summary', {}, [T('where', 'Where does it go?')]),
        h('p', {}, [T('where.p1', 'Every gift lands in one wallet — '), h('b', { class: 'notranslate', translate: 'no' }, [ENS]), ' ', h('span', { class: 'notranslate', translate: 'no' }, ['(' + short(PAYTO) + ')']), T('where.p2', ' — held by Shaka Lei Kaumaka until the orchestra has a multisig. A gift to the person is not a grant to the orchestra; both are welcome and we say which is which: '), h('a', { href: LINKS.lanes, target: '_blank', rel: 'noopener' }, [T('where.lanes', 'the two lanes')]), ' · ', h('a', { href: LINKS.ledger, target: '_blank', rel: 'noopener' }, [T('where.ledger', 'the open ledger')]), '.']),
        h('p', {}, [T('where.p3', 'No account, no tracking, nothing stored about you. Card gifts are handled by Stripe, PayPal or Venmo, who keep a small processing fee; wallet gifts keep nearly all of it.')])]);
      return d;
    }

    /* ── step: stage — a QR to show from the stage (or hold up to a friend); the phone stays awake ─────────────────── */
    function stepStage() {
      var url = opts.shareUrl || LINKS.fans, box = h('div', { class: 'ofn-stage' }), qr = h('div', { class: 'ofn-qr' });
      box.appendChild(back());
      box.appendChild(h('h2', { class: 'ofn-h', id: 'ofn-t', tabindex: '-1', 'data-focus': '1' }, [T('stage.t', 'Scan to bless Shaka 🌊')]));
      box.appendChild(qr); box.appendChild(h('div', { class: 'ofn-host notranslate', translate: 'no' }, [hostOf(url)]));
      box.appendChild(h('p', { class: 'ofn-sub' }, [T('stage.p', 'Point your camera at the square — or just type it. Apple Pay, Venmo, PayPal or crypto, any amount.')]));
      drawQrInto(qr, url, 'QR code: ' + hostOf(url)); keepAwake(true); return [box];
    }

    /* ── step: card (Stripe) ───────────────────────────────────────────────────────────────────────────────────── */
    function stepCard() {
      var box = h('div', {});
      var seg = h('div', { class: 'ofn-seg', role: 'group', 'aria-label': T('freq', 'how often') });
      var area = h('div', {});
      function paint() {
        seg.textContent = ''; area.textContent = '';
        seg.appendChild(chip('💧 ' + T('once', 'Just once'), S.freq === 'once', function () { S.freq = 'once'; paint(); }));
        seg.appendChild(chip('🌊 ' + T('monthly', 'Every month'), S.freq === 'monthly', function () { S.freq = 'monthly'; paint(); }, T('tide', 'the steady tide')));
        if (S.freq === 'monthly') {
          var t = tideFor(S.usd), chips = h('div', { class: 'ofn-chips', role: 'group', 'aria-label': T('tideamt', 'monthly amount') });
          TIDES.forEach(function (v) { chips.appendChild(chip('$' + v, t === v, function () { S.usd = v; fx.power(v); paint(); }, T('permonth', '/ month'))); });
          area.appendChild(h('div', { class: 'ofn-lab' }, [T('howmuch.m', 'How much each month?')])); area.appendChild(chips);
          area.appendChild(cta('🌊 ' + T('give', 'Give') + ' $' + t + ' ' + T('everymonth', 'every month') + ' ↗', stripeUrl('monthly', t)));
          area.appendChild(h('p', { class: 'ofn-note' }, [T('card.m', 'A drop every month is a tide. Cancel any time, no questions — only mahalo. You will see the amount again on the Stripe page before anything is charged.')]));
        } else {
          area.appendChild(h('p', { class: 'ofn-note', style: 'margin-top:4px' }, [T('card.o', 'You choose the amount on the next screen — from a single dollar to the whole sky.')]));
          area.appendChild(cta('💳 ' + T('toStripe', 'Continue to secure checkout') + ' ↗', stripeUrl('once', S.usd)));
        }
        area.appendChild(h('p', { class: 'ofn-note' }, [T('card.n', 'Cards, Apple Pay, Google Pay, Link and local methods — all handled by Stripe; we never see your card. A new tab opens.')]));
      }
      paint(); box.appendChild(back()); title(T('card.t', 'Card, Apple Pay or Google Pay'), T('card.sub', 'No crypto needed — a few taps and it is done.')).forEach(function (n) { if (n) box.appendChild(n); }); box.appendChild(seg); box.appendChild(area);
      return [box];
    }

    /* ── step: wallet (any chain) ──────────────────────────────────────────────────────────────────────────────── */
    function chainChips(onPick) {
      var wrap = h('div', {}); var chips = h('div', { class: 'ofn-chips', role: 'group', 'aria-label': T('chain', 'chain') });
      var list = CHAINS.slice().sort(function (a, b) { var ia = POPULAR.indexOf(a.chainId), ib = POPULAR.indexOf(b.chainId); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
      var shown = S.moreChains ? list : list.filter(function (c) { return POPULAR.indexOf(c.chainId) >= 0 || c.chainId === S.chain; });
      shown.forEach(function (c) { chips.appendChild(chip(c.name, S.chain === c.chainId, function () { S.chain = c.chainId; S.gasless = c.chainId === BASE_ID; onPick(); }, c.chainId === BASE_ID ? T('gasfree', 'gas-free') : null)); });
      if (!S.moreChains && list.length > shown.length) { var more = h('button', { type: 'button', class: 'ofn-chip' }, ['+' + (list.length - shown.length) + ' ' + T('morechains', 'more')]); more.addEventListener('click', function () { S.moreChains = true; render(); /* expanding the list must NOT close it (a chain pick does) */ }); chips.appendChild(more); }
      wrap.appendChild(h('div', { class: 'ofn-lab' }, [T('whichchain', 'Which chain?')])); wrap.appendChild(chips); return wrap;
    }
    function chainPicker(onPick) {                                           // one line: "Chain: Base · gas-free ▾" — the chips open only on a tap
      var wrap = h('div', { class: 'ofn-chain' }), c = chainById(S.chain) || chainById(BASE_ID);
      var btn = h('button', { type: 'button', class: 'ofn-chainbtn', 'aria-expanded': S.chainOpen ? 'true' : 'false' }, [h('span', { class: 'k' }, [T('chain', 'Chain') + ':']), h('b', {}, [c.name]), c.chainId === BASE_ID ? h('small', {}, ['· ' + T('gasfree', 'gas-free')]) : null, h('span', { class: 'v', 'aria-hidden': 'true' }, [S.chainOpen ? '▴' : '▾'])]);
      btn.addEventListener('click', function () { S.chainOpen = !S.chainOpen; render(); });
      wrap.appendChild(btn); if (S.chainOpen) wrap.appendChild(chainChips(function () { S.chainOpen = false; onPick(); })); return wrap;
    }
    function stepWallet() {
      var box = h('div', {}), pickBox = h('div', {}), st = status(), c = chainById(S.chain) || chainById(BASE_ID);
      var warn = h('p', { class: 'ofn-note' });
      function chainNote() {
        c = chainById(S.chain) || chainById(BASE_ID);
        warn.textContent = (c.chainId === BASE_ID ? T('note.base', '✨ Base: you only sign — the gas is paid for you.') : T('note.other', 'On ' + c.name + ' you send ' + c.usdc.symbol + ' from your own wallet and pay a little gas in ' + c.nativeCurrency.symbol + '. Switch to Base for a gas-free gift.')) + (c.note ? ' ' + c.note : '');
      }
      function mountPicker() {
        pickBox.textContent = ''; c = chainById(S.chain) || chainById(BASE_ID);
        var bad = checkUsd(S.usd, c); if (bad) { pickBox.appendChild(h('p', { class: 'ofn-note' }, [bad])); return; }
        pickBox.appendChild(h('div', { class: 'ofn-st' }, ['…']));
        loadConfig().then(function (cfg) {
          if (!cfg.enabled || cfg.disabled.indexOf(c.chainId) >= 0) { pickBox.textContent = ''; pickBox.appendChild(h('p', { class: 'ofn-note' }, [cfg.message || (cfg.disabled.indexOf(c.chainId) >= 0 ? c.name + T('paused', ' is resting right now — try another chain 🌺') : '')])); return; }
          return loadOwh().then(function (OWH) {
            pickBox.textContent = '';
            hookFor(c);
            var picker = OWH.connect({ hook: c.chainId === BASE_ID, surface: S.surface, usdc: c.usdc.address, payTo: PAYTO, chain: c.chainId, usd: function () { return S.usd; }, rail: function () { return 'c' + c.chainId; }, t: T,
              send: function (provider, info) { return sendWith(provider, info, picker, st); } });
            S.picker = picker; S.pickerChain = c.chainId; if (c.chainId !== BASE_ID) picker.el.setAttribute('data-ofn-nobase', '1'); pickBox.appendChild(picker.el); picker.refresh();   /* OWH draws its lazy parts (sign-up hook, QR) only once its root is visible */
            if (opts.pending && opts.pending.go && !S.autoDone) { S.autoDone = true; picker.autostart(opts.pending); }
          });
        }).catch(function (e) { pickBox.textContent = ''; pickBox.appendChild(h('p', { class: 'ofn-note' }, [T('owh.fail', 'The wallet picker could not load — copy the address from “exchange or another chain” instead. ') + esc(errMsg(e))])); });
      }
      var amt = amountPicker(function () { chainNote(); if (S.picker && S.pickerChain === S.chain) { var bad = checkUsd(S.usd, c); if (bad) mountPicker(); else S.picker.refresh(); } else mountPicker(); });
      var chains = chainPicker(function () { render(); });
      box.appendChild(back()); title(T('wallet.t', 'Give from your wallet')).forEach(function (n) { if (n) box.appendChild(n); });
      box.appendChild(amt); box.appendChild(chains); chainNote(); box.appendChild(warn); box.appendChild(pickBox); box.appendChild(st);
      box.appendChild(h('p', { class: 'ofn-note' }, [T('wallet.sub', 'The wallet signs — this page never sees a key.')]));
      mountPicker(); return [box];
    }
    function hookFor(c) {                                                    // OWH's "no wallet yet? sign up in 10 s" row is a passkey wallet that pays through Base Pay — Base only
      var cur = W.OWH_SIGNUP; if (cur && (cur.href || typeof cur.open === 'function')) S.hookReal = cur;     // remember the real hook the first time we see it
      if (c.chainId === BASE_ID) { if (S.hookReal) W.OWH_SIGNUP = S.hookReal; else if (cur && !cur.href && typeof cur.open !== 'function') W.OWH_SIGNUP = undefined; }
      else W.OWH_SIGNUP = {};                                              // truthy but without href/open → OWH neither loads nor renders the row
    }
    function loadOwh() {
      if (W.OWH && W.OWH.connect) return Promise.resolve(W.OWH);
      if (S.owh) return S.owh;
      S.owh = new Promise(function (res, rej) {
        var u = opts.owhUrl || OWH_URL; if (!sameOrFrames(u)) return rej(new Error('blocked url'));
        var s = h('script', { src: u, async: true }); s.onload = function () { (W.OWH && W.OWH.connect) ? res(W.OWH) : rej(new Error('owh missing')); }; s.onerror = function () { rej(new Error('owh did not load')); }; D.head.appendChild(s);
      });
      S.owh.catch(function () { S.owh = null; }); return S.owh;
    }

    /* ── the two senders ────────────────────────────────────────────────────────────────────────────────────────── */
    function explain(e, st, c) {
      var m = errMsg(e), code = e && e.code;
      if (code === 4001 || /user (rejected|denied)|rejected the request/i.test(m)) return T('e.declined', '🌺 declined for now — the aloha waits patiently');
      if (code === -32002) return T('e.pending', 'your wallet already has a request open — look in the wallet app');
      if (e && e.ofn === 'balance') return m;
      if (/insufficient funds/i.test(m)) return T('e.gas', 'not enough ' + (c ? c.nativeCurrency.symbol : 'gas') + ' for the network fee on ' + (c ? c.name : 'this chain') + ' — try Base (gas-free)');
      return T('e.generic', '⚠️ a hiccup: ') + m.slice(0, 220) + T('e.nothing', ' — nothing was sent unless your wallet shows it');
    }
    async function ensureChain(p, c) {
      var cur = Number(await p.request({ method: 'eth_chainId' }));
      if (cur === c.chainId) return;
      try { await p.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: chainHex(c.chainId) }] }); }
      catch (e) {
        if (e && e.code === 4001) throw e;
        var ad = c.add || { chainName: c.name, nativeCurrency: c.nativeCurrency, rpcUrls: c.rpcUrls, blockExplorerUrls: [c.explorer] };
        await p.request({ method: 'wallet_addEthereumChain', params: [{ chainId: chainHex(c.chainId), chainName: ad.chainName, nativeCurrency: ad.nativeCurrency, rpcUrls: ad.rpcUrls, blockExplorerUrls: ad.blockExplorerUrls }] });
      }
      if (Number(await p.request({ method: 'eth_chainId' })) !== c.chainId) throw new Error('your wallet is still on another chain');
    }
    async function giftDirect(p, c, st, picker) {                           // plain ERC-20 transfer from the visitor's own wallet
      say(st, T('s.connect', '🔌 connecting your wallet…'));
      var accts = await p.request({ method: 'eth_requestAccounts' }), from = accts && accts[0]; if (!isAddr(from)) throw new Error('the wallet gave no account');
      say(st, T('s.switch', '🌉 switching to ' + c.name + '…')); await ensureChain(p, c);
      var tok = c.usdc.address, units = toUnits(S.usd, c.usdc.decimals);
      var code = await p.request({ method: 'eth_getCode', params: [tok, 'latest'] }); if (!code || code === '0x') throw new Error('no token contract at the expected address on ' + c.name + ' — refusing');
      var sym = abiString(await p.request({ method: 'eth_call', params: [{ to: tok, data: '0x95d89b41' }, 'latest'] })); if (sym.toUpperCase() !== c.usdc.symbol.toUpperCase()) throw new Error('the token at that address on ' + c.name + ' calls itself “' + sym.slice(0, 12) + '”, expected ' + c.usdc.symbol + ' — refusing');
      var dec = parseInt(await p.request({ method: 'eth_call', params: [{ to: tok, data: '0x313ce567' }, 'latest'] }), 16); if (dec !== c.usdc.decimals) throw new Error('the token on ' + c.name + ' reports ' + dec + ' decimals, expected ' + c.usdc.decimals + ' — refusing');
      var bal = BigInt(await p.request({ method: 'eth_call', params: [{ to: tok, data: balanceData(from) }, 'latest'] }));
      if (bal < units) { var er = new Error(T('e.bal', 'you have ' + fromUnits(bal, c.usdc.decimals) + ' ' + c.usdc.symbol + ' on ' + c.name + ' — pick a smaller gift or another chain')); er.ofn = 'balance'; throw er; }
      say(st, T('s.confirm', '✍️ confirm the gift in your wallet…'));
      var hash = await p.request({ method: 'eth_sendTransaction', params: [{ from: from, to: tok, data: transferData(PAYTO, units), value: '0x0' }] });
      if (!/^0x[0-9a-fA-F]{64}$/.test(hash || '')) throw new Error('the wallet returned no transaction hash');
      say(st, T('s.wait', '⏳ sent — waiting for ' + c.name + ' to confirm…'));
      var ok = null; for (var i = 0; i < 60 && ok === null; i++) {
        await new Promise(function (r) { setTimeout(r, 2000); });
        try { var rc = await p.request({ method: 'eth_getTransactionReceipt', params: [hash] }); if (rc) ok = (rc.status === '0x1' || rc.status === 1); } catch (e) {}
      }
      if (ok === false) throw new Error('the transaction failed on-chain (' + short(hash) + ') — nothing was transferred');
      return { tx: hash, chain: c, usd: S.usd, confirmed: ok === true };
    }
    async function rail(path, body) {                                         // the gift-rail Worker's Base lane; every failure here is ofn='facilitator' → the card offers the plain transfer
      var r; try { r = await W.fetch(FACILITATOR + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); }
      catch (e) { var n = new Error(T('e.net', 'couldn’t reach the gift rail — nothing left your wallet')); n.ofn = 'facilitator'; throw n; }
      try { return await r.json(); } catch (e) { var m = new Error(T('e.net2', 'the gift rail sent a reply we could not read — nothing left your wallet')); m.ofn = 'facilitator'; throw m; }
    }
    var NOUSDC = /insufficient_balance/;                                      // a wallet with no USDC on Base: a plain transfer needs USDC too → say so, offer no retry button
    function words(OWH, code) {                                               // plain words for the facilitator's reason codes (OWH.why is the one place that knows them); the raw code only as the last resort
      code = String(code || '');
      try { if (OWH && typeof OWH.why === 'function') return String(OWH.why(code)); } catch (e) {}
      return NOUSDC.test(code) ? 'not enough USDC on Base in this wallet' : 'the gift rail did not accept it' + (code ? ' (' + code + ')' : '');
    }
    async function giftGasless(OWH, p, info, c, st) {                        // Base · EIP-3009 · PayAI facilitator (the proven x402 path)
      var A = await OWH.authorize(p, { usd: S.usd, payTo: PAYTO, usdc: c.usdc.address, chain: BASE_ID, step: function (w) { say(st, w === 'connect' ? T('s.connect', '🔌 connecting your wallet…') : w === 'switch' ? T('s.switch', '🌉 switching to Base…') : T('s.sign', '✍️ sign the aloha (gas-free for you)…')); } });
      var payload = { x402Version: 1, scheme: 'exact', network: 'base', payload: { signature: A.signature, authorization: A.authorization } };
      var req = { scheme: 'exact', network: 'base', maxAmountRequired: A.authorization.value, resource: RESOURCE, description: 'pennies of aloha 🤙 — every drop keeps a door open', mimeType: 'application/json', payTo: PAYTO, maxTimeoutSeconds: 300, asset: c.usdc.address, extra: { name: 'USD Coin', version: '2' } };
      say(st, T('s.verify', '🌊 verifying…'));
      var vj = await rail('/verify', { x402Version: 1, paymentPayload: payload, paymentRequirements: req });
      if (!vj.isValid) {
        var rc = String(vj.invalidReason || 'unknown'), broke = NOUSDC.test(rc);
        var e1 = new Error(esc(words(OWH, rc)) + T('e.verify2', ' — nothing left your wallet') + (broke ? T('e.verify3', '. Pick a smaller gift, or give by card or PayPal instead.') : ''));
        e1.ofn = broke ? 'balance' : 'facilitator'; throw e1;
      }
      say(st, T('s.settle', '🌊 settling on Base… (seconds)'));
      var sj = await rail('/settle', { x402Version: 1, paymentPayload: payload, paymentRequirements: req });
      if (!sj.success && /settlement_pending/.test(String(sj.errorReason || ''))) return { tx: null, chain: c, usd: S.usd, confirmed: false };   // PayAI: unresolved, may still land — thank, don't fail
      if (!sj.success) { var e2 = new Error(esc(words(OWH, sj.error || sj.errorReason || 'unknown')) + T('e.verify2', ' — nothing left your wallet')); e2.ofn = 'facilitator'; throw e2; }
      var tx = /^0x[0-9a-fA-F]{64}$/.test(sj.transaction || '') ? sj.transaction : null;
      return { tx: tx, chain: c, usd: S.usd, confirmed: true };
    }
    async function sendWith(p, info, picker, st) {
      if (S.busy) return; var c = chainById(S.chain);
      try {
        S.busy = true; if (picker) picker.setBusy(true);
        var bad = checkUsd(S.usd, c); if (bad) { say(st, bad); return; }
        var cfg = await loadConfig(true); if (!cfg.enabled || cfg.disabled.indexOf(c.chainId) >= 0) { say(st, cfg.message || T('paused2', 'this chain is resting right now 🌺')); return; }
        var res;
        if (c.chainId === BASE_ID && S.gasless && W.OWH && W.OWH.authorize) {
          try { res = await giftGasless(W.OWH, p, info, c, st); }
          catch (e) { if (e && e.ofn === 'facilitator') { say(st, ''); st.appendChild(D.createTextNode(errMsg(e) + ' ')); var again = h('button', { type: 'button', class: 'ofn-sm' }, ['↻ ' + T('plain', 'send a plain transfer instead (a few cents of gas)')]); again.addEventListener('click', function () { S.gasless = false; again.remove(); sendWith(p, info, picker, st); }); st.appendChild(again); return; } throw e; }
        } else res = await giftDirect(p, c, st, picker);
        thanks(res);
      } catch (e) { say(st, explain(e, st, c)); }
      finally { S.busy = false; if (picker) picker.setBusy(false); }
    }
    function thanks(res) {
      S.thanks = res; fx.tint(0); fx.burst(); setTimeout(function () { fx.burst(); }, 450);
      try { W.dispatchEvent(new W.CustomEvent('fountain:gift', { detail: { tx: res.tx, chainId: res.chain && res.chain.chainId, usd: res.usd } })); W.dispatchEvent(new W.CustomEvent('x402:gift', { detail: { tx: res.tx, amount: res.usd } })); } catch (e) {}
      go('thanks');
    }
    function stepThanks() {
      var r = S.thanks || {}, url = txUrl(r.chain, r.tx), box = h('div', { class: 'ofn-thanks' });
      box.appendChild(h('div', { class: 'big', id: 'ofn-t', tabindex: '-1', 'data-focus': '1' }, ['🌺 ' + T('mahalo', 'Mahalo nui!')]));
      box.appendChild(h('p', { class: 'ofn-sub' }, [(r.tx ? T('thanks.p', 'Your blessing is on its way into the fountain — it keeps the doors open and the music open source. Shaka and the ʻohana thank you.') : T('thanks.p0', 'Thank you — your gift keeps the doors open and the music open source. Shaka and the ʻohana are smiling. If your payment page said it went through, it did.'))]));
      if (url) box.appendChild(h('p', { class: 'ofn-note' }, ['✦ ', h('a', { href: url, target: '_blank', rel: 'noopener' }, [T('receipt', 'recorded on-chain') + ' · ' + short(r.tx)]), ' ✦']));
      var row = h('div', { class: 'ofn-row', style: 'justify-content:center' });
      if (W.navigator.share) { var sh = h('button', { type: 'button', class: 'ofn-sm' }, ['🌊 ' + T('share', 'share the fountain')]); sh.addEventListener('click', function () { W.navigator.share({ title: T('title', 'Bless Shaka & the ʻohana'), text: T('share.t', 'A fountain of blessings for the open source orchestra 🌊'), url: LINKS.share }).catch(function () {}); }); row.appendChild(sh); }
      else row.appendChild(copyBtn(LINKS.share, '🌊 ' + T('share.copy', 'copy the fountain link')));
      var again = h('button', { type: 'button', class: 'ofn-sm' }, ['✨ ' + T('again', 'bless again')]); again.addEventListener('click', function () { go('home'); }); row.appendChild(again);
      box.appendChild(row); return [box];
    }

    /* ── step: other (exchange · another chain · bridge · Hedera) ───────────────────────────────────────────────── */
    function stepOther() {
      var box = h('div', {}); var c = chainById(S.chain) || chainById(BASE_ID); var qrBox = h('div', { class: 'ofn-qr', hidden: true }), qrBtn, modeBtn;
      box.appendChild(back()); title(T('other.t', 'From an exchange or another chain'), T('other.sub', 'Send it yourself — no wallet connection needed.')).forEach(function (n) { if (n) box.appendChild(n); });
      var chains = chainChips(function () { render(); }); box.appendChild(chains);
      var card = h('div', { class: 'ofn-card' }, [h('h4', {}, [T('other.send', 'Send ' + c.usdc.symbol + ' on ' + c.name + ' to:')]),
        h('div', { class: 'ofn-addr notranslate', translate: 'no' }, [PAYTO]),
        h('p', { class: 'ofn-note' }, [h('b', { class: 'notranslate', translate: 'no' }, [ENS]), ' · ', T('other.only', 'only ' + c.usdc.symbol + ' on ' + c.name + ' — other tokens or chains may be lost. Exchange withdrawals: choose the “' + c.name + '” network.')])]);
      var row = h('div', { class: 'ofn-row' }); row.appendChild(copyBtn(PAYTO, '📋 ' + T('copy.addr', 'copy address')));
      qrBtn = h('button', { type: 'button', class: 'ofn-sm', 'aria-expanded': 'false' }, ['▦ ' + T('qr', 'show QR')]); row.appendChild(qrBtn);
      card.appendChild(row); card.appendChild(qrBox); box.appendChild(card);
      var qrCap = h('p', { class: 'ofn-note', hidden: true }, [T('qr.cap', 'Scan with MetaMask · Coinbase Wallet · Trust · Rainbow — the amount is filled in when your wallet supports it.')]); card.appendChild(qrCap);
      function drawQr() { drawQrInto(qrBox, S.qrAddrOnly ? PAYTO : eip681(c, Math.max(S.usd, 0.01)), 'QR code: pay ' + c.usdc.symbol + ' on ' + c.name + ' to the ʻohana wallet'); }
      qrBtn.addEventListener('click', function () { var on = qrBox.hidden; qrBox.hidden = !on; qrCap.hidden = !on; qrBtn.setAttribute('aria-expanded', on ? 'true' : 'false'); if (on) { drawQr(); if (!modeBtn) { modeBtn = h('button', { type: 'button', class: 'ofn-sm' }, ['⌗ ' + T('qr.addr', 'address only')]); modeBtn.addEventListener('click', function () { S.qrAddrOnly = !S.qrAddrOnly; modeBtn.textContent = S.qrAddrOnly ? '⌗ ' + T('qr.full', 'with amount') : '⌗ ' + T('qr.addr', 'address only'); drawQr(); }); row.appendChild(modeBtn); } } });
      if (c.chainId !== BASE_ID) card.appendChild(h('p', { class: 'ofn-note' }, [T('other.base', 'Cheapest for small gifts: ' + chainById(BASE_ID).name + '. Most exchanges (Coinbase, Binance, Kraken…) can withdraw USDC straight to Base.')]));
      var br = h('div', { class: 'ofn-card' }, [h('h4', {}, ['🌉 ' + T('bridge.t', 'Another chain or token — Solana, Bitcoin, 60+ chains')]),
        h('p', { class: 'ofn-note', style: 'margin-top:0' }, [T('bridge.p', 'Jumper (a bridge by LI.FI) opens with the destination already filled in: whatever you send arrives as USDC in the ʻohana wallet on Base. Their fees and terms apply; you pick the token and amount there.')]),
        cta('🌉 ' + T('bridge.go', 'Open Jumper — pay from anywhere') + ' ↗', jumperUrl(0), 'gold')]); box.appendChild(br);
      var he = h('div', { class: 'ofn-card' }, [h('h4', {}, ['ℏ ' + T('hedera', 'Hedera · HBAR')]), h('div', { class: 'ofn-addr notranslate', translate: 'no' }, [HEDERA]), h('div', { class: 'ofn-row' }, [copyBtn(HEDERA, '📋 ' + T('copy.acct', 'copy account'))])]); box.appendChild(he);
      return [box];
    }

    /* ── render ─────────────────────────────────────────────────────────────────────────────────────────────────── */
    function render() {
      body.textContent = '';
      if (S.step !== 'stage') keepAwake(false);
      root.classList.toggle('ofn-home', S.step === 'home');
      var parts = S.step === 'card' ? stepCard() : S.step === 'wallet' ? stepWallet() : S.step === 'other' ? stepOther() : S.step === 'thanks' ? stepThanks() : S.step === 'stage' ? stepStage() : stepHome();
      parts.forEach(function (n) { if (n) body.appendChild(n); });
    }
    api.render = render; render();
    return api;
  }

  /* ═══ 8 · OPEN / CLOSE / MOUNT ══════════════════════════════════════════════════════════════════════════════════════ */
  function lockScroll(on) { var de = D.documentElement; if (on) { de.setAttribute('data-ofn-open', '1'); de.style.setProperty('overflow', 'hidden'); } else { de.removeAttribute('data-ofn-open'); de.style.removeProperty('overflow'); } }
  function open(opts) {
    opts = opts || {}; if (UI) { try { UI.api.root.querySelector('[data-focus]').focus(); } catch (e) {} return UI; }
    injectCss(); if (opts.configUrl && sameOrFrames(opts.configUrl)) cfgUrl = opts.configUrl;
    var ovl = h('div', { class: 'ofn ofn-ovl', 'data-ofn': '1' }); var inst = instance(opts, 'sheet'); ovl.appendChild(inst.root); D.body.appendChild(ovl); lockScroll(true);
    var onKey = function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      var f = Array.prototype.filter.call(inst.root.querySelectorAll('a[href],button:not([disabled]),input,summary,[tabindex="0"]'), function (n) { return !n.hidden && n.offsetParent !== null; }); if (!f.length) return;
      var first = f[0], last = f[f.length - 1], a = D.activeElement;
      if (e.shiftKey && (a === first || !inst.root.contains(a))) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && (a === last || !inst.root.contains(a))) { e.preventDefault(); first.focus(); }
    };
    D.addEventListener('keydown', onKey, true);
    var xb = inst.root.querySelector('.ofn-x'); if (xb) xb.addEventListener('click', close);
    ovl.addEventListener('click', function (e) { if (e.target === ovl) close(); });
    var onVis = function () { /* the loop itself skips frames while hidden */ }; D.addEventListener('visibilitychange', onVis);
    var onResize = function () { inst.fx.resize(); }; W.addEventListener('resize', onResize);
    UI = { api: inst, ovl: ovl, onKey: onKey, onVis: onVis, onResize: onResize };
    if (opts.step && ['card', 'wallet', 'other', 'stage', 'thanks'].indexOf(opts.step) >= 0) inst.S.step = opts.step;
    if (opts.pending) inst.S.step = 'wallet';
    inst.render(); inst.fx.start();
    try { (inst.root.querySelector('[data-focus]') || xb).focus({ preventScroll: true }); } catch (e) {}
    try { W.dispatchEvent(new W.CustomEvent('fountain:open', { detail: { surface: inst.S.surface } })); } catch (e) {}
    return UI;
  }
  function close() {
    if (!UI) return; var u = UI; UI = null; u.api.fx.stop(); u.api.dispose(); D.removeEventListener('keydown', u.onKey, true); D.removeEventListener('visibilitychange', u.onVis); W.removeEventListener('resize', u.onResize);
    u.ovl.remove(); lockScroll(false); try { if (u.api.S.lastFocus && u.api.S.lastFocus.focus) u.api.S.lastFocus.focus({ preventScroll: true }); } catch (e) {}
    try { W.dispatchEvent(new W.CustomEvent('fountain:close')); } catch (e) {}
  }
  function pending(surface) {                                               // call once on load: returns {usd, rail, go} or null, and removes ?osogift from the address bar
    try {
      var P = parseHandoff(W.location.href, surface || 'fountain'); if (!P) return null;
      var u = new URL(W.location.href); u.searchParams.delete('osogift'); W.history.replaceState(W.history.state, '', u.pathname + u.search + u.hash); return P;
    } catch (e) { return null; }
  }
  function mount(el, opts) {                                                // inline "page mode": the fountain as the heart of a page (blessingpool.com, the preview)
    opts = opts || {}; injectCss(); if (opts.configUrl && sameOrFrames(opts.configUrl)) cfgUrl = opts.configUrl;
    var inst = instance(opts, 'page'); el.textContent = ''; el.appendChild(inst.root);
    if (opts.step && ['card', 'wallet', 'other', 'stage', 'thanks'].indexOf(opts.step) >= 0) inst.S.step = opts.step; if (/[?&]stage(=|&|#|$)/.test(W.location.search)) inst.S.step = 'stage'; if (opts.pending) inst.S.step = 'wallet';
    inst.render(); inst.fx.start(); if (inst.S.step === 'thanks') { inst.fx.tint(0); setTimeout(function () { inst.fx.burst(); }, 500); setTimeout(function () { inst.fx.burst(); }, 1100); }
    var onResize = function () { inst.fx.resize(); }; W.addEventListener('resize', onResize);
    return { api: inst, destroy: function () { inst.fx.stop(); inst.dispose(); W.removeEventListener('resize', onResize); el.textContent = ''; } };
  }

  W.OSOFountain = { version: VERSION, open: open, close: close, mount: mount, pending: pending, strings: {}, isOpen: function () { return !!UI; }, _core: core };
})(typeof window !== 'undefined' ? window : globalThis);
