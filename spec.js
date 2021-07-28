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
    state => enqueue(state, Agent.Entry),
    state => {},
  ],
  r: () => {},
};

const DrifterOrDraft = {
	label: "Drifter or Draft",
  type: "set",
  v: ["Drifter", "Draft"],
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
  p: [state => 0.5, state => 0.5],
  o: [
  	state => {state.set("queue", []); getBenefits(state)},
    () => {}
  ],
  r: state => incr(state, "terms"),
}

