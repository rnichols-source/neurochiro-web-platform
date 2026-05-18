-- Seed: The Brave Practice Event — Fort Lauderdale, FL
-- November 5-8, 2026 at The Westin Fort Lauderdale Beach Resort

INSERT INTO public.seminars (
    host_id,
    title,
    description,
    location,
    city,
    country,
    dates,
    start_time,
    end_time,
    instructor_name,
    instructor_bio,
    registration_link,
    event_type,
    categories,
    tags,
    price,
    ce_hours,
    is_approved,
    is_past,
    image_url,
    venue_name,
    venue_address,
    max_capacity,
    schedule,
    speakers,
    faq,
    listing_tier,
    is_boosted
) VALUES (
    (SELECT id FROM public.profiles WHERE role IN ('founder', 'admin') LIMIT 1),

    'The Brave Practice Event',

    'Stand up, Step in & Scale!

The Brave Practice is a 2-day immersive chiropractic event bringing together the profession''s boldest leaders, coaches, and visionaries at The Westin Fort Lauderdale Beach Resort.

Hosted by Dr. Kimberly Thor-Adams, Dr. Aura Tovar, and Dr. Jenna Davis, this event is designed for chiropractors who are ready to step into their full potential — in practice, in business, and in life.

Whether you''re looking to scale your practice, sharpen your leadership, master patient communication, or build a business that supports your vision for freedom, The Brave Practice delivers two full days of world-class speakers, beachside networking, and real strategies you can implement immediately.

17 speakers. 2 days. 1 mission: help chiropractors build practices — and lives — that are authentically, unapologetically brave.',

    'Fort Lauderdale, FL',
    'Fort Lauderdale',
    'United States',
    'November 5-8, 2026',
    '7:00 AM',
    '9:00 PM',

    'Dr. Kimberly Thor-Adams, Dr. Aura Tovar & Dr. Jenna Davis',

    'Dr. Kimberly Thor-Adams is a chiropractor, author, speaker, coach, and entrepreneur. She owns two successful cash practices in Nebraska and has been practicing for over 15 years. Author of Growing Up Fearless, she empowers chiropractors to be authentic and to light the world on fire. Together with Dr. Aura Tovar and Dr. Jenna Davis, she created The Brave Practice to make bravery contagious across the profession.',

    'https://www.thebravepractice.com',
    'Conference',
    ARRAY['Practice Growth', 'Leadership', 'Business Mastery'],
    ARRAY['Practice Growth', 'Leadership', 'Patient Communication', 'Business Systems', 'Chiropractic Philosophy', 'Pediatric Care', 'Networking'],
    379,
    NULL,
    true,
    false,
    'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&q=80&w=1200',

    'The Westin Fort Lauderdale Beach Resort',
    '321 N Fort Lauderdale Beach Blvd, Fort Lauderdale, FL 33304',
    NULL,

    -- Schedule (JSONB)
    '[
        {
            "day": "Thursday, November 5",
            "items": [
                { "time": "All Day", "title": "Check-in at The Westin Fort Lauderdale Beach Resort", "description": "Arrive, settle in, and connect with fellow attendees at this stunning oceanfront resort." }
            ]
        },
        {
            "day": "Friday, November 6",
            "items": [
                { "time": "7:00 AM", "title": "Registration", "description": "Check in, grab your badge, and get ready for an incredible day." },
                { "time": "8:00 AM", "title": "Welcome", "description": "Opening remarks from your hosts." },
                { "time": "8:15 AM", "title": "Morning Speakers", "description": "World-class presentations on practice growth, leadership, and chiropractic philosophy." },
                { "time": "12:00 PM", "title": "Lunch — Sponsored by The Chiro Freedom Formula", "description": "Networking lunch sponsored by Drs. Rosemary Batanjski & Jennifer Bonde." },
                { "time": "1:45 PM", "title": "Beach Break", "description": "Recharge with sun, sand, and ocean vibes." },
                { "time": "2:30 PM", "title": "Afternoon Speakers", "description": "More powerful sessions on scaling your practice and stepping into your purpose." },
                { "time": "7:00 PM", "title": "Dinner Break", "description": "Enjoy Fort Lauderdale dining with new friends." },
                { "time": "8:30 PM", "title": "Poolside Q&A Panel — Hosted by Dr. Lauryn Brunclik", "description": "Intimate after-hours panel discussion poolside under the stars." },
                { "time": "9:00 PM", "title": "After Hours Book Signing", "description": "Meet the authors and get your copies signed." }
            ]
        },
        {
            "day": "Saturday, November 7",
            "items": [
                { "time": "7:00 AM", "title": "Morning Mingle at the Beach", "description": "Start the day with sunrise networking on the sand." },
                { "time": "8:00 AM", "title": "Welcome", "description": "Day 2 kickoff." },
                { "time": "8:15 AM", "title": "Morning Speakers", "description": "Powerhouse presentations to elevate your practice and mindset." },
                { "time": "11:45 AM", "title": "Lunch — Sponsored by Life Chiropractic College West", "description": "Networking lunch sponsored by LifeWest." },
                { "time": "1:15 PM", "title": "Beach Break", "description": "Afternoon recharge by the ocean." },
                { "time": "2:00 PM", "title": "Afternoon Speakers", "description": "Final sessions to send you home fired up and ready to implement." },
                { "time": "7:00 PM", "title": "Speaker Dinner", "description": "Exclusive dinner with the speakers and hosts." },
                { "time": "9:00 PM", "title": "After Hours", "description": "Final night celebration." }
            ]
        },
        {
            "day": "Sunday, November 8",
            "items": [
                { "time": "Morning", "title": "Check-out", "description": "Check out of The Westin and head home ready to transform your practice." }
            ]
        }
    ]'::jsonb,

    -- Speakers (JSONB)
    '[
        { "name": "Dr. Kimberly Thor-Adams", "title": "Host — Author of Growing Up Fearless, 15+ years in practice, Nebraska", "bio": "Chiropractor, author, speaker, coach, and entrepreneur who owns two successful cash practices. She empowers chiropractors to be authentic in their every moment and to light the world on fire." },
        { "name": "Dr. Aura Tovar", "title": "Host — Dynamic Chiropractic Center, Miami", "bio": "From Venezuela at 14, Life University graduate, nearly 2 decades as owner of Dynamic Chiropractic Center. VP of ChiroMission (100,000+ people impacted). International speaker who has shared the stage with Brian Tracy, Tucker Max, and Thomas Bilyeu." },
        { "name": "Dr. Jenna Davis", "title": "Host — Acorn Family Health & Wellness Centre, Oakville, Ontario", "bio": "Family chiropractor specializing in preconception, infertility, pre/postnatal care, pediatrics, and women''s health at Acorn Family Health and Wellness Centre in Oakville, Ontario." },
        { "name": "Dr. Billy DeMoss", "title": "DeMoss Chiropractic, Newport Beach, CA", "bio": "Owner of DeMoss Chiropractic. Graduated from LA College of Chiropractic in 1985, certified in Chiropractic Spinal Trauma and BioPhysics. 26+ years serving Newport Beach." },
        { "name": "Roberto Monaco", "title": "InfluenceOlogy & The Chiro Speaking Company", "bio": "5,000+ presentations across 7 countries over 20+ years. Chiropractic Advocate Award from Sherman College 2022. The go-to speaking and influence coach for top chiropractors." },
        { "name": "Dr. Travis Corcoran", "title": "President, IFCO — Author of Restoring Reason", "bio": "Bestselling author whose work has reshaped conversations around principled chiropractic leadership. President of the International Federation of Chiropractors and Organizations (IFCO)." },
        { "name": "Drs. Daniel & Richelle Knowles", "title": "Mile High Chiro Movement, Boulder, CO", "bio": "Dr. Danny leads global NetworkSpinal trainings through EpiEnergetics. Dr. Richelle specializes in NetworkSpinal, served on the Colorado Board of Chiropractic Examiners, and is Vice Chair of Sherman College Board of Trustees." },
        { "name": "Drs. Seth & Brea Ryan", "title": "Colorado Springs, CO — Chiropractic Biophysics", "bio": "Own two multimillion-dollar family-centered practices in Colorado Springs. Dr. Seth specializes in spinal corrective care and scoliosis reduction. Dr. Brea is Webster ICPA Certified." },
        { "name": "Dr. Lauryn Brunclik", "title": "She Slays the Day Podcast", "bio": "Built a seven-figure chiropractic clinic, then stepped out to build a seven-figure online business aligned with her values. Now teaches clinicians how to create success that matches who they are." },
        { "name": "Dr. Andrea Lamont Nazarenko", "title": "PhD, Community Psychologist & Implementation Scientist", "bio": "Quantitative and community psychologist (MA, MA, MAS, PhD) dedicated to driving system-level change. Global consultant in implementation science who has advised governments and nonprofits." },
        { "name": "Drs. David & Lauren Kolowski", "title": "Inside Healthy, Northern Colorado", "bio": "Converted their practice to a virtual model with an online membership community in 2023. ''Best of Northern Colorado'' award 2024. Specialize in functional nutrition." },
        { "name": "Dr. Todd Defayette", "title": "Kiro Kids Connect, Saratoga & Schenectady, NY", "bio": "''Dr. D'' — 26+ years in active practice, sees hundreds of people weekly including 100+ children. Founder of Kiro Kids Connect, helping chiropractors connect with and empower moms." },
        { "name": "Dr. Rosemary Batanjski & Dr. Jennifer Bonde", "title": "Chiro Freedom Formula", "bio": "Co-founders of the Chiro Freedom Formula, CEO H.A.B.I.T.S. Framework, and The Profit Lab. 15+ years of consulting and practice-growth expertise, scaling 7-figure+ practices." },
        { "name": "Dr. Peter Kevorkian", "title": "4th President, Life Chiropractic College West", "bio": "Appointed President of Life Chiropractic College West in 2025. 40+ years in private practice in Westwood, MA. President of the Board of ICPA. Fellow of the ICA and College of Straight Chiropractic." },
        { "name": "Dr. Mel Krug", "title": "INSPIRE Method — Inspire Life Chiropractic", "bio": "Creator of the INSPIRE Method. Turned her own health crisis into a revolutionary methodology helping thousands overcome chronic health challenges and business breakthroughs." },
        { "name": "Dr. Amanda Apfelblat", "title": "International Coach & Speaker", "bio": "Leader in the chiropractic profession. International coach, speaker, and entrepreneur who has owned and operated a million dollar+ practice for many years." },
        { "name": "Dr. Shara Downey", "title": "Asia Chiropractic Health Services, Singapore", "bio": "Founder of Asia Chiropractic Health Services. Singapore Quality Brands Award winner. International speaker who has worked with Citibank, Lucas Films, and Singapore Ministry of Defence. Host of The Confident Chiropractor podcast." }
    ]'::jsonb,

    -- FAQ (JSONB)
    '[
        { "question": "Where is the event?", "answer": "The Westin Fort Lauderdale Beach Resort — 321 N Fort Lauderdale Beach Blvd, Fort Lauderdale, FL 33304. A stunning oceanfront resort right on the beach." },
        { "question": "What dates should I book travel for?", "answer": "Check-in is Thursday November 5th. Sessions run Friday November 6th and Saturday November 7th. Check-out is Sunday November 8th." },
        { "question": "What''s included in the $379 ticket?", "answer": "Full access to all speaker sessions on Friday and Saturday, poolside Q&A panel, after-hours book signing, beach networking events, and lunch on both days (sponsored)." },
        { "question": "Do I need to book my own hotel?", "answer": "Yes. The event is held at The Westin Fort Lauderdale Beach Resort. Book your room directly with the hotel — ask about group rates for The Brave Practice." },
        { "question": "Is this event for students too?", "answer": "While the event is primarily designed for practicing chiropractors, students who are serious about building their future practice and career are welcome." },
        { "question": "Are CE credits available?", "answer": "Check with The Brave Practice team for CE credit details and state-specific approvals." },
        { "question": "What should I wear?", "answer": "Smart casual. It''s Fort Lauderdale in November — pack for warm weather, and don''t forget your swimsuit for the beach breaks!" }
    ]'::jsonb,

    'featured',
    true
);
