// DATA

// RUN
const out = document.getElementById("output");
const char = dom(out, 'char');
const log = dom(out, 'log');

let state = new Map();
state.set(TERMS, 0);
state.set(CAREERS, []);
enqueue(state, Name);
run(state);
