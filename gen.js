// HELPERS

function dom(parent, className, content) {
  const el = document.createElement('div');
  parent.appendChild(el);
  el.className = className;
  if (content) el.textContent = content;
  return el;
}

function setMapTo(oldMap, newMap) {
  oldMap.clear();
  for (let [key, value] of newMap) {
    if (Array.isArray(value)) {
      oldMap.set(key, value.slice());
    } else {
      oldMap.set(key, value);
    }
  }
  return oldMap;
}

function copyMap(map) {
  const newMap = new Map(map);
  for (let [key, value] of newMap) {
    if (Array.isArray(value)) {
      newMap.set(key, value.slice());
    }
  }
  return newMap;
}

function printQueue(state, id = "", ) {
  if (!state.has("queue")) {
    console.log(id, []);
    return;
  }
  console.log(id, state.get("queue").map(spec => spec.label));
}

function generator(generatorFunctions) {
  const doOutcome = generatorFunctions.outcome;
  const doRandom = generatorFunctions.random;
  const doRender = generatorFunctions.render;
  const doSelect = generatorFunctions.select;
  return (state, spec) => {
    const savedState = copyMap(state);
    const randomValue = doRandom(spec);

    function run(state, spec, value) {
      state.get("queue").shift();
      doOutcome(state, spec, value);
      spec.r(state);
      if (spec.debug) {
      	console.log(spec.label, spec.p.map(p => p(state)));
      }
    }
    run(state, spec, randomValue);
    const container = dom(log, "c", );
    const label = dom(container, "", spec.label);
    const input = doRender(spec, randomValue);
    container.appendChild(input);
    input.addEventListener('change', e => {
      setMapTo(state, savedState);
      run(state, spec, doSelect(e));
      eraseAndRerun(container, state);
    });
    return container;
  }
}

const freeform = generator({
  outcome: (state, spec, value) => spec.o(state, value),
  random: spec => spec.v,
  render: (spec, initialValue) => {
    const input = document.createElement("input");
    input.setAttribute("type", "text");
    input.value = initialValue;
    return input;
  },
  select: e => e.target.value,
});

const set = generator({
  outcome: (state, spec, value) => spec.o[value](state),
  random: spec => {
    const total = spec.p.map(p => p(state)).reduce((a, b) => a + b);
    const value = Math.random() * total;
    let sum = 0;
    let selected = -1;
    for (let i = 0; i < spec.v.length; i++) {
      sum += spec.p[i](state);
      if (value < sum) {
        selected = i;
        break;
      }
    }
    if (selected < 0) {
      console.log(spec.label, total, spec.p.map(p => p(state)));
    }
    return selected;
  },
  render: (spec, initialValue) => {
    const input = document.createElement("select");
    const total = spec.p.map(p => p(state)).reduce((a, b) => a + b);
    for (let i = 0; i < spec.v.length; i++) {
      const option = document.createElement("option");
      option.text = `${spec.v[i]} (${(spec.p[i](state) / total * 100).toFixed(2)}%)`;
      input.add(option);
    }
    input.selectedIndex = initialValue;
    return input;
  },
  select: e => e.target.selectedIndex,
});

const pick = generator({
  outcome: (state, spec, value) => value.forEach((idx, i) => spec.o[idx](state, i)),
  random: spec => {
    const total = spec.p.map(p => p(state)).reduce((a, b) => a + b);
    let remaining = total;
    let selected = [];
    for (let j = 0; j < spec.n; j++) {
      let sum = 0;
      let value = Math.random() * remaining;
      for (let i = 0; j < spec.v.length; i++) {
        if (selected.includes(i)) continue;
        sum += spec.p[i](state);
        if (value < sum) {
          selected.push(i);
          remaining -= spec.p[i](state);
          break;
        }
      }
    }
    return selected;
  },
  render: (spec, initialValue) => {
    const input = document.createElement("select");
    const total = spec.p.map(p => p(state)).reduce((a, b) => a + b);

    input.multiple = true;
    for (let i = 0; i < spec.v.length; i++) {
      const option = document.createElement("option");
      option.text = `${spec.v[i]} (${(spec.p[i](state) / total * 100).toFixed(2)}%)`;
      input.add(option);
      if (initialValue.includes(i)) {
        option.selected = true;
      }
    }
    return input;
  },
  select: e => [...e.target.selectedOptions].map(opt => opt.index),

});

// When the user makes changes to the selected value, roll back to the log value, change the state.
const history = [];

function doSpec(state) {
  const spec = state.get("queue")[0];

  function setup() {
    switch (spec.type) {
      case 'freeform':
        return freeform(state, spec);
      case 'set':
        return set(state, spec);
      case 'pick':
        return pick(state, spec);
    }
  }
  const parent = setup();
  history.push({
    spec: spec,
    parent: parent,
  });
}

function eraseAndRerun(parent, state) {
  let found = false;
  const historyCopy = history.slice();
  for (let idx = 0; idx < historyCopy.length; idx++) {
    const entry = historyCopy[idx];
    if (entry.parent == parent) {
      found = true;
      history.splice(idx + 1);
      continue;
    }
    if (found) {
      entry.parent.remove();
    }
  }
  run(state);
}

function enqueue(state, spec, front = false) {
  if (front) {
    if (!state.has("queue")) {
      state.set("queue", [])
    }
    state.get("queue").unshift(spec);
  } else {
    append(state, "queue", spec);
  }
}

function renderState(state) {
  char.innerHTML = '';
  const data = Array.from(state);

  function order(x) {
    const attr = x[0];
    const val = x[1];
    const top = ["name", "STR", "DEX", "END", "INT", "EDU", "SOC", "terms"];
    if (top.includes(attr)) {
      return -1 * (10000000 - top.indexOf(attr));
    }
    if (attr.startsWith("_")) {
      return 10000;
    }
    if (Array.isArray(val)) {
    	return 1000;
    }
    if (!Number.isInteger(val)) {
      return 500;
    }
    if (val > 1000) {
    	return 500
    }
    return -1 * val;
  }
  data.sort((a, b) => {
    return order(a) - order(b);
  });
  for (let [key, value] of data) {
  	let className = "line"
  	if (key.startsWith("_")) {
    	className += " debug"
    }
    dom(char,  className, `${key}: ${value}`);
  }
}

function run(state) {
	let count = 0;
  while (count < 50 && state.get("queue").length > 0) {
    printQueue(state, "run");
    doSpec(state);
    count++;
  }
  renderState(state);
}

// DATA HELPERS

const v_2d6 = Array.from({
  length: 11
}, (x, i) => i + 2)
const p_2d6 = v_2d6
  .map(x => x <= 6 ? x - 1 : 13 - x)
  .map(x => state => x)


function uniform(spec) {
  spec.p = spec.v.map(x => state => 1);
  return spec;
}

function mod(stat) {
  return stat == 0 ? -3 : Math.ceil((stat - 8) / 3);
}

// Returns the probability of meeting the target
function check2d6(target) {
  if (target < 2) return 1;
  if (target > 12) return 0;
  if (target >= 7) {
    const n = 13 - target;
    return (n * (n + 1) / 2) / 36;
  } else {
    const n = target - 2;
    return 1 - (n * (n + 1) / 2) / 36;
  }
}

function setSkill(state, skill, value) {
  const old = state.get(skill);
  if (old >= value) return;
  state.set(skill, value);
}

function incr(state, attr, val = 1) {
	if (!state.has(attr)) {
  	state.set(attr, val);
    return;
  }
  state.set(attr, state.get(attr) + val);
}

function append(state, attr, value) {
  if (!state.has(attr)) {
    state.set(attr, [])
  }
  state.get(attr).push(value);
}

function getMod(state, attr) {
  if (!state.has("_DM_" + attr)) {
    return 0;
  }
  return state.get("_DM_" + attr);
}

function parseSkill(str) {
	if (str.startsWith("%")) {
  	return state => append(state, "Assets", str.substring(1));
  }
  for (const char of characteristics) {
    if (str.startsWith(char)) {
      const val = parseInt(str.split("+")[1]);
      return state => incr(state, char, val);
    }
  }
  const re = /(.*) ([0-9])/;
  const match = str.match(re);
  if (match != null) {
  	return state => setSkill(state, match[1], parseInt(match[2]));
  }
  return state => incr(state, str);
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

function currentCareer(state) {
	return state.get("Careers").slice(-1)[0];
}
function currentAssignment(state) {
	return currentCareer(state).split("/")[1];
}

function chooseAssignment(career, assignments, ranks, survival) {
	return uniform({
    label: career + " Assignment",
    type: "set",
    v: agentAssignments,
    o: agentAssignments.map(x => state => {
      append(state, "Careers", career + "/" + x);
      state.set(`_${currentCareer(state)}_Terms`, 0);
      state.set(`_${currentCareer(state)}_Rank`, 0);
      const title = ranks[x][state.get(`_${currentCareer(state)}_Rank`)].title;
      if (title != "") {
        state.set(`${currentCareer(state)} Title`, );

      }
      enqueue(state, survival);
    }),
    r: state => {},
  });
}

// DATA

/*
 * label: pre-text
 * type: freeform / set / pick
 * v: possible outcomes
 * p: probability of outcome [0, 1]
 * o: what to run if outcome is selected
 * n: number to select. pick only
 * r: always runs 
 */


const Name = {
  label: "Name",
  type: "freeform",
  v: "Placeholder Name",
  o: (state, val) => state.set("name", val),
  r: state => {
    Characteristics.forEach(c => enqueue(state, c));
    enqueue(state, BackgroundSkills);
    enqueue(state, Term);
  },
}

const characteristics = ["STR", "DEX", "END", "INT", "EDU", "SOC"];
const Characteristics = characteristics.map((stat, idx) => {
  return {
    label: "Initial " + stat,
    type: "set",
    v: v_2d6,
    p: p_2d6,
    o: v_2d6.map(val => (state => state.set(stat, val))),
    r: () => {}
  }
});

const background_skills = ["Admin", "Animals", "Art", "Athletics", "Carouse", "Drive", "Science", "Seafarer", "Streetwise", "Survival", "Vacc Suit", "Electronics", "Flyer", "Language", "Mechanic", "Medic", "Profession"];
const BackgroundSkills = uniform({
  label: "Background Skills",
  type: "pick",
  v: background_skills,
  o: background_skills.map(skill => (state => setSkill(state, skill, 0))),
  n: 4,
  r: () => {},
});

function canPreCareer(state, check) {
	const terms = state.get("terms");
  if (terms > 2) return 0;
  if (state.has("_PreCareerAttempt_" + terms)) return 0;
  return check;
}
const Term = {
  label: "New Term",
  type: "set",
  v: ["University", "Army", "Marines", "Navy", "Agent", "TODO"],
  p: [
  	state => canPreCareer(state, check2d6(7 - mod(state.get("EDU")) + state.get("terms") - (state.get("SOC") >= 9 ? 1 : 0))),
    state => canPreCareer(state, check2d6(8 - mod(state.get("END")) + 2 * state.get("terms"))),
    state => canPreCareer(state, check2d6(9 - mod(state.get("END")) + 2 * state.get("terms"))),
    state => canPreCareer(state, check2d6(9 - mod(state.get("INT")) + 2 * state.get("terms"))),
    state => check2d6(6 - mod(state.get("INT")) + state.get("Careers").length),
    state => 0.01,
  ],
  o: [
    state => enqueue(state, UniversityEntry),
    state => enqueue(state, ArmyAcademyEntry),
    state => enqueue(state, MarineAcademyEntry),
    state => enqueue(state, NavyAcademyEntry),
    state => enqueue(state, AgentEntry),
    state => {},
  ],
  r: () => {},
  debug: true,
};

const PreCareerEvents = {
  label: "Pre-Career Events",
  type: "set",
  v: [
    "You are approached by an underground (and highly illegal) psionic group who sense potential in you.",
    "Your time in education is not a happy one and you suffer a deep tragedy. You crash and fail to graduate.",
    "A supposedly harmless prank goes wrong and someone gets hurt, physically or emotionally.",
    "Taking advantage of youth, you party as much as you study.",
    "You become involved in a tightly knit clique or group and make a pact to remain friends forever, wherever in the galaxy you may end.",

    "Life Event. Roll on the Life Events table (see page 44).",

    "You join a political movement.",
    "You develop a healthy interest in a hobby or other area of study. Gain any skill of your choice, with the exception of Jack-of-all-Trades, at level 0.",
    "A newly arrived tutor rubs you up the wrong way and you work hard to overturn their conclusions. Roll 9+ on any skill you have learned during this term. If successful, you provide a truly elegant proof that soon becomes accepted as the standard approach. Gain a level in the skill you rolled on and the tutor as a Rival.",
    "War comes and a wide-ranging draft is instigated. You can either flee and join the Drifter career next term or be drafted (roll 1D: 1-3 Army, 4-5 Marine, 6 Navy). Either way, you do not graduate this term. However, if you roll SOC 9+, you can get enough strings pulled to avoid the draft and complete your education – you may attempt graduation normally and are not drafted.",
    "You gain wide-ranging recognition of your initiative and innovative approach to study."
  ],
  p: p_2d6,
  o: [
    state => {},
    state => state.set("_DM_Graduate", -12),
    state => enqueue(state, PreCareerPrank, true),
    state => setSkill(state, "Carouse", 1),
    state => enqueue(state, PreCareerFriends, true),
    state => enqueue(state, TODO("Pre career life event")),
    state => enqueue(state, PreCareerMovement, true),
    state => enqueue(state, TODO("Hobby"), true),
    state => enqueue(state, TODO("Tutor"), true),
    state => enqueue(state, TODO("Draft"), true),
    state => incr(state, "SOC"),
  ],
  r: () => [],
}

const PreCareerPrank = {
  label: "Prank Gone Wrong",
  type: "set",
  v: ["Imprisoned", "Enemy", "Rival"],
  p: [
    state => 1 / 36,
    state => 1 - check2d6(8 - mod(state.get("SOC"))) - 1 / 36,
    state => check2d6(8 - mod(state.get("SOC"))),
  ],
  o: [
    state => enqueue(state, TODO("Imprisoned")),
    state => append(state, "Enemies", "Prank Victim"),
    state => append(state, "Rivals", "Prank Victim"),
  ],
  r: () => {},
}

const PreCareerFriends = uniform({
  label: "School Friends",
  type: "set",
  v: [...Array(3).keys()].map(x => x + 1),
  o: [...Array(3).keys()].map(x => x + 1).map(x => state => append(state, "Allies", x + " School Friends")),
  r: () => {},
});

const PreCareerMovement = {
  label: "Pre Career Movement Leadership",
  type: "set",
  v: ["Failure", "Success"],
  p: [
    state => 1 - check2d6(8 - mod(state.get("SOC"))),
    state => check2d6(8 - mod(state.get("SOC"))),
  ],
  o: [
    state => {},
    state => {
      append(state, "Allies", "Ally of the Movement");
      append(state, "Enemies", "Enemy of the Movement")
    },
  ],
  r: () => {},
}

const UniversityEntry = {
  label: "University Entry",
  type: "set",
  v: ["Failed", "Succeeded"],
  p: [
    state => 1 - check2d6(7 - mod(state.get("EDU"))),
    state => check2d6(7 - mod(state.get("EDU"))),
  ],
  o: [
    state => enqueue(state, Term),
    state => {
      incr(state, "EDU");
      enqueue(state, PreCareerEvents);
      enqueue(state, UniversityGraduation);
    },
  ],
  r: state => state.set("_PreCareerAttempt_" + state.get("terms"), 1),
}

// TODO: DM+1(2) to qualify for Agent, Army, Citizen (corporate), Entertainer(journalist), Marines, Navy, Scholar, Scouts; commission roll
const entryBenefits = ["Agent", "Army", "Citizen (corporate)", "Entertainer (journalist)", "Marines", "Navy", "Scholar", "Scouts", "Commission"];
const universityGradCheck = val => check2d6(val - mod(state.get("INT")) - getMod(state, "Graduate"));
const UniversityGraduation = {
  label: "University Graduation",
  type: "set",
  v: ["Failed", "Succeeded", "Honors"],
  p: [
    state => 1 - universityGradCheck(7),
    state => universityGradCheck(7) - universityGradCheck(11),
    state => universityGradCheck(11),
  ],
  o: [
    state => enqueue(state, UniversitySkills),
    state => {
      enqueue(state, UniversitySkillsGrad);
      entryBenefits.forEach(b => state.set("_DM_" + b, 1))
    },
    state => {
      enqueue(state, UniversitySkillsGrad);
      entryBenefits.forEach(b => state.set("_DM_" + b, 2))
    },
  ],
  r: state => {
  	enqueue(state, Finish);
    enqueue(state, Term);
  },
}

const university_skills = ["Admin", "Advocate", "Animals (training or veterinary)", "Art (any)", "Astrogation", "Electronics (any)", "Engineer (any)", "Language (any)", "Medic", "Navigation", "Profession (any)", "Science (any)"];
const UniversitySkills = uniform({
  label: "University Skills",
  type: "pick",
  v: university_skills,
  o: university_skills.map(skill => (state, idx) => setSkill(state, skill, idx)),
  n: 2,
  r: () => {}
});
const UniversitySkillsGrad = uniform({
  label: "University Skills",
  type: "pick",
  v: university_skills,
  o: university_skills.map(skill => (state, idx) => setSkill(state, skill, idx + 1)),
  n: 2,
  r: () => {}
});

function academyEntry(branch, char, value, skills, gradSpec) {
  return {
    label: branch + " Academy Entry",
    type: "set",
    v: ["Failed", "Succeeded"],
    p: [
      state => 1 - check2d6(value - mod(state.get(char))),
      state => check2d6(value - mod(state.get(char))),
    ],
    o: [
      state => enqueue(state, Term),
      state => {
        skills.forEach(skill => setSkill(state, skill, 0));
        enqueue(state, PreCareerEvents);
        enqueue(state, gradSpec);
      },
    ],
  	r: state => state.set("_PreCareerAttempt_" + state.get("terms"), 1)
  }
}

function academyGraduation(branch) {
  const academyBenefits = state => {
    state.set(`_${branch}_ExtraSkills`, 1);
    state.set("_DM_" + branch, 12);
    state.set("_DM_Commission", 2);
  }

  function academyGraduationCheck(value, state) {
    return check2d6(value - mod(state.get("INT")) -
      (state.get("END") >= 8 ? 1 : 0) -
      (state.get("SOC") >= 8 ? 1 : 0) -
      getMod(state, "Graduate"));
  }
  return {
    label: branch + " Academy Graduation",
    type: "set",
    v: ["Kicked Out", "Failed", "Succeeded", "Honors"],
    p: [
      state => 1 / 36,
      state => 1 - academyGraduationCheck(8, state) - 1 / 36,
      state => academyGraduationCheck(8, state) - academyGraduationCheck(11, state),
      state => academyGraduationCheck(11, state),
    ],
    o: [
      state => {
        state.set(`_DM_${branch}_Commission`, -12);
      },
      state => {
        state.set("_DM_" + branch, 12);
        state.set(`_DM_${branch}_Commission`, -12)
      },
      state => {
        incr(state, "EDU");
        academyBenefits(state)
      },
      state => {
        incr(state, "EDU");
        incr(state, "SOC");
        academyBenefits(state);
        state.set(`_DM_${branch}_Commission`, 12)
      },
    ],
    r: state => {
    	enqueue(state, Finish);
      enqueue(state, Term);
    }
  }
}

const armyServiceSkills = ["Drive", "Vacc Suit", "Athletics", "Gun Combat", "Recon", "Melee", "Heavy Weapons"];
const ArmyAcademyGraduation = academyGraduation("Army");
const ArmyAcademyEntry = academyEntry("Army", "END", 8, armyServiceSkills, ArmyAcademyGraduation);

const marineServiceSkills = ["Vacc Suit", "Athletics", "Gun Combat", "Heavy Weapons", "Tactics", "Stealth"];
const MarineAcademyGraduation = academyGraduation("Marine");
const MarineAcademyEntry = academyEntry("Marine", "END", 9, marineServiceSkills, MarineAcademyGraduation);

const navyServiceSkills = ["Vacc Suit", "Athletics", "Gun Combat", "Pilot", "Gunner", "Mechanic"];
const NavyAcademyGraduation = academyGraduation("Navy");
const NavyAcademyEntry = academyEntry("Marine", "INT", 9, navyServiceSkills, NavyAcademyGraduation);

const skillSets = ["Personal Development", "Service Skills", "Advanced Education", "Assignment"];
const agentSkills = {
  "Personal Development": ["Gun Combat", "DEX +1", "END +1", "Melee", "INT +1", "Athletics"],
  "Service Skills": ["Streetwise", "Drive", "Investigate", "Flyer", "Recon", "Gun Combat"],
  "Advanced Education": ["Advocate", "Language", "Explosives", "Medic", "Vacc Suit", "Electronics"],
  "Law Enforcement": ["Investigate", "Recon", "Streetwise", "Stealth", "Melee", "Advocate"],
  "Intelligence": ["Investigate", "Recon", "Electronics (comms)", "Stealth", "Persuade", "Deception"],
  "Corporate": ["Investigate", "Electronics (computers)", "Stealth", "Carouse", "Deception", "Streetwise"],
};


const DrifterOrDraft = {
	label: "Drifter or Draft",
  type: "set",
  v: ["Drifter", "Draft"],
  p: [state => 0.5, state => 0.5],
  o: [
  	state => enqueue(state, TODO("Drifter")),
    state => enqueue(state, TODO("Draft")),
  ],
  r: () => {},  
}

const AgentEntry = {
  label: "Agent Qualification",
  type: "set",
  v: ["Failed", "Succeeded"],
  p: [
    state => 1 - check2d6(6 - mod(state.get("INT"))),
    state => check2d6(6 - mod(state.get("INT"))),
  ],
  o: [
    state => enqueue(state, DrifterOrDraft),
    state => {
    	console.log(state.get("Careers").length, "asdf");
      if (state.get("Careers").length == 0) {
        agentSkills["Service Skills"].forEach(skill => setSkill(state, skill, 0));
      } else {
        enqueue(state, AgentBasicTraining);
      }
      enqueue(state, AgentAssignment);
    },
  ],
  r: () => {},
};

const AgentBasicTraining = chooseSkill("Agent Basic Training", agentSkills['Service Skills']);

const agentAssignments = ["Law Enforcement", "Intelligence", "Corporate"];

function survival(assignments, stats, values) {
	function getCheck(state) {
  	const idx = assignments.indexOf(currentAssignment(state));
    return check2d6(values[idx] - mod(state.get(stats[idx])));
  }
  return {
    label: "Survival",
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
        enqueue(state, AgentEvents);
        enqueue(state, AgentAdvancement)
      }
    ],
    r: () => {},
  }
}
const AgentAdvancement = advancement(agentAssignments, ["INT", "INT", "INT"], [6, 5, 7]);
const AgentSurvival = survival(agentAssignments, ["END", "INT", "INT"], [6, 7, 5])

const agentRanks = {
	"Law Enforcement": {
    0: tb("Rookie"),
    1: tb("Corporal", "Streetwise 1"),
    2: tb("Sergeant"),
    3: tb("Detective"),
    4: tb("Lieutenant", "Investigate 1"),
    5: tb("Chief", "Admin 1"),
    6: tb("Commissioner", "SOC +1"),
  },
	"Intelligence": {
    0: tb(),
    1: tb("Agent", "Deception 1"),
    2: tb("Field Agent", "Investigate 1"),
    3: tb(),
    4: tb("Special Agent", "Gun Combat 1"),
    5: tb("Assistant Director"),
    6: tb("Director"),
  },
 	"Corporate": {
    0: tb(),
    1: tb("Agent", "Deception 1"),
    2: tb("Field Agent", "Investigate 1"),
    3: tb(),
    4: tb("Special Agent", "Gun Combat 1"),
    5: tb("Assistant Director"),
    6: tb("Director"),
  },
};
const AgentAssignment = chooseAssignment("Agent", agentAssignments, agentRanks, AgentSurvival);

const AgentSkillSet = {
  label: "Skill Set",
  type: "set",
  v: skillSets,
  p: skillSets.map(set => set == "Advanced Education" ?
    state => state.get("EDU") >= 8 ? 1 : 0 :
    state => 1),
  o: skillSets.map(set => set == "Assignment" ?
    state => enqueue(state, chooseSkill(`Agent ${set} Skills`, agentSkills[currentAssignment(state)]), true) :
    state => enqueue(state, chooseSkill(`Agent ${set} Skills`, agentSkills[set]), true)),

  r: () => {},
}

const AgentEvents = {
  label: "Agent Events",
  type: "set",
  v: ["Disaster! Roll on the Mishap Table, but you are not ejected from this career.",
    "An investigation takes on a dangerous turn. Roll Investigate 8+ or Streetwise 8+. If you fail, roll on the Mishap Table. If you succeed, increase one of these skills by one level: Deception, Jack-of-all-Trades, Persuade or Tactics.",
    "You complete a mission for your superiors, and are suitably rewarded. Gain DM+1 to any one Benefit roll from this career.",
    "You establish a network of contacts. Gain D3 Contacts.",
    "You are given advanced training in a specialist field. Roll EDU 8+ to increase any one skill you already have by one level.",
    "Life Event. Roll on the Life Events Table.",
    "You go undercover to investigate an enemy. Roll Deception 8+. If you succeed, roll immediately on the Rogue or Citizen Events Table and make one roll on any Specialist skill table for that career. If you fail, roll immediately on the Rogue or Citizen Mishap Table.",
    "You go above and beyond the call of duty. Gain DM+2 to your next Advancement check.",
    "You are given specialist training in vehicles. Gain one of Drive 1, Flyer 1, Pilot 1 or Gunner 1.",
    "You are befriended by a senior agent. Either increase Investigate by one level or DM+4 to an Advancement roll thanks to their aid.",
    "Your efforts uncover a major conspiracy against your employers. You are automatically promoted.",
  ],
  p: p_2d6,
  o: Array.from({
    length: 11
  }, (x, i) => state => enqueue(state, TODO("Agent Events " + i), true)),
  r: () => {},
}


function tb(title="", bonus="") {
	return {
  	title: title,
    bonus: bonus,
  }
}



function advancement(assignments, stats, values) {
  function getCheck(state) {
  	const idx = assignments.indexOf(currentAssignment(state));
    return check2d6(values[idx] - mod(state.get(stats[idx])));
  }
  function advancementSuccess(state) {
    const asgn = currentAssignment(state);
    incr(state, `_${currentCareer(state)}_Rank`);
    const rankData = agentRanks[asgn][state.get(`_${currentCareer(state)}_Rank`)];
    state.set(currentCareer(state) + " Title", rankData.title);
    parseSkill(rankData.bonus)(state);
    enqueue(state, AgentSkillSet, true);
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
function getBenefits(state) {
	if (state.get("Careers").length == 0) return;
	const terms = state.get(`_${currentCareer(state)}_Terms`);
  const rank = state.get(`_${currentCareer(state)}_Rank`);
  const rankBonus = Math.ceil(rank / 2);
  const numBenefits = terms + rankBonus;
  const set = rewardSet(agentCash, agentBenefits);
  const benefitRoll = rank >= 5 ? set[1] : set[0]; 
  console.log(numBenefits);
  [...Array(numBenefits)].forEach(x => enqueue(state, benefitRoll));
}

const ContinueCareer = {
	label: "Continue Career?",
  type: "set",
  v: ["Leave", "Stay"],
  p: [0.2, 0.8].map(val => state => val),
  o: [
  	state => {
    	getBenefits(state);
      enqueue(state, Term);
    }, 
  	state => {
    	enqueue(state, AgentSkillSet);
      enqueue(state, AgentSurvival);
    },
  ],
  r: () => {},
}

const Finish = {
	label: "Finish?",
  type: "set",
  v: ["Yes", "No"],
  p: [state => 0.5, state => 0.5],
  o: [
  	state => {state.set("queue", []); getBenefits(state)},
    () => {}
  ],
  r: state => incr(state, "terms"),
}

const agentCash = [1000, 2000, 5000, 7000, 10000, 25000, 50000];
const agentBenefits = ["%Scientific Equipment", "INT +1", "%Ship Share", "%Weapon", "%Combat Implant", "SOC +1", "%TAS Membership"];

// RUN
const out = document.getElementById("output");
const char = dom(out, 'char');
const log = dom(out, 'log');

let state = new Map();
state.set("terms", 0);
state.set("Careers", []);
enqueue(state, Name);
run(state);
