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

function chooseSkill(label, skills) {
	return uniform({
		label: label,
		type: "set",
		v: skills,
		o: skills.map(parseSkill),
		r: () => {}
	})
}

function rewards(benefits, cash) {
	return  {
		label: "Benefit Or Cash",
		type: "set",
		v: ["Benefit", "Cash"],
		p: [
			state => state.get(_CASH_TAKEN) > 2 ? 1 : 0.5,
			state => state.get(_CASH_TAKEN) > 2 ? 0 : 0.5,
		],
		o: [
			state => enqueue(state, benefits, true),
			state => enqueue(state, cash, true),
		],
		r: () => {},
	};
}

function cash(values) {
	return uniform({
		label: "Cash",
		type: "set", 
		v: values,
		o: values.map(v => state => incr(state, "Credits", v)),
		r: state => incr(state, _CASH_TAKEN),
	});
}

function benefits(values) {
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
		rewards(
			benefits(benefitList.slice(0, 6)), 
			cash(cashList.slice(0, 6))),
		rewards(
			benefits(benefitList.slice(1, 7)),
			cash(cashList.slice(1, 7))),
	];
}

function assignment(Career) {
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
		o: Career.assignments.map(asgn => state => {
			append(state, CAREERS, _CASGN(Career.name, asgn));
			const career = currentCareer(state);
			state.set(_TERMS(career), 0);
			state.set(_RANK(career), 0);
			const title = Career.ranks[asgn][0].title;
			if (title != "") {
				state.set(`${currentCareer(state)} Title`, title);
			}
			// Basic training
			if (isFirstCareer(state)) {
				Career.basicTrainingSkills(state).forEach(skill => setSkill(state, skill, 0));
			} else {
				enqueue(state, chooseSkill(Career.name + " Basic Training", Career.basicTrainingSkills(state)));
			}
			enqueue(state, Career.Survival);
		}),
		r: state => {},
	}
}


function survival(Career) {
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
				enqueue(state, Finish);
				enqueue(state, Term);
			},
			state => {
				incr(state, _TERMS(currentCareer(state)));
				enqueue(state, Career.Events);
				enqueue(state, Career.Advancement)
			}
		],
		r: () => {},
	}
}

function advancement(Career, assignments, stats, values) {
	function getCheck(state) {
		const asgn = currentAssignment(state);
		const check = Career.advance;
		return check2d6(check[asgn].value - mod(state.get(check[asgn].stat)));
	}
	function advancementSuccess(state) {
		const asgn = currentAssignment(state);
		incr(state, _RANK(currentCareer(state)));
		const rankData = Career.ranks[asgn][state.get(_RANK(currentCareer(state)))];
		state.set(currentCareer(state) + " Title", rankData.title);
		parseSkill(rankData.bonus)(state);
		enqueue(state, Career.SkillSet, true);
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
			state => enqueue(state, TODO("Career Change")),
			state => enqueue(state, ContinueCareer),
			state => {
				advancementSuccess(state);
				enqueue(state, ContinueCareer);
			},
			state => {
				advancementSuccess(state);
				enqueue(state, Career.SkillSet);
				enqueue(state, Career.Survival);
			}
		],
		r: state => enqueue(state, Finish),
	}
}

function getBenefits(state) {
	if (isCurrentPreCareer(state)) return;
	const career = currentCareer(state)
	const terms = state.get(_TERMS(career));
	const rank = state.get(_RANK(career));
	const rankBonus = Math.ceil(rank / 2);
	const numBenefits = Math.max(0, terms + rankBonus);
	const set = rewardSet(Agent.cash, Agent.benefits);
	const benefitRoll = rank >= 5 ? set[1] : set[0]; 
	[...Array(numBenefits)].forEach(x => enqueue(state, benefitRoll));
}

function skillSet(Career) {
	return {
		label: "Skill Set",
		type: "set",
		v: SkillSets,
		p: SkillSets.map(set => set == "Advanced Education" ?
			state => state.get("EDU") >= 8 ? 1 : 0 :
			state => 1),
		o: SkillSets.map(set => set == "Assignment" ?
			state => enqueue(state, chooseSkill(`${Career.name} ${set} Skills`, Career.skills[currentAssignment(state)]), true) :
			state => enqueue(state, chooseSkill(`${Career.name} ${set} Skills`, Career.skills[set]), true)),
		r: () => {},
	}
}

function entry(Career) {
	return {
		label: Career.name + " Qualification",
		type: "set",
		v: ["Failed", "Succeeded"],
		p: binary(state => check2d6(Career.enter.value - mod(state.get(Career.enter.stat)) - get(state, _DM_ENTRY(Career.name)))),
		o: [
			state => enqueue(state, DrifterOrDraft),
			state => {
				enqueue(state, Career.Assignment);
			},
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
