const CAREERS = "Careers";
const TERMS = "terms";
const ASSETS = "Assets";

const UNIVERSITY = "University";
const NAVY_ACADEMY = "Army Academy";
const MARINE_ACADEMY = "Marine Academy";
const ARMY_ACADEMY = "Navy Academy";
const AGENT = "Agent";
const DRIFTER = "Drifter";
const DRAFT = "Draft";

const STR = "STR";
const DEX = "DEX";
const END = "END";
const INT = "INT";
const SOC = "SOC";
const EDU = "EDU";

const QUEUE = "queue";

const SkillSets = ["Personal Development", "Service Skills", "Advanced Education", "Assignment"];
const PreCareers = [UNIVERSITY, NAVY_ACADEMY, MARINE_ACADEMY, ARMY_ACADEMY];

const _CASH_TAKEN = "_Cash_Taken";

function _RANK(career) {
	return `_${career}_Ranks`;
}

function _TERMS(career) {
	return `_${career}_Terms`;
}

function _CASGN(career, assignment) {
	return career + "/" + assignment;
}

function _DM_ENTRY(career) {
	return `_DM_Entry_${career}`;
}

const FLUNKED = "flunked";
const GRAD = "grad";
const HONORS = "honors";
function _GRAD(precareer, outcome) {
	return `${precareer} (${outcome})`
}
