// ============================================================================
// Supplement Data for Patient Portal
// Written at a 6th-grade reading level — warm, encouraging, no medical jargon.
// ============================================================================

export interface Supplement {
  id: string;
  name: string;
  emoji: string;
  category: string;
  defaultDose: string;
  defaultTiming: "morning" | "midday" | "evening" | "bedtime";
  withFood: boolean;
  whatItIs: string;
  whyChiroRecommends: string;
  whatItDoes: string;
  whoBenefits: string;
  howToTake: string;
  whatToLookFor: string;
  commonConcerns: string;
  research: string;
  signsWorking: string;
  signsYouNeed: string;
}

export interface MealIdea {
  id: string;
  title: string;
  category: "breakfast" | "lunch" | "dinner" | "snack";
  description: string;
  ingredients: string[];
  prepTime: string;
}

// ---------------------------------------------------------------------------
// Supplements
// ---------------------------------------------------------------------------

export const SUPPLEMENTS: Supplement[] = [
  // 1 — Omega-3 Fish Oil
  {
    id: "omega-3",
    name: "Omega-3 Fish Oil",
    emoji: "🐟",
    category: "inflammation",
    defaultDose: "2,000 mg (EPA + DHA combined)",
    defaultTiming: "morning",
    withFood: true,
    whatItIs:
      "Omega-3 fish oil comes from fatty fish like salmon, mackerel, and sardines. It gives your body two special fats called EPA and DHA that most people don't get enough of from food alone. Think of it as liquid gold for calming down irritation inside your body.",
    whyChiroRecommends:
      "When your spine and joints are inflamed, your adjustments can't hold as well. Omega-3s help calm that internal fire so your body responds better to each visit. A less-inflamed nervous system sends clearer signals, which means your brain and body communicate the way they're supposed to.",
    whatItDoes:
      "Omega-3s turn down the volume on inflammation throughout your whole body. They help keep your joints moving smoothly, support healthy brain function, and even help your heart. Many patients notice less stiffness in the morning and more comfort between visits.",
    whoBenefits:
      "Almost everyone! It's especially helpful if you deal with stiff or achy joints, if you sit at a desk all day, or if you don't eat fish at least twice a week. Athletes, busy parents, and anyone recovering from an injury tend to notice the biggest difference.",
    howToTake:
      "Take with your biggest meal of the day — the fat in your food helps your body absorb it. If you get fishy burps, try keeping the bottle in the freezer and taking the capsule frozen. Start with one capsule and work up to the full dose over a week.",
    whatToLookFor:
      "Look for a brand that lists the EPA and DHA amounts separately on the label (not just 'fish oil 1,000 mg'). You want at least 600 mg EPA and 400 mg DHA per serving. Choose brands that are third-party tested for purity — this means someone checked for mercury and other junk.",
    commonConcerns:
      "Fish oil is very safe for most people. If you take blood-thinning medication, talk to your doctor first since omega-3s can thin the blood slightly. Fishy aftertaste is the most common complaint — the freezer trick usually fixes that. High-quality brands rarely cause stomach upset.",
    research:
      "Omega-3s are one of the most well-studied supplements in the world. Hundreds of studies show they help reduce markers of inflammation. Research also supports their role in heart health, brain function, and joint comfort. Many doctors and chiropractors consider them a foundational supplement.",
    signsWorking:
      "Within 2-4 weeks you may notice less morning stiffness, smoother-feeling joints, and maybe even a better mood. After 8-12 weeks, many patients say their skin looks healthier and they recover faster after workouts or busy days.",
    signsYouNeed:
      "Dry skin, cracking nails, stiff or achy joints (especially in the morning), brain fog, and low mood can all point to not getting enough omega-3s. If you rarely eat fish, there's a good chance you could benefit.",
  },

  // 2 — Vitamin D3
  {
    id: "vitamin-d3",
    name: "Vitamin D3",
    emoji: "☀️",
    category: "immune",
    defaultDose: "5,000 IU",
    defaultTiming: "morning",
    withFood: true,
    whatItIs:
      "Vitamin D3 is sometimes called the 'sunshine vitamin' because your skin makes it when you spend time in the sun. The problem is most of us spend our days indoors, and even when we're outside, sunscreen blocks D3 production. This supplement gives your body what the sun used to provide.",
    whyChiroRecommends:
      "Vitamin D3 plays a huge role in how your muscles and nerves work together. Without enough of it, your muscles can feel weak and your nervous system doesn't fire as efficiently. That means your adjustments may not hold as long, and your body takes longer to heal between visits.",
    whatItDoes:
      "D3 helps your body absorb calcium so your bones stay strong. It supports your immune system so you get sick less often. It also helps your muscles work properly and supports a healthy mood — especially during the darker months of the year.",
    whoBenefits:
      "If you live anywhere that gets cold winters, work indoors, have darker skin, or just don't get 20 minutes of direct sun most days, you probably need more D3. It's especially important for bone health as we get older.",
    howToTake:
      "Take it with a meal that has some fat in it — eggs, avocado, or even butter on toast works great. D3 is fat-soluble, which just means your body needs a little fat to grab onto it. Morning is ideal so it doesn't interfere with sleep.",
    whatToLookFor:
      "Make sure the label says D3 (cholecalciferol), not D2 — your body uses D3 much more easily. Look for 5,000 IU per capsule. Many good brands combine D3 with a little vitamin K2, which helps direct calcium to your bones instead of your arteries.",
    commonConcerns:
      "D3 is very safe at recommended doses. Since it builds up in your body over time, it's smart to get your levels checked once a year with a simple blood test. Your doctor can tell you your exact number and whether you need more or less.",
    research:
      "Research shows that a huge portion of adults are low in vitamin D — some studies say over 40%. Low D3 is linked to weaker bones, a sluggish immune system, and even low mood. Supplementing has been shown to improve all of these areas when levels are brought back to a healthy range.",
    signsWorking:
      "You may notice fewer colds, more energy, and a brighter mood within 4-8 weeks. Over several months, bone density tests may improve and you might feel stronger during workouts.",
    signsYouNeed:
      "Feeling tired all the time, getting sick often, achy bones or muscles, and feeling down — especially in winter — are all classic signs of low vitamin D. A simple blood test is the best way to know for sure.",
  },

  // 3 — Magnesium Glycinate
  {
    id: "magnesium",
    name: "Magnesium Glycinate",
    emoji: "🌙",
    category: "nervous-system",
    defaultDose: "400 mg",
    defaultTiming: "bedtime",
    withFood: false,
    whatItIs:
      "Magnesium is a mineral your body uses for over 300 different jobs — from helping your muscles relax to keeping your heartbeat steady. Glycinate is a gentle form that's easy on your stomach and especially good for calming your nervous system before bed.",
    whyChiroRecommends:
      "Your nervous system needs magnesium to switch from 'go mode' to 'rest and repair mode.' When you're low on magnesium, your muscles stay tense and your nerves stay fired up — which means your adjustments have to work against tight, stressed-out muscles. Magnesium helps everything relax so your body can actually use the correction.",
    whatItDoes:
      "It helps your muscles relax, supports deep sleep, calms a racing mind, and can even help with occasional headaches and leg cramps. Many patients say it's the one supplement that made the biggest difference in how they feel day to day.",
    whoBenefits:
      "If you're stressed, have trouble sleeping, get muscle cramps, or feel tense all the time, magnesium is probably your best friend. It's also great for anyone who drinks coffee daily, exercises a lot, or deals with headaches.",
    howToTake:
      "Take it about 30-60 minutes before bed. You don't need food with the glycinate form, but it's fine to take with a light snack. Start with 200 mg for the first week and work up to 400 mg. Some people do best splitting the dose — 200 mg in the afternoon and 200 mg at bedtime.",
    whatToLookFor:
      "The word 'glycinate' or 'bisglycinate' on the label is key — this is the form that's gentle on your stomach and best for sleep and relaxation. Avoid magnesium oxide if you can — it's cheap but poorly absorbed and more likely to cause bathroom issues.",
    commonConcerns:
      "Magnesium glycinate rarely causes stomach upset. If you take too much, the main side effect is loose stools — just cut back a little. If you have kidney problems, check with your doctor first since your kidneys are in charge of clearing extra magnesium.",
    research:
      "Studies show that most adults don't get enough magnesium from food alone. Research links low magnesium to poor sleep, muscle cramps, anxiety, and even higher blood pressure. Supplementing with glycinate has been shown to improve sleep quality and reduce muscle tension.",
    signsWorking:
      "Better sleep is usually the first thing people notice — often within the first week. After 2-4 weeks, you may notice fewer muscle cramps, less tension in your shoulders and neck, and a calmer overall feeling.",
    signsYouNeed:
      "Muscle cramps (especially at night), trouble falling asleep, feeling anxious or wound up, eye twitches, and headaches are all common signs of low magnesium. Craving chocolate is another surprising clue — cacao is one of nature's richest sources of magnesium.",
  },

  // 4 — Turmeric / Curcumin
  {
    id: "turmeric",
    name: "Turmeric (Curcumin)",
    emoji: "🟡",
    category: "inflammation",
    defaultDose: "500-1,000 mg curcumin",
    defaultTiming: "morning",
    withFood: true,
    whatItIs:
      "Turmeric is the bright yellow spice you see in curry dishes. Curcumin is the powerful compound inside turmeric that gives it its color and its health benefits. A supplement gives you a concentrated dose — way more than you'd get from sprinkling turmeric on your food.",
    whyChiroRecommends:
      "Inflammation is one of the biggest things that keeps your body from healing after an adjustment. Curcumin is nature's best inflammation fighter. When we calm down that internal swelling, your spine holds its alignment better and your nervous system can do its job without interference.",
    whatItDoes:
      "Curcumin helps calm inflammation throughout your entire body — joints, muscles, gut, and even your brain. Many patients notice less pain, easier movement, and faster recovery. It's also a powerful antioxidant, which means it protects your cells from daily wear and tear.",
    whoBenefits:
      "Anyone dealing with joint discomfort, stiffness, or slow recovery after activity. It's especially popular with patients who want a natural approach to managing everyday aches and pains. Athletes and active people love it for recovery.",
    howToTake:
      "Take with a meal that includes some fat and, ideally, a pinch of black pepper — both dramatically increase absorption. Many good supplements already include black pepper extract (called piperine or BioPerine). Start with 500 mg and increase if needed.",
    whatToLookFor:
      "Look for a product that says 'curcumin' (not just turmeric powder) and includes black pepper extract or uses a special absorption technology. Brands that list 95% curcuminoids are giving you the good stuff. Without an absorption helper, your body barely uses plain curcumin.",
    commonConcerns:
      "Curcumin is very safe for most people. It can thin the blood slightly, so if you're on blood thinners, talk to your doctor. It may turn your nails slightly yellow if you handle the powder — totally harmless. Some people notice a warm feeling in their stomach, which is normal.",
    research:
      "Curcumin has been studied in thousands of research papers. It's been shown to be as effective as some over-the-counter pain relievers for joint comfort, without the side effects. Studies also show benefits for brain health, heart health, and digestive comfort.",
    signsWorking:
      "Most people notice less joint stiffness and easier movement within 2-4 weeks. After 6-8 weeks of consistent use, many patients report they need less over-the-counter pain relief and feel more comfortable during their daily activities.",
    signsYouNeed:
      "If your joints feel stiff, you're slow to recover after exercise or a long day, or you notice puffiness and soreness that lingers, your body may be dealing with too much inflammation. Curcumin can help turn that down.",
  },

  // 5 — Probiotics
  {
    id: "probiotics",
    name: "Probiotics",
    emoji: "🦠",
    category: "gut",
    defaultDose: "30-50 billion CFU",
    defaultTiming: "morning",
    withFood: false,
    whatItIs:
      "Probiotics are friendly bacteria that live in your gut and help keep everything running smoothly. Your gut is home to trillions of tiny organisms — when the good ones outnumber the bad ones, you feel great. Probiotics are like sending reinforcements to the good team.",
    whyChiroRecommends:
      "Your gut and your nervous system are deeply connected — scientists call it the gut-brain axis. About 70% of your immune system lives in your gut, and your gut makes most of your body's serotonin (the 'feel-good' chemical). A healthy gut means a healthier nervous system, which means your body responds better to chiropractic care.",
    whatItDoes:
      "Probiotics help with digestion, reduce bloating and gas, support your immune system, and can even improve your mood. They help your body break down food and absorb the nutrients from everything else you eat — including your other supplements.",
    whoBenefits:
      "Anyone who's taken antibiotics, deals with bloating or digestive issues, gets sick often, or eats a lot of processed food. If you've ever felt like your stomach just isn't happy, probiotics are a great place to start.",
    howToTake:
      "Take first thing in the morning on an empty stomach with a glass of water, about 15-20 minutes before eating. This gives the bacteria the best chance of making it to your gut alive. Some brands are designed to be taken with food — check your label.",
    whatToLookFor:
      "Look for a brand with multiple strains (different types of bacteria), at least 30 billion CFU, and a delayed-release capsule that protects the bacteria from stomach acid. Lactobacillus and Bifidobacterium strains are the most well-studied. Refrigerated brands are often fresher.",
    commonConcerns:
      "When you first start, you might notice a little more gas or bloating for a few days — that's actually a sign the probiotics are working and your gut is adjusting. Start with a lower dose and work up. If you're severely immune-compromised, check with your doctor first.",
    research:
      "The science on probiotics has exploded in the last decade. Studies show they can improve digestive symptoms, boost immune function, reduce the severity of colds, and even help with mood and anxiety. The gut-brain connection is one of the hottest areas in health research right now.",
    signsWorking:
      "Within 1-2 weeks, digestion usually feels smoother — less bloating, more regularity. After a month, many people notice they get sick less often and feel more energetic. Some patients even report clearer skin and a better mood.",
    signsYouNeed:
      "Frequent bloating, gas, irregular digestion, catching every cold that goes around, or feeling run-down even when you're sleeping enough. If you've taken antibiotics recently, probiotics are especially important since antibiotics wipe out good bacteria along with the bad.",
  },

  // 6 — B-Complex
  {
    id: "b-complex",
    name: "B-Complex",
    emoji: "⚡",
    category: "energy",
    defaultDose: "1 capsule (full spectrum B vitamins)",
    defaultTiming: "morning",
    withFood: true,
    whatItIs:
      "B-Complex is a group of eight B vitamins that work together like a team. They include B1, B2, B3, B5, B6, B7 (biotin), B9 (folate), and B12. Each one has a different job, but they all help your body turn food into energy and keep your nerves healthy.",
    whyChiroRecommends:
      "B vitamins are essential fuel for your nervous system. Every nerve signal — from your brain down your spine and out to your fingers and toes — depends on B vitamins to travel properly. When your B levels are healthy, your nervous system works more efficiently, and that means your adjustments can do their best work.",
    whatItDoes:
      "B vitamins help you make energy from your food, support healthy nerve function, help your body handle stress, and keep your mood balanced. They also support healthy hair, skin, and nails. Many patients say they feel a noticeable lift in energy and mental clarity.",
    whoBenefits:
      "If you're tired even after a full night's sleep, feel stressed, eat a mostly plant-based diet, or just feel like you're running on empty, B vitamins can help. They're especially important for women, older adults, and anyone under a lot of stress.",
    howToTake:
      "Take in the morning with breakfast — B vitamins can be energizing, so taking them at night might keep you awake. They're water-soluble, meaning your body uses what it needs and flushes the rest. Don't be alarmed if your urine turns bright yellow — that's just extra B2 and it's completely normal.",
    whatToLookFor:
      "Choose a brand that uses 'methylated' forms — especially methylfolate (instead of folic acid) and methylcobalamin (instead of cyanocobalamin). These are the forms your body can actually use right away without having to convert them first. Not everyone's body converts the cheap forms well.",
    commonConcerns:
      "B vitamins are very safe since your body just gets rid of what it doesn't need. The bright yellow urine is harmless. Some people feel a burst of energy that can feel jittery at first — if that happens, try taking it with a bigger meal or start with half a capsule.",
    research:
      "Research consistently shows that B vitamins support energy production, nerve health, and stress management. Studies have found that B-complex supplementation can improve mood, reduce feelings of stress, and support cognitive function — especially in people who were previously low.",
    signsWorking:
      "More energy and mental clarity are usually the first things people notice, often within the first week. Over time, you may feel more resilient to stress, notice healthier hair and nails, and feel like your brain is working more sharply.",
    signsYouNeed:
      "Feeling exhausted even after sleeping, brain fog, cracks at the corners of your mouth, tingling in your hands or feet, feeling overwhelmed by stress, and pale or yellowish skin can all point to low B vitamins.",
  },

  // 7 — Vitamin C
  {
    id: "vitamin-c",
    name: "Vitamin C",
    emoji: "🍊",
    category: "immune",
    defaultDose: "1,000 mg",
    defaultTiming: "morning",
    withFood: true,
    whatItIs:
      "Vitamin C is one of the most well-known vitamins in the world. Your body can't make it or store much of it, so you need a fresh supply every day. It's found in fruits and vegetables, but a supplement ensures you're getting enough even on days when your diet isn't perfect.",
    whyChiroRecommends:
      "Vitamin C is essential for building and repairing connective tissue — that's the stuff that holds your spine, joints, and muscles together. It also helps make collagen, which your discs, ligaments, and tendons need to stay strong and flexible. Better connective tissue means your adjustments hold longer and your body heals faster.",
    whatItDoes:
      "It supports your immune system, helps build collagen for healthy skin and joints, acts as a powerful antioxidant to protect your cells, and helps your body absorb iron from food. It's also great for recovery after injuries or intense physical activity.",
    whoBenefits:
      "Everyone benefits from vitamin C, but it's especially helpful if you're recovering from an injury, get sick often, are under a lot of stress, or smoke. Athletes and anyone doing physical rehab will notice the recovery support.",
    howToTake:
      "Take with breakfast. If 1,000 mg bothers your stomach, split it into two 500 mg doses — one with breakfast and one with lunch. Buffered vitamin C (calcium ascorbate) is gentler on the stomach than plain ascorbic acid.",
    whatToLookFor:
      "Look for vitamin C with bioflavonoids — these are natural plant compounds that help your body absorb and use the vitamin C better. Buffered forms are easier on sensitive stomachs. Avoid products loaded with sugar or artificial colors.",
    commonConcerns:
      "Vitamin C is very safe. Taking too much can cause loose stools — if that happens, just dial back the dose. It won't cause kidney stones in healthy people at normal doses despite what some old myths say. If you have kidney disease, talk to your doctor about the right amount.",
    research:
      "Decades of research support vitamin C for immune function, collagen production, and antioxidant protection. Studies show it can reduce the duration of colds, support wound healing, and help protect cells from damage caused by stress, pollution, and aging.",
    signsWorking:
      "You may notice fewer colds and faster recovery when you do get sick. Over time, your skin may look healthier, cuts and bruises may heal faster, and your gums may feel stronger. Many patients notice they bounce back quicker after tough days.",
    signsYouNeed:
      "Frequent colds, slow wound healing, bleeding gums, dry and rough skin, easy bruising, and feeling run-down are all signs you might need more vitamin C. High stress burns through your vitamin C stores quickly.",
  },

  // 8 — Collagen Peptides
  {
    id: "collagen",
    name: "Collagen Peptides",
    emoji: "💪",
    category: "joint",
    defaultDose: "10-15 grams",
    defaultTiming: "morning",
    withFood: false,
    whatItIs:
      "Collagen is the most abundant protein in your body — it's the glue that holds you together. It's in your skin, bones, tendons, ligaments, and discs. Collagen peptides are a broken-down form that dissolves easily in liquids and is simple for your body to absorb.",
    whyChiroRecommends:
      "Your spinal discs, ligaments, and joint cartilage are mostly made of collagen. As we age, our body makes less of it, which is why joints get stiffer and injuries take longer to heal. By giving your body the building blocks it needs, collagen helps your spine and joints stay resilient between adjustments.",
    whatItDoes:
      "Collagen supports healthy joints, strengthens bones, improves skin elasticity, and helps your hair and nails grow stronger. It gives your body the raw materials to repair and maintain all the connective tissues that keep you moving comfortably.",
    whoBenefits:
      "Anyone over 30 (that's when collagen production starts declining), people with joint stiffness, athletes, anyone recovering from an injury, and people who want healthier skin, hair, and nails. It's one of the most universally helpful supplements.",
    howToTake:
      "Mix into your morning coffee, tea, smoothie, or even water — it dissolves completely and has no taste. You can also stir it into oatmeal or soup. Take it daily for best results. Some people take it on an empty stomach for maximum absorption.",
    whatToLookFor:
      "Look for 'hydrolyzed collagen peptides' from grass-fed, pasture-raised sources. Types I and III are best for skin, hair, nails, and tendons. Type II is best for joint cartilage. Many good products include multiple types. Third-party testing is always a plus.",
    commonConcerns:
      "Collagen is extremely safe — it's just protein. Some people notice a feeling of fullness since it is a protein supplement. If you have food allergies, check the source (bovine, marine, or chicken). Marine collagen comes from fish, so avoid it if you have a fish allergy.",
    research:
      "Studies show that collagen peptides can improve joint comfort, increase skin hydration, strengthen bones, and support tendon and ligament health. Research on athletes found that collagen supplementation reduced joint pain during activity and sped up recovery.",
    signsWorking:
      "Stronger nails and healthier-looking skin are usually the first signs, often within 4-6 weeks. Joint comfort and flexibility improvements typically show up after 8-12 weeks of daily use. Many patients say their hair grows faster and feels thicker.",
    signsYouNeed:
      "Stiff or creaky joints, thinning hair, brittle nails, skin that's losing its bounce, slow recovery from injuries, and joint discomfort during or after exercise are all signs your body could use more collagen.",
  },

  // 9 — Zinc
  {
    id: "zinc",
    name: "Zinc",
    emoji: "🛡️",
    category: "immune",
    defaultDose: "25-30 mg",
    defaultTiming: "evening",
    withFood: true,
    whatItIs:
      "Zinc is a trace mineral that your body uses for hundreds of important tasks — from fighting off germs to healing wounds to keeping your sense of taste and smell sharp. Your body doesn't store zinc, so you need a little bit every day.",
    whyChiroRecommends:
      "Zinc is critical for tissue repair and immune defense. When your body is healing — whether from an injury, a new exercise routine, or the structural changes happening with chiropractic care — zinc is one of the key players making that repair happen. A strong immune system also means fewer sick days interrupting your care plan.",
    whatItDoes:
      "Zinc supports your immune system, helps wounds heal faster, supports healthy skin, and plays a role in making DNA and proteins. It's also important for your sense of taste and smell and helps your body use other nutrients more effectively.",
    whoBenefits:
      "People who get sick often, heal slowly, eat a plant-based diet (zinc from plants is harder to absorb), or are under a lot of stress. It's also important for men's health and for anyone recovering from surgery or injury.",
    howToTake:
      "Take with dinner or your evening meal — zinc on an empty stomach can cause nausea. Don't take it at the same time as calcium or iron supplements, since they compete for absorption. If you take a multivitamin with zinc already in it, you may not need extra.",
    whatToLookFor:
      "Zinc picolinate, zinc glycinate, and zinc citrate are well-absorbed forms. Avoid zinc oxide — it's the cheapest form and your body doesn't use it well. Look for 25-30 mg per serving. More isn't always better with zinc — too much can cause problems.",
    commonConcerns:
      "Don't take more than 40 mg per day from all sources without guidance, as too much zinc over time can lower your copper levels. Taking it with food prevents the nausea that some people experience. If you notice a metallic taste, you may be taking too much.",
    research:
      "Research shows zinc is essential for a healthy immune response. Studies found that zinc supplementation can reduce the duration of colds and support faster wound healing. It's also been studied for its role in skin health, hormone balance, and maintaining healthy DNA.",
    signsWorking:
      "Fewer colds, faster healing of small cuts and scratches, and clearer skin are common early signs. Many people notice they just feel more resilient — like their body is better at bouncing back from whatever life throws at them.",
    signsYouNeed:
      "Catching every cold, slow wound healing, loss of taste or smell, frequent skin breakouts, white spots on your fingernails, and low energy can all be signs of zinc deficiency. Vegetarians and vegans are at higher risk.",
  },

  // 10 — CoQ10
  {
    id: "coq10",
    name: "CoQ10 (Ubiquinol)",
    emoji: "❤️",
    category: "energy",
    defaultDose: "100-200 mg",
    defaultTiming: "morning",
    withFood: true,
    whatItIs:
      "CoQ10 is a natural substance that every cell in your body uses to make energy. It's especially concentrated in your heart, brain, and muscles — the organs that need the most power. As we age, our body makes less of it, and certain medications (like statins) can lower levels further.",
    whyChiroRecommends:
      "Your nervous system is one of the most energy-hungry systems in your body. Every nerve signal requires energy. When your cells have enough CoQ10, your nervous system runs more efficiently, your muscles recover faster after adjustments, and your body has the power it needs to heal and adapt to the changes chiropractic care is making.",
    whatItDoes:
      "CoQ10 helps your cells produce energy, protects them from damage, supports heart health, and helps your muscles work at their best. Many patients report more stamina, better exercise recovery, and an overall feeling of vitality.",
    whoBenefits:
      "Anyone over 40 (production drops with age), people on statin medications, anyone who feels fatigued, and athletes or active people who want better recovery. It's especially important for heart health and anyone who feels like their energy just isn't what it used to be.",
    howToTake:
      "Take with a meal that includes fat for best absorption. The ubiquinol form is already in the active state your body needs — it's better absorbed than the cheaper ubiquinone form, especially for people over 40. Morning is best so the energy boost doesn't affect sleep.",
    whatToLookFor:
      "Look for 'ubiquinol' on the label — this is the active, ready-to-use form. If you see 'ubiquinone,' that's the form your body has to convert first (harder to do as you age). Soft gels tend to absorb better than dry capsules. 100-200 mg is the sweet spot for most people.",
    commonConcerns:
      "CoQ10 is very safe with almost no side effects. It may interact with blood-thinning medications, so check with your doctor if you take those. Some people feel an energy boost that takes a few days to adjust to — totally normal.",
    research:
      "Extensive research supports CoQ10 for energy production, heart health, and antioxidant protection. Studies show it can improve fatigue, support exercise performance, and help people on statins who experience muscle fatigue. It's one of the most studied supplements for heart and cellular health.",
    signsWorking:
      "More energy and less fatigue are usually noticed within 2-4 weeks. Better exercise recovery and improved stamina often follow. If you were on statins and experiencing muscle aches, many people notice significant relief within a few weeks.",
    signsYouNeed:
      "Feeling tired even after rest, muscle weakness or fatigue (especially if you take a statin), poor exercise recovery, and a general sense of low vitality. If you're over 40 and feel like your battery doesn't charge like it used to, CoQ10 is worth trying.",
  },

  // 11 — Melatonin
  {
    id: "melatonin",
    name: "Melatonin",
    emoji: "😴",
    category: "sleep",
    defaultDose: "1-3 mg",
    defaultTiming: "bedtime",
    withFood: false,
    whatItIs:
      "Melatonin is a hormone your brain naturally makes when it gets dark outside — it's your body's signal that it's time to sleep. Screens, artificial light, stress, and age can all mess up your natural melatonin production. A small supplement can help get your sleep schedule back on track.",
    whyChiroRecommends:
      "Your body does most of its healing and repair while you sleep — including the structural changes from your adjustments. Poor sleep means poor recovery. When your nervous system gets quality rest, it processes the day's input, repairs tissues, and resets for the next day. Melatonin helps make sure that healing window stays open.",
    whatItDoes:
      "Melatonin helps you fall asleep faster, improves sleep quality, and helps reset your body's internal clock. It's also a surprisingly powerful antioxidant that protects your brain cells while you sleep. It doesn't knock you out like a sleeping pill — it gently tells your body it's time for rest.",
    whoBenefits:
      "People who have trouble falling asleep, anyone dealing with jet lag or shift work, screen-heavy lifestyles (phones and computers suppress natural melatonin), and older adults whose natural production has declined.",
    howToTake:
      "Take 30-60 minutes before your desired bedtime. Start with the lowest dose (1 mg) and only increase if needed. More is NOT better with melatonin — too much can actually make your sleep worse. Keep your room dark after taking it to help it work with your body's natural rhythm.",
    whatToLookFor:
      "Less is more with melatonin. Look for low-dose options (1-3 mg). Some brands sell 5-10 mg tablets, which is way more than most people need. Sublingual (under the tongue) or liquid forms absorb faster. Extended-release versions are good if you fall asleep but wake up in the middle of the night.",
    commonConcerns:
      "Melatonin is safe for short-term use. It's not addictive and doesn't create dependence. Some people feel groggy the next morning — that usually means the dose was too high. If you're pregnant, nursing, or have an autoimmune condition, talk to your doctor first. It's meant to be a reset tool, not a forever solution.",
    research:
      "Research supports melatonin for falling asleep faster, improving sleep quality, and resetting circadian rhythms after jet lag or schedule changes. Studies also highlight its role as an antioxidant. It's considered safe and effective for short-to-medium-term use.",
    signsWorking:
      "Falling asleep faster is usually immediate (the first or second night). Over 1-2 weeks, you may notice you're sleeping deeper and waking up feeling more refreshed. Your sleep schedule should start feeling more consistent.",
    signsYouNeed:
      "Trouble falling asleep, lying in bed with a racing mind, waking up feeling unrested, being a night owl who can't shift to an earlier schedule, and feeling wired at bedtime but tired all day are all signs your melatonin rhythm might need a reset.",
  },

  // 12 — Glucosamine + Chondroitin
  {
    id: "glucosamine",
    name: "Glucosamine + Chondroitin",
    emoji: "🦴",
    category: "joint",
    defaultDose: "1,500 mg glucosamine / 1,200 mg chondroitin",
    defaultTiming: "morning",
    withFood: true,
    whatItIs:
      "Glucosamine and chondroitin are natural compounds found in your cartilage — the smooth, rubbery tissue that cushions your joints. As we age or put wear and tear on our joints, this cartilage can break down. These supplements give your body the raw materials to maintain and rebuild that cushioning.",
    whyChiroRecommends:
      "Healthy cartilage means healthy joints, and healthy joints respond better to chiropractic adjustments. When the cushioning between your bones is well-maintained, your spine and other joints move more freely, hold their alignment better, and cause less nerve irritation. Think of it as maintaining the shock absorbers on your car.",
    whatItDoes:
      "This combination supports cartilage health, reduces joint stiffness, improves mobility, and may slow down the normal wear and tear that happens in joints over time. Many patients notice smoother, more comfortable movement — especially in the knees, hips, and spine.",
    whoBenefits:
      "Anyone with joint stiffness or discomfort, active people who put stress on their joints, older adults, and anyone who wants to protect their joint health long-term. It's especially popular with people who have knee, hip, or hand discomfort.",
    howToTake:
      "Take with food to avoid stomach upset. You can take the full dose at once or split it into two doses. This is a slow-building supplement — give it a full 8-12 weeks before deciding if it's working. Consistency is key.",
    whatToLookFor:
      "Look for glucosamine sulfate (the most studied form) paired with chondroitin sulfate. Some products also add MSM (methylsulfonylmethane) for extra joint support. If you have a shellfish allergy, look for a shellfish-free glucosamine — they exist and work just as well.",
    commonConcerns:
      "Very safe for most people. If you have a shellfish allergy, make sure your glucosamine isn't sourced from shellfish shells. May interact mildly with blood thinners. Some people notice mild digestive changes at first — taking with food usually solves this.",
    research:
      "Glucosamine and chondroitin are among the most studied joint supplements in the world. Large clinical trials have shown they can improve joint comfort and function, especially for moderate joint issues. Some studies suggest they may help slow cartilage breakdown over time.",
    signsWorking:
      "This one takes patience. Most people start noticing improvements around 8-12 weeks — less stiffness getting out of bed, easier movement during exercise, and more comfort during daily activities. The benefits tend to build over several months.",
    signsYouNeed:
      "Stiff joints (especially in the morning or after sitting), creaky or crunchy-sounding joints, joint discomfort during or after activity, and a family history of joint problems are all signs that glucosamine and chondroitin could help.",
  },
];

// ---------------------------------------------------------------------------
// Supplement Categories
// ---------------------------------------------------------------------------

export const SUPPLEMENT_CATEGORIES: Array<{ id: string; label: string }> = [
  { id: "all", label: "All" },
  { id: "inflammation", label: "Inflammation" },
  { id: "nervous-system", label: "Nervous System" },
  { id: "gut", label: "Gut Health" },
  { id: "energy", label: "Energy" },
  { id: "sleep", label: "Sleep" },
  { id: "immune", label: "Immune" },
  { id: "joint", label: "Joint & Bone" },
];

// ---------------------------------------------------------------------------
// Meal Ideas (Anti-Inflammatory)
// ---------------------------------------------------------------------------

export const MEAL_IDEAS: MealIdea[] = [
  // Breakfast (5)
  {
    id: "meal-b1",
    title: "Berry Blast Smoothie Bowl",
    category: "breakfast",
    description:
      "A thick, creamy smoothie bowl loaded with antioxidants to start your day with a burst of natural energy and fight inflammation from the first bite.",
    ingredients: [
      "1 cup frozen mixed berries",
      "1/2 banana",
      "1/2 cup spinach",
      "1/4 cup coconut milk",
      "1 scoop collagen peptides",
      "Top with sliced almonds, chia seeds, and fresh berries",
    ],
    prepTime: "5 minutes",
  },
  {
    id: "meal-b2",
    title: "Turmeric Scrambled Eggs",
    category: "breakfast",
    description:
      "Fluffy scrambled eggs with a golden twist. Turmeric and veggies make this a protein-packed, anti-inflammatory breakfast that keeps you full all morning.",
    ingredients: [
      "3 eggs",
      "1/2 tsp turmeric",
      "Pinch of black pepper",
      "Handful of spinach",
      "1/4 avocado, sliced",
      "1 tbsp olive oil or butter",
    ],
    prepTime: "10 minutes",
  },
  {
    id: "meal-b3",
    title: "Overnight Oats with Walnuts",
    category: "breakfast",
    description:
      "Prep the night before and grab it on your way out. Oats give you steady energy, walnuts add omega-3s, and cinnamon helps balance blood sugar.",
    ingredients: [
      "1/2 cup rolled oats",
      "1/2 cup almond milk",
      "1 tbsp chia seeds",
      "1 tbsp walnuts, chopped",
      "1/2 tsp cinnamon",
      "1/2 cup blueberries",
    ],
    prepTime: "5 minutes (+ overnight soak)",
  },
  {
    id: "meal-b4",
    title: "Avocado Toast with Smoked Salmon",
    category: "breakfast",
    description:
      "Healthy fats from avocado and omega-3s from salmon make this a powerhouse breakfast for your brain and joints. Simple, delicious, and packed with nutrients.",
    ingredients: [
      "1 slice whole grain or sourdough bread",
      "1/2 avocado, mashed",
      "2 oz smoked salmon",
      "Squeeze of lemon",
      "Everything bagel seasoning",
      "Optional: capers and red onion",
    ],
    prepTime: "5 minutes",
  },
  {
    id: "meal-b5",
    title: "Green Power Smoothie",
    category: "breakfast",
    description:
      "Don't worry — you can't taste the spinach! This smoothie is sweet, creamy, and loaded with nutrients to fuel your morning and reduce inflammation.",
    ingredients: [
      "1 cup spinach",
      "1/2 banana",
      "1/2 cup frozen mango",
      "1 tbsp almond butter",
      "1 cup unsweetened almond milk",
      "1 scoop collagen peptides",
    ],
    prepTime: "5 minutes",
  },

  // Lunch (5)
  {
    id: "meal-l1",
    title: "Rainbow Salad with Grilled Chicken",
    category: "lunch",
    description:
      "The more colors on your plate, the more variety of nutrients you're getting. This salad is a delicious way to fight inflammation while actually enjoying your lunch.",
    ingredients: [
      "4 oz grilled chicken breast",
      "Mixed greens",
      "Bell peppers (red, yellow, orange)",
      "Cucumber and cherry tomatoes",
      "1/4 avocado",
      "Olive oil and lemon dressing",
    ],
    prepTime: "15 minutes",
  },
  {
    id: "meal-l2",
    title: "Turkey and Veggie Lettuce Wraps",
    category: "lunch",
    description:
      "Crisp lettuce cups filled with seasoned ground turkey and crunchy vegetables. Light, satisfying, and easy to pack for work without the bread bloat.",
    ingredients: [
      "4 oz ground turkey, seasoned with garlic and ginger",
      "Butter lettuce leaves",
      "Shredded carrots",
      "Sliced cucumber",
      "Fresh cilantro",
      "Coconut aminos or tamari for dipping",
    ],
    prepTime: "15 minutes",
  },
  {
    id: "meal-l3",
    title: "Salmon and Sweet Potato Bowl",
    category: "lunch",
    description:
      "A warm, comforting bowl that's loaded with omega-3s, fiber, and flavor. The combination of salmon and sweet potato is one of nature's best anti-inflammatory duos.",
    ingredients: [
      "4 oz baked or grilled salmon",
      "1/2 cup roasted sweet potato cubes",
      "1 cup steamed broccoli",
      "1/4 avocado",
      "Drizzle of tahini",
      "Sesame seeds",
    ],
    prepTime: "25 minutes",
  },
  {
    id: "meal-l4",
    title: "Mediterranean Quinoa Bowl",
    category: "lunch",
    description:
      "Inspired by the Mediterranean diet — one of the most anti-inflammatory ways of eating in the world. Filling, flavorful, and great as leftovers.",
    ingredients: [
      "1 cup cooked quinoa",
      "Cucumber, tomatoes, and red onion, diced",
      "Kalamata olives",
      "2 tbsp hummus",
      "Crumbled feta (optional)",
      "Olive oil and lemon juice",
    ],
    prepTime: "20 minutes",
  },
  {
    id: "meal-l5",
    title: "Bone Broth Soup with Veggies",
    category: "lunch",
    description:
      "Bone broth is liquid gold for your joints and gut. This simple soup is warm, healing, and full of collagen and minerals your body craves.",
    ingredients: [
      "2 cups bone broth (chicken or beef)",
      "Diced carrots, celery, and onion",
      "1 cup chopped kale or spinach",
      "1 clove garlic, minced",
      "Fresh herbs (thyme, parsley)",
      "Salt and pepper to taste",
    ],
    prepTime: "20 minutes",
  },

  // Dinner (5)
  {
    id: "meal-d1",
    title: "Herb-Crusted Salmon with Roasted Veggies",
    category: "dinner",
    description:
      "A restaurant-quality dinner that's surprisingly easy. Salmon is the king of anti-inflammatory foods, and roasted vegetables bring out their natural sweetness.",
    ingredients: [
      "6 oz salmon fillet",
      "Fresh herbs (dill, parsley, garlic)",
      "Lemon slices",
      "Roasted asparagus and cherry tomatoes",
      "1 tbsp olive oil",
      "Salt, pepper, and garlic powder",
    ],
    prepTime: "25 minutes",
  },
  {
    id: "meal-d2",
    title: "Chicken Stir-Fry with Ginger and Turmeric",
    category: "dinner",
    description:
      "Quick, colorful, and packed with anti-inflammatory spices. This stir-fry hits all the right notes — protein, veggies, and flavors that actually fight pain.",
    ingredients: [
      "6 oz chicken breast, sliced thin",
      "Broccoli, bell peppers, and snap peas",
      "1 tbsp coconut aminos",
      "1 tsp fresh ginger, grated",
      "1/2 tsp turmeric",
      "Serve over cauliflower rice",
    ],
    prepTime: "20 minutes",
  },
  {
    id: "meal-d3",
    title: "Turkey Meatballs with Zucchini Noodles",
    category: "dinner",
    description:
      "A lighter take on spaghetti and meatballs that won't leave you feeling heavy. Zucchini noodles are a fun, low-inflammation swap that tastes great with marinara.",
    ingredients: [
      "1 lb ground turkey",
      "Italian seasoning and garlic",
      "3 medium zucchini, spiralized",
      "1 cup marinara sauce (no sugar added)",
      "Fresh basil",
      "1 tbsp olive oil",
    ],
    prepTime: "30 minutes",
  },
  {
    id: "meal-d4",
    title: "Grass-Fed Beef and Veggie Sheet Pan",
    category: "dinner",
    description:
      "Everything on one pan — easy cleanup! Grass-fed beef has more omega-3s than regular beef, and the roasted veggies round out a balanced, inflammation-fighting dinner.",
    ingredients: [
      "6 oz grass-fed beef strips",
      "Brussels sprouts, halved",
      "Sweet potato cubes",
      "Red onion wedges",
      "2 tbsp avocado oil",
      "Garlic, rosemary, salt, and pepper",
    ],
    prepTime: "30 minutes",
  },
  {
    id: "meal-d5",
    title: "Coconut Curry Shrimp",
    category: "dinner",
    description:
      "A warming, flavorful dish that feels indulgent but is actually great for you. Coconut milk, turmeric, and ginger are a triple threat against inflammation.",
    ingredients: [
      "8 oz shrimp, peeled and deveined",
      "1 can coconut milk (full fat)",
      "1 tbsp curry paste",
      "1 cup spinach",
      "1/2 tsp turmeric",
      "Serve over cauliflower rice or brown rice",
    ],
    prepTime: "20 minutes",
  },

  // Snacks (5)
  {
    id: "meal-s1",
    title: "Apple Slices with Almond Butter",
    category: "snack",
    description:
      "The perfect balance of crunchy, sweet, and creamy. The fiber from the apple and protein from the almond butter keep you satisfied without a sugar crash.",
    ingredients: [
      "1 medium apple, sliced",
      "2 tbsp almond butter",
      "Sprinkle of cinnamon",
    ],
    prepTime: "2 minutes",
  },
  {
    id: "meal-s2",
    title: "Guacamole with Veggie Sticks",
    category: "snack",
    description:
      "Creamy, zesty guacamole with crunchy vegetables instead of chips. Avocados are full of healthy fats that help calm inflammation and keep your brain happy.",
    ingredients: [
      "1 ripe avocado, mashed",
      "Squeeze of lime",
      "Salt, garlic, and cilantro",
      "Carrot sticks, celery, and bell pepper strips",
    ],
    prepTime: "5 minutes",
  },
  {
    id: "meal-s3",
    title: "Trail Mix (Homemade)",
    category: "snack",
    description:
      "Skip the store-bought trail mix loaded with sugar and make your own. This version is full of healthy fats, a touch of sweetness, and satisfying crunch.",
    ingredients: [
      "1/4 cup raw almonds",
      "1/4 cup walnuts",
      "2 tbsp pumpkin seeds",
      "2 tbsp dark chocolate chips (70%+ cacao)",
      "2 tbsp unsweetened coconut flakes",
    ],
    prepTime: "2 minutes",
  },
  {
    id: "meal-s4",
    title: "Hard-Boiled Eggs with Everything Seasoning",
    category: "snack",
    description:
      "Protein-packed, portable, and ridiculously easy. Prep a batch at the start of the week and you've got grab-and-go fuel for days.",
    ingredients: [
      "2 hard-boiled eggs",
      "Everything bagel seasoning",
      "Pinch of sea salt",
    ],
    prepTime: "2 minutes (if pre-made)",
  },
  {
    id: "meal-s5",
    title: "Frozen Berry and Coconut Bites",
    category: "snack",
    description:
      "A refreshing, sweet treat that feels like dessert but is actually good for you. Frozen berries with coconut cream are a simple way to satisfy a sweet tooth naturally.",
    ingredients: [
      "1/2 cup mixed berries",
      "2 tbsp coconut cream",
      "Drizzle of honey (optional)",
      "Freeze for 30 minutes for a frozen treat",
    ],
    prepTime: "5 minutes (+ freezing time)",
  },
];

// ---------------------------------------------------------------------------
// Inflammation Triggers
// ---------------------------------------------------------------------------

export const INFLAMMATION_TRIGGERS: Array<{
  title: string;
  description: string;
  whatToDo: string;
}> = [
  {
    title: "Sugar",
    description:
      "Sugar is one of the biggest drivers of inflammation in the modern diet. When you eat a lot of sugar, your body releases chemicals that trigger swelling and irritation throughout your system. This includes obvious sources like candy and soda, but also hidden sugars in sauces, bread, yogurt, and 'healthy' granola bars.",
    whatToDo:
      "Start by reading labels — if sugar is in the first three ingredients, put it back. Swap soda for sparkling water with lemon. Choose fresh fruit when you crave something sweet. You don't have to quit sugar cold turkey — just becoming aware of how much you're eating is a huge first step.",
  },
  {
    title: "Processed Oils",
    description:
      "Vegetable oils like canola, soybean, corn, and sunflower oil are loaded with omega-6 fats. A little omega-6 is fine, but the typical diet has way too much — throwing off the balance with omega-3s and creating a pro-inflammatory environment in your body. These oils are in almost every packaged and restaurant food.",
    whatToDo:
      "Cook with olive oil, avocado oil, or coconut oil instead. When eating out, ask what oil the kitchen uses. At the grocery store, check the ingredients on dressings, sauces, and snacks — you'll be surprised how many contain soybean or canola oil. Simple swaps make a big difference over time.",
  },
  {
    title: "Processed Foods",
    description:
      "Foods that come in boxes, bags, and wrappers with long ingredient lists are often stripped of nutrients and loaded with chemicals your body doesn't recognize. Artificial colors, preservatives, and additives can trigger inflammatory responses. If your great-grandmother wouldn't recognize it as food, it probably isn't helping you.",
    whatToDo:
      "Shop the perimeter of the grocery store where the real food lives — produce, meat, seafood, and eggs. Aim for foods with five ingredients or fewer. Prep simple meals on Sunday so you're not tempted by processed convenience food during the week. Progress, not perfection.",
  },
  {
    title: "Alcohol",
    description:
      "Alcohol is tough on your body in several ways. It damages your gut lining (which triggers inflammation), disrupts your sleep (when your body does its healing), and overloads your liver. Even moderate drinking can increase inflammatory markers in your blood and slow down your recovery.",
    whatToDo:
      "If you drink, try cutting back to 2-3 drinks per week and see how you feel. Many patients are amazed at the difference. Choose red wine over cocktails if you do drink (it has some antioxidants). Stay hydrated and never drink on an empty stomach. Consider a 30-day break to see how much better you can feel.",
  },
  {
    title: "Chronic Stress",
    description:
      "When you're stressed, your body pumps out cortisol — a hormone that's helpful in small doses but inflammatory when it stays elevated. Chronic stress keeps your nervous system in 'fight or flight' mode, which raises inflammation, tightens muscles, and makes it harder for your body to heal. It's not just in your head — stress physically changes your body.",
    whatToDo:
      "Build small stress-relief habits into your day: 5 minutes of deep breathing, a short walk outside, or even just putting your phone down for 20 minutes. Regular chiropractic adjustments help shift your nervous system out of stress mode. Prioritize sleep, move your body daily, and don't be afraid to say no to things that drain you.",
  },
];

// ---------------------------------------------------------------------------
// Anti-Inflammatory Shopping List
// ---------------------------------------------------------------------------

export const SHOPPING_LIST: Record<string, string[]> = {
  Proteins: [
    "Wild-caught salmon",
    "Organic chicken breast",
    "Grass-fed ground beef",
    "Wild-caught shrimp",
    "Ground turkey",
    "Pasture-raised eggs",
    "Sardines (canned in olive oil)",
    "Bone broth (chicken or beef)",
  ],
  Vegetables: [
    "Spinach",
    "Kale",
    "Broccoli",
    "Brussels sprouts",
    "Sweet potatoes",
    "Bell peppers (all colors)",
    "Cauliflower",
    "Zucchini",
    "Asparagus",
    "Carrots",
    "Celery",
    "Red onion",
    "Garlic",
    "Cherry tomatoes",
    "Cucumber",
  ],
  Fruits: [
    "Blueberries",
    "Strawberries",
    "Raspberries",
    "Blackberries",
    "Avocados",
    "Lemons",
    "Limes",
    "Bananas",
    "Apples",
    "Frozen mango",
  ],
  Fats: [
    "Extra virgin olive oil",
    "Avocado oil",
    "Coconut oil",
    "Almond butter",
    "Walnuts",
    "Almonds",
    "Chia seeds",
    "Pumpkin seeds",
    "Tahini",
    "Coconut milk (full fat, canned)",
    "Unsweetened coconut flakes",
  ],
  "Herbs & Spices": [
    "Turmeric (ground)",
    "Fresh ginger",
    "Cinnamon",
    "Garlic powder",
    "Black pepper",
    "Rosemary",
    "Thyme",
    "Fresh basil",
    "Fresh cilantro",
    "Fresh parsley",
    "Fresh dill",
    "Italian seasoning",
    "Sea salt",
    "Curry paste",
  ],
  Drinks: [
    "Green tea",
    "Herbal tea (chamomile, peppermint)",
    "Sparkling water",
    "Unsweetened almond milk",
    "Coconut water",
    "Filtered water with lemon",
  ],
};
