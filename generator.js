// Core code for the generator.
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
    const container = dom(log, "c", );
    const label = dom(container, "", spec.label);
    const input = doRender(spec, randomValue);
    container.appendChild(input);
    input.addEventListener('change', e => {
      setMapTo(state, savedState);
      run(state, spec, doSelect(e));
      eraseAndRerun(container, state);
    });
    run(state, spec, randomValue);
    return container;
  }
}

const freeform = generator({
  outcome: (state, spec, value) => spec.o(state, value),
  random: spec => spec.v[Math.floor(Math.random() * spec.v.length)],
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
      option.text = `${spec.v[i]} (${(spec.p[i](state)).toFixed(2)}%)`;
      // option.text = `${spec.v[i]} (${(spec.p[i](state) / total * 100).toFixed(2)}%)`;
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
      option.text = `${spec.v[i]} (${(spec.p[i](state)).toFixed(2)}%)`;
      //option.text = `${spec.v[i]} (${(spec.p[i](state) / total * 100).toFixed(2)}%)`;
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
	if (!spec) throw "spec is not defined";
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
    doSpec(state);
    count++;
  }
  renderState(state);
}
