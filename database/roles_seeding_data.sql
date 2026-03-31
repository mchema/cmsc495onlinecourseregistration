INSERT INTO `admins` (`user_id`, `access_level`)
SELECT `user_id`, 10
FROM `users`
WHERE `email` IN (
    'horne_chri87@gmail.com',
    'wolff_toto00@gmail.com',
    'vowle_jame00@gmail.com',
    'brown_zak00@gmail.com',
    'barre_ashl27@gmail.com'
);

INSERT INTO `professors` (`user_id`, `department`)
SELECT `user_id`, 'Computer Science'
FROM `users`
WHERE `email` IN (
    'butch_bill17@gmail.com',
    'campb_hugh18@gmail.com'
);

INSERT INTO `professors` (`user_id`, `department`)
SELECT `user_id`, 'Mathematics'
FROM `users`
WHERE `email` IN (
    'campb_cind32@gmail.com',
    'meeks_bren33@gmail.com'
);

INSERT INTO `professors` (`user_id`, `department`)
SELECT `user_id`, 'English'
FROM `users`
WHERE `email` IN (
    'wheel_nanc48@gmail.com',
    'byers_jona49@gmail.com'
);

INSERT INTO `professors` (`user_id`, `department`)
SELECT `user_id`, 'History'
FROM `users`
WHERE `email` IN (
    'byers_joyc53@gmail.com',
    'bauma_murr55@gmail.com'
);

INSERT INTO `professors` (`user_id`, `department`)
SELECT `user_id`, 'Physics'
FROM `users`
WHERE `email` IN (
    'mille_joel67@gmail.com',
    'mille_tomm69@gmail.com'
);

INSERT INTO `professors` (`user_id`, `department`)
SELECT `user_id`, 'Chemistry'
FROM `users`
WHERE `email` IN (
    'ander_abby75@gmail.com',
    'alvar_dina76@gmail.com'
);

INSERT INTO `professors` (`user_id`, `department`)
SELECT `user_id`, 'Nursing'
FROM `users`
WHERE `email` IN (
    'dunla_clai95@gmail.com',
    'river_glor99@gmail.com'
);

INSERT INTO `professors` (`user_id`, `department`)
SELECT `user_id`, 'Information Systems Management'
FROM `users`
WHERE `email` IN (
    'adamu_sydn88@gmail.com',
    'jerim_rich89@gmail.com'
);

INSERT INTO `students` (`user_id`, `major`)
SELECT `user_id`, 'Computer Science'
FROM `users`
WHERE `email` IN (
    'perez_serg11@gmail.com',
    'strol_lanc18@gmail.com',
    'hulke_nico27@gmail.com',
    'rosbe_nico6@gmail.com',
    'prost_alai1@gmail.com',
    'bearm_oliv87@gmail.com',
    'miyas_kimi22@gmail.com',
    'butch_ryan31@gmail.com',
    'hartm_dwig41@gmail.com',
    'buckl_robi51@gmail.com',
    'galpi_tyle61@gmail.com',
    'servo_tess71@gmail.com',
    'velar_jaca81@gmail.com',
    'brook_marc91@gmail.com',
    'barbi_weir101@gmail.com',
    'howar_coop109@gmail.com'
);

INSERT INTO `students` (`user_id`, `major`)
SELECT `user_id`, 'Mathematics'
FROM `users`
WHERE `email` IN (
    'norri_land4@gmail.com',
    'botta_valt77@gmail.com',
    'raikk_kimi7@gmail.com',
    'grosj_roma8@gmail.com',
    'ville_jacq27@gmail.com',
    'janua_anni19@gmail.com',
    'frank_regg28@gmail.com',
    'phill_greg38@gmail.com',
    'mayfi_max46@gmail.com',
    'sincl_enid58@gmail.com',
    'weems_lari66@gmail.com',
    'targa_daem78@gmail.com',
    'targa_hela86@gmail.com',
    'rober_barb97@gmail.com',
    'rober_skip106@gmail.com',
    'murph_dane114@gmail.com'
);

INSERT INTO `students` (`user_id`, `major`)
SELECT `user_id`, 'English'
FROM `users`
WHERE `email` IN (
    'russe_geor63@gmail.com',
    'ocon_este31@gmail.com',
    'sarge_loga2@gmail.com',
    'barri_rube11@gmail.com',
    'berge_gerh28@gmail.com',
    'pourd_theo5@gmail.com',
    'milk_marv24@gmail.com',
    'wilki_ray35@gmail.com',
    'wheel_mike43@gmail.com',
    'munso_eddi54@gmail.com',
    'addam_mort63@gmail.com',
    'frank_bill73@gmail.com',
    'velar_corl83@gmail.com',
    'hassa_ebra93@gmail.com',
    'barbi_pres103@gmail.com',
    'macle_hank111@gmail.com'
);

INSERT INTO `students` (`user_id`, `major`)
SELECT `user_id`, 'History'
FROM `users`
WHERE `email` IN (
    'verst_max1@gmail.com',
    'alons_fern14@gmail.com',
    'magnu_kevi20@gmail.com',
    'butto_jens22@gmail.com',
    'senna_ayrt12@gmail.com',
    'anton_kimi12@gmail.com',
    'maeve_magg21@gmail.com',
    'mosko_kevi30@gmail.com',
    'hails_gail40@gmail.com',
    'harri_stev50@gmail.com',
    'thorp_xavi60@gmail.com',
    'mille_sara70@gmail.com',
    'targa_vise80@gmail.com',
    'berza_nata90@gmail.com',
    'river_sash100@gmail.com',
    'stone_maxi108@gmail.com',
    'june_ma116@gmail.com'
);

INSERT INTO `students` (`user_id`, `major`)
SELECT `user_id`, 'Physics'
FROM `users`
WHERE `email` IN (
    'sainz_carl55@gmail.com',
    'ricci_dani3@gmail.com',
    'lawso_liam40@gmail.com',
    'schum_mick47@gmail.com',
    'hakki_mika8@gmail.com',
    'kubic_robe88@gmail.com',
    'neuma_vict26@gmail.com',
    'gilmo_buff37@gmail.com',
    'sincl_luca45@gmail.com',
    'addam_wedn57@gmail.com',
    'addam_pugs65@gmail.com',
    'targa_rhae77@gmail.com',
    'targa_aemo85@gmail.com',
    'berza_mich96@gmail.com',
    'handl_ruth105@gmail.com',
    'brown_thad113@gmail.com'
);

INSERT INTO `students` (`user_id`, `major`)
SELECT `user_id`, 'Chemistry'
FROM `users`
WHERE `email` IN (
    'hamil_lewi44@gmail.com',
    'gasly_pierr10@gmail.com',
    'albon_alex23@gmail.com',
    'massa_feli19@gmail.com',
    'lauda_niki12@gmail.com',
    'dooha_jack7@gmail.com',
    'frenc_serg23@gmail.com',
    'meeks_shor34@gmail.com',
    'hoppe_jane42@gmail.com',
    'hoppe_jim52@gmail.com',
    'oting_euge62@gmail.com',
    'stone_marl72@gmail.com',
    'velar_luce82@gmail.com',
    'marre_tina92@gmail.com',
    'sherw_alla102@gmail.com',
    'macle_norm110@gmail.com'
);

INSERT INTO `students` (`user_id`, `major`)
SELECT `user_id`, 'Nursing'
FROM `users`
WHERE `email` IN (
    'piast_osca81@gmail.com',
    'zhou_guan24@gmail.com',
    'vette_seba5@gmail.com',
    'maldo_past18@gmail.com',
    'monto_juan42@gmail.com',
    'homel_john20@gmail.com',
    'noir_earv29@gmail.com',
    'gilmo_doof39@gmail.com',
    'byers_will47@gmail.com',
    'barcl_bian59@gmail.com',
    'willi_elli68@gmail.com',
    'hight_alic79@gmail.com',
    'berza_carm87@gmail.com',
    'carso_ken98@gmail.com',
    'macle_lucy107@gmail.com',
    'pears_bett115@gmail.com'
);

INSERT INTO `students` (`user_id`, `major`)
SELECT `user_id`, 'Information Systems Management'
FROM `users`
WHERE `email` IN (
    'lecle_char16@gmail.com',
    'tsuno_yuki22@gmail.com',
    'devri_nyck21@gmail.com',
    'schum_mich47@gmail.com',
    'coult_davi2@gmail.com',
    'ilott_call12@gmail.com',
    'soldi_ben25@gmail.com',
    'prinz_bobb36@gmail.com',
    'hende_dust44@gmail.com',
    'sincl_eric56@gmail.com',
    'addam_gome64@gmail.com',
    'frank_fran74@gmail.com',
    'targa_rhae84@gmail.com',
    'fak_neil94@gmail.com',
    'hadle_midg104@gmail.com',
    'molda_lee112@gmail.com'
);
