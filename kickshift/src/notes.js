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
    say: `"Momentum is mass times velocity. Our car has 900 kilograms at 15 metres per second."
"The ball is about 20 kilograms. When a heavy object hits a light one, the light one leaves faster than the car was even going."
"With a bounce coefficient of 0.6, the ball comes off at about 23.5 metres per second. That's 85 kilometres an hour, while the car barely slows down."
"So the car doesn't need to go fast to hit hard. That's what keeps the sport both exciting and controllable."`,
  },
  {
    title: 'Physics 2: impulse & bumpers', time: '3:10 – 4:00',
    say: `"Impulse is force times time, and it equals the change in momentum. You can't change how much momentum you have to stop, but you can change how long the stop takes."
"A rigid bumper stops the car in about 10 milliseconds, giving a peak force of over 700 kilonewtons. Our honeycomb bumper stretches that to 50 milliseconds."
"Same area under the curve, same impulse, but 80% less peak force on the car, the driver, and the arena."
"And because the bumper is a module, it slides off and a new one goes on in about a minute. The crash parts are designed to be consumed, like tyres in Formula 1."`,
  },
  {
    title: 'Physics 3: kinetic energy & boost', time: '4:00 – 4:50',
    say: `"Kinetic energy is one-half m v squared, and the squared part is the whole story."
"At 30 km/h our car carries about 31 kilojoules. Double the speed to 60 and it's not double the energy. It's four times: 125 kilojoules."
"That's why boost is on a leash. Drivers get short bursts, but the arena caps the top speed at 80 km/h. We get the drama of acceleration without energy levels that make collisions dangerous."`,
  },
  {
    title: 'Physics 4: collision angles', time: '4:50 – 5:40',
    say: `"In a collision between two curved surfaces, the ball leaves along the line connecting the contact point to the ball's centre. We call that the contact normal."
"Because our nose is a curve, where you hit the ball sets the angle. Dead centre, it goes straight. Hit it 70 centimetres off-centre and it leaves at about 18 degrees."
"The formula is theta equals inverse sine of d over capital R plus little r. That means skill matters: drivers aim with geometry, just like a soccer player aims with the side of their foot."`,
  },
  {
    title: 'The arena', time: '5:40 – 6:20',
    say: `"The car is only half of the system. The arena is the pit crew."
"Wireless charging pads are built into the field, so cars top up during play instead of stopping."
"Cameras around the arena track every car and the ball in real time: speed, battery, position. That data runs the boost limits, referees the goals, and feeds the broadcast."
"Putting the intelligence in the arena keeps each car simpler and cheaper."
"It also makes it a business: the arena is the product venues buy, the cars are the equipment, and every match generates live data and footage that can be streamed."`,
  },
  {
    title: 'Cost per match', time: '6:20 – 7:00',
    say: `"Investors always ask: what does it cost to run?"
"We estimate a car uses about one and a half kilowatt-hours in a 10-minute match. That's around 40 hard accelerations, minus what regenerative braking recovers."
"At typical electricity prices that's roughly 25 cents per car, per match. The real operating cost is bumper wear, and that's exactly what our prototype will measure."`,
  },
  {
    title: 'Roadmap', time: '7:00 – 7:50',
    say: `"Here's the plan, in four stages."
"Months 0 to 6: BUILD two prototype cars."
"Months 6 to 9: BREAK them. A thousand-hit bumper test to prove durability."
"Months 9 to 12: PLAY 50 full test matches and record real cost-per-match data."
"Year 2: LAUNCH a pilot league in a real venue."
"Every stage has a number we either hit or we don't, so you'll always know where your money is."
"And if a stage fails, for example if the bumpers wear out too fast, we find out early and cheaply, before anyone builds a stadium."`,
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
"Four laws of physics, one machine. Momentum to kick. Impulse to survive. Energy you can control. Geometry you can aim."
"Imagine the first time a crowd watches a real car score a real goal. We want to build that moment, and we want you in the room when it happens."
"That's KickShift: a car built to score."
"Thank you. I'm happy to take your questions."`,
  },
];
