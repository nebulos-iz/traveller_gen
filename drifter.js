const drifterAssignments = ["Barbarian", "Wanderer", "Scavenger"];
const driterRanks = {
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
//const DrifterAssignment = assignments("Drifter", drifterAssignments, drifterRanks)

