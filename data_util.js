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

function binary(check) {
	return [state => 1 - check(state), state => check(state)];
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

function get(state, attr, val = 0) {
	if (!state.has(attr)) return val;
	return state.get(attr);
}

function parseStat(str) {
	for (const chr of characteristics) {
		if (str.startsWith(chr)) {
			if (str.includes(">")) {
				const numbers = str.split("+")[1];
				const increaseBy = parseInt(str.split(">")[0]);
				const increaseTo = parseInt(str.split(">")[1]);
				return state => state.get(chr) >= increaseTo 
					? incr(state, chr, increaseBy) 
					: state.set(chr, increaseTo);
			}
			const val = parseInt(str.split("+")[1]);
			return state => incr(state, chr, val);
		}
	}
	return null
}

function parseSkill(str) {
	if (str == "") return () => {};
	const stat = parseStat(str);
	if (stat != null) {
		return stat;
	}
  const re = /(.*) ([0-9])/;
  const match = str.match(re);
  if (match != null) {
  	return state => setSkill(state, match[1], parseInt(match[2]));
  }
  return state => incr(state, str);
}

function OR(arr) {
	return arr.join(" OR ");
}
function parseBenefit(str) {
	if (str == "") return () => {};
	if (str.includes("OR")) {
		return state => str.split(' OR ').forEach(s => parseBenefit(s)(state));
	}
	if (Array.isArray(str)) {
		return state => str.forEach(s => parseBenefit(s)(state));
	}
	const stat = parseStat(str);
	if (parseStat(str) != null) {
		return stat;
	}
	return state => append(state, ASSETS, str);
}

function currentCareer(state) {
	return state.get(CAREERS).slice(-1)[0];
}

function currentCareerOnly(state) {
	return currentCareer(state).split("/")[0];
}

function currentAssignment(state) {
	return currentCareer(state).split("/")[1];
}

function isFirstCareer(state) {
	return state.get(CAREERS)
		.filter(career => !PreCareers.some(pre => career.includes(pre)))
		.length == 1;
}

function isCurrentPreCareer(state) {
	return PreCareers.some(pre => currentCareer(state).startsWith(pre));
}

function addModifier(state, roll, val) {
	if (!state.has(MODIFIERS)) {
		state.set(MODIFIERS, new Map());
	}
	const modifiers = state.get(MODIFIERS);
	if (!modifiers.has(roll)) {
		modifiers[roll] = [];
	}
	modifiers[roll].append(val);
}