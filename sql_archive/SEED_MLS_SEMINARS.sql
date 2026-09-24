-- Seed: MLS Chiropractic Seminars — MLS ONE | CATALYST
-- Three upcoming events: Atlanta GA (Oct 24-25), Oakland CA (Oct 24-25), Davenport IA (Nov 21-22)
-- MLS = Mastery. Love. Service. — Founded by Dr. Arno Burnier, D.C. in 1984
-- CEO: Dr. Wade Port | Senior Instructor: Jim Deegan, D.C.

-- ============================================================
-- 1. MLS ONE | CATALYST — Atlanta, Georgia
-- ============================================================

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
    target_audience,
    schedule,
    speakers,
    faq,
    listing_tier,
    is_boosted
) VALUES (
    (SELECT id FROM public.profiles WHERE role IN ('founder', 'admin') LIMIT 1),

    'MLS ONE | CATALYST — Atlanta, GA',

    'Catalyst is the landmark MLS immersion that establishes the essential foundation of chiropractic mastery, uniting science, art, and philosophy with presence-based precision. This 14-hour weekend experience builds unshakable confidence, clarity, and consistency in the art of adjusting.

MLS (Mastery. Love. Service.) was founded by Master Chiropractor Arno Burnier, D.C. in 1984. Born from his own frustration with adjusting methods that brought the spine into maximum tension rather than ease, Dr. Burnier developed an innovative tonal approach that brings the neurospinal system into a state of physiological peace before the thrust is applied. The result is adjusting that works with the nervous system rather than against it.

You won''t be taught from a stage. You''ll be met on the mat. MLS''s teaching team is made up of chiropractors who live this work on the table, in practice, and within themselves. Each brings a unique voice to the MLS lineage while sharing a common posture of presence, humility, and deep devotion to the path.

At MLS, you train within a system refined over decades, rooted in biomechanics, vitalistic philosophy, and mastery through presence. You learn to adjust anyone, at any age, for any condition. You build a foundation for lifelong clarity and consistency, guided by instructors who truly see you.

We are not here to fix people. We are here to train chiropractors who meet life with steady hands, clear hearts, and skills that speak for themselves.

Mastery. Love. Service. Not a tagline. A way of being.',

    'Atlanta, GA',
    'Atlanta',
    'United States',
    'October 24-25, 2026',
    '8:30 AM',
    '4:00 PM',

    'Dr. Wade Port, Jim Deegan D.C. & MLS Staff',

    'Dr. Wade Port has been running Lifeworks Chiropractic in Atlanta since 2005 and has been on staff with Dr. Arno Burnier since 2003. He previously served as the personal chiropractor to Tony Robbins and was voted Chiropractor of the Year by the Georgia Council of Chiropractic. With over 20 years of teaching experience, Wade is dedicated to drawing out authentic gifts from students on the Path of Mastery. Jim Deegan, D.C. has been learning directly from Arno Burnier since 1995 and has over 20 years on the MLS teaching staff. He practices in Smyrna, Georgia and is a passionate mentor who loves leading others to discover their own inborn gifts through mastery.',

    'https://go.mlschiro.com/gaone1026?s=gaone1026',
    'Seminar',
    ARRAY['Technique', 'Adjusting Mastery', 'Philosophy'],
    ARRAY['MLS', 'Adjusting', 'Technique Training', 'Tonal Chiropractic', 'Nervous System', 'Chiropractic Philosophy', 'Mastery', 'Arno Burnier', 'CEU'],
    650,
    14,
    true,
    false,
    'https://mlschiro.com/wp-content/uploads/2024/01/MLS-Chiropractic-Training-Seminar.jpg',

    'Renaissance Atlanta Waverly Hotel and Convention Center',
    '2450 Galleria Parkway SE, Atlanta, GA 30339',
    NULL,
    ARRAY['Doctors', 'Students'],

    -- Schedule (JSONB)
    '[
        {
            "day": "Saturday, October 24",
            "items": [
                { "time": "8:30 AM", "title": "Check-in & Registration", "description": "Arrive at the Renaissance Atlanta Waverly Hotel. Check in, connect with fellow chiropractors, and prepare for immersion." },
                { "time": "9:00 AM", "title": "Opening Circle", "description": "Grounding, presence, and intention setting with the MLS teaching staff." },
                { "time": "9:30 AM", "title": "Foundations of MLS Adjusting", "description": "Chiropractic-specific conditioning, body mechanics, and the biomechanical principles behind the MLS tonal approach." },
                { "time": "12:00 PM", "title": "Lunch Break", "description": "Networking lunch with fellow attendees and staff." },
                { "time": "1:00 PM", "title": "Segment-Specific Technique", "description": "Hands-on training: cervical, thoracic, and lumbar adjusting with presence-based precision. Martial arts-inspired footwork and vectoring systems." },
                { "time": "4:00 PM", "title": "Perceptual Development", "description": "Spine reading, palpation refinement, and developing your innate listening as an adjuster." },
                { "time": "6:00 PM", "title": "Day 1 Close", "description": "Integration and reflection. Evening free for dinner and connection." }
            ]
        },
        {
            "day": "Sunday, October 25",
            "items": [
                { "time": "8:30 AM", "title": "Morning Practice", "description": "Grounding and warm-up. Review of Day 1 principles." },
                { "time": "9:00 AM", "title": "Advanced Application", "description": "Building on Day 1 foundations. Adaptive techniques for diverse populations and complex presentations." },
                { "time": "12:00 PM", "title": "Lunch Break", "description": "Final networking lunch." },
                { "time": "1:00 PM", "title": "Integration & Mastery Drills", "description": "Full integration of all techniques. Repetition, refinement, and individualized feedback from staff." },
                { "time": "3:00 PM", "title": "Closing Circle", "description": "Reflection, gratitude, and commitment to the Path of Mastery." },
                { "time": "4:00 PM", "title": "Seminar Concludes", "description": "Head home with steady hands, a clear heart, and skills that speak for themselves." }
            ]
        }
    ]'::jsonb,

    -- Speakers (JSONB)
    '[
        { "name": "Dr. Wade Port", "title": "MLS CEO & Lead Director", "bio": "A master of principled cash practice since 2005, Wade has trained under the profession''s top visionaries. On staff with Arno Burnier since 2003, he previously served as the personal chiropractor to Tony Robbins. Voted Chiropractor of the Year by the Georgia Council of Chiropractic. He is dedicated to drawing out authentic gifts from students on the Path of Mastery." },
        { "name": "Jim Deegan, D.C.", "title": "Senior Staff & Instructor", "bio": "With over 20 years on the MLS staff, Jim''s heart of service was forged through a life-changing ''quantum leap'' experience in 1994. Learning directly from Arno Burnier since 1995, he is a passionate mentor who loves leading others to discover their own inborn gifts through mastery." },
        { "name": "Dr. Emily Mayo", "title": "MLS Instructor", "bio": "Adjusted since infancy, Emily is a Life University graduate who has trained extensively with MLS. She runs a thriving practice in Pacific Beach, San Diego and is a passionate educator committed to the path." },
        { "name": "Dr. Zach Thomas", "title": "MLS Instructor", "bio": "Life University graduate (2017) and MLS student staff member since 2015. Zach''s journey began with his first adjustment at age 23, a life-changing experience that set him on the path. He has been closely mentored by Dr. Wade Port." },
        { "name": "Dr. Nathan Gerowitz", "title": "MLS Instructor", "bio": "Adjusted from age one, Nathan is a Life University graduate who leads Innate Life Chiropractic in the Chicago area. Over a decade with the MLS movement and co-author of ''Letters to Our Younger Selves: A Combat Manual for Mindful Living.''" },
        { "name": "Dr. Romain Cardinal", "title": "MLS Instructor", "bio": "IFEC Paris graduate (2019) who built a successful Paris practice in his first year. Trained at multiple MLS seminars, Romain is described as a ''master in the making'' who brings the MLS lineage to Europe." },
        { "name": "Dr. Arno Burnier, D.C.", "title": "Founder of MLS (1984)", "bio": "Master Chiropractor who developed the MLS method in 1984. Through years of observation and refinement, he created an innovative approach to adjusting that brings the neurospinal system into a state of physiological peace before the thrust is applied. Over decades, Arno has empowered thousands of Doctors of Chiropractic to transform their adjusting technique into a true art form." }
    ]'::jsonb,

    -- FAQ (JSONB)
    '[
        { "question": "What is MLS ONE | CATALYST?", "answer": "Catalyst is the foundational MLS seminar, a 14-hour weekend immersion that establishes the essential foundation of chiropractic mastery. It covers chiropractic-specific conditioning, segment-specific technique (cervical, thoracic, lumbar), martial arts-inspired footwork and vectoring, perceptual development and spine reading, and presence-based adjusting." },
        { "question": "How much does it cost?", "answer": "Doctor: $650 ($600 early bird, ends September 24). Student: $450 ($400 early bird, ends September 24). Continuing Education Credits add-on: $75. Use coupon code EARLYBIRD to save $50." },
        { "question": "Where is the Atlanta event?", "answer": "Renaissance Atlanta Waverly Hotel and Convention Center, 2450 Galleria Parkway SE, Atlanta, GA 30339." },
        { "question": "Are Continuing Education Credits available?", "answer": "Yes. CEU verification letters are sent from Sherman College within 10-30 days after the seminar. Auto-approved states include: Colorado, Connecticut, Delaware, DC, Idaho, Indiana, Maryland, Massachusetts, Michigan, Mississippi, New Hampshire, New Jersey, Ohio, Rhode Island, South Carolina, Utah, Vermont, Virginia, Washington, Wyoming. Additional approved states for this event: Georgia, Florida, North Carolina, Alabama. DC Self states: Illinois, Iowa, Montana, Nebraska, Oregon." },
        { "question": "Do I need any prerequisites?", "answer": "No. MLS ONE CATALYST is the foundational seminar and is open to all doctors of chiropractic and chiropractic students. MLS TWO IGNITE and MLS PEDS SPARK require completion of MLS ONE." },
        { "question": "What other MLS seminars are available?", "answer": "MLS offers four seminar tracks: MLS ONE CATALYST (foundations), MLS TWO IGNITE (advanced adjusting), MLS PEDS SPARK (pediatric and prenatal), and MLS CERVICAL (cervical specialization). Check mlschiro.com for the full schedule." },
        { "question": "What is the cancellation policy?", "answer": "Tuition is non-refundable. Transfers to a future seminar are allowed with a $75 transfer fee (waived for force majeure situations). Minimum 48 hours cancellation notice is required. MLS emphasizes full seminar attendance for the complete experience." }
    ]'::jsonb,

    'featured',
    true
);

-- ============================================================
-- 2. MLS ONE | CATALYST — Oakland, California
-- ============================================================

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
    target_audience,
    schedule,
    speakers,
    faq,
    listing_tier,
    is_boosted
) VALUES (
    (SELECT id FROM public.profiles WHERE role IN ('founder', 'admin') LIMIT 1),

    'MLS ONE | CATALYST — Oakland, CA',

    'Catalyst is the landmark MLS immersion that establishes the essential foundation of chiropractic mastery, uniting science, art, and philosophy with presence-based precision. This 14-hour weekend experience builds unshakable confidence, clarity, and consistency in the art of adjusting.

MLS (Mastery. Love. Service.) was founded by Master Chiropractor Arno Burnier, D.C. in 1984. His innovative tonal approach brings the neurospinal system into a state of physiological peace before the thrust is applied, allowing the spinal cord and meningeal system to float freely within the neural canal. The result is adjusting that works with the nervous system rather than against it.

You won''t be taught from a stage. You''ll be met on the mat. We are teachers. We are students. We are walking this with you.

Mastery. Love. Service. Not a tagline. A way of being.',

    'Oakland, CA',
    'Oakland',
    'United States',
    'October 24-25, 2026',
    '8:30 AM',
    '4:00 PM',

    'Dr. Wade Port, Jim Deegan D.C. & MLS Staff',

    'Dr. Wade Port has been running Lifeworks Chiropractic in Atlanta since 2005 and has been on staff with Dr. Arno Burnier since 2003. He previously served as the personal chiropractor to Tony Robbins and was voted Chiropractor of the Year by the Georgia Council of Chiropractic. Jim Deegan, D.C. has over 20 years on the MLS teaching staff, learning directly from Arno Burnier since 1995.',

    'https://mlschiro.com/#Seminar',
    'Seminar',
    ARRAY['Technique', 'Adjusting Mastery', 'Philosophy'],
    ARRAY['MLS', 'Adjusting', 'Technique Training', 'Tonal Chiropractic', 'Nervous System', 'Chiropractic Philosophy', 'Mastery', 'Arno Burnier', 'CEU'],
    650,
    14,
    true,
    false,
    'https://mlschiro.com/wp-content/uploads/2024/01/MLS-Chiropractic-Training-Seminar.jpg',

    'Oakland Convention Center',
    'Oakland, CA',
    NULL,
    ARRAY['Doctors', 'Students'],

    '[
        {
            "day": "Saturday, October 24",
            "items": [
                { "time": "8:30 AM", "title": "Check-in & Registration", "description": "Arrive, connect with fellow chiropractors, and prepare for immersion." },
                { "time": "9:00 AM", "title": "Opening Circle & Foundations", "description": "Grounding, presence, intention setting, and the biomechanical principles behind the MLS tonal approach." },
                { "time": "12:00 PM", "title": "Lunch Break", "description": "Networking lunch with attendees and staff." },
                { "time": "1:00 PM", "title": "Segment-Specific Technique", "description": "Hands-on training: cervical, thoracic, and lumbar adjusting with presence-based precision." },
                { "time": "6:00 PM", "title": "Day 1 Close", "description": "Integration and reflection." }
            ]
        },
        {
            "day": "Sunday, October 25",
            "items": [
                { "time": "8:30 AM", "title": "Morning Practice & Review", "description": "Grounding and warm-up. Review of Day 1 principles." },
                { "time": "9:00 AM", "title": "Advanced Application", "description": "Building on Day 1 foundations. Adaptive techniques for diverse populations." },
                { "time": "12:00 PM", "title": "Lunch Break", "description": "Final networking lunch." },
                { "time": "1:00 PM", "title": "Integration & Mastery Drills", "description": "Full integration, repetition, refinement, and individualized feedback." },
                { "time": "4:00 PM", "title": "Closing Circle", "description": "Reflection, gratitude, and commitment to the Path of Mastery." }
            ]
        }
    ]'::jsonb,

    '[
        { "name": "Dr. Wade Port", "title": "MLS CEO & Lead Director", "bio": "A master of principled cash practice since 2005. On staff with Arno Burnier since 2003. Former personal chiropractor to Tony Robbins. Voted Chiropractor of the Year by the Georgia Council of Chiropractic." },
        { "name": "Jim Deegan, D.C.", "title": "Senior Staff & Instructor", "bio": "Over 20 years on the MLS staff. Learning directly from Arno Burnier since 1995. Passionate mentor dedicated to helping others discover their inborn gifts through mastery." },
        { "name": "Dr. Arno Burnier, D.C.", "title": "Founder of MLS (1984)", "bio": "Master Chiropractor who developed the MLS method in 1984. His innovative tonal approach has empowered thousands of chiropractors to transform their adjusting into a true art form." }
    ]'::jsonb,

    '[
        { "question": "What is MLS ONE | CATALYST?", "answer": "The foundational MLS seminar: a 14-hour weekend immersion covering chiropractic-specific conditioning, segment-specific technique, footwork and vectoring, perceptual development, and presence-based adjusting." },
        { "question": "How much does it cost?", "answer": "Doctor: $650 ($600 early bird). Student: $450 ($400 early bird). CEU add-on: $75. Use code EARLYBIRD to save $50." },
        { "question": "Are CEUs available?", "answer": "Yes. Auto-approved in 20+ states. CEU verification from Sherman College within 10-30 days. Check mlschiro.com for your state." },
        { "question": "Do I need prerequisites?", "answer": "No. MLS ONE is open to all DCs and chiropractic students." }
    ]'::jsonb,

    'featured',
    true
);

-- ============================================================
-- 3. MLS ONE | CATALYST — Davenport, Iowa
-- ============================================================

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
    target_audience,
    schedule,
    speakers,
    faq,
    listing_tier,
    is_boosted
) VALUES (
    (SELECT id FROM public.profiles WHERE role IN ('founder', 'admin') LIMIT 1),

    'MLS ONE | CATALYST — Davenport, IA',

    'Catalyst is the landmark MLS immersion that establishes the essential foundation of chiropractic mastery, uniting science, art, and philosophy with presence-based precision. This 14-hour weekend experience builds unshakable confidence, clarity, and consistency in the art of adjusting.

MLS (Mastery. Love. Service.) was founded by Master Chiropractor Arno Burnier, D.C. in 1984. His innovative tonal approach brings the neurospinal system into a state of physiological peace before the thrust is applied, allowing the spinal cord and meningeal system to float freely within the neural canal. The result is adjusting that works with the nervous system rather than against it.

You won''t be taught from a stage. You''ll be met on the mat. We are teachers. We are students. We are walking this with you.

Mastery. Love. Service. Not a tagline. A way of being.',

    'Davenport, IA',
    'Davenport',
    'United States',
    'November 21-22, 2026',
    '8:30 AM',
    '4:00 PM',

    'Dr. Wade Port, Jim Deegan D.C. & MLS Staff',

    'Dr. Wade Port has been running Lifeworks Chiropractic in Atlanta since 2005 and has been on staff with Dr. Arno Burnier since 2003. He previously served as the personal chiropractor to Tony Robbins and was voted Chiropractor of the Year by the Georgia Council of Chiropractic. Jim Deegan, D.C. has over 20 years on the MLS teaching staff, learning directly from Arno Burnier since 1995.',

    'https://mlschiro.com/#Seminar',
    'Seminar',
    ARRAY['Technique', 'Adjusting Mastery', 'Philosophy'],
    ARRAY['MLS', 'Adjusting', 'Technique Training', 'Tonal Chiropractic', 'Nervous System', 'Chiropractic Philosophy', 'Mastery', 'Arno Burnier', 'CEU', 'Palmer'],
    650,
    14,
    true,
    false,
    'https://mlschiro.com/wp-content/uploads/2024/01/MLS-Chiropractic-Training-Seminar.jpg',

    'Davenport Convention Center',
    'Davenport, IA',
    NULL,
    ARRAY['Doctors', 'Students'],

    '[
        {
            "day": "Saturday, November 21",
            "items": [
                { "time": "8:30 AM", "title": "Check-in & Registration", "description": "Arrive, connect with fellow chiropractors, and prepare for immersion." },
                { "time": "9:00 AM", "title": "Opening Circle & Foundations", "description": "Grounding, presence, intention setting, and the biomechanical principles behind the MLS tonal approach." },
                { "time": "12:00 PM", "title": "Lunch Break", "description": "Networking lunch with attendees and staff." },
                { "time": "1:00 PM", "title": "Segment-Specific Technique", "description": "Hands-on training: cervical, thoracic, and lumbar adjusting with presence-based precision." },
                { "time": "6:00 PM", "title": "Day 1 Close", "description": "Integration and reflection." }
            ]
        },
        {
            "day": "Sunday, November 22",
            "items": [
                { "time": "8:30 AM", "title": "Morning Practice & Review", "description": "Grounding and warm-up. Review of Day 1 principles." },
                { "time": "9:00 AM", "title": "Advanced Application", "description": "Building on Day 1 foundations. Adaptive techniques for diverse populations." },
                { "time": "12:00 PM", "title": "Lunch Break", "description": "Final networking lunch." },
                { "time": "1:00 PM", "title": "Integration & Mastery Drills", "description": "Full integration, repetition, refinement, and individualized feedback." },
                { "time": "4:00 PM", "title": "Closing Circle", "description": "Reflection, gratitude, and commitment to the Path of Mastery." }
            ]
        }
    ]'::jsonb,

    '[
        { "name": "Dr. Wade Port", "title": "MLS CEO & Lead Director", "bio": "A master of principled cash practice since 2005. On staff with Arno Burnier since 2003. Former personal chiropractor to Tony Robbins. Voted Chiropractor of the Year by the Georgia Council of Chiropractic." },
        { "name": "Jim Deegan, D.C.", "title": "Senior Staff & Instructor", "bio": "Over 20 years on the MLS staff. Learning directly from Arno Burnier since 1995. Passionate mentor dedicated to helping others discover their inborn gifts through mastery." },
        { "name": "Dr. Arno Burnier, D.C.", "title": "Founder of MLS (1984)", "bio": "Master Chiropractor who developed the MLS method in 1984. His innovative tonal approach has empowered thousands of chiropractors to transform their adjusting into a true art form." }
    ]'::jsonb,

    '[
        { "question": "What is MLS ONE | CATALYST?", "answer": "The foundational MLS seminar: a 14-hour weekend immersion covering chiropractic-specific conditioning, segment-specific technique, footwork and vectoring, perceptual development, and presence-based adjusting." },
        { "question": "How much does it cost?", "answer": "Doctor: $650 ($600 early bird). Student: $450 ($400 early bird). CEU add-on: $75. Use code EARLYBIRD to save $50." },
        { "question": "Are CEUs available?", "answer": "Yes. Auto-approved in 20+ states. CEU verification from Sherman College within 10-30 days. Check mlschiro.com for your state." },
        { "question": "Why Davenport?", "answer": "Davenport, Iowa is the birthplace of chiropractic. Palmer College of Chiropractic, the fountainhead of the profession, is located here. MLS regularly holds seminars in Davenport to honor the roots of chiropractic." }
    ]'::jsonb,

    'featured',
    true
);
