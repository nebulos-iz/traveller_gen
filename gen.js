// DATA

// RUN
const out = document.getElementById("output");
const char = dom(out, 'char');
const log = dom(out, 'log');

let state = new Map();
state.set("terms", 0);
state.set("Careers", []);
enqueue(state, Name);
run(state);
