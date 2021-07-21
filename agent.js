const agentAssignments = ["Law Enforcement", "Intelligence", "Corporate"];
const agentSkills = {
  "Personal Development": ["Gun Combat", "DEX +1", "END +1", "Melee", "INT +1", "Athletics"],
  "Service Skills": ["Streetwise", "Drive", "Investigate", "Flyer", "Recon", "Gun Combat"],
  "Advanced Education": ["Advocate", "Language", "Explosives", "Medic", "Vacc Suit", "Electronics"],
  "Law Enforcement": ["Investigate", "Recon", "Streetwise", "Stealth", "Melee", "Advocate"],
  "Intelligence": ["Investigate", "Recon", "Electronics (comms)", "Stealth", "Persuade", "Deception"],
  "Corporate": ["Investigate", "Electronics (computers)", "Stealth", "Carouse", "Deception", "Streetwise"],
};
const agentCash = [1000, 2000, 5000, 7000, 10000, 25000, 50000];
const agentBenefits = ["%Scientific Equipment", "INT +1", "%Ship Share", "%Weapon", "%Combat Implant", "SOC +1", "%TAS Membership"];
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
const AgentSurvival = survival(agentAssignments, ["END", "INT", "INT"], [6, 7, 5])
const AgentAssignment = chooseAssignment("Agent", agentAssignments, agentRanks, AgentSurvival);
const AgentBasicTraining = chooseSkill("Agent Basic Training", agentSkills['Service Skills']);
const AgentAdvancement = advancement(agentAssignments, ["INT", "INT", "INT"], [6, 5, 7]);


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
