// Speaker script, one entry per slide. Target: about 9 minutes at a relaxed pace.
export const NOTES = [
  {
    title: 'Intro: lights on', time: '0:00 – 0:40',
    say: `(Room dark. Let the black screen breathe.)
"Introducing..."
(Pause while the headlights flicker on.)
"KickShift. A car built to score."
"Every sport has a ball and a player. In KickShift the player is an electric car, and the field itself powers the game. Today I'll show you the physics that makes that work, and what your money builds."`,
  },
  {
    title: 'The idea', time: '0:40 – 1:10',
    say: `"Soccer is the most watched sport on earth. Supercars are what people put on their walls."
"Car-soccer already exists in video games. Nobody has built it for real, with real energy and real physics."
"So we asked: what if the car was the player, and the field was its fuel station?"`,
  },
  {
    title: 'Meet the car', time: '1:10 – 2:00',
    say: `"This is the KickShift concept car. The technologies inside it already exist. The invention is combining them into a competitive game."
"(a) A supercapacitor, for short bursts of power."
"(b) A receiver coil underneath, which collects energy from charging lanes in the field."
"(c) Motors that turn that stored energy into a boost."
"(d) And a curved strike-face nose for hitting the ball."
"The whole design follows one chain: collect energy, store it, turn it into motion. Let's follow that chain."`,
  },
  {
    title: 'Physics 1: wireless charging', time: '2:00 – 3:00',
    say: `"Under parts of the arena we place coils of wire. Alternating current flows through them. The dots and crosses show current coming out of and going into the page, and they swap as the current alternates."
"That alternating current makes a changing magnetic field above the lane, the arrows flipping up and down."
"The car has a receiver coil underneath. A changing magnetic flux through a coil induces a voltage. That is Faraday's law, equation 1, the same principle as wireless phone charging."
(Point to the graphs.) "Graph a is the field. Graph b is the voltage in the car's coil: it only appears while the car is over the lane. Graph c is the energy collected: energy equals power times time, equation 2."
"The charging lane transfers electrical energy through a magnetic field, so the car collects energy without plugging in. The energy comes from the arena's electricity supply."`,
  },
  {
    title: 'Physics 2: battery and supercapacitor', time: '3:00 – 3:50',
    say: `"The car has two energy stores with different jobs."
(Point to graph a.) "This is a standard chart for energy storage. Across is energy per kilogram, up is power per kilogram, both on log scales. Batteries store far more energy per kilogram. Supercapacitors store less, but take it in and give it out much faster."
"So the battery is endurance: ordinary driving for the whole match. The supercapacitor is the sprint."
(Point to b.) "The lane fills the supercapacitor; pressing boost empties it into the motor. A capacitor stores energy as one half C V squared, equation 3. For our prototype, about 0.87 farads at 48 volts holds 1,000 joules."`,
  },
  {
    title: 'Physics 3: the boost', time: '3:50 – 4:50',
    say: `"What actually makes the boost happen? The supercapacitor sends extra power to the motor, which means more torque at the wheel."
"The tyre pushes backward on the floor, and the floor pushes the car forward. That's Newton's third law: the two forces are equal and opposite."
"But there's a limit: grip. The force can't be more than mu times m g, equation 4. For our 50 kilogram prototype that's about 440 newtons. Watch graph a: push past that limit and the wheel spins, and the force actually drops."
"Graph b shows the other limit: power. At speed, force is at most power divided by speed, equation 5. Boost doubles the power, but at 4 metres per second it's capped by grip anyway."
"So boost depends on stored energy, motor power, tyre grip and heat. And extra wheel power can't make the car fly; that would need an upward force."`,
  },
  {
    title: 'Physics 4: one pass, by the numbers', time: '4:50 – 5:40',
    say: `"Can one pass over a lane give a useful boost? Let's check with illustrative numbers for a small, 50 kilogram, remotely driven prototype."
"The lane is 4 metres long and the car crosses at 4 metres per second, so it spends 1 second over it. At 1,000 watts, it collects 1,000 joules, equation 6."
"Speeding the car up from 4 to 6 metres per second needs one half m times v final squared minus v initial squared: 500 joules, equation 7."
"Even if half the energy is lost in storage and the drivetrain, that's enough. So the boost is physically plausible at this scale."
"Charging a vehicle while it moves has already been shown: Purdue reported wireless power to a truck at highway speed. That supports the principle. Our design still has to be proven, and that's what the prototype is for."`,
  },
  {
    title: 'Physics 5: energy is a tactic', time: '5:40 – 6:30',
    say: `"Here's why the physics makes the game interesting."
"At constant charging power, energy collected equals power times length divided by speed, equation 8. Drive over the lane slowly and you collect more."
"Three cars cross the same lane at 2, 4 and 8 metres per second. The slow one collects 2,000 joules; the fast one, only 500."
"Graph b shows what that buys: crossing at 2 metres per second lets you boost to 6.6, while the fast car barely gains anything. But the slow car spent 2 seconds on the lane, and its opponent might reach the ball first."
"KickShift turns energy management into gameplay: collect power from the field, store it onboard, and decide when to spend it."`,
  },
  {
    title: 'Physics 6: hitting the ball', time: '6:30 – 7:10',
    say: `"And when you do reach the ball, momentum does the kicking. This is the full-size car, 900 kilograms, hitting a 20 kilogram ball at 15 metres per second."
"Momentum is conserved, equation 9. The car slows only slightly, but the light ball leaves at about 23.5 metres per second, equation 10. The bars show the total momentum before and after is the same."`,
  },
  {
    title: 'Operating cost', time: '7:10 – 7:40',
    say: `"What does a match cost? Energy is the area under the power curve, equation 11."
"This simulated trace gives about 1.5 kilowatt-hours per car for a 10-minute match, roughly 25 cents of electricity. Cheap enough that the game can run all day."`,
  },
  {
    title: 'Roadmap', time: '7:40 – 8:20',
    say: `"The plan, in four stages."
"Months 0 to 6: build two 50 kilogram prototype cars."
"Months 6 to 9: charge. Measure exactly how many joules a real lane delivers per pass, and how much survives to the wheels."
"Months 9 to 12: play 50 full test matches."
"Year 2: launch a full-size pilot league."
"Each stage ends with a number we either hit or don't, so if something fails, we find out early and cheaply."`,
  },
  {
    title: 'The ask', time: '8:20 – 9:00',
    say: `"We're raising $250,000 in seed funding."
"40% builds the prototype cars, 30% the charging lanes, 20% testing, and 10% safety."
"For that, you get two prototype cars, a charging test arena, and 50 matches of real energy data that prove whether this game works."`,
  },
  {
    title: 'Close', time: '9:00 – 9:40',
    say: `(Let the car launch and hit the ball before speaking.)
"Faraday's law to charge. A supercapacitor to store. Newton's third law to boost. Momentum to score."
"Collect power from the field, store it onboard, and decide when to spend it."
"That's KickShift: a car built to score. Thank you. I'm happy to take your questions."`,
  },
];
