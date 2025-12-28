<?php $withdrawn = $this->generic_model->getSum('withdrawal_history','amount',array('user_id'=>$userdetails->id)); ?>
<?php
					  $regular_direct_commissions_bmt = (150 * $total_direct_regular);
					  $regular_direct_commissions_palliative = (1230 * $total_direct_regular);
					  $regular_direct_commissions_spendable = (1230 * $total_direct_regular);
					  $regular_direct_commissions_wallet = (450 * $total_direct_regular);
					  
					  $total_regular = ($regular_direct_commissions_bmt+ $regular_direct_commissions_palliative+$regular_direct_commissions_spendable+$regular_direct_commissions_wallet);
					  
					   //regularPro
					  $regularPro_direct_commissions_bmt = (150 * $total_direct_regularPro);
					  $regularPro_direct_commissions_palliative = (1230 * $total_direct_regularPro);
					  $regularPro_direct_commissions_spendable = (4000 * $total_direct_regularPro);
					  $regularPro_direct_commissions_wallet = (450 * $total_direct_regularPro);
					  
					  $total_regularPro = ($regularPro_direct_commissions_bmt+ $regularPro_direct_commissions_palliative+$regularPro_direct_commissions_spendable+$regularPro_direct_commissions_wallet);
					  
						  
					  //regularPlus
					  $regularPlus_direct_commissions_bmt = (150 * $total_direct_regularPlus);
					  $regularPlus_direct_commissions_palliative = (2460 * $total_direct_regularPlus);
					  $regularPlus_direct_commissions_spendable = (10000 * $total_direct_regularPlus);
					  $regularPlus_direct_commissions_wallet = (450 * $total_direct_regularPlus);
					  
					  $total_regularPlus = ($regularPlus_direct_commissions_bmt+ $regularPlus_direct_commissions_palliative+$regularPlus_direct_commissions_spendable+$regularPlus_direct_commissions_wallet);
					  
					  //Gold
					  $gold_direct_commissions_bmt = (2000 * $total_direct_gold);
					  $gold_commissions_palliative = (7200 * $total_direct_gold);
					  $gold_commissions_spendable = (7200 * $total_direct_gold);
					  $gold_commissions_shelter = (60000 * $total_direct_gold);
					  $gold_commissions_wallet = (3600 * $total_direct_gold);
					  
					  $total_gold = ($gold_direct_commissions_bmt +  $gold_commissions_palliative + $gold_commissions_spendable + $gold_commissions_wallet + $gold_commissions_shelter );
					  
					  
					   //platinum
					  $platinum_direct_commissions_bmt = (2000 * $total_direct_platinum);
					  $platinum_commissions_palliative = (16000 * $total_direct_platinum);
					  $platinum_commissions_spendable = 0;
					  $platinum_commissions_shelter = (30000 * $total_direct_platinum);
					  $platinum_commissions_wallet = (74250 * $total_direct_platinum);
					  
					  $total_platinum = ($platinum_direct_commissions_bmt +  $platinum_commissions_palliative + $platinum_commissions_spendable + $platinum_commissions_wallet + $platinum_commissions_shelter );
					  
					  $grand_direct_total = ($total_regular + $total_regularPlus + $total_gold + $total_platinum);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

					  $regular_direct_commissions_bmt_2 = (75 * $total_regular_level2);
					  $regular_direct_commissions_palliative_2 = (600 * $total_regular_level2);
					  $regular_direct_commissions_spendable_2 = (600 * $total_regular_level2);
					  $regular_direct_commissions_wallet_2 = (225 * $total_regular_level2);
					  
					  $total_regular_2 = ($regular_direct_commissions_bmt_2 + $regular_direct_commissions_palliative_2 + $regular_direct_commissions_spendable_2 + $regular_direct_commissions_wallet_2);
					  
					   //regularPro
					  $regularPro_direct_commissions_bmt_2 = (75 * $total_regularPro_level2);
					  $regularPro_direct_commissions_palliative_2 = (600 * $total_regularPro_level2);
					  $regularPro_direct_commissions_spendable_2 = (1500 * $total_regularPro_level2);
					  $regularPro_direct_commissions_wallet_2 = (225 * $total_regularPro_level2);
					  
					  $total_regularPro_2 = ($regularPro_direct_commissions_bmt_2+ $regularPro_direct_commissions_palliative_2+$regularPro_direct_commissions_spendable_2+$regularPro_direct_commissions_wallet_2);
					  
						  
					  //regularPlus
					  $regularPlus_direct_commissions_bmt_2 = (75 * $total_regularPlus_level2);
					  $regularPlus_direct_commissions_palliative_2 = (1200 * $total_regularPlus_level2);
					  $regularPlus_direct_commissions_spendable_2 = (5000 * $total_regularPlus_level2);
					  $regularPlus_direct_commissions_wallet_2 = (225 * $total_regularPlus_level2);
					  
					  $total_regularPlus_2 = ($regularPlus_direct_commissions_bmt_2 + $regularPlus_direct_commissions_palliative_2 + $regularPlus_direct_commissions_spendable_2 + $regularPlus_direct_commissions_wallet_2 );
					  
					  //Gold
					  $gold_direct_commissions_bmt_2 = (600 * $total_gold_level2);
					  $gold_commissions_palliative_2 = (4320 * $total_gold_level2);
					  $gold_commissions_spendable_2 = (4320 * $total_gold_level2);
					  $gold_commissions_shelter_2 = (45000 * $total_gold_level2);
					  $gold_commissions_wallet_2 = (2160 * $total_gold_level2);
					  
					  $total_gold_2 = ($gold_direct_commissions_bmt_2 +  $gold_commissions_palliative_2 + $gold_commissions_spendable_2 + $gold_commissions_wallet_2 + $gold_commissions_shelter_2 );
					  
					  
					   //platinum
					  $platinum_direct_commissions_bmt_2 = (600 * $total_platinum_level2);
					  $platinum_commissions_palliative_2 = (6400 * $total_platinum_level2);
					  $platinum_commissions_spendable_2 = 0;
					  $platinum_commissions_shelter_2 = (22500 * $total_platinum_level2);
					  $platinum_commissions_wallet_2 = (44550 * $total_platinum_level2);
					  
					  $total_platinum_2 = ($platinum_direct_commissions_bmt_2 +  $platinum_commissions_palliative_2 + $platinum_commissions_spendable_2 + $platinum_commissions_wallet_2 + $platinum_commissions_shelter_2 );
					  
					  $grand_direct_total_2 = ($total_regular_2 + $total_regularPlus_2 + $total_gold_2 + $total_platinum_2);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

					  $regular_direct_commissions_bmt_3 = (50 * $total_regular_level3);
					  $regular_direct_commissions_palliative_3 = (400 * $total_regular_level3);
					  $regular_direct_commissions_spendable_3 = (400 * $total_regular_level3);
					  $regular_direct_commissions_wallet_3 = (150 * $total_regular_level3);
					  
					  $total_regular_3 = ($regular_direct_commissions_bmt_3 + $regular_direct_commissions_palliative_3 + $regular_direct_commissions_spendable_3 + $regular_direct_commissions_wallet_3);
					  
					  
					   //regularPro
					  $regularPro_direct_commissions_bmt_3 = (50 * $total_regularPro_level3);
					  $regularPro_direct_commissions_palliative_3 = (400 * $total_regularPro_level3);
					  $regularPro_direct_commissions_spendable_3 = (1000 * $total_regularPro_level3);
					  $regularPro_direct_commissions_wallet_3 = (150 * $total_regularPro_level3);
					  
					  $total_regularPro_3 = ($regularPro_direct_commissions_bmt_3+ $regularPro_direct_commissions_palliative_3+$regularPro_direct_commissions_spendable_3+$regularPro_direct_commissions_wallet_3);
					  
						  
					  //regularPlus
					  $regularPlus_direct_commissions_bmt_3 = (50 * $total_regularPlus_level3);
					  $regularPlus_direct_commissions_palliative_3 = (800 * $total_regularPlus_level3);
					  $regularPlus_direct_commissions_spendable_3 = (10000 * $total_regularPlus_level3);
					  $regularPlus_direct_commissions_wallet_3 = (150 * $total_regularPlus_level3);
					  
					  $total_regularPlus_3 = ($regularPlus_direct_commissions_bmt_3 + $regularPlus_direct_commissions_palliative_3 + $regularPlus_direct_commissions_spendable_3 + $regularPlus_direct_commissions_wallet_3 );
					  
					  //Gold
					  $gold_direct_commissions_bmt_3 = (200 * $total_gold_level3);
					  $gold_commissions_palliative_3 = (1440 * $total_gold_level3);
					  $gold_commissions_spendable_3 = (1440 * $total_gold_level3);
					  $gold_commissions_shelter_3 = (15000 * $total_gold_level3);
					  $gold_commissions_wallet_3 = (720 * $total_gold_level3);
					  
					  $total_gold_3 = ($gold_direct_commissions_bmt_3 +  $gold_commissions_palliative_3 + $gold_commissions_spendable_3 + $gold_commissions_wallet_3 + $gold_commissions_shelter_3 );
					  
					  
					   //platinum
					  $platinum_direct_commissions_bmt_3 = (200 * $total_platinum_level3);
					  $platinum_commissions_palliative_3 = (3200 * $total_platinum_level3);
					  $platinum_commissions_spendable_3 = 0;
					  $platinum_commissions_shelter_3 = (7500 * $total_platinum_level3);
					  $platinum_commissions_wallet_3 = (14850 * $total_platinum_level3);
					  
					  $total_platinum_3 = ($platinum_direct_commissions_bmt_3 +  $platinum_commissions_palliative_3 + $platinum_commissions_spendable_3 + $platinum_commissions_wallet_3 + $platinum_commissions_shelter_3 );
					  
					  $grand_direct_total_3 = ($total_regular_3 + $total_regularPlus_3 + $total_gold_3 + $total_platinum_3);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

					  $regular_direct_commissions_bmt_4 = (50 * $total_regular_level4);
					  $regular_direct_commissions_palliative_4 = (400 * $total_regular_level4);
					  $regular_direct_commissions_spendable_4 = (400 * $total_regular_level4);
					  $regular_direct_commissions_wallet_4 = (150 * $total_regular_level4);
					  
					  $total_regular_4 = ($regular_direct_commissions_bmt_4 + $regular_direct_commissions_palliative_4 + $regular_direct_commissions_spendable_4 + $regular_direct_commissions_wallet_4);
					  
					     //regularPro
					  $regularPro_direct_commissions_bmt_4 = (50 * $total_regularPro_level4);
					  $regularPro_direct_commissions_palliative_4 = (400 * $total_regularPro_level4);
					  $regularPro_direct_commissions_spendable_4 = (500 * $total_regularPro_level4);
					  $regularPro_direct_commissions_wallet_4 = (150 * $total_regularPro_level4);
					  
					  $total_regularPro_4 = ($regularPro_direct_commissions_bmt_4+ $regularPro_direct_commissions_palliative_4+$regularPro_direct_commissions_spendable_4+$regularPro_direct_commissions_wallet_4);
					  
						  
					  //regularPlus
					  $regularPlus_direct_commissions_bmt_4 = (50 * $total_regularPlus_level4);
					  $regularPlus_direct_commissions_palliative_4 = (800 * $total_regularPlus_level4);
					  $regularPlus_direct_commissions_spendable_4 = (5000 * $total_regularPlus_level4);
					  $regularPlus_direct_commissions_wallet_4 = (150 * $total_regularPlus_level4);
					  
					  $total_regularPlus_4 = ($regularPlus_direct_commissions_bmt_4 + $regularPlus_direct_commissions_palliative_4 + $regularPlus_direct_commissions_spendable_4 + $regularPlus_direct_commissions_wallet_4 );
					  
					  //Gold
					  $gold_direct_commissions_bmt_4 = (200 * $total_gold_level4);
					  $gold_commissions_palliative_4 = (1440 * $total_gold_level4);
					  $gold_commissions_spendable_4 = (1440 * $total_gold_level4);
					  $gold_commissions_shelter_4 = (15000 * $total_gold_level4);
					  $gold_commissions_wallet_4 = (720 * $total_gold_level4);
					  
					  $total_gold_4 = ($gold_direct_commissions_bmt_4 +  $gold_commissions_palliative_4 + $gold_commissions_spendable_4 + $gold_commissions_wallet_4 + $gold_commissions_shelter_4 );
					  
					  
					   //platinum
					  $platinum_direct_commissions_bmt_4 = (200 * $total_platinum_level4);
					  $platinum_commissions_palliative_4 = (3200 * $total_platinum_level4);
					  $platinum_commissions_spendable_4 = 0;
					  $platinum_commissions_shelter_4 = (7500 * $total_platinum_level4);
					  $platinum_commissions_wallet_4 = (14850 * $total_platinum_level4);
					  
					  $total_platinum_4 = ($platinum_direct_commissions_bmt_4 +  $platinum_commissions_palliative_4 + $platinum_commissions_spendable_4 + $platinum_commissions_wallet_4 + $platinum_commissions_shelter_4 );
					  
					  $grand_direct_total_4 = ($total_regular_4 + $total_regularPlus_4 + $total_gold_4 + $total_platinum_4);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
					  
					  $gold_commissions_shelter_5 = (3000 * $total_gold_level5);
					  $total_gold_5 = $gold_commissions_shelter_5;
					 
					  $platinum_commissions_shelter_5 = (1500 * $total_platinum_level5);					  
					  $total_platinum_5 = $platinum_commissions_shelter_5;
					  
					  $grand_direct_total_5 = ($total_gold_5 + $total_platinum_5);
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

					  $gold_commissions_shelter_6 = (3000 * $total_gold_level6);
					  $total_gold_6 = $gold_commissions_shelter_6;
					  
					  $platinum_commissions_shelter_6 = (1500 * $total_platinum_level6);					  
					  $total_platinum_6 = $platinum_commissions_shelter_6;
					  $grand_direct_total_6 = ($total_gold_6 + $total_platinum_6);
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

					  $gold_commissions_shelter_7 = (3000 * $total_gold_level7);
					  $total_gold_7 = $gold_commissions_shelter_7;
					  
					  $platinum_commissions_shelter_7 = (1500 * $total_platinum_level7);					  
					  $total_platinum_7 = $platinum_commissions_shelter_7;
					  $grand_direct_total_7 = ($total_gold_6 + $total_platinum_7);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

					  $gold_commissions_shelter_8 = (3000 * $total_gold_level8);
					  $total_gold_8 = $gold_commissions_shelter_8;
					  
					  $platinum_commissions_shelter_8 = (1500 * $total_platinum_level8);					  
					  $total_platinum_8 = $platinum_commissions_shelter_8;
					  $grand_direct_total_8 = ($total_gold_6 + $total_platinum_8);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

					  $gold_commissions_shelter_9 = (3000 * $total_gold_level9);
					  $total_gold_9 = $gold_commissions_shelter_9;
					  
					  $platinum_commissions_shelter_9 = (1500 * $total_platinum_level9);					  
					  $total_platinum_9 = $platinum_commissions_shelter_9;
					  $grand_direct_total_9 = ($total_gold_6 + $total_platinum_9);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 
					  $gold_commissions_shelter_10 = (3000 * $total_gold_level10);
					  $total_gold_10 = $gold_commissions_shelter_10;
					  
					  $platinum_commissions_shelter_10 = (1500 * $total_platinum_level10);					  
					  $total_platinum_10 = $platinum_commissions_shelter_10;
					  $grand_direct_total_10 = ($total_gold_10 + $total_platinum_10);
				  ?>
	<?php 
			$lv1_bpt = ($regular_direct_commissions_bmt + $regularPro_direct_commissions_bmt + $regularPlus_direct_commissions_bmt + $gold_direct_commissions_bmt + $platinum_direct_commissions_bmt);
		
			$lv1_bpt_2 = ($regular_direct_commissions_bmt_2 + $regularPro_direct_commissions_bmt_2 + $regularPlus_direct_commissions_bmt_2 + $gold_direct_commissions_bmt_2 + $platinum_direct_commissions_bmt_2);
		
			$lv1_bpt_3 = ($regular_direct_commissions_bmt_3 + $regularPro_direct_commissions_bmt_3 + $regularPlus_direct_commissions_bmt_3 + $gold_direct_commissions_bmt_3 + $platinum_direct_commissions_bmt_3);
		
			$lv1_bpt_4 = ($regular_direct_commissions_bmt_4 + $regularPro_direct_commissions_bmt_4 + $regularPlus_direct_commissions_bmt_4 + $gold_direct_commissions_bmt_4 + $platinum_direct_commissions_bmt_4);
		
		 $all_levels_bpt = ($lv1_bpt+$lv1_bpt_2+$lv1_bpt_3+$lv1_bpt_4);
		
		//////////////////////////////////////////////
		
			$lv1_palliative = ($regular_direct_commissions_palliative + $regularPro_direct_commissions_palliative + $regularPlus_direct_commissions_palliative + $gold_commissions_palliative + $platinum_commissions_palliative);
		
			$lv1_palliative_2 = ($regular_direct_commissions_palliative_2 + $regularPro_direct_commissions_palliative_2 + $regularPlus_direct_commissions_palliative_2 + $gold_commissions_palliative_2 + $platinum_commissions_palliative_2);
		
			$lv1_palliative_3 = ($regular_direct_commissions_palliative_3 + $regularPro_direct_commissions_palliative_3 + $regularPlus_direct_commissions_palliative_3 + $gold_commissions_palliative_3 + $platinum_commissions_palliative_3);
		
			$lv1_palliative_4 = ($regular_direct_commissions_palliative_4 + $regularPro_direct_commissions_palliative_4 + $regularPlus_direct_commissions_palliative_4 + $gold_commissions_palliative_4 + $platinum_commissions_palliative_4);
		
		   $all_levels_pall = ($lv1_palliative+$lv1_palliative_2+$lv1_palliative_3+$lv1_palliative_4);
		
		//////////////////////////////////////////////////////////////////
		
			$lv1_cashback = ($regular_direct_commissions_wallet + $regularPro_direct_commissions_wallet + $regularPlus_direct_commissions_wallet + $gold_commissions_wallet + $platinum_commissions_wallet);
		
			$lv1_cashback_2 = ($regular_direct_commissions_wallet_2 + $regularPro_direct_commissions_wallet_2 + $regularPlus_direct_commissions_wallet_2 + $gold_commissions_wallet_2 + $platinum_commissions_wallet_2);
		
			$lv1_cashback_3 = ($regular_direct_commissions_wallet_3 + $regularPro_direct_commissions_wallet_3 + $regularPlus_direct_commissions_wallet_3 + $gold_commissions_wallet_3 + $platinum_commissions_wallet_3);
		
			$lv1_cashback_4 = ($regular_direct_commissions_wallet_4 + $regularPro_direct_commissions_wallet_4 + $regularPlus_direct_commissions_wallet_4 + $gold_commissions_wallet_4 + $platinum_commissions_wallet_4);

            $all_levels_cashback_pre = ($lv1_cashback+$lv1_cashback_2+$lv1_cashback_3+$lv1_cashback_4);
             //check if this person has engaged in selling of cashback...
            $total_sold = $this->generic_model->getSum('inter_wallet','amount',array('from_user'=>$userdetails->id));
            $all_levels_cashback = ($all_levels_cashback_pre - $total_sold);

		    
		
		//////////////////////////////////////////////////////////////////
		
			$lv1_spendable = ($regular_direct_commissions_spendable + $regularPro_direct_commissions_spendable +  $regularPlus_direct_commissions_spendable + $gold_commissions_spendable + $platinum_commissions_spendable);
		
			$lv1_spendable_2 = ($regular_direct_commissions_spendable_2 + $regularPro_direct_commissions_spendable_2 + $regularPlus_direct_commissions_spendable_2 + $gold_commissions_spendable_2 + $platinum_commissions_spendable_2);
		
			$lv1_spendable_3 = ($regular_direct_commissions_spendable_3 + $regularPro_direct_commissions_spendable_3 + $regularPlus_direct_commissions_spendable_3 + $gold_commissions_spendable_3 + $platinum_commissions_spendable_3);
		
			$lv1_spendable_4 = ($regular_direct_commissions_spendable_4 + $regularPro_direct_commissions_spendable_4 + $regularPlus_direct_commissions_spendable_4 + $gold_commissions_spendable_4 + $platinum_commissions_spendable_4);
		
		 $all_levels_spendable = (($lv1_spendable+$lv1_spendable_2+$lv1_spendable_3+$lv1_spendable_4) - $withdrawn);
		
		//////////////////////////////////////////////////////////////////
				
		
		 $all_gold_shelter = ($gold_commissions_shelter+$gold_commissions_shelter_2+$gold_commissions_shelter_3+$gold_commissions_shelter_4+$gold_commissions_shelter_5+$gold_commissions_shelter_6+$gold_commissions_shelter_7+$gold_commissions_shelter_8+$gold_commissions_shelter_9+$gold_commissions_shelter_10);
		
		///////////////////////////////////////////////////////////////////
		
		 $all_platinum_shelter = ($platinum_commissions_shelter+$platinum_commissions_shelter_2+$platinum_commissions_shelter_3+$platinum_commissions_shelter_4+$platinum_commissions_shelter_5+$platinum_commissions_shelter_6+$platinum_commissions_shelter_7+$platinum_commissions_shelter_8+$platinum_commissions_shelter_9+$platinum_commissions_shelter_10);
		
		///////////////////////////////////////////////////////////////////
		?>

<!DOCTYPE html>
<html lang="en" data-footer="true">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>BeepAgro Palliative Initiative | Admin Dashboard</title>
<meta name="description" content="Transforming Lives!">
<link rel="apple-touch-icon-precomposed" sizes="57x57" href="<?php echo base_url('assets/img/favicon/apple-icon-57x57.png');?>">
<link rel="apple-touch-icon-precomposed" sizes="114x114" href="<?php echo base_url('assets/img/favicon/apple-icon-114x114.png');?>">
<link rel="apple-touch-icon-precomposed" sizes="72x72" href="<?php echo base_url('assets/img/favicon/apple-icon-72x72.png');?>">
<link rel="apple-touch-icon-precomposed" sizes="144x144" href="<?php echo base_url('assets/img/favicon/apple-icon-144x144.png');?>">
<link rel="apple-touch-icon-precomposed" sizes="60x60" href="<?php echo base_url('assets/img/favicon/apple-icon-60x60.png');?>">
<link rel="apple-touch-icon-precomposed" sizes="120x120" href="<?php echo base_url('assets/img/favicon/apple-icon-120x120.png');?>">
<link rel="apple-touch-icon-precomposed" sizes="76x76" href="<?php echo base_url('assets/img/favicon/apple-icon-76x76.png');?>">
<link rel="apple-touch-icon-precomposed" sizes="152x152" href="<?php echo base_url('assets/img/favicon/apple-icon-152x152.png');?>">
<link rel="icon" type="image/png" href="<?php echo base_url('assets/img/favicon/favicon-196x196.png" sizes="196x196');?>">
<link rel="icon" type="image/png" href="<?php echo base_url('assets/img/favicon/favicon-96x96.png" sizes="96x96');?>">
<link rel="icon" type="image/png" href="<?php echo base_url('assets/img/favicon/favicon-32x32.png" sizes="32x32');?>">
<link rel="icon" type="image/png" href="<?php echo base_url('assets/img/favicon/favicon-16x16.png" sizes="16x16');?>">
<link rel="icon" type="image/png" href="<?php echo base_url('assets/img/favicon/favicon-128.png" sizes="128x128');?>">
<meta name="application-name" content="&nbsp;">
<meta name="msapplication-TileColor" content="#FFFFFF">
<meta name="msapplication-TileImage" content="<?php echo base_url('assets/img/favicon/mstile-144x144.png');?>">
<meta name="msapplication-square70x70logo" content="<?php echo base_url('assets/img/favicon/mstile-70x70.png');?>">
<meta name="msapplication-square150x150logo" content="<?php echo base_url('assets/img/favicon/mstile-150x150.png');?>">
<meta name="msapplication-wide310x150logo" content="<?php echo base_url('assets/img/favicon/mstile-310x150.png');?>">
<meta name="msapplication-square310x310logo" content="<?php echo base_url('assets/img/favicon/mstile-310x310.png');?>">
<link rel="preconnect" href="https://fonts.gstatic.com/">
<link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;700&amp;display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;700&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="<?php echo base_url('assets/font/CS-Interface/style.css');?>">
<link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/bootstrap.min.css');?>">
<link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/OverlayScrollbars.min.css');?>">
<link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/datatables.min.css');?>">
<link rel="stylesheet" href="<?php echo base_url('assets/css/styles.css');?>">
<link rel="stylesheet" href="<?php echo base_url('assets/css/main.css');?>">
<script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
<script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.10.21/js/jquery.dataTables.js"></script>
<script src="<?php echo base_url('assets/js/base/loader.js');?>"></script>
 <style>
        #users_table {
            width: 100%;
            margin: 10px auto;
            border-collapse: collapse;
			box-shadow: 0 4px 10px rgba(0, 0, 0, .03) !important;
		    background: var(--foreground);
		    border-radius: var(--border-radius-lg);
		    border: initial
        }
        
        #users_table thead th {
            text-align: center;
            padding: 13px;
        }
        
        #users_table tbody td {
			margin-top: 3px;
			margin-bottom: 3px;
            padding: 13px;
            text-align: center;
        }
    </style>
</head>
<body>
<div id="root"> 
  <!-- navbar segment -->
  <div id="nav" class="nav-container d-flex">
    <div class="nav-content d-flex">
      <div class=" position-relative"> <a href="https://beepagro.com/">
        <div class=""><img src="<?php echo base_url('assets/img/logo/beep_agro_logo.jpg" alt="logo');?>"  width="55px" ></div>
        </a> </div>
      <div class="user-container d-flex"> <a href="#" class="d-flex user position-relative" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false"> <img class="profile" alt="profile" src="<?php echo base_url($user_details->profile_pic);?>">
        <div class="name"><?php echo $user_details->firstname.' '.$user_details->lastname; ?></div>
        </a>
        <div class="dropdown-menu dropdown-menu-end user-menu wide">
          <div class="row mb-3 ms-0 me-0">
            <div class="col-12 ps-1 mb-2">
              <div class="text-extra-small text-primary">ACCOUNT</div>
            </div>
            <div class="col-6 ps-1 pe-1">
              <ul class="list-unstyled">
                <li> <a href="<?php echo base_url('profile');?>">User Profile</a> </li>
                <li> <a href="<?php echo base_url('donor');?>">Preferences</a> </li>
                <li> <a href="<?php echo base_url('aid_tickets');?>">BPI Tickets</a> </li>
              </ul>
            </div>
            <div class="col-6 pe-1 ps-1">
              <ul class="list-unstyled">
                <li> <a href="<?php echo base_url('security');?>">Security</a> </li>
                <li> <a href="<?php echo base_url('billing');?>">Billing</a> </li>
<li> <a href="<?php echo base_url('notifications');?>">Notifications</a> </li>
              </ul>
            </div>
          </div>
          <div class="row mb-1 ms-0 me-0">
            <div class="col-12 p-1 mb-2 pt-2">
              <div class="text-extra-small text-primary">APPLICATION</div>
            </div>
            <div class="col-6 ps-1 pe-1">
              <ul class="list-unstyled">
                <li> <a href="#" data-bs-toggle="modal" data-bs-target="#settings">Themes</a> </li>
                <li> <a href="<?php echo base_url('settings');?>">Currency</a> </li>
              </ul>
            </div>
            <div class="col-6 pe-1 ps-1">
              <ul class="list-unstyled">
                <li> <a href="<?php echo base_url('security');?>">Logs</a> </li>
                <li> <a href="<?php echo base_url('notifications');?>">Alerts</a> </li>
              </ul>
            </div>
          </div>
          <div class="row mb-1 ms-0 me-0">
            <div class="col-12 p-1 mb-3 pt-3">
              <div class="separator-light"></div>
            </div>
            <div class="col-6 ps-1 pe-1">
              <ul class="list-unstyled">
                <li> <a href="<?php echo base_url('settings');?>"> <i data-acorn-icon="gear" class="me-2" data-acorn-size="17"></i> <span class="align-middle">Settings</span> </a> </li>
                <!--<li>
                      <a href="#">
                        <i data-acorn-icon="help" class="me-2" data-acorn-size="17"></i>
                        <span class="align-middle">Help</span>
                      </a>
                    </li>
                    <li>
                      <a href="#">
                        <i data-acorn-icon="file-text" class="me-2" data-acorn-size="17"></i>
                        <span class="align-middle">Docs</span>
                      </a>
                    </li>-->
              </ul>
            </div>
            <div class="col-6 pe-1 ps-1">
              <ul class="list-unstyled">
                <li> <a href="<?php echo base_url('logout');?>"> <i data-acorn-icon="logout" class="me-2" data-acorn-size="17"></i> <span class="align-middle">Logout</span> </a> </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <ul class="list-unstyled list-inline text-center menu-icons">
        <li class="list-inline-item"> <a href="#" data-bs-toggle="modal" data-bs-target="#searchPagesModal"> <i data-acorn-icon="search" data-acorn-size="18"></i> </a> </li>
        <li class="list-inline-item"> <a href="#" id="pinButton" class="pin-button"> <i data-acorn-icon="lock-on" class="unpin" data-acorn-size="18"></i> <i data-acorn-icon="lock-off" class="pin" data-acorn-size="18"></i> </a> </li>
        <li class="list-inline-item"> <a href="#" id="colorButton"> <i data-acorn-icon="light-on" class="light" data-acorn-size="18"></i> <i data-acorn-icon="light-off" class="dark" data-acorn-size="18"></i> </a> </li>
        <li class="list-inline-item"> <a href="#" data-bs-toggle="dropdown" data-bs-target="#notifications" aria-haspopup="true" aria-expanded="false" class="notification-button">
          <div class="position-relative d-inline-flex"> <i data-acorn-icon="bell" data-acorn-size="18"></i>
            <?php if ($unread_count > 0): ?>
            <span class="position-absolute notification-dot rounded-xl"><strong><?php echo $unread_count; ?></strong></span>
            <?php endif; ?>
          </div>
          </a>
          <div class="dropdown-menu dropdown-menu-end wide notification-dropdown scroll-out" id="notifications">
            <div class="scroll">
              <?php foreach ($notifications as $notification): ?>
              <div class="row mb-1 pb-1 border-bottom"> 
                <!-- <a href="<?php //echo $notification->link; ?>">
                                <img src="<?php echo base_url(); ?>assets/img/profile-pic-l-2.jpg" alt="Notification Image" class="img-thumbnail list-thumbnail xsmall border-0 rounded-circle">
                            </a>-->
                <div class="col-12 mb-2"> 
					<a href="<?php echo base_url('notifications');?>">
                  		<p class="text-primary">
					  		<?php echo $notification['title']; ?><br>
                  			<em class="mt-2 text-success">
								Received on: <?php echo $notification['title']; ?>
							</em> 
						</p>
					</a> 
				</div>
                <div class="col-12 mb-2">
                  <a href="<?php echo base_url('mark_as_read/' . $notification['id']); ?>" class="float-right">Mark as Read</a>
                </div>
              </div>
              <?php endforeach; ?>
			  <div class="mt-5">
				<a href="<?php echo base_url('notifications');?>">View Notifications</a>
			  </div>
              
              <!--<ul class="list-unstyled border-last-none">
                    <li class="mb-3 pb-3 border-bottom border-separator-light d-flex">
                      <img src="img/profile/profile-1.webp" class="me-3 sw-4 sh-4 rounded-xl align-self-center" alt="...">
                      <div class="align-self-center">
                        <a href="#">Joisse Kaycee just sent a new comment!</a>
                      </div>
                    </li>
                  </ul>--> 
            </div>
          </div>
        </li>
      </ul>
      <div class="menu-container flex-grow-1">
        <ul id="menu" class="menu">
          <li> <a href="<?php echo base_url('blogs'); ?>"> <i data-acorn-icon="file-text" class="icon" data-acorn-size="18"></i> <span class="label">Blog</span> </a> </li>
          <?php  if(!empty($user_details->is_vip) && empty($user_details->shelter_wallet)){  ?>
          <li> <a href="<?php echo base_url('upgrade_bpi'); ?>"> <i data-acorn-icon="trend-up" class="icon" data-acorn-size="18"></i> <span class="label">Upgrade</span> </a> </li>
          <?php } ?>
          <li> <a href="<?php echo base_url('community'); ?>">
                  <i data-acorn-icon="messages" class="icon" data-acorn-size="18"></i>
                  <span class="label">Community</span>
                </a> </li>
        </ul>
      </div>
      <div class="mobile-buttons-container"> <a href="#" id="mobileMenuButton" class="menu-button"> <i data-acorn-icon="menu"></i> </a> </div>
    </div>
    <div class="nav-shadow"></div>
  </div>
  <!-- end navbar segment -->
  
  <main>
    <div class="container">
      <div class="row"> 
        
        <!-- menu segment -->
         <div class="col-auto d-none d-lg-flex">
          <ul class="sw-25 side-menu mb-0 primary" id="menuSide">
            <li> <a href="#" data-bs-target="#intel"> <i data-acorn-icon="cpu" class="icon" data-acorn-size="18"></i> <span class="label">Member Center</span> </a>
              <ul>
                <li > <a href="<?php echo base_url('dashboard');?>"> <i data-acorn-icon="user" class="icon d-none text-success" data-acorn-size="18"></i> <span class="label">Return to User</span> </a> </li>
              </ul>
            </li>
            <li> <a href="#" data-bs-target="#dashboard"> <i data-acorn-icon="home" class="icon" data-acorn-size="18"></i> <span class="label">User Section</span> </a>
              <ul>
				  <?php if($user_details->user_type == 'admin'){ ?>
				<li> 
					<a  href="<?php echo base_url('admin'); ?>"> <i data-acorn-icon="home" class="icon d-none" data-acorn-size="18"></i> <span class="label">Admin Overview</span> </a> 
				  </li>
				<li > 
					<a href="<?php echo base_url('admin_notification');?>"> <i data-acorn-icon="user" class="icon d-none text-danger"data-acorn-size="18"></i> <span class="label">Notification</span> </a> 
				  </li>
				<li > 
					<a href="<?php echo base_url('admin_bpi_upgrade');?>"> <i data-acorn-icon="shield-check" class="icon d-none text-danger" data-acorn-size="18"></i> <span class="label">Subscription Manager</span> </a> 
				  </li>
                <li> 
					<a class="active" href="<?php echo base_url('users');?>"> <i data-acorn-icon="user" class="icon d-none" data-acorn-size="18"></i> <span class="label">Users</span> </a> 
				  </li>
				<?php } ?>
				  <?php if($user_details->user_type == 'support' || $user_details->user_type == 'admin'){ ?>
				   <li> 
					<a href="<?php echo base_url('inactive_users');?>"> <i data-acorn-icon="user" class="icon d-none" data-acorn-size="18"></i> <span class="label">Inactive Users</span> </a> 
				  </li>
				  <li> 
					<a href="<?php echo base_url('admin_kyc');?>"> <i data-acorn-icon="user" class="icon d-none" data-acorn-size="18"></i> <span class="label">KYC</span> </a> 
				  </li>
				  <li> 
					<a href="<?php echo base_url('admin_student');?>"> <i data-acorn-icon="user" class="icon d-none" data-acorn-size="18"></i> <span class="label">Student Palliative</span> </a> 
				  </li>

<li> 
					<a href="<?php echo base_url('admin_search');?>"> <i data-acorn-icon="user" class="icon d-none" data-acorn-size="18"></i> <span class="label">User Search</span> </a> 
				  </li>
				  <li> <a href="<?php echo base_url('support_tickets');?>"> <i data-acorn-icon="bookmark" class="icon d-none" data-acorn-size="18"></i> <span class="label">Tickets</span> </a> 
				  </li>
				  <?php } ?>
				  <?php if($user_details->user_type == 'admin'){ ?>
                <li> 
					<a href="<?php echo base_url('admin_pickup');?>"> <i data-acorn-icon="home" class="icon d-none" data-acorn-size="18"></i><span class="label">Pickup Centers</span></a> 
				  </li>
                <li> 
					<a href="<?php echo base_url('admin_products');?>"><i data-acorn-icon="wallet" class="icon d-none" data-acorn-size="18"></i> <span class="label">Store &amp; Products</span> </a> </li>  <li> 
					<a href="<?php echo base_url('admin_transactions');?>"> <i data-acorn-icon="link" class="icon d-none" data-acorn-size="18"></i> <span class="label">Transaction History</span> </a> 
				  </li>

  <li> 
					<a href="<?php echo base_url('admin_withdrawals');?>"> <i data-acorn-icon="link" class="icon d-none" data-acorn-size="18"></i> <span class="label">Withdrawal History</span> </a> 
				  </li>
				<?php } ?>
              </ul>
            </li>
           <!-- <li> <a href="#" data-bs-target="#store"> <i data-acorn-icon="home" class="icon" data-acorn-size="18"></i> <span class="label">Storefront</span> </a>
              <ul>
                <li> <a href="<?php echo base_url('store');?>"> <i data-acorn-icon="home" class="icon d-none" data-acorn-size="18"></i> <span class="label">Global Store</span> </a> </li>
                <li> <a href="<?php echo base_url('checkout');?>"> <i data-acorn-icon="cart" class="icon d-none" data-acorn-size="18"></i> <span class="label">My Cart</span> </a> </li>
                <li> <a href="<?php echo base_url('my_items');?>"> <i data-acorn-icon="archive" class="icon d-none" data-acorn-size="18"></i> <span class="label">My Claims</span> </a> </li>
              </ul>
            </li>
            <li> <a href="#" data-bs-target="#services"> <i data-acorn-icon="grid-1" class="icon" data-acorn-size="18"></i> <span class="label">Palliative Services</span> </a>
              <ul>
                <li> <a href="<?php echo base_url('club');?>"> <i data-acorn-icon="database" class="icon d-none" data-acorn-size="18"></i> <span class="label">BPI</span> </a> </li>
                <li> <a href="<?php echo base_url('donor');?>"> <i data-acorn-icon="file-image" class="icon d-none" data-acorn-size="18"></i> <span class="label">Donors</span> </a> </li>
                <li> <a href="<?php echo base_url('merchants');?>"> <i data-acorn-icon="router" class="icon d-none" data-acorn-size="18"></i> <span class="label">Pickup Locations</span> </a> </li>
                <li> <a href="<?php echo base_url('palliative');?>"> <i data-acorn-icon="book" class="icon d-none" data-acorn-size="18"></i> <span class="label">Student Palliative</span> </a> </li>
                <li> <a href="<?php echo base_url('aid_tickets');?>"> <i data-acorn-icon="user" class="icon d-none" data-acorn-size="18"></i> <span class="label">Tickets</span> </a> </li>
              </ul>
            </li>
            <li> <a href="#" data-bs-target="#account"> <i data-acorn-icon="user" class="icon" data-acorn-size="18"></i> <span class="label">Account Management</span> </a>
              <ul>
                <li> <a href="<?php echo base_url('billing');?>"> <i data-acorn-icon="inbox" class="icon d-none" data-acorn-size="18"></i> <span class="label">Billing</span> </a> </li>
                <li> <a href="<?php echo base_url('security');?>"> <i data-acorn-icon="shield" class="icon d-none" data-acorn-size="18"></i> <span class="label">Security</span> </a> </li>
                <li> <a href="<?php echo base_url('settings');?>"> <i data-acorn-icon="gear" class="icon d-none" data-acorn-size="18"></i> <span class="label">Settings</span> </a> </li>
                <li> <a href="<?php echo base_url('transactions');?>"> <i data-acorn-icon="inbox" class="icon d-none" data-acorn-size="18"></i> <span class="label">Transactions</span> </a> </li>
              </ul>
            </li>
            <li> <a href="#" data-bs-target="#support"> <i data-acorn-icon="help" class="icon" data-acorn-size="18"></i> <span class="label">Support</span> </a>
              <ul>
                <li> <a href="#"> <i data-acorn-icon="file-empty" class="icon d-none" data-acorn-size="18"></i> <span class="label">Docs</span> </a> </li>
                <li> <a href="#"> <i data-acorn-icon="notebook-1" class="icon d-none" data-acorn-size="18"></i> <span class="label">Knowledge Base</span> </a> </li><li> <a href="<?php echo base_url('support_tickets');?>"> <i data-acorn-icon="bookmark" class="icon d-none" data-acorn-size="18"></i> <span class="label">Tickets</span> </a> </li>
              </ul>
            </li> -->
          </ul>
        </div>
        <!-- end menu segment -->
        
        <div class="col"> 
          
          <!-- Title segment-->
          <div class="page-title-container mb-3">
            <div class="row">
              <div class="col mb-2">
                <h1 class="mb-2 pb-0 display-4" id="title">BPI Admin Dashboard</h1>
                <div class="text-muted font-heading text-small">User Details</div>
              </div>
              <div>
                <?php
                $error = $this->session->flashdata( 'error' );
                if ( $error ) {
                  ?>
                <div class="alert alert-warning mb-3 mt-3 alert-dismissible fade show" role="alert"> <?php echo $this->session->flashdata('error'); ?>
                  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"><i data-acorn-icon="close-circle" class="text-white" data-acorn-size="18"></i></button>
                </div>
                <?php } ?>
                <?php
                $success = $this->session->flashdata( 'success' );
                if ( $success ) {
                  ?>
                <div class="alert alert-secondary mb-3 mt-3 alert-dismissible fade show" role="alert"> <?php echo $this->session->flashdata('success'); ?>
                  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"><i data-acorn-icon="close-circle" class="text-white" data-acorn-size="18"></i></button>
                </div>
                <?php } ?>
                <?php echo validation_errors('<div class="alert alert-danger alert-dismissible fade show" role="alert"><strong>Form Errors!</strong>'.$this->session->flashdata('errors').'</div>'); ?> </div>
            </div>
          </div>
          <!-- Title segment-->
				<div class="row">
					<div class="col-12 col-xl-4 col-xxl-3">
  <h2 class="small-title">Profile</h2>
  <div class="card mb-5">
    <div class="card-body">
      <div class="d-flex align-items-center flex-column mb-4">
        <div class="d-flex align-items-center flex-column">
          <div class="sw-13 position-relative mb-3">
            <img src="<?php echo base_url($userdetails->profile_pic);?>" class="rounded-xl" width="75px" height="75px" alt="<?php echo $userdetails->firstname.' '.$userdetails->lastname ?>">
          </div>
          <div class="h5 mb-0"><?php echo $userdetails->firstname.' '.$userdetails->lastname ?></div>
          <div class="text-muted"><?php echo $userdetails->user_type; ?></div>
          <div class="text-muted">
            <i data-acorn-icon="pin" class="me-1"></i>
            <span class="align-middle">
				<?php if(empty($userdetails->city)){
					echo 'This user has not set their location';
				}else{ ?>
				<?php  if($userdetails->city != 'all'){ echo $this->generic_model->getInfo('tbl_city','id',$userdetails->city)->name;}else{ echo 'central'; } ?>, <?php echo $this->generic_model->getInfo('tbl_states','id',$userdetails->state)->name; ?> 
				<?php echo $this->generic_model->getInfo('tbl_country_table','id',$userdetails->country)->country_name;
				
					 }?>
			</span>
          </div>
        </div>
      </div>
      <div class="nav flex-column" role="tablist">
        <a class="nav-link active px-0 border-bottom border-separator-light" data-bs-toggle="tab" href="#overviewTab" role="tab">
          <i data-acorn-icon="activity" class="me-2" data-acorn-size="17"></i>
          <span class="align-middle">Overview</span>
        </a>
		<a class="nav-link px-0 border-bottom border-separator-light" data-bs-toggle="tab" href="#financeTab" role="tab">
          <i data-acorn-icon="office" class="me-2" data-acorn-size="17"></i>
          <span class="align-middle">Credit &amp; Debit</span>
        </a>
        <a class="nav-link px-0 border-bottom border-separator-light" data-bs-toggle="tab" href="#projectsTab" role="tab">
          <i data-acorn-icon="office" class="me-2" data-acorn-size="17"></i>
          <span class="align-middle">BPI Membership</span>
        </a>
        <a class="nav-link px-0 border-bottom border-separator-light" data-bs-toggle="tab" href="#permissionsTab" role="tab">
          <i data-acorn-icon="lock-off" class="me-2" data-acorn-size="17"></i>
          <span class="align-middle">Activations &amp; Restrictions</span>
        </a>
        <a class="nav-link px-0 border-bottom border-separator-light" data-bs-toggle="tab" href="#friendsTab" role="tab">
          <i data-acorn-icon="heart" class="me-2" data-acorn-size="17"></i>
          <span class="align-middle">Invites</span>
        </a>
        <a class="nav-link px-0" data-bs-toggle="tab" href="#aboutTab" role="tab">
          <i data-acorn-icon="user" class="me-2" data-acorn-size="17"></i>
          <span class="align-middle">Account Info</span>
        </a>
      </div>
    </div>
  </div>
</div>
<div class="col-12 col-xl-8 col-xxl-9 mb-5 tab-content">
  <div class="tab-pane fade show active" id="overviewTab" role="tabpanel">
    <h2 class="small-title">Stats</h2>
    <div class="mb-5">
      <div class="row g-2 mb-3">
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="card hover-border-primary">
            <div class="card-body">
              <div class="heading mb-0 d-flex justify-content-between lh-1-25 mb-3">
                <span>CASH WALLET</span>
                <i data-acorn-icon="dollar" class="text-primary"></i>
              </div>
              <div class="text-small text-warning mb-1">ACTIVE</div>
              <div class="cta-1 text-primary">
				<?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?>
				<?php echo $this->generic_model->convert_currency($userdetails->default_currency,($userdetails->wallet));?>	
			 </div>
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="card hover-border-primary">
            <div class="card-body">
              <div class="heading mb-0 d-flex justify-content-between lh-1-25 mb-3">
                <span>SPENDABLE</span>
                <i data-acorn-icon="check-square" class="text-primary"></i>
              </div>
              <div class="text-warning mb-1">
			   <?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?>
			   <?php echo $this->generic_model->convert_currency($userdetails->default_currency,($all_levels_spendable));?>
			  </div>
              <div class="cta-1 text-primary"><?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?>
				<?php echo $this->generic_model->convert_currency($userdetails->default_currency,($userdetails->spendable));?>	</div>
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="card hover-border-primary">
            <div class="card-body">
              <div class="heading mb-0 d-flex justify-content-between lh-1-25 mb-3">
                <span>BPT BALANCE</span>
                <i data-acorn-icon="" class="text-primary">BPT</i>
              </div>
              <div class="text-small text-warning mb-1"><?php echo number_format(($all_levels_bpt/20),2); ?> BPT</div>
              <div class="cta-1 text-primary"><?php echo number_format($userdetails->token,0); ?> BPT</div>
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="card hover-border-primary">
            <div class="card-body">
              <div class="heading mb-0 d-flex justify-content-between lh-1-25 mb-3">
                <span>CASHBACK</span>
                <i data-acorn-icon="screen" class="text-primary"></i>
              </div>
			  <div class="text-warning mb-1">
			   <?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?>
			   <?php echo $this->generic_model->convert_currency($userdetails->default_currency,($all_levels_cashback));?>
			  </div>
              <div class="cta-1 text-primary">
			  	<?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($userdetails->default_currency,$userdetails->cashback);?>
			  </div>
            </div>
          </div>
        </div>
      </div>
	  <div class="row g-2 mb-3">
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="card hover-border-primary">
            <div class="card-body">
              <div class="heading mb-0 d-flex justify-content-between lh-1-25 mb-3">
                <span>PALLIATIVE</span>
                <i data-acorn-icon="dollar" class="text-primary"></i>
              </div>
			  <div class="text-warning mb-1">
			   <?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?>
			   <?php echo $this->generic_model->convert_currency($userdetails->default_currency,($all_levels_pall));?>
			  </div>
              <div class="cta-1 text-primary">
				<?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?>
				<?php echo $this->generic_model->convert_currency($userdetails->default_currency,($userdetails->palliative));?>	
			 </div>
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="card hover-border-primary">
            <div class="card-body">
              <div class="heading mb-0 d-flex justify-content-between lh-1-25 mb-3">
                <span>SHELTER</span>
                <i data-acorn-icon="shield-check" class="text-primary"></i>
              </div>
              <div class="text-small text-warning mb-1"><?php if($userdetails->shelter > 0){ echo ($all_gold_shelter + $all_platinum_shelter); } ?></div>
              <div class="cta-1 text-primary"><?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?>
				<?php echo $this->generic_model->convert_currency($userdetails->default_currency,($userdetails->shelter));?>	</div>
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="card hover-border-primary">
            <div class="card-body">
              <div class="heading mb-0 d-flex justify-content-between lh-1-25 mb-3">
                <span>BUSINESS</span>
                <i data-acorn-icon="office" class="text-primary"></i>
              </div>
              <div class="text-small text-warning mb-1"><?php if($userdetails->business > 0){ echo ($all_gold_shelter + $all_platinum_shelter); } ?></div>
              <div class="cta-1 text-primary">
				<?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?>
				<?php echo $this->generic_model->convert_currency($userdetails->default_currency,($userdetails->business));?>	
			  </div>
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="card hover-border-primary">
            <div class="card-body">
              <div class="heading mb-0 d-flex justify-content-between lh-1-25 mb-3">
                <span>LAND</span>
                <i data-acorn-icon="screen" class="text-primary"></i>
              </div>
              <div class="text-small text-warning mb-1"><?php if($userdetails->land > 0){ echo ($all_gold_shelter + $all_platinum_shelter); } ?></div>
              <div class="cta-1 text-primary">
			  	<?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($userdetails->default_currency,$userdetails->land);?>
			  </div>
            </div>
          </div>
        </div>
      </div>
	  <div class="row g-2">
	  	 <div class="col-12 col-sm-6 col-lg-3">
          <div class="card hover-border-primary">
            <div class="card-body">
              <div class="heading mb-0 d-flex justify-content-between lh-1-25 mb-3">
                <span>CAR</span>
                <i data-acorn-icon="office" class="text-primary"></i>
              </div>
              <div class="text-small text-warning mb-1"><?php if($userdetails->car > 0){ echo ($all_gold_shelter + $all_platinum_shelter); } ?></div>
              <div class="cta-1 text-primary">
				<?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?>
				<?php echo $this->generic_model->convert_currency($userdetails->default_currency,($userdetails->car));?>	
			  </div>
            </div>
          </div>
        </div>
         <div class="col-12 col-sm-6 col-lg-3">
          <div class="card hover-border-primary">
            <div class="card-body">
              <div class="heading mb-0 d-flex justify-content-between lh-1-25 mb-3">
                <span>Education</span>
                <i data-acorn-icon="screen" class="text-primary"></i>
              </div>
              <div class="text-small text-warning mb-1"><?php if($userdetails->education > 0){ echo ($all_gold_shelter + $all_platinum_shelter); } ?></div>
              <div class="cta-1 text-primary">
			  	<?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($userdetails->default_currency,$userdetails->education);?>
			  </div>
            </div>
          </div>
        </div>
		 <?php if($userdetails->is_vip == 1){ ?> 
	     <div class="col-12 col-sm-6 col-lg-2">
          <div class="card hover-border-primary">
            <div class="card-body">
				<?php if($userdetails->id == 67 ){ ?>
					<button type="button" class="btn btn-btn btn-success">Admin</button>
				 <?php }else{ ?> 
				<form action="<?php echo base_url('admin/fix_wallets'); ?>" method="post">
					<input type="hidden" name="user" value="<?php echo $userdetails->id; ?>">
				    <input type="hidden" name="cashback" value="<?php echo $all_levels_cashback; ?>">
					<input type="hidden" name="palliative" value="<?php echo $all_levels_pall ?>">
					<input type="hidden" name="bpt" value="<?php echo $all_levels_bpt ?>">
					<input type="hidden" name="spendable" value="<?php echo $all_levels_spendable ?>">
					<input type="hidden" name="shelter" value="<?php echo ($all_gold_shelter + $all_platinum_shelter)?>">
					<button type="submit" class="btn btn-btn btn-lg btn-warning">Repair</button>
				</form>  
				<?php } ?>
            </div>
          </div>
        </div>
		<?php } ?>
		 <div class="col-12 col-sm-6 col-lg-4">
          <div class="card hover-border-primary">
            <div class="card-body">
				<div class="row">
					<?php $next = ($userdetails->id + 1); ?>
					<?php $prev = ($userdetails->id - 1); ?>
					<div class="col-xl-6 col-12">
					 	<a href="<?php echo base_url('users_details/'.$prev); ?>" class="btn btn-btn btn-lg btn-danger">Previous</a>
					</div>
					<div class="col-xl-6 col-12">
						<a href="<?php echo base_url('users_details/'.$next); ?>" class="btn btn-btn btn-lg btn-primary">Next</a>
					</div>
				</div>
            </div>
          </div>
        </div>
	  </div>
    </div>
	<h2 class="small-title">Activation Analysis</h2>
	<div class="mb-5">
	  <div class="row g-2 mb-3">
		<div class="col-12 col-sm-6 col-lg-3">
			<a href="#" data-bs-toggle="modal" data-bs-target="#directModal">
		   <div class="card">
            <div class="card-body">
              <div class="heading mb-0 d-flex justify-content-between lh-1-25 mb-3">
              </div>
              <div class="mb-1">Total Direct Activation: <?php echo  $total_direct_activated; ?><br>
				  <div class="text-small text-muted">
				Regular: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_regular); ?><br>
				Regular Pro: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_regularPro); ?><br>
				 Regular Plus: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_regularPlus); ?><br>
				Gold: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_gold); ?><br>
			Platinum: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_platinum); ?><br><br>
				
					  <h4 class="text-primary">
					  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$grand_direct_total); ?>
					  </h4>
				  </div>
			  </div>
            </div>
          </div>	
			</a>
		</div> 
			<div class="modal modal-right large fade" id="directModal" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Direct Activation Breakdown</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						         <div class="card mb-2"> 
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
										  <h5 class="text-primary">Total Regular Activation: <?php echo $total_direct_regular; ?></h5>
										  <div class="">
				   							BPT Earned: <?php echo $regular_direct_commissions_bmt; ?> BPT<br>
			CashBack Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regular_direct_commissions_wallet); ?><br>
			Palliative Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regular_direct_commissions_palliative); ?><br>
			Spendable Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regular_direct_commissions_spendable); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_regular); ?>
						  </h4>																						
											</div>
										 <button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#regularList">View List</button>
										 <hr class="bg-warning">
										 	<h5 class="text-primary">Total RegularPro Activation: <?php echo $total_direct_regularPro; ?></h5>
										  <div class="">
				   							BPT Earned: <?php echo $regularPro_direct_commissions_bmt; ?> BPT<br>
                                			CashBack Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,$regularPro_direct_commissions_wallet); ?><br>
                                			Palliative Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
                                			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regularPro_direct_commissions_palliative); ?><br>
                                			Spendable Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
                                			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regularPro_direct_commissions_spendable); ?><br><br>
                                				<h4 class="text-primary">
                                					Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
                                					<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_regularPro); ?>
                                				</h4>
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#regularProList">View List</button>
										<hr class="bg-warning">
											<h5 class="text-primary">Total RegularPlus Activation: <?php echo $total_direct_regularPlus; ?></h5>
										  <div class="">
				   							BPT Earned: <?php echo $regularPlus_direct_commissions_bmt; ?> BPT<br>
			CashBack Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regularPlus_direct_commissions_wallet); ?><br>
			Palliative Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regularPlus_direct_commissions_palliative); ?><br>
			Spendable Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regularPlus_direct_commissions_spendable); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_regularPlus); ?>
						  </h4>
											
											
											
											
											
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#regularPlusList">View List</button>
										<hr class="bg-warning">
											<h5 class="text-primary">Total Gold Activation: <?php echo $total_direct_gold; ?></h5>
										  <div class="">
				   							BPT Earned: <?php echo $gold_direct_commissions_bmt; ?> BPT<br>
			CashBack Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$gold_commissions_wallet); ?><br>
			Palliative Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$gold_commissions_palliative); ?><br>
			Spendable Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$gold_commissions_spendable); ?><br>
		Gold Shelter Payout: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$gold_commissions_shelter); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_gold); ?>
						  </h4>
											
											
											
											
											
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#goldList">View List</button>
										<hr class="bg-warning">
											<h5 class="text-primary">Total Platinum Activation: <?php echo $total_direct_platinum; ?></h5>
										  <div class="">
				   							BPT Earned: <?php echo $platinum_direct_commissions_bmt; ?> BPT<br>
			CashBack Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$platinum_commissions_wallet); ?><br>
			Palliative Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$platinum_commissions_palliative); ?><br>
			Spendable Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$platinum_commissions_spendable); ?><br>
		Gold Shelter Payout: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$platinum_commissions_shelter); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_platinum); ?>
						  </h4>
											
											
											
											
											
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#platinumList">View List</button>
										</div>
									  </div>
									</div>
								</div>
						
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
		  
		  <div class="modal fade modal-close-out" id="regularList"  aria-labelledby="regularListLabelCloseOut" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="regularListLabelCloseOut">Direct Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $regular_list ) ) {
                    foreach ( $regular_list as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		
		 <div class="modal fade modal-close-out" id="regularProList"  aria-labelledby="regularListProLabelCloseOut" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="regularProListLabelCloseOut">Direct Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $regularPro_list ) ) {
                    foreach ( $regularPro_list as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  <div class="modal fade modal-close-out" id="regularPlusList"  aria-labelledby="regularListPlusLabelCloseOut" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="regularPlusListLabelCloseOut">Direct Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $regularPlus_list ) ) {
                    foreach ( $regularPlus_list as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  <div class="modal fade modal-close-out" id="goldList"  aria-labelledby="goldListLabelCloseOut" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="goldListLabelCloseOut">Direct Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $gold_list ) ) {
                    foreach ( $gold_list as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  <div class="modal fade modal-close-out" id="platinumList"  aria-labelledby="platinumListLabelCloseOut" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="platinumListLabelCloseOut">Direct Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $platinum_list ) ) {
                    foreach ( $platinum_list as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  
		<div class="col-12 col-sm-6 col-lg-3">
		<a href="#" data-bs-toggle="modal" data-bs-target="#level_2_Modal">
		   <div class="card">
            <div class="card-body">
              <div class="heading mb-0 d-flex justify-content-between lh-1-25 mb-3">
              </div>
              <div class="mb-1">Total Level 2: <?php echo  $total_level2; ?>
				  <div class="text-small text-muted">
				  
				  
				 Regular: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_regular_2); ?><br>
				 Regular Pro: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_regularPro_2); ?><br>
				 Regular Plus: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_regularPlus_2); ?><br>
				Gold: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_gold_2); ?><br>
			Platinum: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_platinum_2); ?><br><br>
				
					  <h4 class="text-primary">
					  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$grand_direct_total_2); ?>
					  </h4>
				  
				  </div>
				</div>
            </div>
          </div>	
			</a>
		</div> 
		<div class="modal modal-right large fade" id="level_2_Modal" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Level 2 Activation Breakdown</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						         <div class="card mb-2"> 
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
										  <h5 class="text-primary">Total Regular Activation: <?php echo $total_regular_level2; ?></h5>
										  <div class="">
				   							BPT Earned: <?php echo $regular_direct_commissions_bmt_2; ?> BPT<br>
			CashBack Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regular_direct_commissions_wallet_2); ?><br>
			Palliative Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regular_direct_commissions_palliative_2); ?><br>
			Spendable Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regular_direct_commissions_spendable_2); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_regular_2); ?>
						  </h4>																						
											</div>
										 <button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#regularList_2">View List</button>
										 <hr class="bg-warning">
										 	<h5 class="text-primary">Total RegularPro Activation: <?php echo $total_regularPro_level2; ?></h5>
										  <div class="">
				   							BPT Earned: <?php echo $regularPro_direct_commissions_bmt_2; ?> BPT<br>
			CashBack Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regularPro_direct_commissions_wallet_2); ?><br>
			Palliative Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regularPro_direct_commissions_palliative_2); ?><br>
			Spendable Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regularPro_direct_commissions_spendable_2); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_regularPro_2); ?>
						  </h4>
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#regularProList_2">View List</button>
										<hr class="bg-warning">
											<h5 class="text-primary">Total RegularPlus Activation: <?php echo $total_regularPlus_level2; ?></h5>
										  <div class="">
				   							BPT Earned: <?php echo $regularPlus_direct_commissions_bmt_2; ?> BPT<br>
			CashBack Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regularPlus_direct_commissions_wallet_2); ?><br>
			Palliative Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regularPlus_direct_commissions_palliative_2); ?><br>
			Spendable Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regularPlus_direct_commissions_spendable_2); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_regularPlus_2); ?>
						  </h4>
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#regularPlusList_2">View List</button>
										<hr class="bg-warning">
											<h5 class="text-primary">Total Gold Activation: <?php echo $total_gold_level2; ?></h5>
										  <div class="">
				   							BPT Earned: <?php echo $gold_direct_commissions_bmt_2; ?> BPT<br>
			CashBack Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$gold_commissions_wallet_2); ?><br>
			Palliative Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$gold_commissions_palliative_2); ?><br>
			Spendable Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$gold_commissions_spendable_2); ?><br>
		Gold Shelter Payout: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$gold_commissions_shelter_2); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_gold_2); ?>
						  </h4>
											
											
											
											
											
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#goldList_2">View List</button>
										<hr class="bg-warning">
											<h5 class="text-primary">Total Platinum Activation: <?php echo $total_platinum_level2; ?></h5>
										  <div class="">
				   							BPT Earned: <?php echo $platinum_direct_commissions_bmt_2; ?> BPT<br>
			CashBack Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$platinum_commissions_wallet_2); ?><br>
			Palliative Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$platinum_commissions_palliative_2); ?><br>
			Spendable Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$platinum_commissions_spendable_2); ?><br>
		Gold Shelter Payout: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$platinum_commissions_shelter_2); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_platinum_2); ?>
						  </h4>
											
											
											
											
											
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#platinumList_2">View List</button>
										</div>
									  </div>
									</div>
								</div>
						
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
		  
		  <div class="modal fade modal-close-out" id="regularList_2"  aria-labelledby="regularListLabelCloseOut_2" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="regularListLabelCloseOut_2">Level 2 Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $regular_list_2 ) ) {
                    foreach ( $regular_list_2 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		
		<div class="modal fade modal-close-out" id="regularProList_2"  aria-labelledby="regularListProLabelCloseOut_2" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="regularProListLabelCloseOut_2">Level 2 Regular Pro Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $regularPro_list_2 ) ) {
                    foreach ( $regularPro_list_2 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  <div class="modal fade modal-close-out" id="regularPlusList_2"  aria-labelledby="regularListPlusLabelCloseOut_2" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="regularPlusListLabelCloseOut_2">Level 2 Regular Plus Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $regularPlus_list_2 ) ) {
                    foreach ( $regularPlus_list_2 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  <div class="modal fade modal-close-out" id="goldList_2"  aria-labelledby="goldListLabelCloseOut_2" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="goldListLabelCloseOut_2">Level 2 Gold Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $gold_list_2 ) ) {
                    foreach ( $gold_list_2 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  <div class="modal fade modal-close-out" id="platinumList_2"  aria-labelledby="platinumListLabelCloseOut_2" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="platinumListLabelCloseOut_2">Level 2 Platinum Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $platinum_list_2 ) ) {
                    foreach ( $platinum_list_2 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		<div class="col-12 col-sm-6 col-lg-3">
			<a href="#" data-bs-toggle="modal" data-bs-target="#level_3_Modal">
		   <div class="card">
            <div class="card-body">
              <div class="heading mb-0 d-flex justify-content-between lh-1-25 mb-3">
              </div>
              <div class="mb-1">Total Level 3: <?php echo  $total_level3; ?>
				  <div class="text-small text-muted">
				 Regular: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_regular_3); ?><br>
				  Regular Pro: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_regularPro_3); ?><br>
				 Regular Plus: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_regularPlus_3); ?><br>
				Gold: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_gold_3); ?><br>
			Platinum: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_platinum_3); ?><br><br>
				
					  <h4 class="text-primary">
					  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$grand_direct_total_3); ?>
					  </h4>
				  
				  </div>
				</div>
            </div>
          </div>	
			</a>
		</div> 
		<div class="modal modal-right large fade" id="level_3_Modal" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Level 3 Activation Breakdown</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						         <div class="card mb-2"> 
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
										  <h5 class="text-primary">Total Regular Activation: <?php echo $total_regular_level3; ?></h5>
										  <div class="">
				   							BPT Earned: <?php echo $regular_direct_commissions_bmt_3; ?> BPT<br>
			CashBack Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regular_direct_commissions_wallet_3); ?><br>
			Palliative Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regular_direct_commissions_palliative_3); ?><br>
			Spendable Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regular_direct_commissions_spendable_3); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_regular_3); ?>
						  </h4>																						
											</div>
											<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#regularList_3">View List</button>
										 <hr class="bg-warning">
										 	<h5 class="text-primary">Total RegularPro Activation: <?php echo $total_regularPro_level3; ?></h5>
										  <div class="">
				   							BPT Earned: <?php echo $regularPro_direct_commissions_bmt_3; ?> BPT<br>
			CashBack Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regularPro_direct_commissions_wallet_3); ?><br>
			Palliative Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regularPro_direct_commissions_palliative_3); ?><br>
			Spendable Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regularPro_direct_commissions_spendable_3); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_regularPlus_3); ?>
						  </h4>
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#regularProList_3">View List</button>
										<hr class="bg-warning">
											<h5 class="text-primary">Total RegularPlus Activation: <?php echo $total_regularPlus_level3; ?></h5>
										  <div class="">
				   							BPT Earned: <?php echo $regularPlus_direct_commissions_bmt_3; ?> BPT<br>
			CashBack Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regularPlus_direct_commissions_wallet_3); ?><br>
			Palliative Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regularPlus_direct_commissions_palliative_3); ?><br>
			Spendable Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regularPlus_direct_commissions_spendable_3); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_regularPlus_3); ?>
						  </h4>
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#regularPlusList_3">View List</button>
										<hr class="bg-warning">
											<h5 class="text-primary">Total Gold Activation: <?php echo $total_gold_level3; ?></h5>
										  <div class="">
				   							BPT Earned: <?php echo $gold_direct_commissions_bmt_3; ?> BPT<br>
			CashBack Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$gold_commissions_wallet_3); ?><br>
			Palliative Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$gold_commissions_palliative_3); ?><br>
			Spendable Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$gold_commissions_spendable_3); ?><br>
		Gold Shelter Payout: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$gold_commissions_shelter_3); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_gold_3); ?>
						  </h4>
											
											
											
											
											
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#goldList_3">View List</button>
										<hr class="bg-warning">
											<h5 class="text-primary">Total Platinum Activation: <?php echo $total_platinum_level3; ?></h5>
										  <div class="">
				   							BPT Earned: <?php echo $platinum_direct_commissions_bmt_3; ?> BPT<br>
			CashBack Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$platinum_commissions_wallet_3); ?><br>
			Palliative Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$platinum_commissions_palliative_3); ?><br>
			Spendable Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$platinum_commissions_spendable_3); ?><br>
		Gold Shelter Payout: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$platinum_commissions_shelter_3); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_platinum_3); ?>
						  </h4>
								</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#platinumList_3">View List</button>
										</div>
									  </div>
									</div>
								</div>
						
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
		  
		   <div class="modal fade modal-close-out" id="regularList_3"  aria-labelledby="regularListLabelCloseOut_3" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="regularListLabelCloseOut_3">Level 3 Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $regular_list_3 ) ) {
                    foreach ( $regular_list_3 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		
		  <div class="modal fade modal-close-out" id="regularProList_3"  aria-labelledby="regularListProLabelCloseOut_3" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="regularPlusListLabelCloseOut_3">Level 3 Regular Pro Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $regularPro_list_3 ) ) {
                    foreach ( $regularPro_list_3 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  <div class="modal fade modal-close-out" id="regularPlusList_3"  aria-labelledby="regularListPlusLabelCloseOut_3" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="regularPlusListLabelCloseOut_3">Level 2 Regular Plus Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $regularPlus_list_3 ) ) {
                    foreach ( $regularPlus_list_3 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  <div class="modal fade modal-close-out" id="goldList_3"  aria-labelledby="goldListLabelCloseOut_3" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="goldListLabelCloseOut_3">Level 3 Gold Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $gold_list_3 ) ) {
                    foreach ( $gold_list_3 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  <div class="modal fade modal-close-out" id="platinumList_3"  aria-labelledby="platinumListLabelCloseOut_3" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="platinumListLabelCloseOut_3">Level 3 Platinum Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $platinum_list_3 ) ) {
                    foreach ( $platinum_list_3 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		<div class="col-12 col-sm-6 col-lg-3">
			<a href="#" data-bs-toggle="modal" data-bs-target="#level_4_Modal">
		   <div class="card">
            <div class="card-body">
              <div class="heading mb-0 d-flex justify-content-between lh-1-25 mb-3">
              </div>
              <div class="mb-1">Total Level 4: <?php echo  $total_level4; ?>
				  <div class="text-small text-muted">				  
				 Regular: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_regular_4); ?><br>
				 Regular Pro: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_regularPro_4); ?><br>
				 Regular Plus: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_regularPlus_4); ?><br>
				Gold: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_gold_4); ?><br>
			Platinum: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_platinum_4); ?><br><br>
				
					  <h4 class="text-primary">
					  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$grand_direct_total_4); ?>
					  </h4>
				  
				  </div>
				</div>
            </div>
          </div>	
			</a>
		</div> 
		<div class="modal modal-right large fade" id="level_4_Modal" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Level 4 Activation Breakdown</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						         <div class="card mb-2"> 
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
										  <h5 class="text-primary">Total Regular Activation: <?php echo $total_regular_level4; ?></h5>
										  <div class="">
				   							BPT Earned: <?php echo $regular_direct_commissions_bmt_4; ?> BPT<br>
			CashBack Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regular_direct_commissions_wallet_4); ?><br>
			Palliative Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regular_direct_commissions_palliative_4); ?><br>
			Spendable Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regular_direct_commissions_spendable_4); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_regular_4); ?>
						  </h4>																						
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#regularList_4">View List</button>
										 <hr class="bg-warning">
										 	<h5 class="text-primary">Total RegularPro Activation: <?php echo $total_regularPro_level4; ?></h5>
										  <div class="">
				   							BPT Earned: <?php echo $regularPro_direct_commissions_bmt_4; ?> BPT<br>
                    			CashBack Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
                    			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regularPro_direct_commissions_wallet_4); ?><br>
                    			Palliative Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
                    			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regularPro_direct_commissions_palliative_4); ?><br>
                    			Spendable Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
                    			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regularPro_direct_commissions_spendable_4); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_regularPro_4); ?>
						  </h4>
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#regularProList_4">View List</button>
										<hr class="bg-warning">
											<h5 class="text-primary">Total RegularPlus Activation: <?php echo $total_regularPlus_level4; ?></h5>
										  <div class="">
				   							BPT Earned: <?php echo $regularPlus_direct_commissions_bmt_4; ?> BPT<br>
			CashBack Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regularPlus_direct_commissions_wallet_4); ?><br>
			Palliative Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regularPlus_direct_commissions_palliative_4); ?><br>
			Spendable Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$regularPlus_direct_commissions_spendable_4); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_regularPlus_4); ?>
						  </h4>
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#regularPlusList_4">View List</button>
										<hr class="bg-warning">
											<h5 class="text-primary">Total Gold Activation: <?php echo $total_gold_level4; ?></h5>
										  <div class="">
				   							BPT Earned: <?php echo $gold_direct_commissions_bmt_4; ?> BPT<br>
			CashBack Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$gold_commissions_wallet_4); ?><br>
			Palliative Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$gold_commissions_palliative_4); ?><br>
			Spendable Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$gold_commissions_spendable_4); ?><br>
		Gold Shelter Payout: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$gold_commissions_shelter_4); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_gold_4); ?>
						  </h4>
											
											
											
											
											
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#goldList_4">View List</button>
										<hr class="bg-warning">
											<h5 class="text-primary">Total Platinum Activation: <?php echo $total_platinum_level4; ?></h5>
										  <div class="">
				   							BPT Earned: <?php echo $platinum_direct_commissions_bmt_4; ?> BPT<br>
			CashBack Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$platinum_commissions_wallet_4); ?><br>
			Palliative Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$platinum_commissions_palliative_4); ?><br>
			Spendable Earned: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$platinum_commissions_spendable_4); ?><br>
		Gold Shelter Payout: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$platinum_commissions_shelter_4); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_platinum_4); ?>
						  </h4>
											
											
											
											
											
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#platinumList_4">View List</button>
										</div>
									  </div>
									</div>
								</div>
						
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
		  
		   <div class="modal fade modal-close-out" id="regularList_4"  aria-labelledby="regularListLabelCloseOut_4" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="regularListLabelCloseOut_4">Level 4 Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $regular_list_4 ) ) {
                    foreach ( $regular_list_4 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  <div class="modal fade modal-close-out" id="regularPlusList_4"  aria-labelledby="regularListPlusLabelCloseOut_4" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="regularPlusListLabelCloseOut_4">Level 4 Regular Plus Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $regularPlus_list_4 ) ) {
                    foreach ( $regularPlus_list_4 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		
		 <div class="modal fade modal-close-out" id="regularProList_4"  aria-labelledby="regularListProLabelCloseOut_4" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="regularPlusListLabelCloseOut_4">Level 4 Regular Pro Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $regularPro_list_4 ) ) {
                    foreach ( $regularPro_list_4 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  <div class="modal fade modal-close-out" id="goldList_4"  aria-labelledby="goldListLabelCloseOut_4" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="goldListLabelCloseOut_4">Level 4 Gold Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $gold_list_4 ) ) {
                    foreach ( $gold_list_4 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  <div class="modal fade modal-close-out" id="platinumList_4"  aria-labelledby="platinumListLabelCloseOut_4" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="platinumListLabelCloseOut_4">Level 4 Platinum Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $platinum_list_4 ) ) {
                    foreach ( $platinum_list_4 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  
		  <div class="col-12 col-sm-6 col-lg-3">
			<a href="#" data-bs-toggle="modal" data-bs-target="#level_5_Modal">
		   <div class="card">
            <div class="card-body">
              <div class="heading mb-0 d-flex justify-content-between lh-1-25 mb-3">
              </div>
              <div class="mb-1">Total Level 5: <?php echo  $total_level5; ?>
				  <div class="text-small text-muted">
				 
				Gold: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>  
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_gold_5); ?><br>
			Platinum: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_platinum_5); ?><br><br>
				
					  <h4 class="text-primary">
					  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$grand_direct_total_5); ?>
					  </h4>
				  
				  </div>
				</div>
            </div>
          </div>	
			</a>
		</div> 
		<div class="modal modal-right large fade" id="level_5_Modal" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Level 5 Activation Breakdown</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						         <div class="card mb-2"> 
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
											<h5 class="text-primary">Total Gold Activation: <?php echo $total_gold_level5; ?></h5>
										  <div class="">
		Gold Shelter Payout: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$gold_commissions_shelter_5); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_gold_5); ?>
						  </h4>
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#goldList_5">View List</button>
										<hr class="bg-warning">
											<h5 class="text-primary">Total Platinum Activation: <?php echo $total_platinum_level5; ?></h5>
										  <div class="">
		Gold Shelter Payout: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$platinum_commissions_shelter_5); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_platinum_5); ?>
						  </h4>
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#platinumList_5">View List</button>
										</div>
									  </div>
									</div>
								</div>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
		   
		  <div class="modal fade modal-close-out" id="goldList_5"  aria-labelledby="goldListLabelCloseOut_5" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="goldListLabelCloseOut_4">Level 5 Gold Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $gold_list_5 ) ) {
                    foreach ( $gold_list_5 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  <div class="modal fade modal-close-out" id="platinumList_5"  aria-labelledby="platinumListLabelCloseOut_5" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="platinumListLabelCloseOut_5">Level 5 Platinum Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $platinum_list_5 ) ) {
                    foreach ( $platinum_list_5 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  
		  <div class="col-12 col-sm-6 col-lg-3">
			<a href="#" data-bs-toggle="modal" data-bs-target="#level_6_Modal">
		   <div class="card">
            <div class="card-body">
              <div class="heading mb-0 d-flex justify-content-between lh-1-25 mb-3">
              </div>
              <div class="mb-1">Total Level 6: <?php echo  $total_level6; ?>
				  <div class="text-small text-muted">
				Gold: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_gold_6); ?><br>
			Platinum: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_platinum_6); ?><br><br>
				
					  <h4 class="text-primary">
					  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$grand_direct_total_6); ?>
					  </h4>
				  
				  </div>
				</div>
            </div>
          </div>	
			</a>
		</div> 
		<div class="modal modal-right large fade" id="level_6_Modal" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Level 6 Activation Breakdown</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						         <div class="card mb-2"> 
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
											<h5 class="text-primary">Total Gold Activation: <?php echo $total_gold_level6; ?></h5>
										  <div class="">
		Gold Shelter Payout: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$gold_commissions_shelter_6); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_gold_6); ?>
						  </h4>
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#goldList_6">View List</button>
										<hr class="bg-warning">
											<h5 class="text-primary">Total Platinum Activation: <?php echo $total_platinum_level6; ?></h5>
										  <div class="">
		Gold Shelter Payout: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$platinum_commissions_shelter_6); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_platinum_6); ?>
						  </h4>
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#platinumList_6">View List</button>
										</div>
									  </div>
									</div>
								</div>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
		   
		  <div class="modal fade modal-close-out" id="goldList_6"  aria-labelledby="goldListLabelCloseOut_6" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="goldListLabelCloseOut_6">Level 6 Gold Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $gold_list_6 ) ) {
                    foreach ( $gold_list_6 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  <div class="modal fade modal-close-out" id="platinumList_6"  aria-labelledby="platinumListLabelCloseOut_6" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="platinumListLabelCloseOut_6">Level 6 Platinum Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $platinum_list_6 ) ) {
                    foreach ( $platinum_list_6 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  
		  
		   <div class="col-12 col-sm-6 col-lg-3">
			<a href="#" data-bs-toggle="modal" data-bs-target="#level_7_Modal">
		   <div class="card">
            <div class="card-body">
              <div class="heading mb-0 d-flex justify-content-between lh-1-25 mb-3">
              </div>
              <div class="mb-1">Total Level 7: <?php echo  $total_level7; ?>
				  <div class="text-small text-muted">
				 
				Gold: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_gold_7); ?><br>
			Platinum: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_platinum_7); ?><br><br>
				
					  <h4 class="text-primary">
					  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$grand_direct_total_7); ?>
					  </h4>
				  
				  </div>
				</div>
            </div>
          </div>	
			</a>
		</div> 
		<div class="modal modal-right large fade" id="level_7_Modal" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Level 7 Activation Breakdown</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						         <div class="card mb-2"> 
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
											<h5 class="text-primary">Total Gold Activation: <?php echo $total_gold_level7; ?></h5>
										  <div class="">
		Gold Shelter Payout: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$gold_commissions_shelter_7); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_gold_7); ?>
						  </h4>
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#goldList_6">View List</button>
										<hr class="bg-warning">
											<h5 class="text-primary">Total Platinum Activation: <?php echo $total_platinum_level7; ?></h5>
										  <div class="">
		Gold Shelter Payout: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$platinum_commissions_shelter_7); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_platinum_7); ?>
						  </h4>
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#platinumList_7">View List</button>
										</div>
									  </div>
									</div>
								</div>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
		   
		  <div class="modal fade modal-close-out" id="goldList_7"  aria-labelledby="goldListLabelCloseOut_7" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="goldListLabelCloseOut_7">Level 7 Gold Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $gold_list_7 ) ) {
                    foreach ( $gold_list_7 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  <div class="modal fade modal-close-out" id="platinumList_7"  aria-labelledby="platinumListLabelCloseOut_7" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="platinumListLabelCloseOut_6">Level 7 Platinum Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $platinum_list_7 ) ) {
                    foreach ( $platinum_list_7 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  
		   <div class="col-12 col-sm-6 col-lg-3">
			<a href="#" data-bs-toggle="modal" data-bs-target="#level_8_Modal">
		   <div class="card">
            <div class="card-body">
              <div class="heading mb-0 d-flex justify-content-between lh-1-25 mb-3">
              </div>
              <div class="mb-1">Total Level 8: <?php echo  $total_level8; ?>
				  <div class="text-small text-muted">
				 
				Gold: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_gold_8); ?><br>
			Platinum: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_platinum_8); ?><br><br>
				
					  <h4 class="text-primary">
					  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$grand_direct_total_8); ?>
					  </h4>
				  
				  </div>
				</div>
            </div>
          </div>	
			</a>
		</div> 
		<div class="modal modal-right large fade" id="level_8_Modal" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Level 8 Activation Breakdown</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						         <div class="card mb-2"> 
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
											<h5 class="text-primary">Total Gold Activation: <?php echo $total_gold_level8; ?></h5>
										  <div class="">
		Gold Shelter Payout: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$gold_commissions_shelter_8); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_gold_8); ?>
						  </h4>
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#goldList_6">View List</button>
										<hr class="bg-warning">
											<h5 class="text-primary">Total Platinum Activation: <?php echo $total_platinum_level8; ?></h5>
										  <div class="">
		Gold Shelter Payout: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$platinum_commissions_shelter_8); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_platinum_8); ?>
						  </h4>
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#platinumList_8">View List</button>
										</div>
									  </div>
									</div>
								</div>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
		   
		  <div class="modal fade modal-close-out" id="goldList_8"  aria-labelledby="goldListLabelCloseOut_8" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="goldListLabelCloseOut_8">Level 8 Gold Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $gold_list_8 ) ) {
                    foreach ( $gold_list_8 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  <div class="modal fade modal-close-out" id="platinumList_8"  aria-labelledby="platinumListLabelCloseOut_8" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="platinumListLabelCloseOut_8">Level 8 Platinum Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $platinum_list_8 ) ) {
                    foreach ( $platinum_list_8 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  
		   <div class="col-12 col-sm-6 col-lg-3">
			<a href="#" data-bs-toggle="modal" data-bs-target="#level_9_Modal">
		   <div class="card">
            <div class="card-body">
              <div class="heading mb-0 d-flex justify-content-between lh-1-25 mb-3">
              </div>
              <div class="mb-1">Total Level 9: <?php echo  $total_level9; ?>
				  <div class="text-small text-muted">
				
				Gold: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_gold_9); ?><br>
			Platinum: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_platinum_9); ?><br><br>
				
					  <h4 class="text-primary">
					  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$grand_direct_total_9); ?>
					  </h4>
				  
				  </div>
				</div>
            </div>
          </div>	
			</a>
		</div> 
		<div class="modal modal-right large fade" id="level_9_Modal" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Level 9 Activation Breakdown</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						         <div class="card mb-2"> 
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
											<h5 class="text-primary">Total Gold Activation: <?php echo $total_gold_level9; ?></h5>
										  <div class="">
		Gold Shelter Payout: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$gold_commissions_shelter_9); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_gold_9); ?>
						  </h4>
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#goldList_9">View List</button>
										<hr class="bg-warning">
											<h5 class="text-primary">Total Platinum Activation: <?php echo $total_platinum_level9; ?></h5>
										  <div class="">
		Gold Shelter Payout: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$platinum_commissions_shelter_9); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_platinum_9); ?>
						  </h4>
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#platinumList_9">View List</button>
										</div>
									  </div>
									</div>
								</div>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
		   
		  <div class="modal fade modal-close-out" id="goldList_9"  aria-labelledby="goldListLabelCloseOut_9" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="goldListLabelCloseOut_9">Level 9 Gold Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $gold_list_9 ) ) {
                    foreach ( $gold_list_9 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  <div class="modal fade modal-close-out" id="platinumList_9"  aria-labelledby="platinumListLabelCloseOut_9" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="platinumListLabelCloseOut_9">Level 9 Platinum Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $platinum_list_9 ) ) {
                    foreach ( $platinum_list_9 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  
		   <div class="col-12 col-sm-6 col-lg-3">
			<a href="#" data-bs-toggle="modal" data-bs-target="#level_10_Modal">
		   <div class="card">
            <div class="card-body">
              <div class="heading mb-0 d-flex justify-content-between lh-1-25 mb-3">
              </div>
              <div class="mb-1">Total Level 10: <?php echo  $total_level10; ?>
				  <div class="text-small text-muted">
				
				Gold: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_gold_10); ?><br>
			Platinum: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_platinum_10); ?><br><br>
				
					  <h4 class="text-primary">
					  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					  <?php echo $this->generic_model->convert_currency($user_details->default_currency,$grand_direct_total_10); ?>
					  </h4>
				  
				  </div>
				</div>
            </div>
          </div>	
			</a>
		</div> 
		<div class="modal modal-right large fade" id="level_10_Modal" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Level 10 Activation Breakdown</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						         <div class="card mb-2"> 
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
											<h5 class="text-primary">Total Gold Activation: <?php echo $total_gold_level10; ?></h5>
										  <div class="">
		Gold Shelter Payout: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$gold_commissions_shelter_10); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_gold_10); ?>
						  </h4>
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#goldList_10">View List</button>
										<hr class="bg-warning">
											<h5 class="text-primary">Total Platinum Activation: <?php echo $total_platinum_level10; ?></h5>
										  <div class="">
		Gold Shelter Payout: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
			<?php echo $this->generic_model->convert_currency($user_details->default_currency,$platinum_commissions_shelter_10); ?><br><br>
				    	  <h4 class="text-primary">
							  Total: <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
							<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_platinum_10); ?>
						  </h4>
											</div>
										<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#platinumList_10">View List</button>
										</div>
									  </div>
									</div>
								</div>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
		   
		  <div class="modal fade modal-close-out" id="goldList_10"  aria-labelledby="goldListLabelCloseOut_10" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="goldListLabelCloseOut_10">Level 10 Gold Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $gold_list_10 ) ) {
                    foreach ( $gold_list_10 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
		  <div class="modal fade modal-close-out" id="platinumList_10"  aria-labelledby="platinumListLabelCloseOut_10" style="display: none;" aria-hidden="true">
		  <div class="modal-dialog">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title" id="platinumListLabelCloseOut_10">Level 10 Platinum Activation List</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			  </div>
			  <div class="modal-body">
				 <div class="scroll">
                  <?php
                  if ( !empty( $platinum_list_10 ) ) {
                    foreach ( $platinum_list_10 as $row ) {
                      $fname = $row['firstname'];
                      $lname = $row['lastname'];
                      $image = $row['profile_pic'];
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $row['created_at'];
                      ?>
                  <div class="card mb-2"> 
					 <a href="<?php echo base_url('users_details/'.$row['id']);?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url($imager);?>" alt="<?php echo $fname.' '.$lname; ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $fname.' '.$lname; ?></div>
                            <div class="text-small text-muted">Joined: <?php echo $dateJoined; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>View Profile</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> No Available data </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
              </div>
			  </div>
			  <div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			  </div>
			</div>
		  </div>
		</div>
		  
	  </div>
	</div>
	  
	  
    <h2 class="small-title">Activity</h2>
    <div class="card sh-35 mb-5">
      <div class="card-body">
       <div class="scroll h-100">
                       <?php 
                            foreach($logs as $log){ ?>
                                <div class="row g-0 mb-2">
                                  <div class="col-auto">
                                    <div class="sw-3 d-inline-block d-flex justify-content-start align-items-center h-100">
                                      <div class="sh-3">
                                        <i data-acorn-icon="shield" class="text-success"></i>
                                      </div>
                                    </div>
                                  </div>
                                  <div class="col">
                                    <div class="card-body d-flex flex-column pt-0 pb-0 ps-3 pe-0 h-100 justify-content-center">
                                      <div class="d-flex flex-column">
                                        <div class="mt-n1 lh-1-25">Login via <?php echo $log->device; ?></div>
                                      </div>
                                    </div>
                                  </div>
								   <div class="col">
                                    <div class="card-body d-flex flex-column pt-0 pb-0 ps-3 pe-0 h-100 justify-content-center">
                                      <div class="d-flex flex-column">
                                        <div class="mt-n1 lh-1-25">Login From IP: <?php echo $log->location; ?></div>
                                      </div>
                                    </div>
                                  </div>	
                                  <div class="col-auto">
                                    <div class="d-inline-block d-flex justify-content-end h-100">
                                      <div class="text-muted mt-n1 lh-1-25"><?php echo $log->login_time; ?></div>
                                    </div>
                                  </div>
                                </div>
                       <?php } ?>
                      </div>
      </div>
    </div>
    <h2 class="small-title">Timeline</h2>
    <div class="card mb-5">
      <div class="card-body">
        <div class="row g-0">
          <div class="col-auto sw-1 d-flex flex-column justify-content-center align-items-center position-relative me-4">
            <div class="w-100 d-flex sh-1"></div>
            <div class="rounded-xl shadow d-flex flex-shrink-0 justify-content-center align-items-center">
              <div class="bg-gradient-light sw-1 sh-1 rounded-xl position-relative"></div>
            </div>
            <div class="w-100 d-flex h-100 justify-content-center position-relative">
              <div class="line-w-1 bg-separator h-100 position-absolute"></div>
            </div>
          </div>
          <div class="col mb-4">
            <div class="h-100">
              <div class="d-flex flex-column justify-content-start">
                <div class="d-flex flex-column">
				<?php $sponsor = $this->generic_model->getInfo('users','id',$sponsor_data->referred_by); ?>
                  <span class="heading stretched-link">Registration</span>
                  <div class="text-alternate"><?php echo $userdetails->created_at; ?></div>
                  <div class="text-muted mt-1">
					  Joined BPI Community, invited by 
					  <a href="<?php echo base_url('user_details/'.$sponsor->id); ?>" target="_blank">
						  <?php echo $sponsor->firstname.' '.$sponsor->lastname; ?>
					  </a>
				</div>
                </div>
              </div>
            </div>
          </div>
        </div>
		<?php $active_shelter = $this->generic_model->getInfo('active_shelters','user_id',$userdetails->id); ?>
		<?php 
		if(!empty($active_shelter)){ ?>
       	 <div class="row g-0">
          <div class="col-auto sw-1 d-flex flex-column justify-content-center align-items-center position-relative me-4">
            <div class="w-100 d-flex sh-1 position-relative justify-content-center">
              <div class="line-w-1 bg-separator h-100 position-absolute"></div>
            </div>
            <div class="rounded-xl shadow d-flex flex-shrink-0 justify-content-center align-items-center">
              <div class="bg-gradient-light sw-1 sh-1 rounded-xl position-relative"></div>
            </div>
            <div class="w-100 d-flex h-100 justify-content-center position-relative">
              <div class="line-w-1 bg-separator h-100 position-absolute"></div>
            </div>
          </div>
          <div class="col mb-4">
            <div class="h-100">
              <div class="d-flex flex-column justify-content-start">
                <div class="d-flex flex-column">
                  <a href="#" class="heading stretched-link pt-0">Activated BPI Package</a>
                  <div class="text-alternate"><?php echo $active_shelter->activated_date; ?></div>
                  <div class="text-muted mt-1"> 
					Activated BPI package of <?php echo $active_shelter->amount; ?>
				  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
		<?php }
		  if($userdetails->kyc == 1){
			  $kyc = $this->generic_model->getInfo('kyc_data','user_id',$userdetails->id);
		  ?>
        <div class="row g-0">
          <div class="col-auto sw-1 d-flex flex-column justify-content-center align-items-center position-relative me-4">
            <div class="w-100 d-flex sh-1 position-relative justify-content-center">
              <div class="line-w-1 bg-separator h-100 position-absolute"></div>
            </div>
            <div class="rounded-xl shadow d-flex flex-shrink-0 justify-content-center align-items-center">
              <div class="bg-gradient-light sw-1 sh-1 rounded-xl position-relative"></div>
            </div>
            <div class="w-100 d-flex h-100 justify-content-center position-relative">
              <div class="line-w-1 bg-separator h-100 position-absolute"></div>
            </div>
          </div>
          <div class="col mb-4">
            <div class="h-100">
              <div class="d-flex flex-column justify-content-start">
                <div class="d-flex flex-column">
                  <a href="#" class="heading stretched-link">Uploaded KYC</a>
                  <div class="text-alternate"><?php echo $kyc->date_uploaded; ?></div>
                  <div class="text-muted mt-1">KyC Uploaded and Approved!</div>
                </div>
              </div>
            </div>
          </div>
        </div>
		<?php }elseif($userdetails->kyc == 0 && $userdetails->kyc_pending == 1){ ?>
		  <div class="row g-0">
          <div class="col-auto sw-1 d-flex flex-column justify-content-center align-items-center position-relative me-4">
            <div class="w-100 d-flex sh-1 position-relative justify-content-center">
              <div class="line-w-1 bg-separator h-100 position-absolute"></div>
            </div>
            <div class="rounded-xl shadow d-flex flex-shrink-0 justify-content-center align-items-center">
              <div class="bg-gradient-light sw-1 sh-1 rounded-xl position-relative"></div>
            </div>
            <div class="w-100 d-flex h-100 justify-content-center position-relative">
              <div class="line-w-1 bg-separator h-100 position-absolute"></div>
            </div>
          </div>
          <div class="col mb-4">
            <div class="h-100">
              <div class="d-flex flex-column justify-content-start">
                <div class="d-flex flex-column">
                  <a href="#" class="heading stretched-link">Uploaded KYC</a>
                  <div class="text-alternate"><?php echo $kyc->date_uploaded; ?></div>
                  <div class="text-muted mt-1">KYC is waiting to be approved by admin!</div>
                </div>
              </div>
            </div>
          </div>
        </div>
		<?php }else{ ?>
			<div class="row g-0">
          <div class="col-auto sw-1 d-flex flex-column justify-content-center align-items-center position-relative me-4">
            <div class="w-100 d-flex sh-1 position-relative justify-content-center">
              <div class="line-w-1 bg-separator h-100 position-absolute"></div>
            </div>
            <div class="rounded-xl shadow d-flex flex-shrink-0 justify-content-center align-items-center">
              <div class="bg-gradient-light sw-1 sh-1 rounded-xl position-relative"></div>
            </div>
            <div class="w-100 d-flex h-100 justify-content-center position-relative">
              <div class="line-w-1 bg-separator h-100 position-absolute"></div>
            </div>
          </div>
          <div class="col mb-4">
            <div class="h-100">
              <div class="d-flex flex-column justify-content-start">
                <div class="d-flex flex-column">
                  <a href="#" class="heading stretched-link">Missing KYC</a>
                  <div class="text-alternate">-------</div>
                  <div class="text-muted mt-1">This user has not submitted KYC requirements yet</div>
                </div>
              </div>
            </div>
          </div>
        </div>  
		<?php  } ?>
      </div>
    </div>

  </div>
	
  <div class="tab-pane fade" id="projectsTab" role="tabpanel">
    <h2 class="small-title">BPI Membership</h2>
    <div class="row row-cols-1 row-cols-sm-2 g-2">
	 <?php if(empty($userdetails->is_vip) && empty($userdetails->vip_pending)){ ?>	
		<h3>This Member has not activated any Membership Package</h3>
	<?php }elseif(empty($userdetails->is_vip) && !empty($userdetails->vip_pending)){?>
		<h3>There is a pending activation for this account awaiting admin approval! </h3>
	<?php }else{  ?>
	  	<!-- top containers stats -->	
                  <div class="col-12 col-lg-6 col-xxl-3">
                    <div class="card">
                      <div class="card-body">
                        <div class="heading mb-0 d-flex justify-content-between lh-1-25 mb-3">
                          <span>Activated Package</span>
                          <i data-acorn-icon="screen" class="text-primary"></i>
                        </div>
                        <div class="text-medium text-warning mb-1">
                          <span class="text-medium">
							  
							<?php 
						  if(!empty($this->generic_model->getInfo('active_shelters','user_id',$userdetails->id)->amount)){
						  echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; 
						  echo $this->generic_model->convert_currency($userdetails->default_currency,$this->generic_model->getInfo('active_shelters','user_id',$userdetails->id)->amount); }
							  else{
								  echo 'Missing Important Data';
							  }
							  ?>
						  </span>
                        </div>
                        <div class="cta-1 text-primary">
							<?php 
						  		$packaged = $this->generic_model->getInfo('active_shelters','user_id',$userdetails->id);
						       if(!empty($packaged)){
						  		if($packaged->amount == 10000){
								  echo 'BPI Regular';
							 	}
						       elseif($packaged->amount == 50000 || $packaged->amount == 40000){
								  echo 'BPI Regular Plus';
								}
						       elseif($packaged->amount == 100000 || $packaged->amount == 110000){
								  echo 'Silver Plus';
								}
						        elseif($packaged->amount == 210000 || $packaged->amount == 200000){
								  echo 'Gold Plus';
								}
						        elseif($packaged->amount == 310000){
								  echo 'PLATINUM';
								}
						  		else{
									echo 'No Valid Package Found';
								}
							   }
						       else{
								   echo 'Missing Important Data';
							   }
						    ?>
						</div>
                      </div>
                    </div>
                  </div>
                  
				  <div class="col-12 col-lg-6 col-xxl-3">
                    <div class="card">
                      <div class="card-body">
                        <div class="heading mb-0 d-flex justify-content-between lh-1-25 mb-3"> 	
                          <span>Palliative Type</span>
                          <i data-acorn-icon="cart" class="text-primary"></i>
                        </div>
                        <div class="text-medium text-warning mb-1">
                          <span class="text-medium">
                          <?php 
						  if(!empty($this->generic_model->getInfo('shelter_program','id',$active_plan->shelter_option)->amount)){
						  echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol;
                          echo $this->generic_model->convert_currency($userdetails->default_currency,$this->generic_model->getInfo('shelter_program','id',$active_plan->shelter_option)->amount);
						  }else{
							  echo 'Missing Valid Data';
						  }
							  ?>
                          </span>
                        </div>
                        <div class="cta-1 text-primary">
						<?php 
						  if(!empty($this->generic_model->getInfo('shelter_program','id',$active_plan->shelter_option))){
						  echo $this->generic_model->getInfo('shelter_program','id',$active_plan->shelter_option)->name; 
						  }else{
							  echo 'Missing Valid Data';
						  }
						?>
						</div>
                      </div>
                    </div>
                  </div>
					
                  <div class="col-12 col-lg-6 col-xxl-3">
                    <div class="card">
                      <div class="card-body">
                        <div class="heading mb-0 d-flex justify-content-between lh-1-25 mb-3">
                          <span>Shelter Package</span>
                          <i data-acorn-icon="clock" class="text-primary"></i>
                        </div>
                        <div class="text-medium text-warning mb-1">
                          <span class="text-medium">
							<?php 
						  	if(!empty($this->generic_model->getInfo('shelter_palliative_types','id',$active_plan->shelter_package))){
							  echo $this->generic_model->getInfo('shelter_palliative_types','id',$active_plan->shelter_package)->name; 
							}else{
								echo 'Missing Important Data';
							}
							?>
							</span>
                        </div>
                        <div class="cta-1 text-primary">
                          <?php 
						  if(!empty($this->generic_model->getInfo('shelter_palliative_types','id',$active_plan->shelter_package))){
						  echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol;
                          echo $this->generic_model->convert_currency($userdetails->default_currency,$this->generic_model->getInfo('shelter_palliative_types','id',$active_plan->shelter_package)->amount);
						  }else{
							 echo 'Missing Important Data'; 
						  }
						 ?>
                        </div>
                      </div>
                    </div>
                  </div>
					
                  <div class="col-12 col-lg-6 col-xxl-3">
                    <div class="card">
                      <div class="card-body">
                        <div class="heading mb-0 d-flex justify-content-between lh-1-25 mb-3">
                          <span>BPI Status</span>
                          <i data-acorn-icon="navigate-diagonal" class="text-primary"></i>
                        </div>
                        <div class="text-medium text-warning mb-1">
                          <span class="text-medium">
						<?php
						 if(!empty($this->generic_model->getInfo('shelter_program','id',$active_plan->shelter_option))){
						  echo $this->generic_model->getInfo('shelter_program','id',$active_plan->shelter_option)->name; 
						 }else{
							echo 'Missing Important Data';  
						 }
							  ?></span>
                        </div>
                        <?php if($userdetails->shelter_wallet == 1){ ?>
                            <div class="cta-1 text-primary">
                                Active
                            </div>
                        <?php }else{ ?>
                          <div class="cta-1 text-warning">
                                Pooling
                           </div>
                        <?php } ?>
                      </div>
                    </div>
                  </div>
		
      <?php } ?>
    </div>
  </div>
	
  <div class="tab-pane fade" id="permissionsTab" role="tabpanel">
    <h2 class="small-title">Activations &amp; Restrictions</h2>
    <div class="row row-cols-1 g-2">
      <div class="col">
        <div class="card">
          <div class="card-body">
                  <span class="heading mb-1 lh-1-25 text-primary">Withdrawal Ban</span>
                  <span class="d-block"><?php if($userdetails->withdraw_ban == 1){ echo 'Active: User is banned from withdrawing'; }else{ echo 'Not Active: User can make withdrawals'; } ?></span>
			  <div class="mt-2">
			  <?php if($userdetails->withdraw_ban == 1){?>
			  	<form action="<?php echo base_url('admin/unban_withdrawal');?>" method="post">
					<input type="hidden" name="uid" value="<?php echo $userdetails->id; ?>" >
					<button type="submit" class="btn btn-success btn-lg">Unban</button>
				</form>
		  	 <?php }else{ ?>
				<form action="<?php echo base_url('admin/ban_withdrawal');?>" method="post"> 
					<input type="hidden" name="uid" value="<?php echo $userdetails->id; ?>" >
					<button type="submit" class="btn btn-danger btn-lg">Ban Withdrawal</button>
				</form>
			 <?php } ?>
			  </div>
          </div>
        </div>
      </div>
      <div class="col">
        <div class="card">
          <div class="card-body">
                  <span class="heading mb-1 lh-1-25 text-primary">Shelter Wallet Activation</span>
                  <span class="d-block">
					  <?php if($userdetails->shelter_wallet == 1){ echo 'ACTIVATED'; }else{ echo 'INACTIVE'; }?>
			      </span>
          </div>
        </div>
      </div>
    </div>
  </div>
	
  <div class="tab-pane fade" id="friendsTab" role="tabpanel">
    <h2 class="small-title">Direct Invites</h2>
    <div class="row row-cols-1 row-cols-md-2 row-cols-xxl-3 g-2 mb-5">
	  <?php
        if(!empty($referrals)){
          foreach ($referrals as $row) { 
              $fname = $this->generic_model->getInfo('users','id',$row->user_id)->firstname;
              $lname = $this->generic_model->getInfo('users','id',$row->user_id)->lastname;
              $dateJoined = $this->generic_model->getInfo('users','id',$row->user_id)->created_at;
			  $ref_data = $this->generic_model->getInfo('users','id',$row->user_id);
              $image = $this->generic_model->getInfo('users','id',$row->user_id)->profile_pic;
              if(empty($image)){
                  $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
              }else{
                  $imager = $image;
              }
      ?>  
          <div class="col">
			<div class="card h-100">
				<div class="card-body">
					<div class="row g-0 sh-6">
						<div class="col-auto">
							<img src="<?php echo base_url($imager);?>" class="card-img rounded-xl sh-6 sw-6" alt="<?php echo $fname.' '.$lname; ?>">
						</div>
						<div class="col">
							<div class="card-body d-flex flex-row pt-0 pb-0 ps-3 pe-0 h-100 align-items-center justify-content-between">
								<div class="d-flex flex-column">
									<div><?php echo $fname.' '.$lname; ?></div>
									<?php if($ref_data->is_vip == 1){ ?>
									 <div class="text-small text-primary">Membership Activated</div>
									<?php }else{ ?> 
									 <div class="text-danger">Inactive Member</div>	
									<?php } ?>
									<div class="text-small text-muted"><?php echo $dateJoined; ?></div>
								</div>
								<div class="d-flex">
									<a href="<?php echo base_url('users_details/'.$row->user_id);?>" class="btn btn-outline-primary btn-sm ms-1">Details</a>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<?php }}else{ echo 'This user does not have any invites yet'; }?>
    </div>
  </div>
	
  <div class="tab-pane fade" id="aboutTab" role="tabpanel">
    <h2 class="small-title">About</h2>
    <div class="card">
      <div class="card-body">
        <div class="mb-5">
          <p class="text-small text-muted mb-2">Address</p>
          <p> <?php echo $userdetails->address;?> </p>
        </div>
        <div class="mb-5">
          <p class="text-small text-muted mb-2">Gender</p>
          <p> <?php echo $userdetails->gender;?> </p>
        </div>
        <div class="mb-3">
          <p class="text-small text-muted mb-2">CONTACT</p>
          <a href="#" class="d-block body-link mb-1">
            <i data-acorn-icon="phone" class="me-2" data-acorn-size="17"></i>
            <span class="align-middle"><?php echo $userdetails->mobile;?></span>
          </a>
          <a href="#" class="d-block body-link">
            <i data-acorn-icon="email" class="me-2" data-acorn-size="17"></i>
            <span class="align-middle"><?php echo $userdetails->email;?></span>
          </a>
        </div>
        <?php 
        if($userdetails->solar_agent == 1){
            ?>
          <div>
            <form method="post" action="<?php echo base_url('admin/disable_solar_agent'); ?>">
                  <input type="hidden" value="<?php echo $userdetails->id; ?>" name="user_id">
                  <button type="submit" class="btn btn-lg btn-danger">Disable Solar Agent</button>
            </form>
        </div>  
        <?php }else{ ?>
        <div>
            <form method="post" action="<?php echo base_url('admin/grant_solar_agent'); ?>">
                  <input type="hidden" value="<?php echo $userdetails->id; ?>" name="user_id">
                  <button type="submit" class="btn btn-lg btn-success">Grant Solar Agent</button>
            </form>
        </div>
        <?php } ?>
      </div>
    </div>
  </div>
  
  <div class="tab-pane fade" id="financeTab" role="tabpanel">
    <h2 class="small-title">Financial Management</h2>
	<div class="row mb-3">
		<div class="col-lg-3 col-12">
			<div class="card h-100">
				<div class="card-body">
					<p class="text-alternate">Total Earnings <span class="text-small">(Level 1)</span></p>
					<h5>
					<?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?>
                    <?php echo $this->generic_model->convert_currency($userdetails->default_currency,$grand_direct_total); ?>
					<!--$grand_direct_total = ($total_regular + $total_regularPlus + $total_gold + $total_platinum);-->
					</h5>
				</div>
			</div>
		</div>
		<div class="col-lg-3 col-12">
			<div class="card h-100">
				<div class="card-body">
					<p class="text-alternate">Total Earnings <span class="text-small">(Level 2)</span></p>
					<h5>
					<?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?>
                    <?php echo $this->generic_model->convert_currency($userdetails->default_currency,$grand_direct_total_2); ?>
					<!--$grand_direct_total = ($total_regular + $total_regularPlus + $total_gold + $total_platinum);-->
					</h5>
				</div>
			</div>
		</div>
		<div class="col-lg-3 col-12">
			<div class="card h-100">
				<div class="card-body">
					<p class="text-alternate">Total Earnings <span class="text-small">(Level 3)</span></p>
					<h5>
					<?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?>
                    <?php echo $this->generic_model->convert_currency($userdetails->default_currency,$grand_direct_total_3); ?>
					<!--$grand_direct_total = ($total_regular + $total_regularPlus + $total_gold + $total_platinum);-->
					</h5>
				</div>
			</div>
		</div>
		<div class="col-lg-3 col-12">
			<div class="card h-100">
				<div class="card-body">
					<p class="text-alternate">Total Earnings <span class="text-small">(Level 4)</span></p>
					<h5>
					<?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?>
                    <?php echo $this->generic_model->convert_currency($userdetails->default_currency,$grand_direct_total_4); ?>
					<!--$grand_direct_total = ($total_regular + $total_regularPlus + $total_gold + $total_platinum);-->
					</h5>
				</div>
			</div>
		</div>
	  </div>
	<div class="row mb-3">
		<div class="col-lg-3 col-12">
			<div class="card h-100">
				<div class="card-body">
					<p class="text-alternate">Total Earnings <span class="text-small">(Level 5)</span></p>
					<h5>
					<?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?>
                    <?php echo $this->generic_model->convert_currency($userdetails->default_currency,$grand_direct_total_5); ?>
					<!--$grand_direct_total = ($total_regular + $total_regularPlus + $total_gold + $total_platinum);-->
					</h5>
				</div>
			</div>
		</div>
		<div class="col-lg-3 col-12">
			<div class="card h-100">
				<div class="card-body">
					<p class="text-alternate">Total Earnings <span class="text-small">(Level 6)</span></p>
					<h5>
					<?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?>
                    <?php echo $this->generic_model->convert_currency($userdetails->default_currency,$grand_direct_total_6); ?>
					<!--$grand_direct_total = ($total_regular + $total_regularPlus + $total_gold + $total_platinum);-->
					</h5>
				</div>
			</div>
		</div>
		<div class="col-lg-3 col-12">
			<div class="card h-100">
				<div class="card-body">
					<p class="text-alternate">Total Earnings <span class="text-small">(Level 7)</span></p>
					<h5>
					<?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?>
                    <?php echo $this->generic_model->convert_currency($userdetails->default_currency,$grand_direct_total_7); ?>
					<!--$grand_direct_total = ($total_regular + $total_regularPlus + $total_gold + $total_platinum);-->
					</h5>
				</div>
			</div>
		</div>
		<div class="col-lg-3 col-12">
			<div class="card h-100">
				<div class="card-body">
					<p class="text-alternate">Total Earnings <span class="text-small">(Level 8)</span></p>
					<h5>
					<?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?>
                    <?php echo $this->generic_model->convert_currency($userdetails->default_currency,$grand_direct_total_8); ?>
					<!--$grand_direct_total = ($total_regular + $total_regularPlus + $total_gold + $total_platinum);-->
					</h5>
				</div>
			</div>
		</div>
	  </div>
	<div class="row mb-5">
		<div class="col-lg-3 col-12">
			<div class="card h-100">
				<div class="card-body">
					<p class="text-alternate">Total Earnings <span class="text-small">(Level 9)</span></p>
					<h5>
					<?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?>
                    <?php echo $this->generic_model->convert_currency($userdetails->default_currency,$grand_direct_total_9); ?>
					<!--$grand_direct_total = ($total_regular + $total_regularPlus + $total_gold + $total_platinum);-->
					</h5>
				</div>
			</div>
		</div>
		<div class="col-lg-3 col-12">
			<div class="card h-100">
				<div class="card-body">
					<p class="text-alternate">Total Earnings <span class="text-small">(Level 10)</span></p>
					<h5>
					<?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?>
                    <?php echo $this->generic_model->convert_currency($userdetails->default_currency,$grand_direct_total_10); ?>
					<!--$grand_direct_total = ($total_regular + $total_regularPlus + $total_gold + $total_platinum);-->
					</h5>
				</div>
			</div>
		</div>
		<div class="col-lg-3 col-12">
			<div class="card h-100">
				<div class="card-body">
					<p class="text-alternate">Total Shelter <span class="text-small">(Level 1 to 10)</span></p>
					<h5>
					<?php $gold1_10 = ($gold_commissions_shelter + $gold_commissions_shelter_2 + $gold_commissions_shelter_3 +$gold_commissions_shelter_4 + $gold_commissions_shelter_5 + $gold_commissions_shelter_6 + $gold_commissions_shelter_7 + $gold_commissions_shelter_8 + $gold_commissions_shelter_9 + $gold_commissions_shelter_10)?>
						
					<?php $platinum1_10 = ($platinum_commissions_shelter + $platinum_commissions_shelter_2 + $platinum_commissions_shelter_3 + $platinum_commissions_shelter_4 + $platinum_commissions_shelter_5 + $platinum_commissions_shelter_6 + $platinum_commissions_shelter_7 + $platinum_commissions_shelter_8 + $platinum_commissions_shelter_9 + $platinum_commissions_shelter_10); ?>	
					<?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?>
                    <?php echo $this->generic_model->convert_currency($userdetails->default_currency,($gold1_10 + $platinum1_10 )); ?>
					</h5>
				</div>
			</div>
		</div>
		<div class="col-lg-3 col-12">
			<div class="card h-100">
				<div class="card-body">
					<p class="text-alternate">Total Withdrawn</p>
					<h5>
					<?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?>
                    <?php echo $this->generic_model->convert_currency($userdetails->default_currency,$withdrawn); ?>
					</h5>
				</div>
			</div>
		</div> 
	</div>
	<div class="row mb-5">
		<div class="col-lg-3 col-12">
			<div class="card h-100">
				<div class="card-body">
					<p class="text-alternate">Grand Total Earnings <span class="text-small">(Level 1 to 10)</span></p>
					<h5>
					<?php $all_total = ($grand_direct_total + $grand_direct_total_2 + $grand_direct_total_3 + $grand_direct_total_4 + $grand_direct_total_5 + $grand_direct_total_6 + $grand_direct_total_7 + $grand_direct_total_8 + $grand_direct_total_9 + $grand_direct_total_10); ?>
						
					<?php $all_shelter = ($gold1_10 + $platinum1_10); ?>
					<?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?>
                    <?php echo $this->generic_model->convert_currency($userdetails->default_currency,$all_total); ?>
					<!--$grand_direct_total = ($total_regular + $total_regularPlus + $total_gold + $total_platinum);-->
					</h5>
				</div>
			</div>
		</div>
		<div class="col-lg-3 col-12">
			<div class="card h-100">
				<div class="card-body">
					<p class="text-alternate">Grand Earnings Less Shelter <span class="text-small">(Level 1 to 10)</span></p>
					<h5>
					<?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?>
                    <?php echo $this->generic_model->convert_currency($userdetails->default_currency,($all_total - $all_shelter)); ?>
					<!--$grand_direct_total = ($total_regular + $total_regularPlus + $total_gold + $total_platinum);-->
					</h5>
				</div>
			</div>
		</div>
		<div class="col-lg-3 col-12">
			<div class="card h-100">
				<div class="card-body">
					<p class="text-alternate">Balance Less Withdrawn <span class="text-small">(Level 1 to 10)</span></p>
					<h5>
					<?php $shelter_all_earn_diff = ($all_total - $all_shelter); ?>
					<?php echo $this->generic_model->getInfo('currency_management','id',$userdetails->default_currency)->symbol; ?>
                    <?php echo $this->generic_model->convert_currency($userdetails->default_currency,$shelter_all_earn_diff - $withdrawn); ?>
					<!--$grand_direct_total = ($total_regular + $total_regularPlus + $total_gold + $total_platinum);-->
					</h5>
				</div>
			</div>
		</div>
	</div>
	  
    <div class="card">
      <div class="card-body">
        <div class="row">
					<table id="centers_table" class="display data-table nowrap w-100 dataTable no-footer mt-5 mb-5" role="grid">
					<thead class="mb-3">
						<tr class="odd pb-2 pt-2" role="row">
							<th>Id</th>
							<th>User</th>
							<th>Currency</th>
							<th>Amount</th>
							<th>Description</th>
							<th>Date</th>
							<th>Status</th>
						</tr>
					</thead>
				</table>					
				<script type="text/javascript">
					$(document).ready(function() {
						$('#centers_table').DataTable({
							"processing": true,
							"serverSide": true,
							"ajax": {
								"url": "<?php echo site_url('admin/user_withdrawal_list'); ?>",
								"type": "POST",
								"data": {
										"user_id": <?php echo $userdetails->id; ?>
									}
							},
							"columns": [
								{ "data": "id" },
								{ "data": "user_id" },
								{ "data": "currency" },
								{ "data": "amount" },
								{ "data": "description" },
								{ "data": "date" },
								{ "data": "status" },
							],
						  "pagingType": "full_numbers", // Options: 'simple', 'simple_numbers', 'full', 'full_numbers'
							 "createdRow": function(row, data, dataIndex) {
									$(row).attr('data-id', data.id); // Set data-id attribute
								}
						});
						 // Add click event listener to the table rows
						//$('#centers_table tbody').on('click', 'tr', function() {
							//var merchantId = $(this).attr('data-id');
							//window.location.href = '<?php //echo site_url('pickup_details/'); ?>' + merchantId;
						//});
					});
				</script>
			    </div>
      </div>
    </div>
  </div>
</div>
</div>
        </div>
      </div>
    </div>
  </main>
  <footer>
    <div class="footer-content">
      <div class="container">
        <div class="row">
          <div class="col-12 col-sm-6">
            <p class="mb-0 text-muted text-medium">BeepAgro Palliative Initiative 2024</p>
          </div>
          <div class="col-sm-6 d-none d-sm-block">
            <ul class="breadcrumb pt-0 pe-0 mb-0 float-end">
              <li class="breadcrumb-item mb-0 text-medium"> <a href="https://beepagro.com/terms" target="_blank" class="btn-link">Our Terms</a> </li>
              <li class="breadcrumb-item mb-0 text-medium"> <a href="https://beepagro.com/privacy" target="_blank" class="btn-link">Our Policies</a> </li>
              <li class="breadcrumb-item mb-0 text-medium"> <a href="https://beepagro.com/" target="_blank" class="btn-link">Home</a> </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </footer>
</div>
<div class="modal fade modal-right scroll-out-negative" id="settings" data-bs-backdrop="true" tabindex="-1" role="dialog" aria-labelledby="settings" aria-hidden="true">
  <div class="modal-dialog modal-dialog-scrollable full" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Theme Settings</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <div class="scroll-track-visible">
          <div class="mb-5" id="color">
            <label class="mb-3 d-inline-block form-label">Color</label>
            <div class="row d-flex g-3 justify-content-between flex-wrap mb-3"> <a href="#" class="flex-grow-1 w-50 option col" data-value="light-blue" data-parent="color">
              <div class="card rounded-md p-3 mb-1 no-shadow color">
                <div class="blue-light"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">LIGHT BLUE</span> </div>
              </a> <a href="#" class="flex-grow-1 w-50 option col" data-value="dark-blue" data-parent="color">
              <div class="card rounded-md p-3 mb-1 no-shadow color">
                <div class="blue-dark"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">DARK BLUE</span> </div>
              </a> </div>
            <div class="row d-flex g-3 justify-content-between flex-wrap mb-3"> <a href="#" class="flex-grow-1 w-50 option col" data-value="light-teal" data-parent="color">
              <div class="card rounded-md p-3 mb-1 no-shadow color">
                <div class="teal-light"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">LIGHT TEAL</span> </div>
              </a> <a href="#" class="flex-grow-1 w-50 option col" data-value="dark-teal" data-parent="color">
              <div class="card rounded-md p-3 mb-1 no-shadow color">
                <div class="teal-dark"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">DARK TEAL</span> </div>
              </a> </div>
            <div class="row d-flex g-3 justify-content-between flex-wrap mb-3"> <a href="#" class="flex-grow-1 w-50 option col" data-value="light-sky" data-parent="color">
              <div class="card rounded-md p-3 mb-1 no-shadow color">
                <div class="sky-light"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">LIGHT SKY</span> </div>
              </a> <a href="#" class="flex-grow-1 w-50 option col" data-value="dark-sky" data-parent="color">
              <div class="card rounded-md p-3 mb-1 no-shadow color">
                <div class="sky-dark"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">DARK SKY</span> </div>
              </a> </div>
            <div class="row d-flex g-3 justify-content-between flex-wrap mb-3"> <a href="#" class="flex-grow-1 w-50 option col" data-value="light-red" data-parent="color">
              <div class="card rounded-md p-3 mb-1 no-shadow color">
                <div class="red-light"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">LIGHT RED</span> </div>
              </a> <a href="#" class="flex-grow-1 w-50 option col" data-value="dark-red" data-parent="color">
              <div class="card rounded-md p-3 mb-1 no-shadow color">
                <div class="red-dark"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">DARK RED</span> </div>
              </a> </div>
            <div class="row d-flex g-3 justify-content-between flex-wrap mb-3"> <a href="#" class="flex-grow-1 w-50 option col" data-value="light-green" data-parent="color">
              <div class="card rounded-md p-3 mb-1 no-shadow color">
                <div class="green-light"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">LIGHT GREEN</span> </div>
              </a> <a href="#" class="flex-grow-1 w-50 option col" data-value="dark-green" data-parent="color">
              <div class="card rounded-md p-3 mb-1 no-shadow color">
                <div class="green-dark"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">DARK GREEN</span> </div>
              </a> </div>
            <div class="row d-flex g-3 justify-content-between flex-wrap mb-3"> <a href="#" class="flex-grow-1 w-50 option col" data-value="light-lime" data-parent="color">
              <div class="card rounded-md p-3 mb-1 no-shadow color">
                <div class="lime-light"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">LIGHT LIME</span> </div>
              </a> <a href="#" class="flex-grow-1 w-50 option col" data-value="dark-lime" data-parent="color">
              <div class="card rounded-md p-3 mb-1 no-shadow color">
                <div class="lime-dark"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">DARK LIME</span> </div>
              </a> </div>
            <div class="row d-flex g-3 justify-content-between flex-wrap mb-3"> <a href="#" class="flex-grow-1 w-50 option col" data-value="light-pink" data-parent="color">
              <div class="card rounded-md p-3 mb-1 no-shadow color">
                <div class="pink-light"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">LIGHT PINK</span> </div>
              </a> <a href="#" class="flex-grow-1 w-50 option col" data-value="dark-pink" data-parent="color">
              <div class="card rounded-md p-3 mb-1 no-shadow color">
                <div class="pink-dark"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">DARK PINK</span> </div>
              </a> </div>
            <div class="row d-flex g-3 justify-content-between flex-wrap mb-3"> <a href="#" class="flex-grow-1 w-50 option col" data-value="light-purple" data-parent="color">
              <div class="card rounded-md p-3 mb-1 no-shadow color">
                <div class="purple-light"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">LIGHT PURPLE</span> </div>
              </a> <a href="#" class="flex-grow-1 w-50 option col" data-value="dark-purple" data-parent="color">
              <div class="card rounded-md p-3 mb-1 no-shadow color">
                <div class="purple-dark"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">DARK PURPLE</span> </div>
              </a> </div>
          </div>
          <div class="mb-5" id="navcolor">
            <label class="mb-3 d-inline-block form-label">Override Nav Palette</label>
            <div class="row d-flex g-3 justify-content-between flex-wrap"> <a href="#" class="flex-grow-1 w-33 option col" data-value="default" data-parent="navcolor">
              <div class="card rounded-md p-3 mb-1 no-shadow">
                <div class="figure figure-primary top"></div>
                <div class="figure figure-secondary bottom"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">DEFAULT</span> </div>
              </a> <a href="#" class="flex-grow-1 w-33 option col" data-value="light" data-parent="navcolor">
              <div class="card rounded-md p-3 mb-1 no-shadow">
                <div class="figure figure-secondary figure-light top"></div>
                <div class="figure figure-secondary bottom"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">LIGHT</span> </div>
              </a> <a href="#" class="flex-grow-1 w-33 option col" data-value="dark" data-parent="navcolor">
              <div class="card rounded-md p-3 mb-1 no-shadow">
                <div class="figure figure-muted figure-dark top"></div>
                <div class="figure figure-secondary bottom"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">DARK</span> </div>
              </a> </div>
          </div>
          <div class="mb-5" id="behaviour">
            <label class="mb-3 d-inline-block form-label">Menu Behaviour</label>
            <div class="row d-flex g-3 justify-content-between flex-wrap"> <a href="#" class="flex-grow-1 w-50 option col" data-value="pinned" data-parent="behaviour">
              <div class="card rounded-md p-3 mb-1 no-shadow">
                <div class="figure figure-primary left large"></div>
                <div class="figure figure-secondary right small"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">PINNED</span> </div>
              </a> <a href="#" class="flex-grow-1 w-50 option col" data-value="unpinned" data-parent="behaviour">
              <div class="card rounded-md p-3 mb-1 no-shadow">
                <div class="figure figure-primary left"></div>
                <div class="figure figure-secondary right"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">UNPINNED</span> </div>
              </a> </div>
          </div>
          <div class="mb-5" id="layout">
            <label class="mb-3 d-inline-block form-label">Layout</label>
            <div class="row d-flex g-3 justify-content-between flex-wrap"> <a href="#" class="flex-grow-1 w-50 option col" data-value="fluid" data-parent="layout">
              <div class="card rounded-md p-3 mb-1 no-shadow">
                <div class="figure figure-primary top"></div>
                <div class="figure figure-secondary bottom"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">FLUID</span> </div>
              </a> <a href="#" class="flex-grow-1 w-50 option col" data-value="boxed" data-parent="layout">
              <div class="card rounded-md p-3 mb-1 no-shadow">
                <div class="figure figure-primary top"></div>
                <div class="figure figure-secondary bottom small"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">BOXED</span> </div>
              </a> </div>
          </div>
          <div class="mb-5" id="radius">
            <label class="mb-3 d-inline-block form-label">Radius</label>
            <div class="row d-flex g-3 justify-content-between flex-wrap"> <a href="#" class="flex-grow-1 w-33 option col" data-value="rounded" data-parent="radius">
              <div class="card rounded-md radius-rounded p-3 mb-1 no-shadow">
                <div class="figure figure-primary top"></div>
                <div class="figure figure-secondary bottom"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">ROUNDED</span> </div>
              </a> <a href="#" class="flex-grow-1 w-33 option col" data-value="standard" data-parent="radius">
              <div class="card rounded-md radius-regular p-3 mb-1 no-shadow">
                <div class="figure figure-primary top"></div>
                <div class="figure figure-secondary bottom"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">STANDARD</span> </div>
              </a> <a href="#" class="flex-grow-1 w-33 option col" data-value="flat" data-parent="radius">
              <div class="card rounded-md radius-flat p-3 mb-1 no-shadow">
                <div class="figure figure-primary top"></div>
                <div class="figure figure-secondary bottom"></div>
              </div>
              <div class="text-muted text-part"> <span class="text-extra-small align-middle">FLAT</span> </div>
              </a> </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<div class="settings-buttons-container">
  <button type="button" class="btn settings-button btn-primary p-0" data-bs-toggle="modal" data-bs-target="#settings" id="settingsButton"> <span class="d-inline-block no-delay" data-bs-delay="0" data-bs-offset="0,3" data-bs-toggle="tooltip" data-bs-placement="left" title="Settings"> <i data-acorn-icon="paint-roller" class="position-relative"></i> </span> </button>
</div>
<div class="modal fade modal-under-nav modal-search modal-close-out" id="searchPagesModal" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header border-0 p-0">
        <button type="button" class="btn-close btn btn-icon btn-icon-only btn-foreground" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body ps-5 pe-5 pb-0 border-0">
        <input id="searchPagesInput" class="form-control form-control-xl borderless ps-0 pe-0 mb-1 auto-complete" type="text" autocomplete="off">
      </div>
      <div class="modal-footer border-top justify-content-start ps-5 pe-5 pb-3 pt-3 border-0"> <span class="text-alternate d-inline-block m-0 me-3"> <i data-acorn-icon="arrow-bottom" data-acorn-size="15" class="text-alternate align-middle me-1"></i> <span class="align-middle text-medium">Navigate</span> </span> <span class="text-alternate d-inline-block m-0 me-3"> <i data-acorn-icon="arrow-bottom-left" data-acorn-size="15" class="text-alternate align-middle me-1"></i> <span class="align-middle text-medium">Select</span> </span> </div>
    </div>
  </div>
</div>
<script src="<?php echo base_url('assets/js/vendor/jquery-3.5.1.min.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/bootstrap.bundle.min.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/OverlayScrollbars.min.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/autoComplete.min.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/clamp.min.js');?>"></script> 
<script src="<?php echo base_url('assets/icon/acorn-icons.js');?>"></script> 
<script src="<?php echo base_url('assets/icon/acorn-icons-interface.js');?>"></script> 
<script src="<?php echo base_url('assets/icon/acorn-icons-commerce.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/jquery.barrating.min.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/jquery.barrating.min.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/quill.min.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/quill.active.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/datatables.min.js');?>"></script>
<script src="<?php echo base_url('assets/js/vendor/mousetrap.min.js');?>"></script>
<script src="<?php echo base_url('assets/js/base/helpers.js');?>"></script> 
<script src="<?php echo base_url('assets/js/base/globals.js');?>"></script> 
<script src="<?php echo base_url('assets/js/base/nav.js');?>"></script> 
<script src="<?php echo base_url('assets/js/base/search.js');?>"></script> 
<script src="<?php echo base_url('assets/js/base/settings.js');?>"></script> 
<script src="<?php echo base_url('assets/js/cs/datatable.extend.js');?>"></script>
<script src="<?php echo base_url('assets/js/plugins/datatable.ajax.js');?>"></script>
<script src="<?php echo base_url('assets/js/common.js');?>"></script> 
<script src="<?php echo base_url('assets/js/scripts.js');?>"></script>
	

<!--Start of Tawk.to Script--> 
<script type="text/javascript">
	var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
	(function(){
	var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
	s1.async=true;
	s1.src='https://embed.tawk.to/6629bb3fa0c6737bd13007ec/1hs9g6sk0';
	s1.charset='UTF-8';
	s1.setAttribute('crossorigin','*');
	s0.parentNode.insertBefore(s1,s0);
	})();
	</script> 
<!--End of Tawk.to Script-->
</body>
</html>