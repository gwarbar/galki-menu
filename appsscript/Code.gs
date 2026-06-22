/* ═══════════════════════════════════════════════════════════════════════════
   Gałki — Google Apps Script REST API
   Deploy as: Web App → Execute as: Me → Who has access: Anyone

   Script Properties (Project Settings → Script Properties):
     PIN  →  your 4-digit admin PIN (e.g. 2137)

   Sheets required in the active spreadsheet:
     smaki   (columns: nazwa | kategoria | aktywny | brak | kolejnosc | nazwa_en | alkohol | wegan)
     polewki (columns: nazwa | aktywny | brak | alkohol | nazwa_en | wegan)
     meta    (A1="lastUpdate", B1=timestamp number)
═══════════════════════════════════════════════════════════════════════════ */

/* ── GET ──────────────────────────────────────────────────────────────── */
function doGet(e) {
  const action = (e.parameter && e.parameter.action) || 'flavors';
  let output;

  try {
    if (action === 'ping') {
      output = { lastUpdate: getLastUpdate_() };
    } else {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      output = {
        lastUpdate: getLastUpdate_(),
        smaki:      readSmaki_(ss.getSheetByName('smaki')),
        polewki:    readPolewki_(ss.getSheetByName('polewki'))
      };
    }
  } catch (err) {
    output = { error: err.toString() };
  }

  return jsonResponse_(output);
}

/* ── POST ─────────────────────────────────────────────────────────────── */
function doPost(e) {
  let output;

  try {
    const body   = JSON.parse(e.postData.contents);
    const pin    = body.pin    || '';
    const action = body.action || '';
    const data   = body.data   || {};

    /* PIN check */
    const correctPin = PropertiesService.getScriptProperties().getProperty('PIN');
    if (!correctPin) {
      return jsonResponse_({ ok: false, error: 'PIN not configured in Script Properties' });
    }
    if (pin !== correctPin) {
      return jsonResponse_({ ok: false, error: 'Unauthorized' });
    }

    if (action === 'save') {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      writeSmaki_(ss.getSheetByName('smaki'),     data.smaki   || []);
      writePolewki_(ss.getSheetByName('polewki'), data.polewki || []);
      bumpLastUpdate_(ss);
      output = { ok: true };
    } else {
      output = { ok: false, error: 'Unknown action: ' + action };
    }
  } catch (err) {
    output = { ok: false, error: err.toString() };
  }

  return jsonResponse_(output);
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function getLastUpdate_() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('meta');
  if (!sheet) return 0;
  return sheet.getRange('B1').getValue() || 0;
}

function bumpLastUpdate_(ss) {
  const sheet = ss.getSheetByName('meta');
  if (!sheet) return;
  sheet.getRange('A1').setValue('lastUpdate');
  sheet.getRange('B1').setValue(Date.now());
}

function readSmaki_(sheet) {
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  /* Skip header row (row 0) if first cell looks like a header */
  const start = (rows.length > 0 && rows[0][0] === 'nazwa') ? 1 : 0;
  return rows.slice(start).map(r => ({
    nazwa:     String(r[0] || ''),
    kategoria: String(r[1] || 'śmietankowy'),
    aktywny:   r[2] === true  || r[2] === 'TRUE'  || r[2] === 1,
    brak:      r[3] === true  || r[3] === 'TRUE'  || r[3] === 1,
    kolejnosc: Number(r[4])   || 0,
    nazwa_en:  String(r[5]    || ''),
    alkohol:   r[6] === true  || r[6] === 'TRUE' || r[6] === 1,
    wegan:     r[7] === true  || r[7] === 'TRUE' || r[7] === 1
  })).filter(r => r.nazwa.trim() !== '');
}

function readPolewki_(sheet) {
  if (!sheet) return [];
  const rows  = sheet.getDataRange().getValues();
  const start = (rows.length > 0 && rows[0][0] === 'nazwa') ? 1 : 0;
  return rows.slice(start).map(r => ({
    nazwa:   String(r[0] || ''),
    aktywny: r[1] === true || r[1] === 'TRUE' || r[1] === 1,
    brak:    r[2] === true || r[2] === 'TRUE' || r[2] === 1,
    alkohol:  r[3] === true || r[3] === 'TRUE' || r[3] === 1,
    nazwa_en: String(r[4] || ''),
    wegan:    r[5] === true || r[5] === 'TRUE' || r[5] === 1
  })).filter(r => r.nazwa.trim() !== '');
}

function writeSmaki_(sheet, smaki) {
  if (!sheet) return;
  /* Clear data rows (keep header if present) */
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 8).clearContent();
  }
  if (smaki.length === 0) return;

  const rows = smaki.map((s, i) => [
    String(s.nazwa   || ''),
    String(s.kategoria || 'śmietankowy'),
    s.aktywny ? true : false,
    s.brak    ? true : false,
    Number(s.kolejnosc) || (i + 1),
    String(s.nazwa_en   || ''),
    s.alkohol ? true : false,
    s.wegan   ? true : false
  ]);
  sheet.getRange(2, 1, rows.length, 8).setValues(rows);
}

function writePolewki_(sheet, polewki) {
  if (!sheet) return;
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 6).clearContent();
  }
  if (polewki.length === 0) return;

  const rows = polewki.map(p => [
    String(p.nazwa    || ''),
    p.aktywny ? true : false,
    p.brak    ? true : false,
    p.alkohol ? true : false,
    String(p.nazwa_en || ''),
    p.wegan   ? true : false
  ]);
  sheet.getRange(2, 1, rows.length, 6).setValues(rows);
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
