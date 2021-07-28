const skillSets = ["Personal Development", "Service Skills", "Advanced Education", "Assignment"];
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
      state => state.get("_Cash_Taken") > 2 ? 1 : 0.5,
      state => state.get("_Cash_Taken") > 2 ? 0 : 0.5,
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
    r: state => incr(state, "_Cash_Taken"),
  });
}

function benefits(values) {
	return uniform({
    label: "Benefits",
    type: "set", 
    v: values,
    o: values.map(parseSkill),
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
    r: state => {},
  }
}

function assignment(Career) {
	return uniform({
    label: Career.name + " Assignment",
    type: "set",
    v: Career.assignments,
    o: Career.assignments.map(x => state => {
      append(state, "Careers", Career.name + "/" + x);
      state.set(`_${currentCareer(state)}_Terms`, 0);
      state.set(`_${currentCareer(state)}_Rank`, 0);
      const title = Career.ranks[x][state.get(`_${currentCareer(state)}_Rank`)].title;
      if (title != "") {
        state.set(`${currentCareer(state)} Title`, );
      }
      enqueue(state, Career.Survival);
    }),
    r: state => {},
  });
}

function survival(Career) {
	function getCheck(state) {
  	const idx = Career.assignments.indexOf(currentAssignment(state));
    return check2d6(Career.survival.values[idx] 
			- mod(state.get(Career.survival.stats[idx])));
  }
  return {
    label: Career.name + "Survival",
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
        incr(state, `_${currentCareer(state)}_Terms`);
        enqueue(state, Career.Events);
        enqueue(state, Career.Advancement)
      }
    ],
    r: () => {},
  }
}

function advancement(Career, assignments, stats, values) {
  function getCheck(state) {
  	const idx = Career.assignments.indexOf(currentAssignment(state));
    return check2d6(Career.advancement.values[idx] 
			- mod(state.get(Career.advancement.stats[idx])));
  }
  function advancementSuccess(state) {
    const asgn = currentAssignment(state);
    incr(state, `_${currentCareer(state)}_Rank`);
    const rankData = Career.ranks[asgn][state.get(`_${currentCareer(state)}_Rank`)];
    state.set(currentCareer(state) + " Title", rankData.title);
    parseSkill(rankData.bonus)(state);
    enqueue(state, Career.SkillSet, true);
  }
  return {
    label: "Advancement",
    type: "set",
    v: ["Career Change", "Failure", "Success", "Career Continue"],
    p: [
      state => check2d6(14 - state.get(`_${currentCareer(state)}_Terms`)),
      state => Math.max(0, 1 - getCheck(state) - check2d6(14 - state.get(`_${currentCareer(state)}_Terms`))),
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
        enqueue(state, AgentSkillSet);
      	enqueue(state, AgentSurvival);
      }
    ],
    r: state => enqueue(state, Finish, true),
  }
}
function tb(title="", bonus="") {
	return {
  	title: title,
    bonus: bonus,
  }
}

function getBenefits(state) {
	if (state.get("Careers").length == 0) return;
	const terms = state.get(`_${currentCareer(state)}_Terms`);
  const rank = state.get(`_${currentCareer(state)}_Rank`);
  const rankBonus = Math.ceil(rank / 2);
  const numBenefits = terms + rankBonus;
  const set = rewardSet(Agent.cash, Agent.benefits);
  const benefitRoll = rank >= 5 ? set[1] : set[0]; 
  [...Array(numBenefits)].forEach(x => enqueue(state, benefitRoll));
}
