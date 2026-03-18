-- Seed Real Seminar: Adelaide, Australia
-- Note: Replace '00000000-0000-0000-0000-000000000000' with a valid host_id if needed, 
-- or we use a subquery to find an admin/founder.

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
    is_approved,
    is_past,
    image_url
) VALUES (
    (SELECT id FROM public.profiles WHERE role IN ('founder', 'admin') LIMIT 1),
    'NeuroChiro Seminar — Adelaide',
    'This NeuroChiro seminar is designed for chiropractors and chiropractic students who want to deepen their understanding of the nervous system and strengthen their clinical certainty.

During this seminar, Dr. Raymond Nichols will walk through the NeuroChiro framework for modern chiropractic — focusing on nervous system regulation, communication clarity, patient certainty, and practice structure.

This event is designed to help doctors and students move beyond symptom-based care and into a nervous-system-first model that improves clinical results, communication confidence, and patient commitment.

Expect a high-energy environment focused on clarity, structure, and real-world implementation.',
    'Adelaide, Australia',
    'Adelaide',
    'Australia',
    'Coming Soon 2026',
    '9:00 AM',
    '5:00 PM',
    'Dr. Raymond Nichols',
    'Dr. Raymond Nichols is the founder of NeuroChiro and the creator of the NeuroChiro Mastermind. His work focuses on helping chiropractors and chiropractic students build clinical certainty through a nervous-system-first approach to care. Through NeuroChiro he has built a global network of chiropractors focused on nervous system regulation, clear communication, and patient-centered chiropractic care.',
    'https://www.neurochiromastermind.com/neurochiro-live',
    'NeuroChiro Seminar',
    ARRAY['Clinical Mastery', 'Nervous System Chiropractic'],
    ARRAY['Clinical Certainty', 'Nervous System Regulation', 'Communication Architecture'],
    497,
    true,
    false,
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800'
);
