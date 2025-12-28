<!DOCTYPE html>
<html lang="en" data-footer="true">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>BeepAgro Palliative Initiative | My Assets</title>
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
<link rel="stylesheet" href="<?php echo base_url('assets/css/styles.css');?>">
<link rel="stylesheet" href="<?php echo base_url('assets/css/main.css');?>">
<script src="<?php echo base_url('assets/js/base/loader.js');?>"></script>
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
          <li> <a href="#"> <i data-acorn-icon="messages" class="icon" data-acorn-size="18"></i> <span class="label">Community</span> </a> </li>
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
            <li> <a href="#" data-bs-target="#dashboard"> <i data-acorn-icon="home" class="icon" data-acorn-size="18"></i> <span class="label">Member Dashboard</span> </a>
              <ul>
                <li> <a href="<?php echo base_url('dashboard');?>"> <i data-acorn-icon="navigate-diagonal" class="icon d-none" data-acorn-size="18"></i> <span class="label">Home</span> </a> </li>
                <li> <a href="<?php echo base_url('analytics');?>"> <i data-acorn-icon="chart-4" class="icon d-none" data-acorn-size="18"></i> <span class="label">Analytics</span> </a> </li>
                <li> <a class="active" href="#"> <i data-acorn-icon="wallet" class="icon d-none" data-acorn-size="18"></i> <span class="label">Assets</span> </a> </li>
                <li> <a href="<?php echo base_url('refer');?>"> <i data-acorn-icon="link" class="icon d-none" data-acorn-size="18"></i> <span class="label">Invites</span> </a> </li>
              </ul>
            </li>
            <li> <a href="#" data-bs-target="#store"> <i data-acorn-icon="home" class="icon" data-acorn-size="18"></i> <span class="label">Storefront</span> </a>
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
            </li>
          </ul>
        </div>
        <!-- end menu segment -->
        
        <div class="col"> 
          
          <!-- welcome to BPI-->
          <div class="page-title-container mb-3">
            <div class="row">
              <div class="col mb-2">
                <h1 class="mb-2 pb-0 display-4" id="title">Your BPI Assets</h1>
                <div class="text-muted font-heading text-small">Empowering You to Monitor Performance, Stay Informed, and Drive Success with Real-Time Insights</div>
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
          <div class="row g-2 mb-2">
            <div class="col-6 col-md-4 col-lg-2">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center border border-primary mb-4"> <i data-acorn-icon="dollar" class="text-primary"></i> </div>
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">CASH WALLET</div>
                  <div class="text-primary cta-4"><?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,($user_details->wallet + $user_details->spendable));?></div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-4 col-lg-2">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center border border-primary mb-4"> <i data-acorn-icon="" class="text-primary">BPT</i> </div>
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">BPT BALANCE</div>
                  <div class="text-primary cta-4"><?php echo number_format($user_details->token,0); ?> BPT</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-4 col-lg-2">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center border border-primary mb-4"> <i data-acorn-icon="cart" class="text-primary"></i> </div>
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">CASHBACK WALLET</div>
                  <div class="text-primary cta-4"><?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,$user_details->cashback);?></div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-4 col-lg-2">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <?php if(empty($user_details->is_vip)){?>
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center border border-muted mb-4"> <i data-acorn-icon="lock-on" class="text-muted"></i> </div>
                  <?php }else { ?>
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center border border-primary mb-4"> <i data-acorn-icon="user" class="text-primary"></i> </div>
                  <?php } ?>
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">PALLIATIVE WALLET</div>
                  <?php if(empty($user_details->is_vip)){?>
                  <div class="text-muted cta-4">Locked </div>
                  <?php }else { ?>
                  <div class="text-primary cta-4"><?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,$user_details->palliative);?></div>
                  <?php } ?>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-4 col-lg-2">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <?php if(empty($user_details->shelter_wallet)){?>
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center border border-muted mb-4"> <i data-acorn-icon="lock-on" class="text-muted"></i> </div>
                  <?php }else{ ?>
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center border border-primary mb-4"> <i data-acorn-icon="shield-check" class="text-primary"></i> </div>
                  <?php } ?>
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">SHELTER PALLIATIVE</div>
                  <?php if(empty($user_details->shelter_wallet)){?>
                  <div class="text-muted cta-4">Locked</div>
                  <?php }else{ ?>
                  <div class="text-primary cta-4"> <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,$user_details->shelter); ?> </div>
                  <?php
                  }
                  if ( !empty( $shelter_option ) ) {
                    $totalAmount = $this->generic_model->getInfo( 'shelter_program', 'id', $shelter_option->shelter_option )->amount;
                    if ( $user_details->shelter >= $totalAmount ) {
                      ?>
                  <a href="<?php echo base_url('claim_shelter_pal/'.$shelter_option->shelter_option);?>" class="btn btn-md btn-success">Claim Palliative</a>
                  <?php }else{ ?>
                  <?php } }  ?>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-4 col-lg-2">
              <?php
              $wallet_milestone = $this->generic_model->get_count( 'wallet_milestone', array( 'wallet_package' => 6 ) );
              if ( $wallet_milestone > 0 ) {
                //get the current milestone to go
                $claim_stats = $this->generic_model->get_by_condition( 'active_milestone_claims', array( 'user_id' => $user_details->id, 'shelter_program_id' => 6 ) );
                if ( !empty( $claim_stats ) ) {
                  //check the level
                  $previous_level = $claim_stats->last_milestone;
                  $new_level = ( $previous_level + 1 );
                  $next_level = ( $new_level + 1 );

                  //get the next level for the milestone
                  $new_milestone = $this->generic_model->get_by_condition( 'wallet_milestone', array( 'level' => $new_level, 'wallet_package' => 6 ) );
                  $next_milestone = $this->generic_model->get_by_condition( 'wallet_milestone', array( 'level' => $next_level, 'wallet_package' => 6 ) );
                } else {
                  $new_milestone = $this->generic_model->get_by_condition( 'wallet_milestone', array( 'level' => 1, 'wallet_package' => 6 ) );
                  $next_milestone = $this->generic_model->get_by_condition( 'wallet_milestone', array( 'level' => 2, 'wallet_package' => 6 ) );
                }
              }
              $totalAmount = $this->generic_model->getInfo( 'shelter_program', 'id', 6 )->amount;
              ?>
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <?php if($user_details->education >= $new_milestone->amount ){ ?>
                  <a href="<?php echo base_url('claim_edu_pal/'.$new_milestone->level);?>" class="btn btn-md btn-success">Claim Palliative</a>
                  <?php }else{ ?>
                  <?php
                  if ( empty( $shelter_option ) || $shelter_option->shelter_option != 6 || empty($user_details->shelter_wallet)) {
                    ?>
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center border border-muted mb-4"> <i data-acorn-icon="lock-on" class="text-muted"></i> </div>
                  <?php }else{ ?>
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center border border-primary mb-4"> <i data-acorn-icon="book" class="text-primary"></i> </div>
                  <?php } ?>
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">EDUCATION PALLIATIVE</div>
                  <?php if(empty($shelter_option) || $shelter_option->shelter_option != 6 ){?>
                  <div class="text-muted cta-4">Locked</div>
                  <?php }else { ?>
                  <div class="text-muted cta-4"> <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,$user_details->education); ?> </div>
                  <?php } } ?>
                </div>
              </div>
            </div>
          </div>
          <div class="row g-2 mb-5">
            <div class="col-6 col-md-4 col-lg-2">
              <?php
              $totalAmount = $this->generic_model->getInfo( 'shelter_program', 'id', 7 )->amount;
              ?>
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <?php if($user_details->car >= $totalAmount ){ ?>
                  <a href="<?php echo base_url('claim_shelter_pal/7');?>" class="btn btn-md btn-success">Claim Palliative</a>
                  <?php }else{ ?>
                  <?php if(empty($shelter_option) || $shelter_option->shelter_option != 7 || empty($user_details->shelter_wallet) ){?>
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center border border-muted mb-4"> <i data-acorn-icon="lock-on" class="text-muted"></i> </div>
                  <?php }else{ ?>
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center border border-primary mb-4"> <i data-acorn-icon="car" class="text-primary"></i> </div>
                  <?php } } ?>
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">CAR PALLIATIVE</div>
                  <?php if(empty($shelter_option) || $shelter_option->shelter_option != 7 ){?>
                  <div class="text-muted cta-4">Locked</div>
                  <?php }else{ ?>
                  <div class="text-primary cta-4">
                    <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
                    <?php echo $this->generic_model->convert_currency($user_details->default_currency,$user_details->car);  ?> </div>
                  <?php } ?>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-4 col-lg-2">
              <?php
              $totalAmount = $this->generic_model->getInfo( 'shelter_program', 'id', 9 )->amount;
              ?>
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <?php if($user_details->business >= $totalAmount ){ ?>
                  <a href="<?php echo base_url('claim_shelter_pal/9');?>" class="btn btn-md btn-success">Claim Palliative</a>
                  <?php }else{ ?>
                  <?php if(empty($shelter_option) || $shelter_option->shelter_option != 9 || empty($user_details->shelter_wallet) ){?>
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center border border-muted mb-4"> <i data-acorn-icon="lock-on" class="text-muted"></i> </div>
                  <?php }else{ ?>
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center border border-primary mb-4"> <i data-acorn-icon="office" class="text-primary"></i> </div>
                  <?php } } ?>
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">BUSINESS SUPPORT</div>
                  <?php if(empty($shelter_option) || $shelter_option->shelter_option != 9 ){?>
                  <div class="text-muted cta-4">Locked</div>
                  <?php }else{ ?>
                  <div class="text-primary cta-4">
                    <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
                    <?php echo $this->generic_model->convert_currency($user_details->default_currency,$user_details->business);  ?> </div>
                  <?php } ?>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-4 col-lg-2">
              <?php
              $totalAmount = $this->generic_model->getInfo( 'shelter_program', 'id', 8 )->amount;
              ?>
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <?php if($user_details->land >= $totalAmount ){ ?>
                  <a href="<?php echo base_url('claim_shelter_pal/8');?>" class="btn btn-md btn-success">Claim Palliative</a>
                  <?php }else{ ?>
                  <?php if(empty($shelter_option) || $shelter_option->shelter_option != 8 ){?>
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center border border-muted mb-4"> <i data-acorn-icon="lock-on" class="text-muted"></i> </div>
                  <?php }else{ ?>
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center border border-primary mb-4"> <i data-acorn-icon="direction" class="text-primary"></i> </div>
                  <?php } } ?>
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">LAND PALLIATIVE</div>
                  <?php if(empty($shelter_option) || $shelter_option->shelter_option != 8 || empty($user_details->shelter_wallet)){?>
                  <div class="text-muted cta-4">Locked</div>
                  <?php }else{ ?>
                  <div class="text-primary cta-4">
                    <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
                    <?php echo $this->generic_model->convert_currency($user_details->default_currency,$user_details->land);  ?> </div>
                  <?php } ?>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-4 col-lg-2">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center border border-primary mb-4"> <i data-acorn-icon="flash" class="text-primary"></i> </div>
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">POWER PALLIATIVE</div>
                  <div class="text-primary cta-4">0.00</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-4 col-lg-2">
              <?php
              $totalAmount = 35000;
              ?>
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center border border-primary mb-4"> <i data-acorn-icon="loaf" class="text-primary"></i> </div>
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">MEAL PALLIATIVE</div>
                  <div class="text-primary cta-4"> <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,$user_details->meal); ?> </div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-4 col-lg-2">
              <?php
              $totalAmount = 100000;
              ?>
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center border border-primary mb-4"> <i data-acorn-icon="health" class="text-primary"></i> </div>
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">HEALTH PALLIATIVE</div>
                  <div class="text-primary cta-4"> <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,$user_details->health); ?> </div>
                </div>
              </div>
            </div>
          </div>
          <div class="row g-2 mb-5">
            <div class="col-6 col-md-4 col-lg-2">
              <?php
              $totalAmount = 35000;
              ?>
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center border border-primary mb-4"> <i data-acorn-icon="prize" class="text-primary"></i> </div>
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">LEGAL PALLIATIVE</div>
                  <div class="text-primary cta-4"> <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,$user_details->legals); ?> </div>
                </div>
              </div>
            </div>
		   <?php if($user_details->is_shareholder == 1 ){ ?>
			  <div class="col-6 col-md-4 col-lg-2">
              <div class="card h-100 hover-scale-up cursor-pointer bg-success ">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center border border-white mb-4"> 
				  <i data-acorn-icon="file-chart" class="text-white"></i> </div>
                  <div class="mb-1 d-flex align-items-center text-white lh-1-25">BPI PORTFOLIO</div>
                  <div class="text-white cta-4"> <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,$user_details->shareholder); ?> </div>
                </div>
              </div>
            </div>
			  <?php } ?>
			  
			  
          </div>
          <div class="page-title-container mt-5 mb-5">
            <div class="row">
              <div class="col mb-2 mt-5">
                <h1 class="mb-2 pb-0 display-4" id="title">Inter-Wallet Transfer</h1>
                <div class="text-muted font-heading text-small">You can transfer assets to other members f BPI using the form below</div> 
              </div>
              <!--<div class="col-12 col-sm-auto d-flex align-items-center justify-content-end">
					<a href="<?php //echo base_url('withdrawal'); ?>" class="btn btn-outline-primary btn-icon btn-icon-start w-100 w-md-auto">
					<i data-acorn-icon="wallet"></i>
					<span>Withdrawal</span>
					</a>
				</div>--> 
            </div>
          </div>
		  <div class="row">
			<div class="col-sm-12 col-xl-6">
                  <div class="card h-100">
                    <div class="position-absolute card-top-buttons">
                      <button class="btn btn-header-light icon-button" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"> <i class="simple-icon-refresh"></i> </button>
                    </div>
                    <div class="card-body">
                      <h3 class="text-primary mb-5">Inter-Wallet Transfer</h3>
                      <div class="dashboard-quick-post">
                        <?php echo form_open_multipart('user/inter_transfer'); ?>
                         <div class="filled mb-3"> <i data-acorn-icon="wallet"></i>
							<select name="method" class="form-control" required>
								<option value="">Select Transfer Wallet</option>
								<option value="cashback">Cashback</option>
							</select>
                        </div>
                        <div class="filled mb-3"> <i data-acorn-icon="user"></i>
                          <input type="text" name="ssn" id="ssn" class="form-control" placeholder="Enter Member SSC" required>
                        </div>
                        <div class="text-alternate mt-1 mb-1" style="display:none" id="connecting"></div>
                         <div class="filled mb-3"> <i data-acorn-icon="user"></i>
                          <input type="text" name="member" class="form-control" id="member" placeholder="Member Name" readonly>
                        </div>
                         <div class="filled mb-3"> <i data-acorn-icon="wallet"></i>
                          <input type="number" name="amount" class="form-control" placeholder="Enter Amount To Transfer" required>
                        </div>
                        <div class="filled mb-3">
                          <div class="col-sm-12">
                            <button type="submit" class="btn btn-primary btn-lg float-right">Transfer</button>
                          </div>
                        </div>
                        <?php  echo form_close(); ?>
                      </div>
                    </div>
                  </div>
            </div>
			<div class="col-xl-6 col-sm-12 mb-4">
                <div class="card h-100">
                      <div class="card-body">
                        <h5>How To Use Inter-Wallet transfer</h5>
                        <ul>
                            <li>Enter Memeber BPI Social Security Code: SSC</li>
                            <li>Confirm that the name that appears is correct</li>
                            <li>Enter the amount you wish to transfer</li>
                            <li>Send the transaction for processing</li>
                        </ul>
                         <h5>IMPORTANT</h5>
                         <ul>
                             <li>Do not attempt to test this feature using your own SSC, your account will be banned</li>
                             <li>Make sure you have sufficient funds in your cashback wallet to cover the transaction</li>
                             <li>A service charge or N100 will be deducted from your cashback wallet</li>
                             <li>VAT Applies to all transfers including this</li>
                             <li>All approved transfers are non-refundable ensure you have the right recipient before proceeding</li>
                         </ul>
                      </div>
                </div>
            </div>
		  </div>

		  <div class="page-title-container mt-5 mb-5">
            <div class="row">
              <div class="col mb-2 mt-5">
                <h1 class="mb-2 pb-0 display-4" id="title">Wallet Top Up</h1>
                <div class="text-muted font-heading text-small">You can add funds to your cash wallet using the form below</div>
              </div>
              <!--<div class="col-12 col-sm-auto d-flex align-items-center justify-content-end">
					<a href="<?php //echo base_url('withdrawal'); ?>" class="btn btn-outline-primary btn-icon btn-icon-start w-100 w-md-auto">
					<i data-acorn-icon="wallet"></i>
					<span>Withdrawal</span>
					</a>
				</div>--> 
            </div>
          </div>
		  <div class="row">
			<div class="col-lg-12 col-xl-6">
              <div class="row">
                <div class="col-md-12 mb-4">
                  <div class="card">
                    <div class="position-absolute card-top-buttons">
                      <button class="btn btn-header-light icon-button" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"> <i class="simple-icon-refresh"></i> </button>
                    </div>
                    <div class="card-body">
                      <h3 class="text-primary mb-5">Wallet Topup</h3>
                      <div class="dashboard-quick-post">
                        <?php echo form_open_multipart('user/top_up_wallet'); ?>
                        <div class="filled mb-3"> <i data-acorn-icon="arrow-top"></i>
                          <input type="number" name="amount" class="form-control" placeholder="Enter Amount To Top Up" required>
                        </div>
                        <div class="filled mb-3"> <i data-acorn-icon="wallet"></i>
							<select name="method" class="form-control" required>
								<option value="">Select Funding Method</option>
								<option value="bank">NGN Bank Account</option>
								<option value="card">Card Payment</option>
							</select>
                        </div>
                        <div class="filled mb-3">
                          <div class="col-sm-12">
                            <button type="submit" class="btn btn-primary btn-lg float-right">Proceed</button>
                          </div>
                        </div>
                        <?php echo form_close(); ?>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
			<div class="col-xl-6 col-lg-12 mb-4">
              <h2 class="small-title">Top Up History</h2>
              <div class="scroll-out">
                <div class="scroll-by-count" data-count="3">
                  <?php
                  if ( !empty( $funding ) ) {
                    foreach ( $funding as $row ) {
                      ?>
                  <div class="card mb-2"> <a href="<?php echo base_url('transactions');?>" class="row g-0 sh-10">
                    <div class="col">
                      <div class="card-body d-flex flex-column h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-3">
                            <div class="text-primary"> Funding </div>
                          </div>
                          <div class="d-flex flex-column col-6">
                            <div class="text-alternate">
                              <?php if($row->amount < 1) { echo 'Amount: '.number_format($row->amount,8).' BPT '.$row->status;}else { ?>
                              Amount: <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,$row->amount); }?> </div>
                            <div class="text-small text-muted"> <?php echo $row->description; ?> </div>
                          </div>
                          <div class="d-flex flex-column col-3">
                            <?php
                            if ( $row->status == 'Successful' ) {
                              ?>
                            <span class="badge bg-outline-primary">Successful</span>
                            <?php }elseif($row->status == 'processing' || $row->status == 'Pending'){ ?>
                            <span class="badge bg-outline-warning">Processing</span>
                            <?php }else{ ?>
                            <span class="badge bg-outline-danger">Failed</span>
                            <?php } ?>
                          </div>
                        </div>
                      </div>
                    </div>
                    </a> </div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> You do not have transaction to show </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
                </div>
              </div>
            </div>
		  </div>
          <div class="page-title-container mt-5 mb-5">
            <div class="row">
              <div class="col mb-2 mt-5">
                <h1 class="mb-2 pb-0 display-4" id="title">Assets Withdrawal &amp; Transfer</h1>
                <div class="text-muted font-heading text-small">You can withdraw your assets to your local bank account or transfer assets from one wallet to another wallet here</div>
              </div>
              <!--<div class="col-12 col-sm-auto d-flex align-items-center justify-content-end">
					<a href="<?php //echo base_url('withdrawal'); ?>" class="btn btn-outline-primary btn-icon btn-icon-start w-100 w-md-auto">
					<i data-acorn-icon="wallet"></i>
					<span>Withdrawal</span>
					</a>
				</div>--> 
            </div>
          </div>
          <div class="row">
            <div class="col-lg-12 col-xl-6">
              <div class="row">
                <div class="col-md-12 mb-4">
                  <div class="card">
                    <div class="position-absolute card-top-buttons">
                      <button class="btn btn-header-light icon-button" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"> <i class="simple-icon-refresh"></i> </button>
                    </div>
                    <div class="card-body">
                      <h3 class="text-primary mb-5">Instant Withdrawal</h3>
                      <div class="dashboard-quick-post">
                        <?php if(!empty($bank_records)){ ?>
                        <?php echo form_open_multipart('transaction/withdrawal'); ?>
                        <div class="filled mb-3"> <i data-acorn-icon="arrow-top"></i>
                          <input type="number" name="amount" class="form-control" placeholder="Enter Amount To Withdraw">
                        </div>
                        <div class="filled mb-3"> <i data-acorn-icon="user"></i>
                          <input type="text" name="account_number" class="form-control" value="<?php echo $bank_records->account_number; ?>" readonly>
                        </div>
                        <div class="filled mb-3"> <i data-acorn-icon="user"></i>
                          <input type="text" name="account" class="form-control" value="<?php echo $bank_records->bank_account; ?>" readonly>
                        </div>
                        <div class="filled mb-3"> <i data-acorn-icon="home"></i>
                          <input type="text" readonly class="form-control" value="<?php echo $this->generic_model->convertBankCode($bank_records->bank_name)->bank_name; ?>">
                          <input type="hidden" name="bank" class="form-control" value="<?php echo $bank_records->bank_name; ?>">
                        </div>
                        <div class="filled mb-3">
                          <div class="col-sm-12">
                            <button type="submit" class="btn btn-primary btn-lg float-right">Proceed</button>
                          </div>
                        </div>
                        <?php echo form_close(); ?>
                        <?php }else{ ?>
                        <h5>Setup your bank information to enable withdrawal to bank. </h5>
                        <br>
                        <a href="<?php echo base_url('settings'); ?>" class="btn btn-lg btn-danger">Go to settings</a>
                        <?php } ?>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-xl-6 col-lg-12 mb-4">
              <h2 class="small-title">Withdrawal History</h2>
              <div class="scroll-out">
                <div class="scroll-by-count" data-count="4">
                  <?php
                  if ( !empty( $withdrawals ) ) {
                    foreach ( $withdrawals as $row ) {
                      ?>
                  <div class="card mb-2"> <a href="<?php echo base_url('transactions');?>" class="row g-0 sh-10">
                    <div class="col">
                      <div class="card-body d-flex flex-column h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-3">
                            <div class="text-primary"> Withdrawal </div>
                          </div>
                          <div class="d-flex flex-column col-6">
                            <div class="text-alternate">
                              <?php if($row->amount < 1) { echo 'Amount: '.number_format($row->amount,8).' BPT '.$row->status;}
                                else { ?>
                              Amount: <?php 
                                           if($row->currency == 'USD'){
                                               echo '$'.$row->amount;
                                           }else{
                                               echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol;
                                               echo $this->generic_model->convert_currency($user_details->default_currency,$row->amount);
                                           }
                                             ?>
                                <?php  }?> 
                            </div>
                            <div class="text-small text-muted"> <?php echo $row->description; ?> </div>
                          </div>
                          <div class="d-flex flex-column col-3">
                            <?php
                            if ( $row->status == 'Successful' ) {
                              ?>
                            <span class="badge bg-outline-primary">Successful</span>
                            <?php }elseif($row->status == 'processing' || $row->status == 'pending'){ ?>
                            <span class="badge bg-outline-warning">Processing</span>
                            <?php }else{ ?>
                            <span class="badge bg-outline-danger">Failed</span>
                            <?php } ?>
                          </div>
                        </div>
                      </div>
                    </div>
                    </a> </div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> You do not have transaction to show </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
                </div>
              </div>
            </div>
            <div class="col-12">
              <div class="row">
                <div class="col-xl-6 col-lg-6 col-md-12 mb-4">
                  <div class="card h-100">
                    <div class="position-absolute card-top-buttons">
                      <button class="btn btn-header-light icon-button" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"> <i class="simple-icon-refresh"></i> </button>
                    </div>
                    <div class="card-body">
                      <h3 class="text-primary mb-5">Instant Transfer</h3>
                      <div class="dashboard-quick-post"> <?php echo form_open_multipart('transaction/wallet_transfer'); ?>
                        <div class="filled mb-3"> <i data-acorn-icon="wallet" class="text-danger"></i>
                          <select class="form-control select2-single" name="from">
                            <option>Select Originating Wallet</option>
							<?php
							  if($user_details->is_shareholder == 1) {
							?>
							  <option value="shareholder">Share Holdings</option>
							<?php
							  }
							  ?>
                            <option value="palliative">Palliative Wallet</option>
                          </select>
                        </div>
                        <div class="filled mb-3"> <i data-acorn-icon="wallet" class="text-success"></i>
                          <select class="form-control select2-single" name="to">
                            <option>Select Destination Wallet</option>
                            <option value="wallet">Cash Wallet</option>
                            <option value="cashback">Cashback Wallet</option>
                          </select>
                        </div>
                        <div class="filled mb-3"> <i data-acorn-icon="arrow-top"></i>
                          <input type="text" name="amount" class="form-control" placeholder="Enter Amount To transfer">
                        </div>
                        <div class="filled mb-3">
                          <div class="col-sm-12">
                            <button type="submit" class="btn btn-success float-right">Transfer</button>
                          </div>
                        </div>
                        <?php echo form_close(); ?> </div>
                    </div>
                  </div>
                </div>
                <div class="col-xl-6 col-lg-6 col-md-12 mb-4">
                  <div class="card h-100">
                    <div class="position-absolute card-top-buttons">
                      <button class="btn btn-header-light icon-button" type="button" data-toggle="dropdown"
                                        aria-haspopup="true" aria-expanded="false"> <i class="simple-icon-refresh"></i> </button>
                    </div>
                    <div class="card-body">
                      <h3 class="text-primary mb-5">Crypto Withdrawal</h3>
                      <div class="dashboard-quick-post"> 
                        <?php echo form_open_multipart('transaction/crypto_transfer'); ?>
                         <div class="filled mb-3"> <i data-acorn-icon="wallet" class="text-info"></i>
                          <select name="crypto" required class="form-control">
                              <option value="">Select Crypto Asset</option>
                              <?php if($user_details->default_currency != 2){ ?>
                              <option value="usdt">USDT TRC20</option>
                              <?php } ?>
                              <option value="" class="text-muted" disabled>BPT (Coming Soon)</option>
                          </select>
                        </div>
                        <div class="filled mb-3"> <i data-acorn-icon="wallet" class="text-info"></i>
                          <input type="text" name="amount" class="form-control" placeholder="Enter Amount To withdraw (USD)">
                        </div>
                        <div class="filled mb-3"> <i data-acorn-icon="wallet"></i>
                          <input type="text" name="address" class="form-control" placeholder="Enter wallet address">
                        </div>
                        <div class="filled mb-3">
                          <div class="col-sm-12">
                            <button type="submit" class="btn btn-success float-right"  >Send Request</button>
                          </div>
                        </div>
                        <?php echo form_close(); ?> </div>
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
<script src="<?php echo base_url('assets/js/vendor/moment-with-locales.min.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/Chart.bundle.min.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/chartjs-plugin-rounded-bar.min.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/chartjs-plugin-crosshair.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/chartjs-plugin-datalabels.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/chartjs-plugin-streaming.min.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/progressbar.min.js');?>"></script> 
<script src="<?php echo base_url('assets/js/base/helpers.js');?>"></script> 
<script src="<?php echo base_url('assets/js/base/globals.js');?>"></script> 
<script src="<?php echo base_url('assets/js/base/nav.js');?>"></script> 
<script src="<?php echo base_url('assets/js/base/search.js');?>"></script> 
<script src="<?php echo base_url('assets/js/base/settings.js');?>"></script> 
<script src="<?php echo base_url('assets/js/cs/charts.extend.js');?>"></script> 
<script src="<?php echo base_url('assets/js/pages/dashboard.analysis.js');?>"></script> 
<script src="<?php echo base_url('assets/js/pages/support.ticketsdetail.js');?>"></script> 
<script src="<?php echo base_url('assets/js/common.js');?>"></script> 
<script src="<?php echo base_url('assets/js/scripts.js');?>"></script> 
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script>
        $(document).ready(function() {
            function checkSSN() {
                 $('#connecting').html('<em>Fetching Details...</em>');
                 $('#connecting').show();
                var ssn = $('#ssn').val();

                if (ssn) {
                    $.ajax({
                        url: '<?php echo base_url('check_ssn'); ?>', 
                        type: 'POST',
                        data: { ssn: ssn },
                        dataType: 'json',
                        success: function(response) {
                            if (response.success) {
                                $('#member').val(response.firstname + ' ' + response.lastname);
                                $('#connecting').hide();
                            } else {
                                $('#member').val('');
                                $('#connecting').html('<em>Invalid Member SSC</em>');
                            }
                        },
                        error: function(xhr, status, error) {
                            console.error('AJAX Error:', status, error);
                        }
                    });
                } else {
                    $('#member').val('');
                }
            }

            // Trigger checkSSN on keyup and blur events
            $('#ssn').on('keyup blur', function() {
                checkSSN();
            });
        });
    </script>

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
