-- CITI-Senti: shared reference data for development and production.
-- Run after init_citi_senti_schema and add_feedback_source.
-- Policy topics are proposed application-level classifications.
-- Aspect definitions and illustrative examples follow the earlier project taxonomy.
-- Existing records are preserved on conflict, including topic activation settings.

INSERT INTO public.policy_topics (topic_name, is_active)
VALUES
    ('Traffic and Transportation', true),
    ('Environment and Waste Management', true),
    ('Public Safety and Security', true),
    ('Health and Sanitation', true),
    ('Education and Youth Development', true),
    ('Tourism, Culture and Heritage', true),
    ('Business, Trade and Livelihood', true),
    ('Urban Planning, Housing and Land Use', true),
    ('Infrastructure and Public Works', true),
    ('Social Welfare and Community Development', true),
    ('Governance and Public Administration', true),
    ('Disaster Risk Reduction and Management', true),
    ('Public Utilities and Services', true),
    ('Taxes, Revenue and Public Finance', true),
    ('Other Policy Issues', true)
ON CONFLICT (topic_name) DO NOTHING;

INSERT INTO public.aspect_categories
    (aspect_code, aspect_name, description, example_text)
VALUES
    ('A01', 'Policy Benefits and Impact',
     'Opinions concerning the overall usefulness, effectiveness, benefits, disadvantages, or general consequences of a policy or government initiative.',
     'This ordinance will really help the community.'),
    ('A02', 'Implementation and Enforcement',
     'Opinions concerning how a policy is carried out, monitored, implemented, followed, or enforced.',
     'Maganda yung ordinance pero hindi naman ini-implement.'),
    ('A03', 'Cost, Fees and Penalties',
     'Opinions concerning the monetary costs, payments, fees, fines, penalties, or financial burdens associated with a policy or government service.',
     'Sobrang taas naman ng penalty.'),
    ('A04', 'Accessibility and Convenience',
     'Opinions concerning how easy or difficult it is for citizens to access, use, comply with, participate in, or benefit from a government policy, program, or service.',
     'Residents should also be able to apply online.'),
    ('A05', 'Fairness and Inclusivity',
     'Opinions concerning whether a policy or government action treats individuals, communities, or population groups equitably and inclusively.',
     'The rule disadvantages people who cannot afford private parking.'),
    ('A06', 'Rules and Policy Provisions',
     'Opinions concerning the content, design, conditions, requirements, restrictions, exemptions, or specific provisions of a policy or ordinance.',
     'The two-hour parking limit is too short.'),
    ('A07', 'Government Administration and Responsiveness',
     'Opinions concerning how government offices, agencies, and officials manage, communicate, coordinate, administer, or respond to matters involving public policies and services.',
     'The city should explain the new policy more clearly.'),
    ('A08', 'Public Safety and Security',
     'Opinions concerning the actual or expected effects of a policy or government initiative on public safety, protection, or security.',
     'The loading zone will make pedestrians safer.'),
    ('A09', 'Environmental Impact',
     'Opinions concerning the actual or expected effects of policies and government initiatives on environmental conditions, resources, and sustainability.',
     'This could reduce plastic waste in the city.'),
    ('A10', 'Traffic and Transportation Impact',
     'Opinions concerning the effects of policies or government initiatives on mobility, transportation, traffic conditions, parking availability, and movement within the city.',
     'This will make traffic along Session Road worse.'),
    ('A11', 'Other',
     'Meaningful policy-related aspects that cannot reasonably be classified under any of the ten established substantive categories.',
     NULL)
ON CONFLICT (aspect_code) DO NOTHING;
