// Speaker script, one entry per slide. Target: ~9 minutes total at a relaxed pace.
export const NOTES = [
  {
    title: 'Intro: lights on', time: '0:00 – 0:40',
    say: `(Room dark. Let the black screen breathe.)
"Introducing..."
(Pause while the headlights flicker on.)
"KickShift. A car built to score."
"Every sport has a ball and a player. We're replacing the player with a 900-kilogram electric car. Today I'll show you the physics that makes it work, what it costs to run, and what your money builds."`,
  },
  {
    title: 'The idea', time: '0:40 – 1:20',
    say: `"Soccer is the most watched sport on earth. Supercars are what people put on their walls."
"Car-soccer already exists in video games, and millions of people play it. But nobody has built it for real, because a normal car would destroy itself, the ball, and the budget."
"So the question we asked was: what if the car was the player? Not a road car modified for a stunt, but a car designed from zero for this one sport."
"And this is not a copy of an existing sports car. A road supercar is built to go as fast as possible. KickShift is built to hit, survive, and aim. That's a completely different engineering problem, and that's the gap we want to own."`,
  },
  {
    title: 'Meet the car', time: '1:20 – 2:20',
    say: `"This is the KickShift. Four things make it different from any sports car you know."
"One: boost on demand. Short bursts of extra power, but the arena controls when you get it."
"Two: a lightweight EV chassis, about 900 kilograms, with the battery mounted low for a low centre of mass, so it doesn't roll over in a hit."
"Three: swap-in bumpers that absorb hits and come off in about a minute."
"Four: a strike-face nose. The front is shaped on purpose, because the curve decides where the ball goes."
"Now let's look at why each of those choices is physics, not styling."`,
  },
  {
    title: 'Physics 1: momentum', time: '2:20 – 3:10',
    say: `"Here's the collision as a lab demo: a 900-kilogram cart, our car, hits a 20-kilogram ball at 15 metres per second. Equation 1 is conservation of momentum."
(Point to graph a.) "Watch the velocities. The car drops from 15 to about 14.5 metres per second. The ball jumps from zero to 23.5, about 85 km/h, faster than the car was going."
(Point to graph b.) "And the bars show total momentum before and after is the same. The car hands over only about 3% of its momentum, but because the ball is so light, that's enough to launch it."
"The strobe marks show it too: the ball's marks are spaced further apart, because it's moving faster."
"So the car doesn't need extreme speed to hit hard. Mass does the kicking."`,
  },
  {
    title: 'Physics 2: impulse & bumpers', time: '3:10 – 4:00',
    say: `"Impulse is force times time, and it equals the change in momentum, equation 3. To stop the car you must remove a fixed amount of momentum, but you choose how long that takes."
"Top: a rigid bumper stops the car in 10 milliseconds, with a peak force of 707 kilonewtons and only 25 millimetres of crush."
"Bottom: our crushable module stretches the stop to 50 milliseconds. Peak force falls to 141 kilonewtons, 80% less, with 125 millimetres of crush."
"Same area under both curves, so same impulse. Equation 4 checks it with work and energy: average force times crush distance equals the 11.25 kilojoules of kinetic energy, for both."
"The crushed module is the part designed to wear out. It swaps in about a minute, like changing tyres in Formula 1."`,
  },
  {
    title: 'Physics 3: kinetic energy & boost', time: '4:00 – 4:50',
    say: `"Kinetic energy is one half M v squared, equation 5, and the squared part is the whole story."
"The graph: 30 km/h is 31 kilojoules. Double to 60 and it's not double, it's four times, 125 kilojoules."
"The demo shows why that matters. Same car, same brakes, from 30, 60 and 80 km/h. The friction force does work over the stopping distance, so distance also grows with v squared, equation 6: 3.5 metres, then 14.2, then 25.2."
"That's why boost is on a leash. Drivers get short bursts, but the arena caps speed at 80 km/h, so impacts and stopping distances stay inside what the arena is built for."`,
  },
  {
    title: 'Physics 4: collision angles', time: '4:50 – 5:40',
    say: `"This is a top view. The front of the car is a circle of radius R, 1.5 metres. The ball has radius r."
"When two round surfaces collide, the force acts along the line through both centres, the contact normal n-hat, so the ball leaves along that line."
"If the ball is centred, d equals zero, it goes straight. Offset it by 70 centimetres and it leaves at 18 degrees, up or down depending on the side."
"The graph on the right is equation 7, theta equals arcsine of d over R plus r, and each shot lands on the curve. Skill matters: drivers aim with geometry, like a player using the side of their foot."`,
  },
  {
    title: 'The arena', time: '5:40 – 6:20',
    say: `"The car is only half the system. The arena is the pit crew."
"Cameras sample each car 120 times a second. From the positions alone you get velocity, change in position over time, and acceleration, change in velocity over time. That's equation 8."
"Watch the vectors: velocity is always tangent to the path, and in the turns the acceleration points inward. The dashed circle is the turn radius rho, and the centripetal acceleration is v squared over rho."
"The graphs on the right are the live speed and acceleration. The same data runs the boost limiter, referees the goals, and tells the charging pads when a car is on top of them."`,
  },
  {
    title: 'Cost per match', time: '6:20 – 7:00',
    say: `"Investors always ask what it costs to run. Physics answers that too."
"The top graph is a simulated power trace for one car over a 10-minute match: 40 hard accelerations as spikes up, and regenerative braking below zero, where the motor puts energy back into the battery."
"Energy is the area under the power curve, equation 9. The bottom graph adds it up: about 1.5 kilowatt-hours per match."
"At typical electricity prices that's roughly 25 cents per car. The real operating cost is bumper wear, and that's exactly what the prototype will measure."`,
  },
  {
    title: 'Roadmap', time: '7:00 – 7:50',
    say: `"Here's the plan as a schedule."
"Months 0 to 6: build two prototype cars."
"Months 6 to 9: break them, with a thousand-hit bumper test to prove durability."
"Months 9 to 12: play 50 full test matches and record real cost-per-match data. That's where the seed money ends."
"Year 2: launch a pilot league in a real venue."
"Every stage ends with a number we either hit or don't, so if something fails, like the bumpers wearing out too fast, we find out early and cheaply."`,
  },
  {
    title: 'The ask', time: '7:50 – 8:40',
    say: `"We're raising $250,000 in seed funding."
"Half builds the two prototype cars. A quarter builds the test arena and tracking system. 15% goes to durability testing, and 10% to safety."
"For that, you get two working cars, one test arena, and the hard data that proves whether this sport can run at a reasonable cost."`,
  },
  {
    title: 'Close', time: '8:40 – 9:30',
    say: `(Let the car launch and hit the ball before speaking.)
"Four ideas from this class, one machine. Momentum to kick. Impulse to survive. Energy you can control. Geometry you can aim."
"Imagine the first time a crowd watches a real car score a real goal. We want to build that moment, and we want you in the room when it happens."
"That's KickShift: a car built to score."
"Thank you. I'm happy to take your questions."`,
  },
];
