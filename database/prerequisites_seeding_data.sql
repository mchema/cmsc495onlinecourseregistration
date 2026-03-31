INSERT INTO `prerequisites`
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CHEM103' AND c.course_code = 'CHEM113'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CHEM113' AND c.course_code = 'CHEM297'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC105' AND c.course_code = 'CMSC115'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC115' AND c.course_code = 'CMSC215'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC115' AND c.course_code = 'CMSC220'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC115' AND c.course_code = 'CMSC310'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC215' AND c.course_code = 'CMSC315'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC115' AND c.course_code = 'CMSC320'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC215' AND c.course_code = 'CMSC325'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC315' AND c.course_code = 'CMSC330'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC315' AND c.course_code = 'CMSC335'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC115' AND c.course_code = 'CMSC340'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC115' AND c.course_code = 'CMSC345'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC315' AND c.course_code = 'CMSC405'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC310' AND c.course_code = 'CMSC412'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC315' AND c.course_code = 'CMSC412'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC320' AND c.course_code = 'CMSC415'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC320' AND c.course_code = 'CMSC420'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC215' AND c.course_code = 'CMSC425'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC315' AND c.course_code = 'CMSC427'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC330' AND c.course_code = 'CMSC430'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC220' AND c.course_code = 'CMSC440'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC340' AND c.course_code = 'CMSC440'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC150' AND c.course_code = 'CMSC451'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC315' AND c.course_code = 'CMSC451'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'MATH141' AND c.course_code = 'CMSC465'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC315' AND c.course_code = 'CMSC465'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC330' AND c.course_code = 'CMSC495'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC335' AND c.course_code = 'CMSC495'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'CMSC345' AND c.course_code = 'CMSC495'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'ENGL102' AND c.course_code = 'ENGL240'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'ENGL102' AND c.course_code = 'ENGL250'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'ENGL102' AND c.course_code = 'ENGL281'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'ENGL102' AND c.course_code = 'ENGL303'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'ENGL102' AND c.course_code = 'ENGL363'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'ENGL102' AND c.course_code = 'ENGL364'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'ENGL102' AND c.course_code = 'ENGL381'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'ENGL102' AND c.course_code = 'ENGL384'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'ENGL102' AND c.course_code = 'ENGL386'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'ENGL102' AND c.course_code = 'ENGL389'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'ENGL102' AND c.course_code = 'ENGL406'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'ENGL102' AND c.course_code = 'ENGL418'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'ENGL102' AND c.course_code = 'ENGL430'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'ENGL102' AND c.course_code = 'ENGL433'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'ENGL102' AND c.course_code = 'ENGL439'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'ENGL102' AND c.course_code = 'ENGL441'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'ENGL102' AND c.course_code = 'ENGL459'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'ENGL250' AND c.course_code = 'ENGL495'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'ENGL303' AND c.course_code = 'ENGL495'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'HIST115' AND c.course_code = 'HIST289'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'HIST289' AND c.course_code = 'HIST309'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'HIST289' AND c.course_code = 'HIST495'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'IFSM300' AND c.course_code = 'IFSM301'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'IFSM300' AND c.course_code = 'IFSM370'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'IFSM201' AND c.course_code = 'IFSM380'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'IFSM311' AND c.course_code = 'IFSM432'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'IFSM300' AND c.course_code = 'IFSM438'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'IFSM438' AND c.course_code = 'IFSM441'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'IFSM311' AND c.course_code = 'IFSM461'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'IFSM438' AND c.course_code = 'IFSM495'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'IFSM461' AND c.course_code = 'IFSM495'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'MATH107' AND c.course_code = 'MATH108'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'MATH115' AND c.course_code = 'MATH140'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'MATH140' AND c.course_code = 'MATH141'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'MATH140' AND c.course_code = 'MATH340'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'MATH141' AND c.course_code = 'MATH241'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'MATH141' AND c.course_code = 'MATH246'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'MATH141' AND c.course_code = 'MATH301'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'MATH141' AND c.course_code = 'MATH402'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'MATH141' AND c.course_code = 'MATH463'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'NURS302' AND c.course_code = 'NURS352'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'NURS302' AND c.course_code = 'NURS372'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'NURS302' AND c.course_code = 'NURS392'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'NURS302' AND c.course_code = 'NURS412'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'NURS302' AND c.course_code = 'NURS432'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'NURS302' AND c.course_code = 'NURS452'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'NURS302' AND c.course_code = 'NURS462'
UNION ALL
SELECT p.course_id, c.course_id
FROM `courses` p
JOIN `courses` c
WHERE p.course_code = 'NURS352' AND c.course_code = 'NURS496';
