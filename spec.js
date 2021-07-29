/*
 * label: pre-text
 * type: freeform / set / pick
 * v: possible outcomes
 * p: probability of outcome [0, 1]
 * o: what to run if outcome is selected
 * n: number to select. pick only
 * r: always runs 
 */

const Term = {
  label: "New Term",
  type: "set",
  v: [UNIVERSITY, ARMY_ACADEMY, MARINE_ACADEMY, NAVY_ACADEMY, AGENT, "TODO"],
  p: [
  	state => canPreCareer(state, UNIVERSITY, check2d6(7 - mod(state.get(EDU)) + state.get(TERMS) - (state.get(SOC) >= 9 ? 1 : 0))),
    state => canPreCareer(state, ARMY_ACADEMY, check2d6(8 - mod(state.get(END)) + 2 * state.get(TERMS))),
    state => canPreCareer(state, MARINE_ACADEMY, check2d6(9 - mod(state.get(END)) + 2 * state.get(TERMS))),
    state => canPreCareer(state, NAVY_ACADEMY, check2d6(9 - mod(state.get(INT)) + 2 * state.get(TERMS))),
    state => canCareer(state, AGENT, check2d6(6 - mod(state.get(INT)) + state.get(CAREERS).length)),
    state => 0.01,
  ],
  o: [
    state => enqueue(state, UniversityEntry),
    state => enqueue(state, ArmyAcademyEntry),
    state => enqueue(state, MarineAcademyEntry),
    state => enqueue(state, NavyAcademyEntry),
    state => enqueue(state, Agent.Entry),
    state => {},
  ],
  r: () => {},
};

const DrifterOrDraft = {
	label: "Drifter or Draft",
  type: "set",
  v: [DRIFTER, DRAFT],
  p: [state => 0.5, state => 0.5],
  o: [
  	state => enqueue(state, TODO("Drifter")), //DrifterAssignment),
    state => enqueue(state, TODO("Draft")),
  ],
  r: () => {},  
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
    	enqueue(state, Agent.SkillSet);
      enqueue(state, Agent.Survival);
    },
  ],
  r: () => {},
}

const Finish = {
	label: "Finish?",
  type: "set",
  v: ["Yes", "No"],
  p: [state => 1.0, state => 0.0],
  o: [
  	state => {state.set(QUEUE, []); getBenefits(state)},
    () => {}
  ],
  r: state => incr(state, TERMS),
}

