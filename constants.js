const CAREERS = "Careers";
const TERMS = "terms";
const ASSETS = "Assets";

const UNIVERSITY = "University";
const NAVY_ACADEMY = "Army Academy";
const MARINE_ACADEMY = "Marine Academy";
const ARMY_ACADEMY = "Navy Academy";
const AGENT = "Agent";
const ARMY = "Army";
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
const MilitaryCareers = [ARMY];

const _CASH_TAKEN = "_Cash_Taken";

function _RANK(career) {
	return `_${career}_Ranks`;
}

function _EXTRA_RANK(career) {
	return `_${career}_ExtraRanks`;
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

const _DM_GRADUATE = "_DM_Graduate";
function _DM_COMMISSION(branch) {
	return `_DM_Commission_${branch}`;
}

const FLUNKED = "flunked";
const GRAD = "grad";
const HONORS = "honors";
function _GRAD(precareer, outcome) {
	return `${precareer} (${outcome})`
}

function _PRE_CAREER_ATTEMPT(term) {
  return "_PreCareerAttempt_" + term;
}

function _EXTRA_SKILLS(career) {
  return `_${career}_ExtraSkills`;
}

function _COMMISSION(career) {
	return `_${career}_Commission`;
}


const WEAPON = "Weapon";
const CONTACT = "Contact";
const ALLY = "Ally";
const SHIP_SHARE = "Ship Share";
const SCIENTIFIC_EQUIPMENT = "Scientific Equipment";
const COMBAT_IMPLANT = "Combat Implant";
const ARMOR = "Armor";

const _DRAFTED = "_Drafted";

const _PRINT = "_print";

const MODIFIERS = '_Modifiers';
const LOG = '_Log';