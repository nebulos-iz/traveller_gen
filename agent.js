const Agent = {
	name: "Agent",
};
Agent.assignments = ["Law Enforcement", "Intelligence", "Corporate"];
Agent.skills = {
  "Personal Development": ["Gun Combat", "DEX +1", "END +1", "Melee", "INT +1", "Athletics"],
  "Service Skills": ["Streetwise", "Drive", "Investigate", "Flyer", "Recon", "Gun Combat"],
  "Advanced Education": ["Advocate", "Language", "Explosives", "Medic", "Vacc Suit", "Electronics"],
  "Law Enforcement": ["Investigate", "Recon", "Streetwise", "Stealth", "Melee", "Advocate"],
  "Intelligence": ["Investigate", "Recon", "Electronics (comms)", "Stealth", "Persuade", "Deception"],
  "Corporate": ["Investigate", "Electronics (computers)", "Stealth", "Carouse", "Deception", "Streetwise"],
};
Agent.basicTrainingSkills = state => Agent.skills['Service Skills'];
Agent.cash = [1000, 2000, 5000, 7000, 10000, 25000, 50000];
Agent.benefits = [SCIENTIFIC_EQUIPMENT, "INT +1", SHIP_SHARE, WEAPON, COMBAT_IMPLANT, "SOC +1", "TAS Membership"];
Agent.ranks = {
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
Agent.enter = check(INT, 6);
Agent.advance = {
	"Law Enforcement": check("INT", 6),
	"Intelligence": check("INT", 5),
	"Corporate": check("INT", 7),
}
Agent.survive = {
	"Law Enforcement": check("END", 6),
	"Intelligence": check("INT", 7),
	"Corporate": check("INT", 5),
}
Agent.Events = {
  label: "Agent Events",
  type: "set",
  v: ["Disaster!",
    "Dangerous Investigation",
    "Successful Missions",
    "Contact Networks",
    "Advanced Training",
    "Life Event. ",
    "Undercover Mission",
    "Above the Call of Duty",
    "Vehicles Specialist",
    "Friends in High Places",
    "Conspiracy Discovered",
  ],
  p: p_2d6,
  o: [
		state => enqueue(state, Agent.Mishaps, true),
		state => enqueue(state, DangerousInvestigation(state), true),
		state => enqueue(state, TODO("Agent Events " + 3), true),
		state => enqueue(state, TODO("Agent Events " + 4), true),
		state => enqueue(state, TODO("Agent Events " + 5), true),
		state => enqueue(state, TODO("Agent Events " + 6), true),
		state => enqueue(state, TODO("Agent Events " + 7), true),
		state => enqueue(state, TODO("Agent Events " + 8), true),
		state => enqueue(state, TODO("Agent Events " + 9), true),
		state => enqueue(state, TODO("Agent Events " + 10), true),
		state => enqueue(state, TODO("Agent Events " + 11), true),
		state => enqueue(state, TODO("Agent Events " + 12), true),
	],
  r: () => {},
	t: (_, idx) => {
		return ["Roll on the Mishap Table, but you are not ejected from this career.",
			"An investigation takes on a dangerous turn.",
			"You complete a mission for your superiors, and are suitably rewarded. Gain DM+1 to any one Benefit roll from this career.",
			"You establish a network of contacts. Gain D3 Contacts.",
			"You are given advanced training in a specialist field. Roll EDU 8+ to increase any one skill you already have by one level.",
			"Life Event. Roll on the Life Events Table.",
			"You go undercover to investigate an enemy. Roll Deception 8+. If you succeed, roll immediately on the Rogue or Citizen Events Table and make one roll on any Specialist skill table for that career. If you fail, roll immediately on the Rogue or Citizen Mishap Table.",
			"You go above and beyond the call of duty. Gain DM+2 to your next Advancement check.",
			"You are given specialist training in vehicles. Gain one of Drive 1, Flyer 1, Pilot 1 or Gunner 1.",
			"You are befriended by a senior agent. Either increase Investigate by one level or DM+4 to an Advancement roll thanks to their aid.",
			"Your efforts uncover a major conspiracy against your employers. You are automatically promoted.",
		][idx];
	}
}
Agent.Mishaps = uniform({
	label: "Agent Mishaps",
	type: "set",
	v: [
		"Severe Injury",
		"Unpleasant Deal",
		"Career Ruining Investigation",
		"Know Too Much",
		"Close to Home",
		"Injury",
	],
  o: Array.from({length: 11}, (x, i) => state => enqueue(state, TODO("Agent Mishaps " + i), true)),
	r: () => {},
	t: (_, idx) => {
		return [
			"Severely injured (this is the same as a result of 2 on the Injury Table). Alternatively, roll twice on the Injury Table and take the lower result.",
			"A criminal or other figure under investigation offers you a deal. Accept, and you leave this career without further penalty (although you lose the Benefit roll as normal). Refuse, and you must roll twice on the Injury Table and take the lower result. You gain an Enemy and one level in any skill you choose.",
			"An investigation goes critically wrong or leads to the top, ruining your career. Roll Advocate 8+. If you succeed, you may keep the Benefit roll from this term. If you roll 2, you must take the Prisoner career in your next term.",
			"You learn something you should not know, and people want to kill you for it. Gain an Enemy and Deception 1.",
			"Your work ends up coming home with you, and someone gets hurt. Choose one of your Contacts, Allies or family members, and roll twice on the Injury Table for them, taking the lower result.",
			"Injured. Roll on the Injury Table.",
		][idx];
	},
})

function DangerousInvestigation(state) {
	const checkSkill = get(state, "Investigate") > get(state, "Streetwise") ? "Investigate" : "Streetwise";
	return {
		label: "Dangerous Investigation",
		type: "set",
		v: ["Failure", "Success"],
		p: binary(state => check2d6(8 - get(state, checkSkill))),
		o: [
			state => enqueue(state, Agent.Mishaps, true),
			state => enqueue(state, ChooseSkill("Event Success", ["Deception", "Jack-of-all-Trades", "Persuade", "Tactics"]), true),
		],
		r: () => {},
	};
}
