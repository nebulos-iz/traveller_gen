const v_2d6 = Array.from({length: 11}, (x, i) => i + 2);

const p_2d6 = v_2d6
  .map(x => x <= 6 ? x - 1 : 13 - x)
  .map(x => state => x);

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
  	return state => append(state, ASSETS, str.substring(1));
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

function currentCareer(state) {
	return state.get(CAREERS).slice(-1)[0];
}

function currentAssignment(state) {
	return currentCareer(state).split("/")[1];
}

function isFirstCareer(state) {
	return state.get(CAREERS)
		.filter(career => !PreCareers.some(pre => career.includes(pre)))
		.length == 0;
}
