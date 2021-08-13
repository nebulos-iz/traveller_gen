const Army = {
	name: "Army",
};
Army.assignments = ["Support", "Infantry", "Cavalry"];
Army.skills = {
	"Personal Development": ["STR +1", "DEX +1", "END +1", "Gamberl", "Medic", "Melee"],
	"Service Skills": ["Driver or Vacc Suit", "Athletics", "Gun Combat", "Recon", "Melee", "Heavy Weapons"],
	"Advanced Education": ["Tactics (military)", "Electornics", "Navigation", "Explosives", "Engineer", "Survival"],
	"Support": ["Animals", "Carouse", "Melee (blade)", "Stealth", "Seafarer (personal or sails)", "Survival"],
	"Infantry": ["Gun Combat", "Melee", "Heavy Weapons", "Stealth", "Athletics", "Recon"],
	"Cavalry": ["Mechanic", "Drive", "Flyer", "Recon", "Heavy Weapons (vehicle)", "Electronics (sensors)"],
};
Army.basicTrainingSkills = state => Army.skills["Service Skills"];
Army.cash = [2000, 5000, 10000, 10000, 10000, 20000, 30000];
Army.benefits = [COMBAT_IMPLANT, "INT +1", "EDU +1", WEAPON, ARMOR, OR(["END +1", COMBAT_IMPLANT]), "SOC +1"];
Army.ranks = {
	"Enlisted": {
		0: tb("Private", "Gun Combat 1"),
		1: tb("Lance Corporal", "Survival 1"),
		2: tb("Corporal"),
		3: tb("Lance Sergeant", "Leadership 1"),
		4: tb("Sergeant"),
		5: tb("Gunnery Sergeant"),
		6: tb("Sergeant Major"),
	},
	"Officer": {
		0: tb(),
		1: tb("Lieutenant", "Leadership 1"),
		2: tb("Captain", "Streetwise 1"),
		3: tb("Major", "Tactics (military) 1"),
		4: tb("Lieutenant Colonel"),
		5: tb("Colonel"),
		5: tb("General"),
		6: tb("SOC +1>10"),
	},
};
Army.enter = check(END, 5);
Army.survive = {
	"Support": check(END, 5),
	"Infantry": check(STR, 6),
	"Cavalry": check(INT, 7),
}
Army.advance = {
	"Support": check(EDU, 7),
	"Infantry": check(EDU, 6),
	"Cavalry": check(INT, 5),
}
Army.Mishaps = uniform({
	label: "Army Mishaps",
	type: "set",
	v: [
		"Severe Injury",
		"Bloody Commander",
		"Guerillas",
		"Superior Smuggler",
		"Rival",
		"Injury",
	],
  o: Array.from({length: 11}, (x, i) => state => enqueue(state, TODO("Army Events " + i), true)),
	r: () => {},
	t: (_, idx) => {
		return [
			"Severely injured in action (this is the same as a result of 2 on the Injury Table). Alternatively, roll twice on the Injury Table and take the lower result.",
			"Your unit is slaughtered in a disastrous battle, for which you blame your commander. Gain them as an Enemy as they have you removed from the service.",
			"You are sent to a very unpleasant region (jungle, swamp, desert, icecap, urban) to battle against guerrilla fighters and rebels. You are discharged because of stress, injury or because the government wishes to bury the whole incident. Increase Recon or Survival by one level but also gain the rebels as an Enemy.",
			"You discover that your commanding officer is engaged in some illegal activity, such as weapon smuggling. You can join their ring and gain them as an Ally before the inevitable investigation gets you discharged, or you can cooperate with the military police - the official whitewash gets you discharged anyway but you may keep your Benefit roll from this term of service.",
			"You are tormented by or quarrel with an officer or fellow soldier. Gain that officer as a Rival as they drive you out of the service.",
			"Injured. Roll on the Injury Table.",
		][idx];
	},
})
Army.Events = {
	label: "Army Events",
	type: "set",
	v: [
		"Disaster!",
		"Wild Planet",
		"Urban War",
		"Special Assignment",
		"Ground War",
		"Life Event",
		"Advanced Training",
		"Last Stand",
		"Peacekeeper",
		"Commander's Favorite",
		"Heroism",
	],
	p: p_2d6,
	o: Array.from({
		length: 11
	}, (x, i) => state => enqueue(state, TODO("Army Events " + i), true)),
	r: () => {},
	t: (_, idx) => {
		return [
			"Disaster! Roll on the Mishap Table, but you are not ejected from this career.",
			"You are assigned to a planet with a hostile or wild environment. Gain one of Vacc Suit 1, Engineer 1, Animals (riding or training) 1 or Recon 1.",
			"You are assigned to an urbanised planet torn by war. Gain one of Stealth 1, Streetwise 1, Persuade 1 or Recon 1.",
			"You are given a special assignment or duty in your unit. Gain DM+1 to any one Benefit roll.",
			"You are thrown into a brutal ground war. Roll EDU 8+ to avoid injury; if you succeed, you gain one level in Gun Combat or Leadership.",
			"Life Event. Roll on the Life Events Table.",
			"You are given advanced training in a specialist field. Roll EDU 8+ to increase any one skill you already have by one level.",
			"Surrounded and outnumbered by the enemy, you hold out until relief arrives. Gain DM+2 to your next Advancement check.",
			"You are assigned to a peacekeeping role. Gain one of Admin 1, Investigate 1, Deception 1 or Recon 1.",
			"Your commanding officer takes an interest in your career. Either gain Tactics (military) 1 or DM+4 to your next Advancement roll thanks to their aid.",
			"You display heroism in battle. You may gain a promotion or a commission automatically",
		][idx];
	},
}
