<?php
defined('BASEPATH') OR exit('No direct script access allowed');

$route['default_controller'] = 'welcome';
$route['404_override'] = '';
$route['translate_uri_dashes'] = FALSE;

//////////////////////////////ADMIN ROUTES////////////////////////////////////////////
$route['review_support_requests'] = 'admin/review_support_requests';
$route['active_support_requests'] = 'admin/active_support_requests';
$route['admin/approve_cs_request/(:num)'] = 'admin/approve_request/$1';
$route['admin/reject_cs_request/(:num)'] = 'admin/decline_request/$1';
$route['admin/delete_cs_request/(:num)'] = 'admin/delete_request/$1';
$route['pool/create'] = 'pool/create';
$route['pool/manage'] = 'pool/manage';
$route['pool/view/(:num)'] = 'pool/view/$1';
$route['invest/contribute'] = 'invest/contribute';
$route['invest/my_contributions'] = 'invest/my_contributions';
$route['admin'] = 'admin/index';
$route['admin_search'] = 'admin/search';
$route['admin_investment'] = 'admin/investment';
$route['admin/do_search'] = 'admin/do_search';
$route['top_up_request'] = 'admin/top_up_request';
$route['accept_merchant/(:any)'] = 'admin/accept_merchant/$1';
$route['admin_pickup'] = 'admin/pickups';
$route['admin_analytics'] = 'admin/analytics';
$route['admin_student'] = 'admin/students_palliative';
$route['admin_products'] = 'admin/products';
$route['admin_refer'] = 'admin/refer';
$route['admin_notification'] = 'admin/notification';
$route['verifyAll'] = 'admin/verifyAll';
$route['admin_nextofkin'] = 'admin/nextofkin';
$route['view_nok_request/(:any)'] = 'admin/view_nextofkin/$1';
$route['approve_nok_request/(:any)'] = 'admin/approve_nok_request/$1';
$route['reject_nok_request/(:any)'] = 'admin/reject_nok_request/$1';
$route['admin_bpi_upgrade'] = 'admin/bpi_upgrades';
$route['view_user_upgrade/(:any)'] = 'admin/view_upgrades/$1';
$route['view_user_payment/(:any)'] = 'admin/view_payments/$1';
$route['view_student_payment/(:any)'] = 'admin/view_student_payments/$1';
$route['view_wallet_payment/(:any)'] = 'admin/view_wallet_payments/$1';
$route['view_crypto_payment/(:any)'] = 'admin/view_crypto_payment/$1';
$route['reject_upgrade/(:any)'] = 'admin/reject_upgrade/$1';
$route['reject_student/(:any)'] = 'admin/reject_student/$1';
$route['reject_payment/(:any)'] = 'admin/reject_payment/$1';
$route['reject_crypto/(:any)'] = 'admin/reject_crypto/$1';
$route['reject_topup/(:any)'] = 'admin/reject_topup/$1';
$route['approve_upgrade/(:any)'] = 'admin/approve_upgrade/$1';
$route['approve_student/(:any)'] = 'admin/approve_student/$1';
$route['approve_payment/(:any)'] = 'admin/approve_payment/$1';
$route['approve_topup/(:any)'] = 'admin/approve_topup/$1';
$route['approve_crypto/(:any)'] = 'admin/approve_crypto/$1';
$route['admin_kyc'] = 'admin/kyc';
$route['admin_view_kyc/(:any)'] = 'admin/admin_view_kyc/$1';
$route['approve_kyc/(:any)'] = 'admin/approve_kyc/$1';
$route['reject_kyc/(:any)'] = 'admin/reject_kyc/$1';
$route['delete_product/(:any)'] = 'admin/delete_product/$1';
$route['users'] = 'admin/users';
$route['activated_users'] = 'admin/activated_users';
$route['inactive_users'] = 'admin/inactive_users';
$route['admin_transactions'] = 'admin/admin_transactions';
$route['admin_withdrawals'] = 'admin/admin_withdrawals';
$route['users_details/(:any)'] = 'admin/user_details/$1';
$route['pickup_details/(:any)'] = 'admin/pickup_details/$1';
$route['products_details/(:any)'] = 'admin/products_details/$1';
$route['reject_merc_payment/(:any)'] = 'admin/reject_merc_payment/$1';
$route['approve_merc_payment/(:any)'] = 'admin/approve_merc_payment/$1';
$route['argnes_ai'] = 'argnes/index';
$route['cron/update-referrals'] = 'CronController/update_referrals';
///////////////////////////////END ADMIN ROUTES//////////////////////////////////////

///////////////////////////////TICKET ROUTES/////////////////////////////////////////
$route['support_tickets'] = 'tickets/index';
$route['tickets/create'] = 'tickets/create';
$route['tickets/edit/(:num)'] = 'tickets/edit/$1';
$route['tickets/delete/(:num)'] = 'tickets/delete/$1';
$route['tickets/view/(:num)'] = 'tickets/view/$1';
//////////////////////////////END TICKET ROUTES/////////////////////////////////////
 
///////////////////////////////Community Routes/////////////////////////////////////
$route['solarassessment'] = 'siteController/solar';
$route['solarassessment/calculate'] = 'siteController/solar_calculate';
$route['api/update-assessment-status'] = 'SiteController/update_assessment_status';
$route['solarassessment/download_pdf/(:num)'] = 'siteController/download_pdf/$1';
$route['api/submit-assessment'] = 'siteController/solar_submit';
$route['api/get-assessments'] = 'siteController/get_assessments';
$route['assessments/details/(:num)'] = 'siteController/details/$1';
$route['generate_captcha_image'] = 'authController/generate_captcha_image';
$route['apply_for_support'] = 'siteController/apply_for_support';


$route['community'] = 'community/index';
$route['networking'] = 'community/networking';
$route['learning'] = 'community/learning';
$route['health'] = 'community/health';
$route['creativity'] = 'community/creativity';
$route['entertainment'] = 'community/entertainment';
$route['innovation'] = 'community/innovation';
$route['post_detail/(:any)'] = 'community/post_detail/$1';
///////////////////////////// End Community Routes /////////////////////////////////

///////////////////////////// Youtube Routes /////////////////////////////////
$route['submit_channel'] = 'channels/submit_channel';
$route['channels/verify_callback'] = 'channels/verify_callback';

///////////////////////////// End Community Routes /////////////////////////////////

///////////////////////////// share package Routes /////////////////////////////////
$route['available_slots'] = 'ShareController/available_packages';
$route['view_slots/(:num)'] = 'ShareController/viewSlots/$1'; // Route for viewing slots by package ID
$route['purchase_slot/(:num)'] = 'ShareController/purchaseSlot/$1'; // Route for buying a slot for a package ID
$route['group_details/(:num)'] = 'ShareController/viewGroupDetails/$1'; //
//////////////////////////// end share package Routes /////////////////////////////

/////////////////authentication routes//////////////////////////////////////////////
$route['fetch'] = 'authController/fetch';
$route['mark_as_read/(:any)'] = 'user/mark_as_read/$1';
$route['login'] = 'welcome/index';
$route['flutter_callback'] = 'webhook/flutterwave';
$route['calculator'] = "siteController/calculator";
$route['validator'] = 'siteController/validator';
$route['delete_beneficiary/(:any)'] = 'SiteController/delete_beneficiary/$1';
$route['blogs'] = 'blog/posts';
$route['blogs_details/(:any)'] = 'blog/blog_detail/$1';
$route['register'] =  'authController/register';
$route['process_registration'] = 'authController/process_registration';
$route['registration_success'] = 'authController/registration_success';
$route['partner_success'] = 'partners/registration_success';
$route['email_verified/(:any)'] = 'authController/email_verified/$1';
$route['api/auth/validate-ssc'] = 'authController/validate_ssc';
$route['verify_email/(:any)'] = 'authController/verify_email/$1';
$route['part_verify_email/(:any)'] = 'partners/verify_email/$1';
$route['login'] = 'authController/login';
$route['process_login'] = 'authController/process_login';
$route['dashboard'] = 'authController/dashboard';
$route['part_dashboard'] = 'partners/part_dashboard';
$route['logout'] = 'authController/logout';
$route['partner_logout'] = 'partners/logout';
$route['reset_password/(:any)'] = 'authController/reset_pass/$1';
$route['reset_password'] = 'authController/reset_password';
$route['reset_password_success'] = 'authController/reset_password_success';
$route['forgot_password'] = 'authController/forgot_password';
$route['part_forgot_password'] = 'partners/forgot_password';


///////////////////ajax function routes //////////////////////////////////////
$route['updateQuotaHome'] = 'ajaxCalls/updateQuota';
$route['foodhandler/processOrder'] = 'foodHandler/processOrder';
$route['check_ssn'] = 'user/check_ssn';
/////////////////////////payment routes /////////////////////////////////////
$route['bank_transfer'] = 'paymentController/bank_transfer';
$route['ict_pay_wallet'] = 'siteController/ict_pay_wallet';
$route['pay_wallet'] = 'siteController/pay_wallet';
$route['ict_form'] = 'siteController/ict_form';
$route['claim_cashback'] = 'siteController/claim_cashback';
$route['ict_pay_cashback'] = 'siteController/ict_pay_cashback';
$route['sponsor_bank_transfer'] = 'paymentController/sponsor_bank_transfer';
$route['crypto_pay'] = 'paymentController/crypto_pay';
$route['card_pay'] = 'paymentController/card_pay';
$route['leaderboard'] = 'siteController/leaderboard';
$route['bank_confirm'] = 'paymentController/bank_confirm';
$route['bank_confirm_dual'] = 'paymentController/bank_confirm_dual';
$route['donor_bank_confirm'] = 'user/donor_bank_confirm';
$route['bank_wallet_confirm'] = 'user/bank_wallet_confirm'; 
$route['upgrade_bank_confirm'] = 'user/upgrade_bank_confirm';
$route['merchantbank_confirm'] = 'paymentController/merchantbank_confirm';
$route['sponsor_bank_confirm'] = 'paymentController/sponsor_bank_confirm';
$route['processPayment'] = 'paymentController/processPayment';
$route['processPayment_dual'] = 'paymentController/processPayment_dual';
$route['wallet_processPayment'] = 'paymentController/wallet_processPayment';
$route['process_merch_payment'] = 'paymentController/process_merch_payment';
$route['sponsor_processPayment'] = 'paymentController/sponsor_processPayment';
$route['payment_success_page'] = 'paymentController/success';
$route['flutterwaveCallback_wallet'] = 'paymentController/flutterwaveCallback_wallet';
$route['flutterwaveCallback'] = 'paymentController/flutterwaveCallback';
$route['donor_flutterwaveCallback'] = 'user/donor_flutterwaveCallback';
$route['flutterwaveCallback_vip'] = 'paymentController/flutterwaveCallback_vip';
$route['flutterwaveCallback_vip_dual'] = 'paymentController/flutterwaveCallback_vip_dual';
$route['upgrade_flutterwaveCallback_vip'] = 'user/upgrade_flutterwaveCallback_vip';
$route['sponsor_flutterwaveCallback_vip'] = 'paymentController/sponsor_flutterwaveCallback_vip';
$route['usdt_confirmation'] = 'paymentController/usdt_confirmation';
$route['usdt_confirmation_dual'] = 'paymentController/usdt_confirmation_dual';

/////////////////////////////menu routes////////////////////////////////////
$route['investment_options'] = 'siteController/investments';
$route['pecv_dashboard'] = 'siteController/pecv_dashboard';
$route['cs_donate/(:num)'] = 'siteController/cs_donate/$1';
$route['bsc_msc'] = 'siteController/bsc_msc';
$route['bsc_apply'] = 'siteController/bsc_apply'; 
$route['msc_apply'] = 'siteController/msc_apply';
$route['palliative'] = 'siteController/palliative';
$route['analytics'] = 'siteController/analytics';
$route['my_assets'] = 'siteController/my_assets';
$route['pwallet'] = 'partners/my_assets';
$route['merchants'] = 'siteController/merchants';
$route['merchants(:num)'] = 'siteController/merchants/$1';
$route['extension'] = 'siteController/extension';
$route['upgrade_exc'] = 'siteController/upgrade_exc';
$route['club'] = 'siteController/club';
$route['settings'] = 'siteController/settings';
$route['preference'] = 'partners/settings';
$route['store'] = 'siteController/store';
$route['transactions'] = 'siteController/transactions';
$route['profile'] = 'siteController/profile';
$route['ptransactions'] = 'partners/transactions';
$route['refer'] = 'siteController/refer';
$route['update_profile'] = 'user/update_profile';
$route['update_account'] = 'user/update_account';
$route['start_vip'] = 'user/start_vip';
$route['start_vip_pro'] = 'user/start_vip_pro';
$route['start_vip_plus'] = 'user/start_vip_plus';
$route['start_dual_act'] = 'user/start_vip_plus_dual';
$route['start_platinum_vip'] = 'user/start_platinum_vip';
$route['start_gold_vip'] = 'user/start_gold_vip';
$route['reg_vip'] = 'user/reg_vip';
$route['silver_vip'] = 'user/silver_vip';
$route['gold_vip'] = 'user/gold_vip';
$route['withdrawal'] = 'user/withdrawal';
$route['kyc_start'] = 'user/kyc_start';
$route['details/(:any)'] = 'siteController/product_details/$1';
$route['checkout'] = 'siteController/checkout';
$route['delete_order/(:any)'] = 'user/delete_order/$1';
$route['claim_with_cashback'] = 'user/claim_product';
$route['top_up'] = 'user/top_up';
$route['claim_with_wallet'] = 'user/claim_wallet';
$route['my_items'] = 'siteController/my_items';
$route['complete_order/(:any)'] = 'user/complete_order/$1';
$route['claim_dashboard/(:any)'] = 'siteController/claim_dashboard/$1';
$route['view_exc/(:any)'] = 'siteController/view_exc/$1';
$route['activate_exc/(:any)'] = 'siteController/activate_exc/$1';
$route['billing'] = 'siteController/billing/';
$route['security'] = 'siteController/security/';
$route['local_store/(:any)'] = 'siteController/local_store/$1';
$route['view_profile/(:any)'] = 'siteController/view_profile/$1';
$route['wishlist'] = 'siteController/wishlist'; 
$route['move_to_cart/(:any)'] = 'user/move_to_cart/$1';
$route['claim_edu_pal/(:any)'] = 'user/claim_edu_pal/$1';
$route['claim_shelter_pal/(:any)'] = 'user/claim_shelter_pal/$1';
$route['delete_link/(:any)'] = 'user/delete_link/$1';
$route['claim_student_pal'] = 'user/claim_student_pal';
$route['donor'] = 'user/donor';
$route['aid_tickets'] ="siteController/aid_tickets";
$route["get_states"] = "user/getStates";
$route["get_cities"] = "user/getCities";
$route["apply_pickup"] = "user/apply_pickup";
$route["meal_claimed/(:any)"] = 'siteController/meal_claim/$1';
$route["merchant_fee"] = 'siteController/merchant_fee';
$route["merchant_flutterwaveCallback"] = 'paymentController/merchant_flutterwaveCallback';
$route['campaigns'] = 'siteController/campaigns';
$route['announcements'] = 'siteController/announcements';
$route['notifications'] = 'user/notif_index';
$route['read_notif/(:any)'] = 'user/read_notif/$1';
$route['testemail'] = "user/testemail";
$route['upgrade_bpi'] = "siteController/upgrade_bpi";
$route['partners'] = "partners/index";
$route['part_reg'] = "partners/register";



