function canPreCareer(state, check) {
	const terms = state.get("terms");
  if (terms > 2) return 0;
  if (state.has("_PreCareerAttempt_" + terms)) return 0;
  return check;
}

const PreCareerEvents = {
  label: "Pre-Career Events",
  type: "set",
  v: [
    "You are approached by an underground (and highly illegal) psionic group who sense potential in you.",
    "Your time in education is not a happy one and you suffer a deep tragedy. You crash and fail to graduate.",
    "A supposedly harmless prank goes wrong and someone gets hurt, physically or emotionally.",
    "Taking advantage of youth, you party as much as you study.",
    "You become involved in a tightly knit clique or group and make a pact to remain friends forever, wherever in the galaxy you may end.",

    "Life Event. Roll on the Life Events table (see page 44).",

    "You join a political movement.",
    "You develop a healthy interest in a hobby or other area of study. Gain any skill of your choice, with the exception of Jack-of-all-Trades, at level 0.",
    "A newly arrived tutor rubs you up the wrong way and you work hard to overturn their conclusions. Roll 9+ on any skill you have learned during this term. If successful, you provide a truly elegant proof that soon becomes accepted as the standard approach. Gain a level in the skill you rolled on and the tutor as a Rival.",
    "War comes and a wide-ranging draft is instigated. You can either flee and join the Drifter career next term or be drafted (roll 1D: 1-3 Army, 4-5 Marine, 6 Navy). Either way, you do not graduate this term. However, if you roll SOC 9+, you can get enough strings pulled to avoid the draft and complete your education – you may attempt graduation normally and are not drafted.",
    "You gain wide-ranging recognition of your initiative and innovative approach to study."
  ],
  p: p_2d6,
  o: [
    state => {},
    state => state.set("_DM_Graduate", -12),
    state => enqueue(state, PreCareerPrank, true),
    state => setSkill(state, "Carouse", 1),
    state => enqueue(state, PreCareerFriends, true),
    state => enqueue(state, TODO("Pre career life event")),
    state => enqueue(state, PreCareerMovement, true),
    state => enqueue(state, TODO("Hobby"), true),
    state => enqueue(state, TODO("Tutor"), true),
    state => enqueue(state, TODO("Draft"), true),
    state => incr(state, "SOC"),
  ],
  r: () => [],
}

const PreCareerPrank = {
  label: "Prank Gone Wrong",
  type: "set",
  v: ["Imprisoned", "Enemy", "Rival"],
  p: [
    state => 1 / 36,
    state => 1 - check2d6(8 - mod(state.get("SOC"))) - 1 / 36,
    state => check2d6(8 - mod(state.get("SOC"))),
  ],
  o: [
    state => enqueue(state, TODO("Imprisoned")),
    state => append(state, "Enemies", "Prank Victim"),
    state => append(state, "Rivals", "Prank Victim"),
  ],
  r: () => {},
}

const PreCareerFriends = uniform({
  label: "School Friends",
  type: "set",
  v: [...Array(3).keys()].map(x => x + 1),
  o: [...Array(3).keys()].map(x => x + 1).map(x => state => append(state, "Allies", x + " School Friends")),
  r: () => {},
});

const PreCareerMovement = {
  label: "Pre Career Movement Leadership",
  type: "set",
  v: ["Failure", "Success"],
  p: [
    state => 1 - check2d6(8 - mod(state.get("SOC"))),
    state => check2d6(8 - mod(state.get("SOC"))),
  ],
  o: [
    state => {},
    state => {
      append(state, "Allies", "Ally of the Movement");
      append(state, "Enemies", "Enemy of the Movement")
    },
  ],
  r: () => {},
}

const UniversityEntry = {
  label: "University Entry",
  type: "set",
  v: ["Failed", "Succeeded"],
  p: [
    state => 1 - check2d6(7 - mod(state.get("EDU"))),
    state => check2d6(7 - mod(state.get("EDU"))),
  ],
  o: [
    state => enqueue(state, Term),
    state => {
      incr(state, "EDU");
      enqueue(state, PreCareerEvents);
      enqueue(state, UniversityGraduation);
    },
  ],
  r: state => state.set("_PreCareerAttempt_" + state.get("terms"), 1),
}

// TODO: DM+1(2) to qualify for Agent, Army, Citizen (corporate), Entertainer(journalist), Marines, Navy, Scholar, Scouts; commission roll
const entryBenefits = ["Agent", "Army", "Citizen (corporate)", "Entertainer (journalist)", "Marines", "Navy", "Scholar", "Scouts", "Commission"];
const universityGradCheck = val => check2d6(val - mod(state.get("INT")) - getMod(state, "Graduate"));
const UniversityGraduation = {
  label: "University Graduation",
  type: "set",
  v: ["Failed", "Succeeded", "Honors"],
  p: [
    state => 1 - universityGradCheck(7),
    state => universityGradCheck(7) - universityGradCheck(11),
    state => universityGradCheck(11),
  ],
  o: [
    state => enqueue(state, UniversitySkills),
    state => {
      enqueue(state, UniversitySkillsGrad);
      entryBenefits.forEach(b => state.set("_DM_" + b, 1))
    },
    state => {
      enqueue(state, UniversitySkillsGrad);
      entryBenefits.forEach(b => state.set("_DM_" + b, 2))
    },
  ],
  r: state => {
  	enqueue(state, Finish);
    enqueue(state, Term);
  },
}

const university_skills = ["Admin", "Advocate", "Animals (training or veterinary)", "Art (any)", "Astrogation", "Electronics (any)", "Engineer (any)", "Language (any)", "Medic", "Navigation", "Profession (any)", "Science (any)"];
const UniversitySkills = uniform({
  label: "University Skills",
  type: "pick",
  v: university_skills,
  o: university_skills.map(skill => (state, idx) => setSkill(state, skill, idx)),
  n: 2,
  r: () => {}
});
const UniversitySkillsGrad = uniform({
  label: "University Skills",
  type: "pick",
  v: university_skills,
  o: university_skills.map(skill => (state, idx) => setSkill(state, skill, idx + 1)),
  n: 2,
  r: () => {}
});

function academyEntry(branch, char, value, skills, gradSpec) {
  return {
    label: branch + " Academy Entry",
    type: "set",
    v: ["Failed", "Succeeded"],
    p: [
      state => 1 - check2d6(value - mod(state.get(char))),
      state => check2d6(value - mod(state.get(char))),
    ],
    o: [
      state => enqueue(state, Term),
      state => {
        skills.forEach(skill => setSkill(state, skill, 0));
        enqueue(state, PreCareerEvents);
        enqueue(state, gradSpec);
      },
    ],
  	r: state => state.set("_PreCareerAttempt_" + state.get("terms"), 1)
  }
}

function academyGraduation(branch) {
  const academyBenefits = state => {
    state.set(`_${branch}_ExtraSkills`, 1);
    state.set("_DM_" + branch, 12);
    state.set("_DM_Commission", 2);
  }

  function academyGraduationCheck(value, state) {
    return check2d6(value - mod(state.get("INT")) -
      (state.get("END") >= 8 ? 1 : 0) -
      (state.get("SOC") >= 8 ? 1 : 0) -
      getMod(state, "Graduate"));
  }
  return {
    label: branch + " Academy Graduation",
    type: "set",
    v: ["Kicked Out", "Failed", "Succeeded", "Honors"],
    p: [
      state => 1 / 36,
      state => 1 - academyGraduationCheck(8, state) - 1 / 36,
      state => academyGraduationCheck(8, state) - academyGraduationCheck(11, state),
      state => academyGraduationCheck(11, state),
    ],
    o: [
      state => {
        state.set(`_DM_${branch}_Commission`, -12);
      },
      state => {
        state.set("_DM_" + branch, 12);
        state.set(`_DM_${branch}_Commission`, -12)
      },
      state => {
        incr(state, "EDU");
        academyBenefits(state)
      },
      state => {
        incr(state, "EDU");
        incr(state, "SOC");
        academyBenefits(state);
        state.set(`_DM_${branch}_Commission`, 12)
      },
    ],
    r: state => {
    	enqueue(state, Finish);
      enqueue(state, Term);
    }
  }
}

const armyServiceSkills = ["Drive", "Vacc Suit", "Athletics", "Gun Combat", "Recon", "Melee", "Heavy Weapons"];
const ArmyAcademyGraduation = academyGraduation("Army");
const ArmyAcademyEntry = academyEntry("Army", "END", 8, armyServiceSkills, ArmyAcademyGraduation);

const marineServiceSkills = ["Vacc Suit", "Athletics", "Gun Combat", "Heavy Weapons", "Tactics", "Stealth"];
const MarineAcademyGraduation = academyGraduation("Marine");
const MarineAcademyEntry = academyEntry("Marine", "END", 9, marineServiceSkills, MarineAcademyGraduation);

const navyServiceSkills = ["Vacc Suit", "Athletics", "Gun Combat", "Pilot", "Gunner", "Mechanic"];
const NavyAcademyGraduation = academyGraduation("Navy");
const NavyAcademyEntry = academyEntry("Marine", "INT", 9, navyServiceSkills, NavyAcademyGraduation);
