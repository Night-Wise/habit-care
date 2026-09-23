import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {{ text: string, author: string | null }[]} */
const seed = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Motivation gets you started. Habit keeps you going.", author: "Jim Ryun" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "A year from now you will wish you had started today.", author: "Karen Lamb" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "What you do every day matters more than what you do once in a while.", author: "Gretchen Rubin" },
  { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "Dream big. Start small. Act now.", author: "Robin Sharma" },
  { text: "Make each day your masterpiece.", author: "John Wooden" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Little by little, one travels far.", author: "J.R.R. Tolkien" },
  { text: "Be so good they can't ignore you.", author: "Steve Martin" },
  { text: "Either you run the day or the day runs you.", author: "Jim Rohn" },
  { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" },
  { text: "Habits are the compound interest of self-improvement.", author: "James Clear" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "Every action you take is a vote for the type of person you wish to become.", author: "James Clear" },
  { text: "Never miss twice.", author: "James Clear" },
  { text: "The most effective way to do it, is to do it.", author: "Amelia Earhart" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { text: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
  { text: "It's not whether you get knocked down, it's whether you get up.", author: "Vince Lombardi" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "If you can dream it, you can do it.", author: "Walt Disney" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "All our dreams can come true if we have the courage to pursue them.", author: "Walt Disney" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Nothing is impossible. The word itself says I'm possible.", author: "Audrey Hepburn" },
  { text: "You must do the things you think you cannot do.", author: "Eleanor Roosevelt" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Life is 10% what happens to you and 90% how you react to it.", author: "Charles R. Swindoll" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
  { text: "Go confidently in the direction of your dreams.", author: "Henry David Thoreau" },
  { text: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { text: "Life is like riding a bicycle. To keep your balance, you must keep moving.", author: "Albert Einstein" },
  { text: "Creativity is intelligence having fun.", author: "Albert Einstein" },
  { text: "Stay hungry. Stay foolish.", author: "Steve Jobs" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "If you're going through hell, keep going.", author: "Winston Churchill" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Attitude is a little thing that makes a big difference.", author: "Winston Churchill" },
  { text: "Never, never, never give up.", author: "Winston Churchill" },
  { text: "Nothing will work unless you do.", author: "Maya Angelou" },
  { text: "Do the best you can until you know better. Then when you know better, do better.", author: "Maya Angelou" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Our greatest glory is not in never falling, but in rising every time we fall.", author: "Confucius" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "The mind is everything. What you think you become.", author: "Buddha" },
  { text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha" },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
  { text: "Fortune favors the bold.", author: "Latin Proverb" },
  { text: "A smooth sea never made a skilled sailor.", author: "Franklin D. Roosevelt" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
  { text: "Well done is better than well said.", author: "Benjamin Franklin" },
  { text: "By failing to prepare, you are preparing to fail.", author: "Benjamin Franklin" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Never leave that till tomorrow which you can do today.", author: "Benjamin Franklin" },
  { text: "Whatever you are, be a good one.", author: "Abraham Lincoln" },
  { text: "I am a slow walker, but I never walk back.", author: "Abraham Lincoln" },
  { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "In a gentle way, you can shake the world.", author: "Mahatma Gandhi" },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { text: "Genius is one percent inspiration and ninety-nine percent perspiration.", author: "Thomas Edison" },
  { text: "There is no substitute for hard work.", author: "Thomas Edison" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Knowing is not enough; we must apply. Willing is not enough; we must do.", author: "Johann Wolfgang von Goethe" },
  { text: "Doubt can only be removed by action.", author: "Johann Wolfgang von Goethe" },
  { text: "Discipline equals freedom.", author: "Jocko Willink" },
  { text: "If you want to change the world, start off by making your bed.", author: "William H. McRaven" },
  { text: "Less but better.", author: "Greg McKeown" },
  { text: "What is important is seldom urgent, and what is urgent is seldom important.", author: "Dwight D. Eisenhower" },
  { text: "We first make our habits, and then our habits make us.", author: "John Dryden" },
  { text: "Successful people are simply those with successful habits.", author: "Brian Tracy" },
  { text: "Eat that frog! Do the hardest thing first.", author: "Brian Tracy" },
  { text: "You can edit a bad page. You can't edit a blank one.", author: "Jodi Picoult" },
  { text: "Feel the fear and do it anyway.", author: "Susan Jeffers" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "Don't wish it were easier. Wish you were better.", author: "Jim Rohn" },
  { text: "Success is nothing more than a few simple disciplines, practiced every day.", author: "Jim Rohn" },
  { text: "Deep work creates rare and valuable results.", author: "Cal Newport" },
  { text: "What gets measured gets managed.", author: "Peter Drucker" },
  { text: "Efficiency is doing things right; effectiveness is doing the right things.", author: "Peter Drucker" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
  { text: "Do not let what you cannot do interfere with what you can do.", author: "John Wooden" },
  { text: "Never mistake activity for achievement.", author: "John Wooden" },
  { text: "Put first things first.", author: "Stephen Covey" },
  { text: "Begin with the end in mind.", author: "Stephen Covey" },
  { text: "I am not a product of my circumstances. I am a product of my decisions.", author: "Stephen Covey" },
  { text: "Between stimulus and response there is a space. In that space is our power to choose.", author: "Viktor Frankl" },
  { text: "When we are no longer able to change a situation, we are challenged to change ourselves.", author: "Viktor Frankl" },
  { text: "Those who have a 'why' to live can bear with almost any 'how'.", author: "Viktor Frankl" },
  { text: "Pain is inevitable. Suffering is optional.", author: "Haruki Murakami" },
  { text: "Growth and comfort cannot coexist.", author: "Ginni Rometty" },
  { text: "The obstacle is the way.", author: "Ryan Holiday" },
  { text: "What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius" },
  { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius" },
  { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
  { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
  { text: "Begin at once to live, and count each separate day as a separate life.", author: "Seneca" },
  { text: "If a man knows not to which port he sails, no wind is favorable.", author: "Seneca" },
  { text: "It's not what happens to you, but how you react to it that matters.", author: "Epictetus" },
  { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },
  { text: "Don't explain your philosophy. Embody it.", author: "Epictetus" },
  { text: "No great thing is created suddenly.", author: "Epictetus" },
  { text: "Talk to yourself like someone you are responsible for helping.", author: "Jordan Peterson" },
  { text: "Compare yourself to who you were yesterday, not to who someone else is today.", author: "Jordan Peterson" },
  { text: "Inspiration exists, but it has to find you working.", author: "Pablo Picasso" },
  { text: "Setting goals is the first step in turning the invisible into the visible.", author: "Tony Robbins" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
];

const originals = `
Small steps every day lead to big results.
Do something today that your future self will thank you for.
Progress, not perfection.
Consistency beats intensity.
Don't wait for opportunity. Create it.
Push yourself, because no one else is going to do it for you.
Great things never come from comfort zones.
Wake up with determination. Go to bed with satisfaction.
Show up even when you don't feel like it.
Your only competition is who you were yesterday.
Make today count.
One day or day one. You decide.
Don't expect to be motivated every day. Expect to be disciplined.
Protect your energy. Guard your focus.
Finish what you start.
Be patient with yourself. Growth takes time.
Rest is part of the process, not a reward for finishing it.
You don't need more time. You need more focus.
Stop waiting for the perfect moment.
A little progress each day adds up to big results.
Be stubborn about your goals and flexible about your methods.
Win the morning, win the day.
How you do anything is how you do everything.
Simplify. Then simplify again.
Stay focused and keep shipping.
Ship it. Then improve it.
Done today beats perfect someday.
Start before you're ready.
Fear is a compass pointing to what matters.
Courage is fear walking.
Do it scared.
Breathe. Begin. Become.
Systems over goals.
Environment design beats willpower.
Make the right thing the easy thing.
Identity-based habits stick. Ask: who do I want to become?
Single-tasking is a superpower.
Protect your mornings like they matter — because they do.
Evening rituals set up morning victories.
Sleep is a performance enhancer.
Movement is medicine.
A short walk can untangle a long problem.
Write it down. Clarity loves paper.
Gratitude turns what we have into enough.
Celebrate small wins. They compound.
Track what you want to improve.
Learn continuously. The world won't wait.
Read a little every day.
Stay a student forever.
Listen more than you speak.
Kindness is never wasted.
Routine creates freedom.
Boring is underrated. Boring works.
Show up for the unglamorous reps.
Trust the process when the results are invisible.
Invisible progress is still progress.
Keep going. You're closer than you think.
When motivation fades, systems carry you.
Your calendar reveals your priorities.
Schedule what matters or watch it disappear.
Get comfortable being uncomfortable.
Lean into the hard thing.
Today, be a little braver than yesterday.
Today, be a little kinder than yesterday.
One good habit can change the direction of your whole day.
Check one box. Then another. Momentum loves motion.
Missed a day? Restart without drama.
Self-compassion fuels consistency better than self-criticism.
Say no to protect your yes.
Boundaries are a form of self-respect.
Energy management beats time management.
One focused hour beats three distracted ones.
Create before you consume.
Output first. Input second.
Make something small every day.
First drafts are allowed to be terrible.
You are not your streak. You are the person who returns.
Returning is the habit that matters most.
Today is a fresh page. Write something worth reading.
Let this day be proof that you showed up.
Tiny wins stack into unstoppable momentum.
Be loyal to your future self.
Effort compounds quietly until it becomes obvious.
Let consistency be your unfair advantage.
Your standards become your destiny.
Calm focus beats frantic hustle.
Slow is smooth. Smooth is fast.
Clear space. Clear mind. Clear day.
Ordinary days done well create extraordinary lives.
Keep promises to yourself — especially the small ones.
Self-trust is built one kept commitment at a time.
Hard days still count. Especially hard days.
Steady beats spectacular.
A restart is still progress.
Forgive the slip. Keep the system.
Make starting ridiculously easy.
Two minutes is enough to begin.
Action creates motivation more often than the reverse.
Do the first tiny step and let momentum take over.
You are allowed to begin again at any hour.
Don't wait for January. Start on an ordinary Tuesday.
Prepare in silence. Let results make the noise.
Quiet work. Loud results.
Close the day with something completed.
End the day better than you began it.
Make future you proud in one small way today.
Enough for today is still enough.
Perfectionism is procrastination in a fancy coat.
Ship imperfect. Improve endlessly.
Get moving, then get better.
Direction first. Speed second.
Be fierce with your goals and gentle with yourself.
Hold the standard. Soften the self-talk.
Speak to yourself like a good coach would.
Stay five minutes longer than the urge to quit.
Boredom is the gateway to mastery.
Mastery loves repetition.
Love the process and results become a side effect.
The prize is who you become while practicing.
Character is built in the moments no one applauds.
Unseen effort still shapes you.
Private excellence precedes public success.
A productive day is a happy day.
Start messy. Finish proud.
Your attention is your most valuable asset.
Guard the first hour of your day.
Tie new habits to old anchors.
Design your desk for focus, not distraction.
Leave tomorrow's start already begun.
Reduce decisions so you can increase action.
Rituals turn intention into action.
Connect each habit to a deeper why.
Choose your hard — growth is hard, regret is harder.
Do the work your future self will celebrate.
Balance drive with rest.
Rest is a skill. Practice it.
Recovery is part of high performance.
Lift as you climb.
Leave yourself better than yesterday.
Better is a direction, not a destination.
Sustainable beats heroic.
Build a system you can keep on your worst day.
Design for your lowest-energy self.
Start tiny. Grow steadily.
Consistency first. Intensity later.
See clearly. Act simply. Repeat daily.
Simple actions, repeated, remake a life.
Raise what you pursue. Lower what you tolerate.
Read more than you scroll.
Create more than you compare.
Run your own race at your own pace.
Your timeline is not late — it is yours.
Roots before fruits.
Depth before display.
One bad week does not erase a good year.
Zoom out when you feel stuck.
Zoom in when you feel overwhelmed.
The next right step is enough.
Right now is the only time you can act.
Align intention and action today.
Presence beats perfection every time.
Be so present that yesterday and tomorrow fade for a while.
Open the app. Do the thing. Close the loop.
Your streak is a story you're writing one day at a time.
Protect your peace like it's productive — because it is.
Put your phone in another room and watch your focus return.
Notifications are optional. Attention is not.
Revision is where good work happens.
Ship the draft. Learn from the feedback.
Come back to the work. Come back to yourself.
A quiet morning of focus can change the whole week.
Your next checkmark is waiting.
Build the day you want with the habits you keep.
Choose the harder right over the easier wrong.
The day you plant the seed is not the day you eat the fruit.
Stay with the boring reps that build the extraordinary.
Raise your standards and watch your life follow.
Do what needs doing before it becomes urgent.
Preparation turns pressure into performance.
Finish the open loops that drain your mind.
Organize your environment and your habits will follow.
Design a life that makes good choices automatic.
The person you become is built in ordinary hours.
Practice gratitude and notice how persistence feels lighter.
Be proud of showing up on the hard days.
Your pace can be slow as long as it is steady.
Don't break the chain if you can help it — and repair it if you must.
Your goals need a schedule more than they need a pep talk.
Inspiration is nice. A calendar block is better.
Put the important thing where your eyes can't miss it.
Begin before motivation arrives.
Motion creates emotion.
The hardest part is often just opening the door.
Walk through the door. The rest gets easier.
Midnight resets nothing — your next choice does.
Every hour is a chance to course-correct.
Course-correct early and often.
Ordinary Tuesdays build legendary years.
Be the kind of consistent that looks lucky from the outside.
Luck is often preparation wearing a disguise.
Do it for the feeling of finishing.
Finishing teaches a confidence starting never can.
Leave tomorrow a cleaner slate.
Future you is watching what you do with this hour.
One honest effort is enough for today.
Progress prefers persistence over perfection.
Version one unlocks version two.
You can't steer a parked car.
Aim, then iterate.
Feedback is fuel if you refuse to take it personally.
Thick skin. Soft heart. Strong habits.
Gentle with yourself is not the same as soft on standards.
A good coach corrects without crushing.
Coach yourself through the dip.
The dip is where quitters leave and builders stay.
Five more minutes can change the story of your day.
Often the breakthrough is just past the boredom.
Repetition is not boring when you care about the craft.
Care about the craft and the days take care of themselves.
Fall in love with the practice, not just the prize.
Become someone who does what they said they would do.
What you do in private becomes who you are in public.
Win the private battles and the public ones get easier.
Today's quote is a reminder: begin again, bravely.
Invest attention where you want growth.
The first win of the day sets the tone.
Stack habits onto moments that already exist.
After coffee, stretch. After stretch, begin.
Make good habits obvious, attractive, easy, and satisfying.
Make bad habits invisible, unattractive, difficult, and unsatisfying.
Environment is the invisible hand of behavior.
Lay out what you need the night before.
Decision fatigue is real — automate the small stuff.
A ritual is a habit with meaning.
Meaning fuels longer streaks than willpower alone.
Why clarity turns hard days into chosen days.
Regret weighs more than effort.
Celebrate progress without pausing the process.
Pause to appreciate, then keep moving.
Appreciation without action is just nostalgia.
Action without appreciation burns out.
You cannot pour from an empty cup — refill deliberately.
Fill your cup so you can fill others'.
Serve others after you've strengthened yourself.
Strength shared is strength multiplied.
Leave people better than you found them.
Leave places better than you found them.
Keep aiming slightly beyond comfortable.
Comfortable growth still counts as growth.
Stretch without snapping.
Heroic sprints fade. Sustainable systems endure.
If it's easy on hard days, it sticks on good days.
Lower the bar to start. Raise the bar to finish.
Scale only what you can sustain.
Earn the right to go harder by going longer.
Longevity of effort beats spikes of effort.
Keep the streak honest and the standards kind.
Honesty with yourself is the first habit.
Your life is the sum of what you tolerate and what you pursue.
Choose better inputs for better outputs.
Guard your information diet.
Comparison steals joy and focus.
Bloom in your season.
Seasons of rest prepare seasons of harvest.
Winter work is still work.
Invisible seasons still grow roots.
Build depth that cannot be shaken by a bad week.
Find the next right step and take it.
This moment is your material. Shape it.
Shape today with intention.
Intention without action is a wish.
Action without intention is noise.
Let today's quote move you into motion.
Your comfort zone is a beautiful place, but nothing ever grows there.
Clarity comes from engagement, not thought.
Your habits shape your identity, and your identity shapes your habits.
Remove friction from good habits. Add friction to bad ones.
Multitasking is a myth. Attention is a spotlight.
Water, walk, write — three simple resets.
Journaling is thinking on paper.
Teach what you learn. Teaching deepens mastery.
Ask better questions. You'll get better answers.
Curiosity is a career advantage.
Humility opens doors that pride keeps closed.
Help someone without expecting anything back.
Today's efforts are tomorrow's ease.
Plant seeds of effort. Harvest seasons of growth.
You won't always be motivated. You must learn to be consistent anyway.
A boring plan you follow beats an exciting plan you abandon.
The dip is temporary. Quitting is permanent.
Challenge is what makes life interesting. Overcoming them is what makes life meaningful.
Discomfort is the price of admission to a meaningful life.
Today, be a little more focused than yesterday.
You teach people how to treat you by what you allow.
Do the work when energy is high. Rest when it's low.
Batch the boring. Protect the deep work.
Criticism of the work is not criticism of you.
Separate your identity from your output.
Bravery is not the absence of fear, but action in spite of it.
Anxiety is excitement without breath.
Your body hears everything your mind says. Speak kindly.
Motivation is temporary. Inspiration is temporary. Discipline lasts.
Work smarter, then harder.
A deep life is a good life.
Your network is your net worth — but character is the currency.
Be careful who you share your dreams with.
Art is finished when you decide it is.
Write drunk; edit sober — metaphorically: draft freely, refine carefully.
The harder you work for something, the greater you'll feel when you achieve it.
When you can't win the game, change the rules.
When you can't change the rules, change the game.
Don't wait for the perfect moment — make this one count.
Show up for yourself the way you would for a friend.
Small consistent action beats rare heroic effort.
Keep the promise you made to yourself this morning.
Focus on the next checkmark, not the whole mountain.
Progress loves patience and persistence together.
Let today's effort be quiet and complete.
Build momentum with one honest repetition.
Your future habits are being written by today's choices.
Choose discipline when inspiration is quiet.
A calm mind finishes more than a frantic one.
Protect one sacred block of deep work today.
Finish open loops so your mind can rest.
Make room for what matters by removing what doesn't.
Simplify your plan until starting feels easy.
Trade perfection for progress and watch yourself grow.
Return to the path without apology.
Every restart is proof you still care.
Care enough to continue.
Continue even when applause is missing.
Missing applause is normal — keep building anyway.
Building in silence is still building.
Silence and consistency make a powerful pair.
Pair courage with patience and watch growth unfold.
Unfold your potential one completed task at a time.
At a time is the only pace that lasts.
Lasting change prefers gentle daily pressure.
Pressure applied daily reshapes identity.
Identity follows evidence — collect evidence today.
Today is evidence that you are becoming.
Becoming takes ordinary hours used well.
Used well, an ordinary hour becomes extraordinary.
Extraordinary lives are assembled from ordinary days.
Days like this one are where character is forged.
Forged character makes hard goals feel inevitable.
Inevitable success is usually just long consistency.
Consistency is a love letter to your future self.
`.trim().split('\n').map((t) => t.trim()).filter(Boolean);

const fillers = [];
const verbs = ['Begin', 'Continue', 'Practice', 'Protect', 'Build', 'Choose', 'Honor', 'Strengthen', 'Cultivate', 'Renew'];
const focuses = [
  'your focus',
  'your habits',
  'your craft',
  'your health',
  'your patience',
  'your courage',
  'your discipline',
  'your curiosity',
  'your kindness',
  'your standards',
];
const endings = [
  'one honest step at a time',
  'before the day gets noisy',
  'even when motivation is quiet',
  'as if your future depends on it',
  'with calm and consistency',
  'without waiting for perfect conditions',
  'and let momentum do the rest',
  'like someone who keeps promises',
  'with gratitude for the chance',
  'and trust the compound effect',
];

for (const verb of verbs) {
  for (const focus of focuses) {
    for (const ending of endings) {
      fillers.push(`${verb} ${focus} ${ending}.`);
    }
  }
}

const seen = new Set();
/** @type {{ text: string, author: string | null }[]} */
const unique = [];

function add(text, author) {
  const key = text.trim().toLowerCase();
  if (!key || seen.has(key)) return;
  seen.add(key);
  unique.push({ text: text.trim(), author: author ?? null });
}

for (const q of seed) add(q.text, q.author);
for (const t of originals) add(t, null);
for (const t of fillers) {
  if (unique.length >= 366) break;
  add(t, null);
}

if (unique.length < 366) {
  console.error(`Only generated ${unique.length} quotes`);
  process.exit(1);
}

const final = unique.slice(0, 366).map((q, i) => ({
  id: i + 1,
  text: q.text,
  author: q.author,
}));

const outPath = path.join(__dirname, '..', 'src', 'data', 'daily-quotes.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(final, null, 2) + '\n');
console.log(`Wrote ${final.length} quotes to ${outPath}`);
