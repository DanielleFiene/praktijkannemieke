/**
 * Toestemmings- en minderjarigen-secties in het kennismakingsformulier (.docx).
 * Vereist: npm install jszip (devDependency).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const docPath = path.join(
	root,
	'assets/docs/Kennismakingsformulier-NEI-coaching-en-therapie.docx'
);

let JSZip;
try {
	JSZip = (await import('jszip')).default;
} catch {
	console.error('Installeer eerst: npm install jszip --save-dev');
	process.exit(1);
}

function esc(text) {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function para(text, bold = false) {
	const rPr = bold
		? '<w:rPr><w:rFonts w:ascii="Tahoma" w:hAnsi="Tahoma" w:cs="Tahoma"/><w:b/><w:szCs w:val="22"/></w:rPr>'
		: '<w:rPr><w:rFonts w:ascii="Tahoma" w:hAnsi="Tahoma" w:cs="Tahoma"/><w:szCs w:val="22"/></w:rPr>';
	return `<w:p><w:pPr><w:pStyle w:val="Plattetekst"/></w:pPr><w:r>${rPr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function emptyField(label) {
	return `${para(label, true)}${para('')}`;
}

const GEZAG_TEKST = [
	'Bij gescheiden ouders met gezamenlijk gezag geven beide ouders toestemming.',
	'De toestemming van de andere ouder kan ook schriftelijk of per e-mail worden gegeven.',
	'Heeft één ouder het gezag alleen, dan volstaat diens toestemming.',
];

const GEZAG_PARAS = GEZAG_TEKST.map((t) => para(t)).join('');

const GEZAG_CHECKBOX = para(
	'☐  Ik heb als enige het ouderlijk gezag over de minderjarige cliënt (vul dan ouder/voogd 2 niet in).'
);

const OLD_GEZAG_ZIN =
	'Bij gescheiden ouders met gezamenlijk gezag geven beide ouders toestemming, tenzij anders met de praktijk is afgesproken.';

function fixGezagWording(xml) {
	if (!xml.includes(OLD_GEZAG_ZIN)) return xml;
	const oldBlock = para(OLD_GEZAG_ZIN);
	if (xml.includes(oldBlock)) {
		return xml.replace(oldBlock, GEZAG_PARAS);
	}
	const re = new RegExp(
		`<w:p><w:pPr><w:pStyle w:val="Plattetekst"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Tahoma" w:hAnsi="Tahoma" w:cs="Tahoma"/><w:szCs w:val="22"/></w:rPr><w:t xml:space="preserve">${OLD_GEZAG_ZIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</w:t></w:r></w:p>`
	);
	return xml.replace(re, GEZAG_PARAS);
}

/** Gezagtekst boven handtekening; geen aparte AVG-toestemmingsparagraaf; onderaan leeg. */
function applyGezagLayout(xml) {
	let out = xml;
	const toestemmingRe =
		/<w:p><w:pPr><w:pStyle w:val="Plattetekst"\/><\/w:pPr><w:r><w:rPr><w:rFonts w:ascii="Tahoma" w:hAnsi="Tahoma" w:cs="Tahoma"\/><w:b\/><w:szCs w:val="22"\/><\/w:rPr><w:t xml:space="preserve">Toestemming verwerking persoonsgegevens<\/w:t><\/w:r><\/w:p>\s*<w:p><w:pPr><w:pStyle w:val="Plattetekst"\/><\/w:pPr><w:r><w:rPr><w:rFonts w:ascii="Tahoma" w:hAnsi="Tahoma" w:cs="Tahoma"\/><w:szCs w:val="22"\/><\/w:rPr><w:t xml:space="preserve">Ik geef toestemming aan Praktijk Annemieke om mijn \(bijzondere\) persoonsgegevens te verwerken voor het uitvoeren van de behandeling en de daarmee samenhangende administratie, zoals beschreven in de privacyverklaring op praktijkannemieke\.nl\.<\/w:t><\/w:r><\/w:p>/;
	if (toestemmingRe.test(out)) {
		out = out.replace(toestemmingRe, GEZAG_PARAS);
	}
	const trailingGezagRe = new RegExp(
		`${GEZAG_CHECKBOX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*${GEZAG_PARAS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
	);
	if (trailingGezagRe.test(out)) {
		out = out.replace(trailingGezagRe, GEZAG_CHECKBOX);
	}
	return out;
}

const appendix = `
${para('', false)}
${GEZAG_PARAS}
${para('')}
${para('Datum: ........................................          Handtekening: ........................................')}
${para('', false)}
${para('Alleen invullen bij minderjarige cliënt (jonger dan 16 jaar)', true)}
${para('Laat dit gedeelte leeg als de cliënt 16 jaar of ouder is.')}
${emptyField('Naam minderjarige:')}
${emptyField('Geboortedatum minderjarige:')}
${para('Ouder/voogd 1', true)}
${emptyField('Naam:')}
${para('Datum: ........................................          Handtekening: ........................................')}
${para('Ouder/voogd 2 (indien van toepassing)', true)}
${emptyField('Naam:')}
${para('Datum: ........................................          Handtekening: ........................................')}
${GEZAG_CHECKBOX}
`;

const buf = fs.readFileSync(docPath);
const zip = await JSZip.loadAsync(buf);
const docFile = zip.file('word/document.xml');
if (!docFile) throw new Error('word/document.xml ontbreekt');
let xml = await docFile.async('string');
const before = xml;

xml = fixGezagWording(xml);
xml = applyGezagLayout(xml);

const marker = '</w:body>';
const needsAppendix =
	!xml.includes('Alleen invullen bij minderjarige cliënt (jonger dan 16 jaar)');
if (needsAppendix) {
	if (!xml.includes(marker)) throw new Error('Onverwachte document.xml-structuur');
	xml = xml.replace(marker, `${appendix}${marker}`);
}

if (xml === before) {
	console.log('Geen wijziging nodig.');
	process.exit(0);
}

zip.file('word/document.xml', xml);
const out = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(docPath, out);
console.log('Bijgewerkt:', path.relative(root, docPath));
