export interface Exercise {
  id: string;
  name: string;
  category: 'neck-upper' | 'low-back-core' | 'full-body' | 'breathing' | 'desk-worker' | 'kids';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  bodyAreas: string[];
  instructions: string;
  proTip: string;
  nervousSystemWhy: string;
  setsReps: string;
  frequency: string;
}

export const EXERCISE_CATEGORIES = [
  { key: 'neck-upper', label: 'Neck & Upper Back', emoji: '🦴' },
  { key: 'low-back-core', label: 'Low Back & Core', emoji: '💪' },
  { key: 'full-body', label: 'Full Body Mobility', emoji: '🏃' },
  { key: 'breathing', label: 'Stress Relief & Breathing', emoji: '🧘' },
  { key: 'desk-worker', label: 'Desk Worker Specials', emoji: '💻' },
  { key: 'kids', label: 'Kids & Family', emoji: '👶' },
] as const;

export const EXERCISES: Exercise[] = [
  // ─── NECK & UPPER BACK (6) ───────────────────────────────────────────

  {
    id: 'chin-tuck',
    name: 'Chin Tuck',
    category: 'neck-upper',
    difficulty: 'Beginner',
    duration: '2 min',
    bodyAreas: ['Neck', 'Upper back'],
    instructions:
      'Sit or stand tall. Now make a double chin — push your chin straight back like someone poked you in the forehead. Hold it for 5 seconds. Relax. Do that 10 times. You should feel a gentle stretch at the back of your neck.',
    proTip:
      'Keep your eyes looking straight ahead the whole time. If you look down, you are doing it wrong.',
    nervousSystemWhy:
      'This retrains the muscles at the base of your skull that directly connect to your brain stem — the control center for balance, posture, and focus.',
    setsReps: '1 set of 10 reps (5-second hold each)',
    frequency: '2-3 times per day',
  },
  {
    id: 'neck-rotations',
    name: 'Gentle Neck Rotations',
    category: 'neck-upper',
    difficulty: 'Beginner',
    duration: '2 min',
    bodyAreas: ['Neck'],
    instructions:
      'Sit up nice and tall. Slowly turn your head to the right like you are looking over your shoulder. Hold 3 seconds. Come back to center. Now do the same thing to the left. Repeat 8 times each side. Move slowly — this is not a race.',
    proTip:
      'If one side feels tighter, spend a little extra time there. But never push into pain.',
    nervousSystemWhy:
      'The top two bones in your neck have more nerve connections than almost anywhere else in your spine — gentle movement here helps your brain recalibrate balance and coordination.',
    setsReps: '1 set of 8 reps each side (3-second hold)',
    frequency: 'Daily',
  },
  {
    id: 'shoulder-rolls',
    name: 'Shoulder Rolls',
    category: 'neck-upper',
    difficulty: 'Beginner',
    duration: '1 min',
    bodyAreas: ['Shoulders', 'Upper back', 'Neck'],
    instructions:
      'Stand or sit. Shrug your shoulders up toward your ears, then roll them back, then down, then forward. Make big slow circles. Do 10 rolls backward, then 10 forward. Let your arms just hang loose the whole time.',
    proTip:
      'Close your eyes while you do this and really focus on making the biggest circles you can. You will find spots that feel crunchy — that is normal tension releasing.',
    nervousSystemWhy:
      'Your shoulders carry more stress tension than almost anywhere else — rolling them out sends a "relax" signal through the nerves that control your fight-or-flight response.',
    setsReps: '10 rolls backward + 10 rolls forward',
    frequency: 'As often as you want, especially when stressed',
  },
  {
    id: 'upper-trap-stretch',
    name: 'Upper Trap Stretch',
    category: 'neck-upper',
    difficulty: 'Beginner',
    duration: '2 min',
    bodyAreas: ['Neck', 'Shoulders', 'Upper back'],
    instructions:
      'Sit tall. Reach your right hand over your head and gently place it on the left side of your head — do not pull, just rest it there. Let the weight of your hand tilt your head toward your right shoulder. You should feel a stretch on the left side of your neck. Hold 20 seconds. Switch sides. Do 3 times each.',
    proTip:
      'The key word is gently. Your hand is just resting there, not yanking your head sideways. If you feel tingling down your arm, ease up immediately.',
    nervousSystemWhy:
      'The upper trap muscle connects to nerves that run from your neck into your arms — releasing tension here can help with headaches, shoulder pain, and even numbness in your hands.',
    setsReps: '3 reps each side (20-second hold)',
    frequency: 'Daily, especially after screen time',
  },
  {
    id: 'thoracic-extension',
    name: 'Upper Back Extension',
    category: 'neck-upper',
    difficulty: 'Beginner',
    duration: '2 min',
    bodyAreas: ['Upper back', 'Chest'],
    instructions:
      'Stand up. Put your hands behind your head. Lean back gently until you feel a stretch in your upper back. Hold 5 seconds. Come back up. Do it 10 times. That is it.',
    proTip:
      'If you feel dizzy, you are going too far. Ease up. This should feel like a good morning stretch, not a backbend contest.',
    nervousSystemWhy:
      'This opens up the upper back — the same region that controls your heart rate and digestion through the nerves that run alongside your spine.',
    setsReps: '1 set of 10 reps (5-second hold)',
    frequency: 'Daily, great right after your adjustment',
  },
  {
    id: 'cervical-flexor-activation',
    name: 'Deep Neck Flexor Hold',
    category: 'neck-upper',
    difficulty: 'Intermediate',
    duration: '3 min',
    bodyAreas: ['Neck', 'Front of throat'],
    instructions:
      'Lie on your back. Tuck your chin slightly like you are making a gentle double chin. Now lift your head just barely off the ground — like one inch. Hold it for 10 seconds. Put it back down. Rest a few seconds. Do 8 reps. If your chin pokes up toward the ceiling, you have gone too high.',
    proTip:
      'This one is harder than it looks. If 10 seconds is too much, start with 5. The muscles at the front of your neck are usually weak from looking at screens all day.',
    nervousSystemWhy:
      'These deep neck muscles stabilize your spine right where it meets your skull — strengthening them helps your brain get better position signals, which means better posture without even thinking about it.',
    setsReps: '1 set of 8 reps (10-second hold)',
    frequency: '4-5 times per week',
  },

  // ─── LOW BACK & CORE (6) ─────────────────────────────────────────────

  {
    id: 'cat-cow',
    name: 'Cat-Cow',
    category: 'low-back-core',
    difficulty: 'Beginner',
    duration: '2 min',
    bodyAreas: ['Low back', 'Mid back', 'Neck'],
    instructions:
      'Get on your hands and knees. Hands under your shoulders, knees under your hips. Arch your back up like a scared cat — tuck your chin to your chest. Hold 3 seconds. Then drop your belly toward the floor and look up gently like a cow. Hold 3 seconds. Go back and forth 10 times. Move with your breath — breathe in when you look up, breathe out when you round.',
    proTip:
      'Do this right after your adjustment — your body will love it. Make it slow and smooth, not jerky.',
    nervousSystemWhy:
      'This pumps movement through every segment of your spine, waking up the nerves that tell your brain where your body is in space — that is the foundation of good coordination.',
    setsReps: '1 set of 10 reps (3-second hold each position)',
    frequency: 'Daily, morning is best',
  },
  {
    id: 'bird-dog',
    name: 'Bird-Dog',
    category: 'low-back-core',
    difficulty: 'Intermediate',
    duration: '3 min',
    bodyAreas: ['Low back', 'Core', 'Glutes', 'Shoulders'],
    instructions:
      'Start on your hands and knees. Reach your right arm straight out in front of you while you extend your left leg straight behind you. Hold for 5 seconds. Bring them back. Now do the left arm and right leg. That is one rep. Do 8 reps. Keep your back flat — pretend you have a cup of coffee on your low back and you cannot spill it.',
    proTip:
      'If you wobble, that is totally normal. It means your stabilizer muscles are waking up. Start with just lifting one limb at a time if you need to.',
    nervousSystemWhy:
      'This exercise forces opposite sides of your brain to coordinate together — it is one of the best ways to build the brain-body connection that keeps your spine stable all day.',
    setsReps: '1 set of 8 reps each side (5-second hold)',
    frequency: '4-5 times per week',
  },
  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    category: 'low-back-core',
    difficulty: 'Beginner',
    duration: '3 min',
    bodyAreas: ['Glutes', 'Low back', 'Core'],
    instructions:
      'Lie on your back with your knees bent and feet flat on the floor, hip-width apart. Push through your heels and squeeze your butt to lift your hips off the ground. Your body should make a straight line from knees to shoulders. Hold 5 seconds at the top. Lower back down slowly. Do 12 reps.',
    proTip:
      'If you feel this mostly in your hamstrings instead of your glutes, scoot your feet a little closer to your butt. You want to feel the burn right in the booty.',
    nervousSystemWhy:
      'Your glutes are the biggest muscle connected to your low back — when they fire properly, they take massive pressure off the nerves in your lower spine.',
    setsReps: '2 sets of 12 reps (5-second hold at top)',
    frequency: 'Daily',
  },
  {
    id: 'knee-to-chest',
    name: 'Knee-to-Chest Stretch',
    category: 'low-back-core',
    difficulty: 'Beginner',
    duration: '2 min',
    bodyAreas: ['Low back', 'Hips'],
    instructions:
      'Lie on your back. Pull one knee toward your chest with both hands. Keep the other leg flat on the floor or bent — whatever feels comfortable. Hold 20 seconds. Switch legs. Do 3 times each side. Then try both knees at the same time for a bonus stretch.',
    proTip:
      'Pull to where you feel a gentle stretch, not pain. If your hands cannot reach your knee, grab behind your thigh instead.',
    nervousSystemWhy:
      'This opens up the space where your biggest nerves exit your low back — the same nerves that run all the way down to your toes.',
    setsReps: '3 reps each side (20-second hold)',
    frequency: 'Daily, especially before bed',
  },
  {
    id: 'dead-bug',
    name: 'Dead Bug',
    category: 'low-back-core',
    difficulty: 'Intermediate',
    duration: '3 min',
    bodyAreas: ['Core', 'Low back', 'Hips'],
    instructions:
      'Lie on your back. Raise your arms straight toward the ceiling. Bend your knees to 90 degrees so your shins are parallel to the floor. Now slowly lower your right arm overhead and your left leg toward the floor at the same time. Do not let your low back arch off the floor. Bring them back. Switch sides. Do 8 each side.',
    proTip:
      'Press your low back into the floor the entire time. If your back arches up, you have gone too far. Smaller movement done right beats big sloppy movement every time.',
    nervousSystemWhy:
      'This trains your deep core to stabilize your spine automatically — which is exactly what protects your nervous system during everyday movements like bending and lifting.',
    setsReps: '2 sets of 8 reps each side',
    frequency: '4-5 times per week',
  },
  {
    id: 'pelvic-tilts',
    name: 'Pelvic Tilts',
    category: 'low-back-core',
    difficulty: 'Beginner',
    duration: '2 min',
    bodyAreas: ['Low back', 'Core'],
    instructions:
      'Lie on your back with your knees bent. Flatten your low back against the floor by tightening your belly — imagine pulling your belly button to the floor. Hold 5 seconds. Then relax and let your low back arch naturally. That is one rep. Do 15 reps. It is a super small movement — nobody watching would even notice.',
    proTip:
      'This is the single best exercise for anyone with low back stiffness. Do it first thing in the morning before you even get out of bed.',
    nervousSystemWhy:
      'Pelvic tilts gently pump the joints in your low back, which sends a flood of fresh signals to the nerves that control your legs, bladder, and digestion.',
    setsReps: '1 set of 15 reps (5-second hold)',
    frequency: 'Daily, morning and evening',
  },

  // ─── FULL BODY MOBILITY (5) ──────────────────────────────────────────

  {
    id: 'morning-wake-up',
    name: 'Morning Wake-Up Routine',
    category: 'full-body',
    difficulty: 'Beginner',
    duration: '5 min',
    bodyAreas: ['Full body'],
    instructions:
      'Do these 5 moves in order: (1) Stand tall and reach both arms overhead as high as you can — hold 10 seconds. (2) Drop into a forward fold letting your arms dangle — hold 10 seconds. (3) Come back up and do 10 shoulder rolls backward. (4) Put your hands on your hips and make 5 big hip circles each direction. (5) Finish with 5 slow cat-cow stretches on the floor. Total time — about 5 minutes. Your whole body just woke up.',
    proTip:
      'Do this before breakfast every single day. After a week you will not believe how much better your mornings feel.',
    nervousSystemWhy:
      'Moving your entire spine first thing in the morning fires up the nerve pathways that keep you alert, balanced, and energized for the rest of the day.',
    setsReps: '1 round through all 5 moves',
    frequency: 'Every morning',
  },
  {
    id: 'standing-spinal-twist',
    name: 'Standing Spinal Twist',
    category: 'full-body',
    difficulty: 'Beginner',
    duration: '2 min',
    bodyAreas: ['Mid back', 'Low back', 'Core'],
    instructions:
      'Stand with your feet shoulder-width apart. Let your arms hang loose. Now twist your upper body to the right, letting your arms swing naturally like wet noodles. Then twist to the left. Keep going back and forth at an easy pace. Let your arms slap against your body. Do this for about 30 seconds, rest, then go again for 30 seconds.',
    proTip:
      'This should feel playful, not forced. Let gravity and momentum do the work. Your arms are just along for the ride.',
    nervousSystemWhy:
      'Rotational movement through your spine activates the sensors in every spinal joint, which helps your brain map exactly where your body is — that is why you feel more "put together" afterward.',
    setsReps: '2 rounds of 30 seconds',
    frequency: 'Daily',
  },
  {
    id: 'forward-fold',
    name: 'Standing Forward Fold',
    category: 'full-body',
    difficulty: 'Beginner',
    duration: '2 min',
    bodyAreas: ['Hamstrings', 'Low back', 'Calves'],
    instructions:
      'Stand with your feet hip-width apart. Soften your knees — do not lock them. Slowly fold forward from your hips and let your arms dangle toward the floor. Do not worry about touching your toes. Just hang there and let gravity stretch you. Hold 20 seconds. Roll back up slowly one vertebra at a time. Do 3 times.',
    proTip:
      'Bend your knees as much as you need to. This is about stretching your back, not a hamstring competition. Let your head hang heavy.',
    nervousSystemWhy:
      'Hanging forward stretches the entire chain of muscles and nerves along the back of your body — from your skull all the way to your heels — which triggers a deep relaxation response.',
    setsReps: '3 reps (20-second hold)',
    frequency: 'Daily',
  },
  {
    id: 'hip-circles',
    name: 'Hip Circles',
    category: 'full-body',
    difficulty: 'Beginner',
    duration: '2 min',
    bodyAreas: ['Hips', 'Low back', 'Core'],
    instructions:
      'Stand with your feet shoulder-width apart and hands on your hips. Make big slow circles with your hips — like you are hula hooping in slow motion. Do 10 circles clockwise, then 10 counterclockwise. Keep your upper body as still as you can.',
    proTip:
      'If you hear popping or cracking, that is usually just gas bubbles releasing from the joint. Totally normal as long as there is no pain.',
    nervousSystemWhy:
      'Your hips are directly connected to the nerves in your lower spine — mobilizing them helps keep the nerve signals flowing freely to your legs and lower body.',
    setsReps: '10 circles each direction',
    frequency: 'Daily, great as a warm-up',
  },
  {
    id: 'full-body-reach-stretch',
    name: 'Full Body Reach-and-Stretch',
    category: 'full-body',
    difficulty: 'Beginner',
    duration: '2 min',
    bodyAreas: ['Full body'],
    instructions:
      'Stand tall. Reach your right arm up and over your head to the left while pushing your right hip out to the right. You should feel a stretch from your fingertips down to your hip. Hold 15 seconds. Switch sides. Then reach both arms overhead and go up on your tiptoes — stretch as tall as you possibly can. Hold 10 seconds. Drop down. Do the whole thing 3 times.',
    proTip:
      'Breathe into the stretch. Every time you exhale, try to reach just a tiny bit further. That is where the magic happens.',
    nervousSystemWhy:
      'Stretching your whole body in different directions fires up the position sensors in every single joint — it is like giving your brain a full software update on where everything is.',
    setsReps: '3 rounds (15-second hold each side)',
    frequency: 'Daily',
  },

  // ─── STRESS RELIEF & BREATHING (5) ───────────────────────────────────

  {
    id: 'box-breathing',
    name: 'Box Breathing',
    category: 'breathing',
    difficulty: 'Beginner',
    duration: '4 min',
    bodyAreas: ['Diaphragm', 'Nervous system'],
    instructions:
      'Sit comfortably. Breathe in through your nose for 4 counts. Hold your breath for 4 counts. Breathe out through your mouth for 4 counts. Hold empty for 4 counts. That is one box. Do 8 boxes. Keep the counts even — in 4, hold 4, out 4, hold 4. Focus only on counting.',
    proTip:
      'Navy SEALs use this to stay calm in life-or-death situations. If it works for them, it will work for your Monday morning stress too.',
    nervousSystemWhy:
      'The equal intervals of breathing and holding switch your nervous system from "fight or flight" to "rest and digest" — the same state your body needs to heal after an adjustment.',
    setsReps: '8 cycles (about 4 minutes)',
    frequency: 'Anytime you feel stressed, or daily for maintenance',
  },
  {
    id: 'diaphragmatic-breathing',
    name: 'Belly Breathing',
    category: 'breathing',
    difficulty: 'Beginner',
    duration: '3 min',
    bodyAreas: ['Diaphragm', 'Core', 'Nervous system'],
    instructions:
      'Lie on your back or sit comfortably. Put one hand on your chest and one on your belly. Breathe in through your nose and make your belly hand rise while your chest hand stays still. Breathe out slowly through your mouth and feel your belly fall. Do 10 breaths. If your chest is moving more than your belly, slow down and focus on pushing that belly out.',
    proTip:
      'Most people breathe backwards — all chest, no belly. Relearning belly breathing is one of the highest-impact things you can do for your health. Practice it until it becomes your default.',
    nervousSystemWhy:
      'Your diaphragm is directly wired to the vagus nerve — the master "calm down" nerve — so belly breathing literally tells your brain to reduce stress, lower blood pressure, and improve digestion.',
    setsReps: '10 breaths per session',
    frequency: '2-3 times per day',
  },
  {
    id: '4-7-8-breathing',
    name: '4-7-8 Sleep Breathing',
    category: 'breathing',
    difficulty: 'Beginner',
    duration: '3 min',
    bodyAreas: ['Diaphragm', 'Nervous system'],
    instructions:
      'Sit or lie down. Close your mouth. Breathe in quietly through your nose for 4 counts. Hold your breath for 7 counts. Breathe out completely through your mouth making a whoosh sound for 8 counts. That is one breath. Do 4 rounds to start. Work up to 8 rounds over a few weeks.',
    proTip:
      'This is designed to knock you out. Do it in bed when you cannot sleep. Most people do not make it through all 4 rounds before they start feeling drowsy.',
    nervousSystemWhy:
      'The long exhale activates your parasympathetic nervous system so powerfully that it can lower your heart rate within minutes — it is like a natural sleep switch.',
    setsReps: '4-8 cycles',
    frequency: 'Nightly before bed, or anytime you need to calm down',
  },
  {
    id: 'humming-breath',
    name: 'Humming Breath (Bee Breath)',
    category: 'breathing',
    difficulty: 'Beginner',
    duration: '3 min',
    bodyAreas: ['Throat', 'Sinuses', 'Nervous system'],
    instructions:
      'Sit comfortably. Take a deep breath in through your nose. As you breathe out, keep your mouth closed and hum — like a buzzing bee. Make the hum last as long as your exhale. Feel the vibration in your face and throat. Do 10 hums. You can plug your ears with your fingers for extra vibration if you want.',
    proTip:
      'This one feels silly. Do it anyway. The vibration you feel in your face and throat is literally stimulating your vagus nerve. Silly-looking exercises that work are better than cool-looking ones that do not.',
    nervousSystemWhy:
      'The humming vibration directly stimulates the vagus nerve as it passes through your throat — this is one of the fastest ways to activate your body\'s built-in calming system.',
    setsReps: '10 hums per session',
    frequency: 'Daily, or whenever you feel anxious',
  },
  {
    id: 'cold-water-face-splash',
    name: 'Cold Water Face Reset',
    category: 'breathing',
    difficulty: 'Beginner',
    duration: '1 min',
    bodyAreas: ['Face', 'Nervous system'],
    instructions:
      'Go to a sink. Turn on the cold water. Cup your hands, fill them with cold water, and splash it on your face — forehead, cheeks, around your eyes. Do it 5-6 times. Take a slow deep breath. Done. That is it. One minute and your whole nervous system just shifted gears.',
    proTip:
      'This works because of something called the dive reflex — your body thinks you just dove into water and instantly slows your heart rate. It is like a cheat code for calming down fast.',
    nervousSystemWhy:
      'Cold water on your face triggers the mammalian dive reflex through your trigeminal nerve, which immediately activates your vagus nerve and drops your heart rate — instant calm.',
    setsReps: '5-6 splashes',
    frequency: 'Anytime you feel overwhelmed, anxious, or need a reset',
  },

  // ─── DESK WORKER SPECIALS (5) ────────────────────────────────────────

  {
    id: 'seated-figure-4',
    name: 'Seated Figure-4 Hip Opener',
    category: 'desk-worker',
    difficulty: 'Beginner',
    duration: '3 min',
    bodyAreas: ['Hips', 'Glutes', 'Low back'],
    instructions:
      'Sit in your chair with both feet on the floor. Cross your right ankle over your left knee so your legs make a figure-4 shape. Sit up tall. Gently lean forward from your hips until you feel a stretch in your right hip and glute. Hold 30 seconds. Switch sides. Do 2 times each leg.',
    proTip:
      'If you sit all day, your hips are screaming for this stretch right now. Set a phone reminder to do it every 2 hours. Your low back will thank you.',
    nervousSystemWhy:
      'Tight hips pull on the nerves and muscles that attach to your lower spine — opening them up takes direct pressure off the nerves that run down your legs.',
    setsReps: '2 reps each side (30-second hold)',
    frequency: 'Every 2 hours while sitting',
  },
  {
    id: 'desk-push-up',
    name: 'Desk Push-Up',
    category: 'desk-worker',
    difficulty: 'Beginner',
    duration: '2 min',
    bodyAreas: ['Chest', 'Shoulders', 'Core', 'Arms'],
    instructions:
      'Stand about 2 feet from your desk. Place your hands on the edge of the desk, shoulder-width apart. Lower your chest toward the desk by bending your elbows. Push back up. Do 10 reps. Keep your body in a straight line — do not let your hips sag. These are easier than floor push-ups but still get the blood moving.',
    proTip:
      'The further your feet are from the desk, the harder it gets. Start close and work your way back over time. Nobody in the office will judge you — they will probably want to join in.',
    nervousSystemWhy:
      'Getting blood flowing to your chest and shoulders counteracts the hunched posture that compresses the nerves in your upper back all day long.',
    setsReps: '2 sets of 10 reps',
    frequency: '2-3 times during the workday',
  },
  {
    id: 'seated-spinal-twist',
    name: 'Seated Spinal Twist',
    category: 'desk-worker',
    difficulty: 'Beginner',
    duration: '2 min',
    bodyAreas: ['Mid back', 'Low back', 'Core'],
    instructions:
      'Sit sideways in your chair so the back of the chair is to your right. Grab the back of the chair with both hands. Sit up tall and gently twist your torso to the right, using the chair for leverage. Hold 20 seconds. Now switch so the chair back is to your left and twist left. Do 3 times each way.',
    proTip:
      'Exhale as you twist — you will get an extra inch or two of rotation. Never twist through sharp pain though. A gentle stretch is perfect.',
    nervousSystemWhy:
      'Spinal rotation mobilizes the joints in your mid back where the nerves that control your lungs, stomach, and energy levels exit the spine.',
    setsReps: '3 reps each side (20-second hold)',
    frequency: 'Every hour while sitting',
  },
  {
    id: 'wrist-circles',
    name: 'Wrist Circles & Stretches',
    category: 'desk-worker',
    difficulty: 'Beginner',
    duration: '2 min',
    bodyAreas: ['Wrists', 'Forearms', 'Hands'],
    instructions:
      'Hold your arms out in front of you. Make fists and circle your wrists 10 times clockwise, then 10 times counterclockwise. Then open your hands wide and spread your fingers as far apart as you can — hold 5 seconds. Close into fists. Do that open-close thing 10 times. Finish by pressing your palms together in a prayer position and gently pushing your wrists down until you feel a stretch.',
    proTip:
      'If you type all day, your wrists are doing thousands of tiny movements without ever getting a full stretch. Two minutes now saves you from carpal tunnel problems later.',
    nervousSystemWhy:
      'The nerves that control your hands run all the way up from your neck — keeping your wrists mobile prevents compression that can cause numbness, tingling, and weakness in your grip.',
    setsReps: '10 circles each direction + 10 open-close reps',
    frequency: 'Every hour during screen work',
  },
  {
    id: 'standing-desk-break',
    name: 'Standing Desk Break Sequence',
    category: 'desk-worker',
    difficulty: 'Beginner',
    duration: '3 min',
    bodyAreas: ['Full body'],
    instructions:
      'Stand up from your desk. (1) Reach both arms overhead and stretch tall for 10 seconds. (2) Do 10 shoulder rolls backward. (3) Clasp your hands behind your back and squeeze your shoulder blades together — hold 10 seconds. (4) Do 5 standing hip circles each direction. (5) March in place for 20 seconds, lifting your knees high. Sit back down. You just reset your entire body in 3 minutes.',
    proTip:
      'Set a timer on your phone for every 45 minutes. When it goes off, do this sequence. Your productivity will actually go up because your brain gets more blood flow.',
    nervousSystemWhy:
      'Sitting for long periods puts constant pressure on the nerves in your spine and slows blood flow to your brain — this 3-minute reset restores both circulation and nerve signaling.',
    setsReps: '1 round through all 5 moves',
    frequency: 'Every 45-60 minutes while working',
  },

  // ─── KIDS & FAMILY (5) ───────────────────────────────────────────────

  {
    id: 'animal-walks',
    name: 'Animal Walks',
    category: 'kids',
    difficulty: 'Beginner',
    duration: '5 min',
    bodyAreas: ['Full body'],
    instructions:
      'Pick a hallway or open space. Do each animal walk for about 20 seconds: (1) Bear Crawl — walk on hands and feet with your butt in the air. (2) Crab Walk — sit on the floor, put your hands behind you, lift your hips up, and walk backward. (3) Frog Jumps — squat down and jump forward like a frog. (4) Inchworm — bend down, walk your hands out to a plank, then walk your feet to your hands. Take turns with your kids and make it a race!',
    proTip:
      'Kids will do these all day long if you make it a game. Time each animal walk or create an obstacle course. Adults — you will be surprised how tired you get. These are sneaky hard.',
    nervousSystemWhy:
      'Crawling patterns activate both sides of the brain at the same time — this is how babies develop coordination, and it works just as well for adults who want to improve their balance and movement.',
    setsReps: '20 seconds per animal, 2-3 rounds',
    frequency: '3-4 times per week',
  },
  {
    id: 'superman-hold',
    name: 'Superman Floor Hold',
    category: 'kids',
    difficulty: 'Beginner',
    duration: '3 min',
    bodyAreas: ['Low back', 'Glutes', 'Upper back'],
    instructions:
      'Lie face down on the floor. Stretch your arms out in front of you like Superman flying. Now lift your arms, chest, and legs off the floor at the same time. Hold for 5 seconds. Lower everything back down. Rest a moment. Do 8 reps. For little kids — tell them they are flying and see who can hold it longest.',
    proTip:
      'Do not yank your head back — keep looking at the floor. Your neck should stay in line with your spine. If 5 seconds is too easy, work up to 10.',
    nervousSystemWhy:
      'This strengthens all the muscles that run along your spine, which are the same muscles that protect the spinal cord and keep your posture strong throughout the day.',
    setsReps: '1 set of 8 reps (5-second hold)',
    frequency: '3-4 times per week',
  },
  {
    id: 'family-tree-pose',
    name: 'Family Tree Pose',
    category: 'kids',
    difficulty: 'Beginner',
    duration: '3 min',
    bodyAreas: ['Legs', 'Core', 'Ankles', 'Hips'],
    instructions:
      'Stand on one foot. Place the sole of your other foot against your ankle or calf — not on your knee. Put your hands together in front of your chest or raise them overhead like branches. Try to hold for 20 seconds without falling. Switch feet. The whole family does it together and whoever wobbles last wins. No shame in touching a wall for balance.',
    proTip:
      'Stare at one spot on the floor or wall — this tricks your brain into balancing better. Kids are usually way better at this than adults, so prepare to be humbled.',
    nervousSystemWhy:
      'Balance comes directly from your brain processing nerve signals from your feet, eyes, and inner ear all at once — practicing this is like upgrading your brain\'s operating system.',
    setsReps: '3 reps each leg (20-second hold)',
    frequency: '3-4 times per week',
  },
  {
    id: 'jumping-jacks-challenge',
    name: 'Jumping Jacks Challenge',
    category: 'kids',
    difficulty: 'Beginner',
    duration: '3 min',
    bodyAreas: ['Full body'],
    instructions:
      'This is simple. Do jumping jacks as a family. Round 1 — everyone does 10 together. Round 2 — do 15. Round 3 — do 20. Rest 30 seconds between rounds. Try to get everyone clapping at the same time. For tiny kids who cannot do real jumping jacks yet, just have them jump up and down while waving their arms — same benefit.',
    proTip:
      'Make it fun by adding silly rules. Do them in slow motion. Do them super fast. Do them while making animal noises. The point is to move and laugh at the same time.',
    nervousSystemWhy:
      'Jumping sends a wave of healthy impact through your bones and joints, which stimulates the nerve receptors that help your brain coordinate the timing of all your movements.',
    setsReps: '3 rounds of 10/15/20',
    frequency: '3-4 times per week',
  },
  {
    id: 'ragdoll-forward-bend',
    name: 'Ragdoll Hanging Forward Bend',
    category: 'kids',
    difficulty: 'Beginner',
    duration: '2 min',
    bodyAreas: ['Low back', 'Hamstrings', 'Neck'],
    instructions:
      'Stand with your feet hip-width apart. Bend forward at your waist and just let everything hang — your arms, your head, your hands. Do not try to touch your toes. Just flop like a ragdoll. Gently sway side to side. Nod your head yes and no. Stay there for 20 seconds. Slowly roll up one bone at a time until you are standing tall. Do 3 times. Tell the kids to go as floppy as possible.',
    proTip:
      'Bend your knees as much as you want. This is about letting go of tension, not touching the floor. The more relaxed you are, the better it works.',
    nervousSystemWhy:
      'Letting your spine hang with gravity decompresses the spaces between your vertebrae where nerves exit — it is like giving your nervous system room to breathe.',
    setsReps: '3 reps (20-second hold)',
    frequency: 'Daily, great after school or work',
  },
];
