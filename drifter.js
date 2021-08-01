const Drifter = {
	name: "Drifter",
};
Drifter.assignments = ["Barbarian", "Wanderer", "Scavenger"];
Drifter.skills = {
  "Personal Development": ["STR +1", "END +1", "DEX +1", "Language", "Profession", "Jack-of-all-Trades"],
  "Service Skills": ["Athletics", "Melee (unarmed)", "Recon", "Streetwise", "Stealth", "Survival"],
  "Advanced Education": null,
  "Barbarian": ["Animals", "Carouse", "Melee (blade)", "Stealth", "Seafarer (personal or sails)", "Survival"],
  "Wanderer": ["Drive", "Deception", "Recon", "Stealth", "Streetwise", "Survival"],
  "Scavenger": ["Pilot (small craft)", "Mechanic", "Astrogation", "Vacc Suit", "Profession", "Gun Combat"],
};
Drifter.basicTrainingSkills = state => Drifter.skills[currentAssignment(state)];
Drifter.cash = [0, 0, 1000, 2000, 3000, 4000, 8000];
Drifter.benefits = [CONTACT, WEAPON, ALLY, WEAPON, "EDU +1", SHIP_SHARE, [SHIP_SHARE, SHIP_SHARE]];
Drifter.ranks = {
	"Barbarian": {
    0: tb(),
    1: tb("", "Survival 1"),
    2: tb("Warrior", "Melee (blade) 1"),
    3: tb(),
    4: tb("Chieftain", "Leadership 1"),
    5: tb(),
    6: tb("Warlord"),
  },
	"Wanderer": {
    0: tb(),
    1: tb("", "Streetwise 1"),
    2: tb(),
    3: tb("", "Deception 1"),
    4: tb(),
    5: tb(),
    6: tb(),
  },
 	"Scavenger": {
    0: tb(),
    1: tb("", "Vacc Suit 1"),
    2: tb(),
    3: tb("", "Mechanic 1"), /* or Professor (belter) 1 */
    4: tb(),
    5: tb(),
    6: tb(),
  },
};
Drifter.enter = check(END, 0);
Drifter.advance = {
	"Barbarian": check(STR, 7),
	"Wanderer": check(INT, 7),
	"Scavenger": check(END, 7),
}
Drifter.survive = {
	"Barbarian": check(END, 7),
	"Wanderer": check(END, 7),
	"Scavenger": check(END, 7),
}
Drifter.Events = {
  label: "Drifter Events",
  type: "set",
	v: [
		"Disaster! Roll on the Mishap Table, but you are not ejected from this career.",
		"A patron offers you a chance at a job. If you accept, you gain DM+4 to your next Qualification roll, but you owe that patron a favour.",
		"You pick up a few useful skills here and there. Gain one level of Jack-of-all-Trades, Survival, Streetwise or Melee (any).",
		"You manage to scavenge something of use. Gain DM+1 to any one Benefit roll.",
		"You encounter something unusual. Go to the Life Events Table and have an Unusual Event.",
		"Life Event. Roll on the Life Events Table.",
		"You are attacked by enemies. Gain an Enemy if you do not have one already, and roll either Melee 8+, Gun Combat 8+ or Stealth 8+ to avoid a roll on the Injury Table.",
		"You are offered a chance to take part in a risky but rewarding adventure. If you accept, roll 1D: On a 1-2, you are injured or arrested; either roll on the Injury Table or take the Prisoner career in your next term.  On 3-4, you survive, but gain nothing.  On a 5-6, you succeed. Gain DM+4 to one Benefit roll.",
		"Life on the edge hones your abilities. Increase any skill you already have by one level.",
		"You are forcibly drafted. Roll for the Draft next term.",
		"You thrive on adversity. You are automatically promoted",
	],
  p: p_2d6,
  o: Array.from({
    length: 11
  }, (x, i) => state => enqueue(state, TODO("Drifter Events " + i), true)),
  r: () => {},
}
