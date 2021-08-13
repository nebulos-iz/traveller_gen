function tb(title="", bonus="") {
	return {
		title: title,
		bonus: bonus,
	}
}

function check(stat, value) {
	return {
		stat: stat,
		value: value,
	}
}

function TODO(label = "TODO") {
	return {
		label: label,
		type: "set",
		v: ["TODO"],
		p: [
			state => 1.0
		],
		o: [
			state => {},
		],
		r: () => {},
	}
}

function ChooseSkill(label, skills) {
	return uniform({
		label: label,
		type: "set",
		v: skills,
		o: skills.map(parseSkill),
		r: () => {}
	})
}

function Rewards(benefits, cash) {
	return  {
		label: "Benefit Or Cash",
		type: "set",
		v: ["Benefit", "Cash"],
		p: [
			state => 1,
			state => state.get(_CASH_TAKEN) > 2 ? 0 : 1,
		],
		o: [
			state => enqueue(state, benefits, true),
			state => enqueue(state, cash, true),
		],
		r: () => {},
	};
}

function Cash(values) {
	return uniform({
		label: "Cash",
		type: "set", 
		v: values,
		o: values.map(v => state => incr(state, "Credits", v)),
		r: state => incr(state, _CASH_TAKEN),
	});
}

function Benefits(values) {
	return uniform({
		label: "Benefits",
		type: "set", 
		v: values,
		o: values.map(parseBenefit),
		r: () => {},
	});
}

function rewardSet(cashList, benefitList) {
	return [
		Rewards(
			Benefits(benefitList.slice(0, 6)), 
			Cash(cashList.slice(0, 6))),
		Rewards(
			Benefits(benefitList.slice(1, 7)),
			Cash(cashList.slice(1, 7))),
	];
}

function Assignment(Career) {
	return {
		label: Career.name + " Assignment",
		type: "set",
		v: Career.assignments,
		p: Career.assignments.map(asgn => state => {
			if (state.get(CAREERS).includes(_CASGN(Career.name, asgn))) {
				return 0;
			}
			return 1;
		}),
		o: Career.assignments.map(asgn => startAssignment(Career, asgn)),
		r: state => {},
	}
}

function startAssignment(Career, asgn) {
	return state => {
		append(state, CAREERS, _CASGN(Career.name, asgn));
		const career = currentCareer(state);
		state.set(_TERMS(career), 0);
		state.set(_RANK(career), 0);
		const title = getRankData(Career, state).title;
		if (title != "") {
			state.set(`${currentCareer(state)} Title`, title);
		}
		// Basic training
		const skills = Career.basicTrainingSkills(state);
		if (isFirstCareer(state)) {
			skills.forEach(skill => setSkill(state, skill, 0));
			state.set(_PRINT, "Gained basic training skills " + skills.join(", "));
		} else {
			enqueue(state, ChooseSkill(Career.name + " Basic Training", skills));
		}
		enqueue(state, Survival(Career));
	}
}


function Survival(Career) {
	function getCheck(state) {
		const asgn = currentAssignment(state);
		const check = Career.survive;
		return check2d6(check[asgn].value - mod(state.get(check[asgn].stat)));
	}
	return {
		label: Career.name + " Survival",
		type: "set",
		v: ["Failure", "Success"],
		p: [
			state => Math.max(1/36, 1 - getCheck(state)),
			state => Math.min(35/36, getCheck(state)),
		],
		o: [
			state => {
				enqueue(state, Career.Mishaps);
				enqueue(state, FinishCareer(Career));
				enqueue(state, Term);
			},
			state => {
				incr(state, _TERMS(currentCareer(state)));
				enqueue(state, Career.Events);
				if (MilitaryCareers.includes(currentCareerOnly(state))) {
					enqueue(state, Commission(Career));
				} else {
					enqueue(state, Advancement(Career));
				}
			}
		],
		r: () => {},
	}
}

function Commission(Career) {
	return {
		label: Career.name + " Commission",
		type: "set",
		v: ["Failed", "Succeeded"],
		p: binary(state => check2d6(9 - mod(state.get(SOC)) 
																	- get(state, _DM_COMMISSION(Career.name)))),
		o: [
			state => enqueue(state, Advancement(Career)),
			state => {
				const career = currentCareer(state);
				state.set(_COMMISSION(career), 1);
				state.set(_EXTRA_RANK(career), get(state, _RANK(career)));
				state.set(_RANK(career), 1);
				const rankData = getRankData(Career, state);
				if (rankData.title != "") {
					state.set(career + " Title", rankData.title);
					state.set(_PRINT, "Promoted to " + rankData.title);
				}
				enqueue(state, ContinueCareer(Career));
			},
		],
		r: () => {},
	}
}

function getRankData(Career, state) {
	const career = currentCareer(state);
	const rank = state.get(_RANK(career));
	const rankKey = MilitaryCareers.includes(currentCareerOnly(state))
		? (state.has(_COMMISSION(career)) ? "Officer" : "Enlisted")
		: currentAssignment(state);
	return Career.ranks[rankKey][rank]
}


function Advancement(Career, assignments, stats, values) {
	function getCheck(state) {
		const asgn = currentAssignment(state);
		const check = Career.advance;
		return check2d6(check[asgn].value - mod(state.get(check[asgn].stat)));
	}
	function advancementSuccess(state) {
		const asgn = currentAssignment(state);
		incr(state, _RANK(currentCareer(state)));
		const rankData = getRankData(Career, state);
		if (rankData.title != "") {
			state.set(currentCareer(state) + " Title", rankData.title);
			state.set(_PRINT, "Promoted to " + rankData.title);
		}
		parseSkill(rankData.bonus)(state);
		enqueue(state, SkillSet(Career), true);
	}
	return {
		label: "Advancement",
		type: "set",
		v: ["Career Change", "Failure", "Success", "Career Continue"],
		p: [
			state => check2d6(14 - state.get(_TERMS(currentCareer(state)))),
			state => Math.max(0, 1 - getCheck(state) - check2d6(14 - state.get(_TERMS(currentCareer(state))))),
			state => getCheck(state) - 1 / 36,
			state => 1 / 36,
		],
		o: [
			state => enqueue(state, Term),
			state => enqueue(state, ContinueCareer(Career)),
			state => {
				advancementSuccess(state);
				enqueue(state, ContinueCareer(Career));
			},
			state => {
				advancementSuccess(state);
				enqueue(state, SkillSet(Career));
				enqueue(state, Survival(Career));
			}
		],
		r: state => enqueue(state, FinishCareer(Career)),
	}
}

function getBenefits(state, Career) {
	if (isCurrentPreCareer(state)) return;
	const career = currentCareer(state)
	const terms = state.get(_TERMS(career));
	const rank = get(state, _RANK(career)) + get(state, _EXTRA_RANK(career));
	const rankBonus = Math.ceil(rank / 2);
	const numBenefits = Math.max(0, terms + rankBonus);
	const set = rewardSet(Career.cash, Career.benefits);
	const benefitRoll = rank >= 5 ? set[1] : set[0]; 
	if (numBenefits > 0) state.set(_PRINT, `Retired with ${numBenefits} benefits`);
	[...Array(numBenefits)].forEach(x => enqueue(state, benefitRoll));
}

function SkillSet(Career) {
	return {
		label: "Skill Set",
		type: "set",
		v: SkillSets,
		p: SkillSets.map(set => set == "Advanced Education" ?
			state => state.get("EDU") >= 8 && Career.skills[set] != null ? 1 : 0 :
			state => 1),
		o: SkillSets.map(set => set == "Assignment" ?
			state => enqueue(state, ChooseSkill(`${Career.name} ${set} Skills`, Career.skills[currentAssignment(state)]), true) :
			state => enqueue(state, ChooseSkill(`${Career.name} ${set} Skills`, Career.skills[set]), true)),
		r: () => {},
	}
}

function Entry(Career) {
	return {
		label: Career.name + " Qualification",
		type: "set",
		v: ["Failed", "Succeeded"],
		p: binary(state => check2d6(Career.enter.value - mod(state.get(Career.enter.stat)) - get(state, _DM_ENTRY(Career.name)))),
		o: [
			state => enqueue(state, DrifterOrDraft),
			state => enqueue(state, Assignment(Career)),
		],
		r: () => {},
	}
}

function canCareer(state, career, check) {
	if (state.get(CAREERS).filter(h => h.startsWith(career)).length > 2) {
		return 0;
	}
	return check;
}

function ContinueCareer(Career) {
	return {
		label: "Continue Career?",
		type: "set",
		v: ["Leave", "Stay"],
		p: [0.2, 0.8].map(val => state => val),
		o: [
			state => {
				getBenefits(state, Career);
				enqueue(state, Term);
			}, 
			state => {
				enqueue(state, SkillSet(Career));
				enqueue(state, Survival(Career));
			},
		],
		r: () => {},
	}
}

function FinishCareer(Career)  {
	return {
		label: "Finish?",
		type: "set",
		v: ["Yes", "No"],
		p: [state => state.get(TERMS) + 1, state => 2],
		o: [
			state => {state.set(QUEUE, []); getBenefits(state, Career)},
			() => {}
		],
		r: state => incr(state, TERMS),
	};
}
