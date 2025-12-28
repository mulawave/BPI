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
            <li> <a href="#" data-bs-target="#intel"> <i data-acorn-icon="cpu" class="icon" data-acorn-size="18"></i> <span class="label">Member Center</span> </a>
              <ul>
                <li > <a href="<?php echo base_url('dashboard');?>"> <i data-acorn-icon="user" class="icon d-none text-success" data-acorn-size="18"></i> <span class="label">Return to User</span> </a> </li>
              </ul>
            </li>
            <li> <a href="#" data-bs-target="#dashboard"> <i data-acorn-icon="home" class="icon" data-acorn-size="18"></i> <span class="label">User Section</span> </a>
              <ul>
				  <?php if($user_details->user_type == 'admin'){ ?>
				<li> 
					<a class="active" href="#"> <i data-acorn-icon="home" class="icon d-none" data-acorn-size="18"></i> <span class="label">Admin Overview</span> </a> 
				  </li>
				<li > 
					<a href="<?php echo base_url('admin_notification');?>"> <i data-acorn-icon="user" class="icon d-none"data-acorn-size="18"></i> <span class="label">Notification</span> </a> 
				  </li>
				  <li > 
					 <?php $total_requests = $this->generic_model->get_count('wallet_payments',array('status'=>0)); ?> 
					<a href="<?php echo base_url('top_up_request');?>"> <i data-acorn-icon="wallet" class="icon d-none"data-acorn-size="18"></i> 
						<span class="label">
							Topup Requests 
							<sup class="text-small text-danger">
								<?php if ($total_requests > 0): ?>
								    <?php echo $total_requests; ?><i data-acorn-icon="bell" class="icon d-none text-danger"></i>
								<?php endif; ?> 
							</sup>
						</span> 
					</a> 
				  </li>
				  <li > 
					<a href="<?php echo base_url('review_support_requests');?>"> <i data-acorn-icon="shield-check" class="icon d-none" data-acorn-size="18"></i> <span class="label">CS Requests</span> </a> 
				  </li>
				  <!--<li > 
					<a href="<?php //echo base_url('active_support_requests');?>"> <i data-acorn-icon="shield-check" class="icon d-none" data-acorn-size="18"></i> <span class="label">Active CS Requests</span> </a> 
				  </li>-->
				<li > 
					<a href="<?php echo base_url('admin_bpi_upgrade');?>"> <i data-acorn-icon="shield-check" class="icon d-none" data-acorn-size="18"></i> <span class="label">Subscription Manager</span> </a> 
				  </li>
				<li > 
					<a href="<?php echo base_url('admin_investment');?>"> <i data-acorn-icon="shield-check" class="icon d-none" data-acorn-size="18"></i> <span class="label">Investment Manager</span> </a> 
				  </li>
                <li> 
					<a href="<?php echo base_url('users');?>"> <i data-acorn-icon="user" class="icon d-none" data-acorn-size="18"></i> <span class="label">All Users</span> </a> 
				  </li>
				   <li> 
					<a href="<?php echo base_url('activated_users');?>"> <i data-acorn-icon="user" class="icon d-none" data-acorn-size="18"></i> <span class="label">Activated Users</span> </a> 
				  </li>
				  <li> 
					<a href="<?php echo base_url('admin_nextofkin');?>"> <i data-acorn-icon="user" class="icon d-none" data-acorn-size="18"></i> <span class="label">Beneficiary Claims</span> </a> 
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
                <div class="text-muted font-heading text-small">Project Overview</div>
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
			  <?php if($user_details->user_type == 'admin'){ ?>
			<div class="row g-2 mb-2">
            <div class="col-6 col-md-4 col-lg-2">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center border border-muted mb-4"> <i data-acorn-icon="user" class="text-muted"></i> </div>
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">Total Members</div>
                  <div class="text-primary cta-4">
					<?php echo ($this->generic_model->get_count('users',array('verified'=>1)) + $this->generic_model->get_count('users',array('verified'=>0))); ?>
				  </div>
                </div>
              </div>
            </div>
				  
			<div class="col-6 col-md-4 col-lg-2">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center mb-4"> <i data-acorn-icon="user" class="text-primary"></i><sup class="text-primary" >BPI</sup> </div>
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">BPI Members</div>
                  <div class="text-primary cta-4">
					<?php echo $this->generic_model->count_vip_users_with_active_shelters(); ?>
				  </div>
                </div>
              </div>
            </div>
			
			<div class="col-6 col-md-4 col-lg-2">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center mb-4"> <i data-acorn-icon="user" class="text-danger"></i><sup class="text-danger" ><del>BPI</del></sup> </div>
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">Non BPI Members</div>
                  <div class="text-danger cta-4">
					<?php 
						$verified = $this->generic_model->get_count('users',array('verified'=>1));
						$not_verified = $this->generic_model->get_count('users',array('verified'=>0));
						$vip = $this->generic_model->count_vip_users_with_active_shelters();
						echo (($verified + $not_verified) - $vip);
					 ?>
				  </div>
                </div>
              </div>
            </div>
				  
			<div class="col-6 col-md-4 col-lg-2">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center mb-4"> <i data-acorn-icon="shield-check" class="text-primary"></i><sup class="text-warning" >Shelter</sup> </div>
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">Active Shelter Wallets</div>
                  <div class="text-primary cta-4">
					<?php echo $this->generic_model->get_count('users',array('shelter_wallet'=>1)); ?>
				  </div>
                </div>
              </div>
            </div>
          	
			<div class="col-6 col-md-4 col-lg-2">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center mb-4"> <i data-acorn-icon="email" class="text-primary"></i></div>
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">Verifed Emails</div>
                  <div class="text-primary cta-4">
					<?php echo $this->generic_model->get_count('users',array('verified'=>1)); ?>
				  </div>
                </div>
              </div>
            </div>
			
			<div class="col-6 col-md-4 col-lg-2">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="sw-6 sh-6 rounded-xl d-flex justify-content-center align-items-center mb-4"> <i data-acorn-icon="email" class="text-danger"></i></div>
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">Unverifed Emails</div>
                  <div class="text-danger cta-4">
					<?php 
					  $unverified = $this->generic_model->get_count('users',array('verified'=>0)); 
					  echo $unverified; ?>
				  </div>
					
					 <?php if(!empty($unverified)) { ?>
					  <div class="text-danger cta-4">
						  <a href="<?php echo base_url('verifyAll'); ?>" class="btn btn-icon btn-icon-start btn-outline-primary mt-1"> <i data-acorn-icon="check"></i> <span>Mass Verify</span> </a>
					   </div>
					<?php  } ?>
                </div>
              </div>
            </div>
				  
          </div>
          
			<div class="row g-2 mb-2">
			<h5 class="mb-3 mt-3">Activation Overview!</h5>
            <div class="col-6 col-md-4 col-lg-2">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">Total Activated</div>
                  <div class="text-primary cta-4">
					<?php echo $this->generic_model->count_vip_users_with_active_shelters(); ?>
				  </div>
                </div>
              </div>
            </div>
							  
			<div class="col-6 col-md-4 col-lg-2">
			<a href="#" data-bs-toggle="modal" data-bs-target="#largeRightModalExamplePlatinum">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">Platinum Members</div>
                  <div class="text-primary">
					<?php $platinum = $this->generic_model->get_count('active_shelters',array('amount'=> 310000,'status'=>'active')); 
					   echo $platinum;
					  ?>
					  
				  </div>
				  <div class="text-primary cta-4 mt-2">
				<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>  
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,(310000 * $platinum)); ?>
				  </div>
                </div>
              </div>
			</a>
            </div>
				
          	<div class="modal modal-right large fade" id="largeRightModalExamplePlatinum" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Platinum Members</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						<?php 
							$platinum_members = $this->generic_model->get_vip_users_with_specific_amount(310000);
							if(!empty($platinum_members)){
								foreach($platinum_members as $member){
									//$userinfo = $this->generic_model->getInfo('users','id',$member->user_id); ?>
						         <div class="card mb-2 hover-border-primary"> 
									  <a href="<?php echo base_url('users_details/'.$member->id); ?>" class="row g-0 sh-9">
									<div class="col-auto">
									  <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
										<div class="fw-bold text-primary"> <i data-acorn-icon="user"></i> </div>
									  </div>
									</div>
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
										  <div class="text-alternate"><?php echo $member->firstname.' '.$member->lastname; ?></div>
										  <div class="text-small text-muted"><?php echo $member->email; ?></div>
										</div>
									  </div>
									</div>
									</a> 
								</div>
						<?php
								}
							}else{
								echo 'No member found for this category';
							}
						?>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
				  
			<div class="col-6 col-md-4 col-lg-2">
			<a href="#" data-bs-toggle="modal" data-bs-target="#largeRightModalExampleGold">	
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">Gold Members</div>
                  <div class="text-primary cta-4">
					<?php 
						$debitGold = (210000 * 6);
						$gold = $this->generic_model->get_count('active_shelters',array('amount'=> 210000,'status'=>'active'));
						$real_gold = ($gold - 6);
						?>
					
					<?php echo $gold; ?>  
				  </div>
				   <div class="text-primary cta-4 mt-2">
				<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>  
				<?php echo $this->generic_model->convert_currency($user_details->default_currency,(210000 * $gold) - $debitGold); ?>
				  </div>
                </div>
              </div>
			</a>
            </div>
				
			<div class="modal modal-right large fade" id="largeRightModalExampleGold" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Gold Members</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						<?php 
							$gold_members = $this->generic_model->get_vip_users_with_specific_amount(210000);
							if(!empty($gold_members)){
								foreach($gold_members as $member){
									//$userinfo = $this->generic_model->getInfo('users','id',$member->id); ?>
						         <div class="card mb-2 hover-border-primary"> 
									  <a href="<?php echo base_url('users_details/'.$member->id); ?>" class="row g-0 sh-9">
									<div class="col-auto">
									  <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
										<div class="fw-bold text-primary"> <i data-acorn-icon="user"></i> </div>
									  </div>
									</div>
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
										  <div class="text-alternate"><?php echo $member->firstname.' '.$member->lastname; ?></div>
										  <div class="text-small text-muted"><?php echo $member->email; ?></div>
										</div>
									  </div>
									</div>
									</a> 
								</div>
						<?php
								}
							}else{
								echo 'No member found for this category';
							}
						?>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>	  
				  		
			<div class="col-6 col-md-4 col-lg-2">
			<a href="#" data-bs-toggle="modal" data-bs-target="#largeRightModalExampleRegularPlus">	
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">Regular+ Members</div>
                  <div class="text-primary cta-4">
					  <?php $regp =  ($this->generic_model->get_count('active_shelters',array('amount'=> 40000,'status'=>'active')) + $this->generic_model->get_count('active_shelters',array('amount'=> 50000,'status'=>'active')) ); ?>
					  <?php echo $regp; ?>
				  </div>
				 <div class="text-primary cta-4 mt-2">
				<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>  
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,(50000 * $regp)); ?>
				  </div>	
                </div>
              </div>
			</a>
            </div>
				
			<div class="modal modal-right large fade" id="largeRightModalExampleRegularPlus" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Regular+ Members</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						<?php 
							$regplus_members = $this->generic_model->get_vip_users_with_specific_amount(50000);
							if(!empty($regplus_members)){
								foreach($regplus_members as $member){
									//$userinfo = $this->generic_model->getInfo('users','id',$member->user_id); ?>
						         <div class="card mb-2 hover-border-primary"> 
									  <a href="<?php echo base_url('users_details/'.$member->id); ?>" class="row g-0 sh-9">
									<div class="col-auto">
									  <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
										<div class="fw-bold text-primary"> <i data-acorn-icon="user"></i> </div>
									  </div>
									</div>
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
										  <div class="text-alternate"><?php echo $member->firstname.' '.$member->lastname; ?></div>
										  <div class="text-small text-muted"><?php echo $member->email; ?></div>
										</div>
									  </div>
									</div>
									</a> 
								</div>
						<?php
								}
							}else{
								echo 'No member found for this category';
							}
						?>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
				 		
			<div class="col-6 col-md-4 col-lg-2">
			<a href="#" data-bs-toggle="modal" data-bs-target="#largeRightModalExampleRegularPro">	
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">Regular Pro Members</div>
                  <div class="text-primary cta-4">
					  <?php $regPro =  $this->generic_model->get_count('active_shelters',array('amount'=> 23000,'status'=>'active')); ?>
					  <?php echo $regPro; ?>
				  </div>
				 <div class="text-primary cta-4 mt-2">
				<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>  
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,(23000 * $regPro)); ?>
				  </div>	
                </div>
              </div>
			</a>
            </div>
			<div class="modal modal-right large fade" id="largeRightModalExampleRegularPro" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Regular Pro Members</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						<?php 
							$regpro_members = $this->generic_model->get_vip_users_with_specific_amount(23000);
							if(!empty($regpro_members)){
								foreach($regpro_members as $member){
									//$userinfo = $this->generic_model->getInfo('users','id',$member->user_id); ?>
						         <div class="card mb-2 hover-border-primary"> 
									  <a href="<?php echo base_url('users_details/'.$member->id); ?>" class="row g-0 sh-9">
									<div class="col-auto">
									  <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
										<div class="fw-bold text-primary"> <i data-acorn-icon="user"></i> </div>
									  </div>
									</div>
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
										  <div class="text-alternate"><?php echo $member->firstname.' '.$member->lastname; ?></div>
										  <div class="text-small text-muted"><?php echo $member->email; ?></div>
										</div>
									  </div>
									</div>
									</a> 
								</div>
						<?php
								}
							}else{
								echo 'No member found for this category';
							}
						?>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
			
				  
			<div class="col-6 col-md-4 col-lg-2">
			<a href="#" data-bs-toggle="modal" data-bs-target="#largeRightModalRegular">	
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">Regular Members</div>
                  <div class="text-primary cta-4">
					<?php $regs = $this->generic_model->get_count('active_shelters',array('amount'=>10000,'status'=>'active')); ?>
					<?php echo $regs; ?>
				  </div>
				   <div class="text-primary cta-4 mt-2">
				<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>  
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,(10000 * $regs)); ?>
				  </div>
                </div>
              </div>
			</a>
            </div>
			<div class="modal modal-right large fade" id="largeRightModalRegular" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Regular Members</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						<?php 
							$regular_members = $this->generic_model->get_vip_users_with_specific_amount(10000);
							if(!empty($regular_members)){
								foreach($regular_members as $member){
									//$userinfo = $this->generic_model->getInfo('users','id',$member->user_id); ?>
						         <div class="card mb-2 hover-border-primary"> 
									  <a href="<?php echo base_url('users_details/'.$member->id); ?>" class="row g-0 sh-9">
									<div class="col-auto">
									  <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
										<div class="fw-bold text-primary"> <i data-acorn-icon="user"></i> </div>
									  </div>
									</div>
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
										  <div class="text-alternate"><?php echo $member->firstname.' '.$member->lastname; ?></div>
										  <div class="text-small text-muted"><?php echo $member->email; ?></div>
										</div>
									  </div>
									</div>
									</a> 
								</div>
						<?php
								}
							}else{
								echo 'No member found for this category';
							}
						?>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
		
				  
			<div class="col-6 col-md-4 col-lg-2">
			<a href="#" data-bs-toggle="modal" data-bs-target="#largeRightModalExamplePend">	
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">Pending Approval</div>
                  <div class="text-primary cta-4">
					<?php echo $this->generic_model->get_count('active_shelters',array('status'=>'Pending')); ?>
				  </div>
                </div>
              </div>
			</a>
            </div>
			<div class="modal modal-right large fade" id="largeRightModalExamplePend" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Pending Members</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						<?php 
							$non_members = $this->generic_model->select_where('active_shelters',array('status'=>'Pending'));
							if(!empty($non_members)){
								foreach($non_members as $mem_member){
									$mem_userinfo = $this->generic_model->getInfo('users','id',$mem_member->user_id); ?>
						         <div class="card mb-2 hover-border-primary"> 
									  <a href="<?php echo base_url('users_details/'.$mem_member->user_id); ?>" class="row g-0 sh-9">
									<div class="col-auto">
									  <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
										<div class="fw-bold text-primary"> <i data-acorn-icon="user"></i> </div>
									  </div>
									</div>
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
										  <div class="text-alternate"><?php echo $mem_userinfo->firstname.' '.$mem_userinfo->lastname; ?></div>
										  <div class="text-small text-muted"><?php echo $mem_userinfo->email; ?></div>
										</div>
									  </div>
									</div>
									</a> 
								</div>
						<?php
								}
							}else{
								echo 'No member found for this category';
							}
						?>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
            </div>
            
            <div class="row g-2 mb-2">
               	<h5 class="mb-3 mt-3">Management Overview!</h5>
               	<?php
               	    $regular_share = $this->generic_model->getInfo('shareholders_plan','source','regular');
               	    $ceo_regular = $regular_share->ceo_wallet;
               	    $cto_regular = $regular_share->cto_wallet;
               	    $tech_regular = $regular_share->tech_rd;
               	    $training_regular = $regular_share->training_pool;
               	    $state_rep_regular = $regular_share->state_reps;
               	    $exec_regular = $regular_share->exec_pool;
					$regular_pool = $this->generic_model->getInfo('investors_pool','source','regular')->amount;
               	    /////////////////////////////////////////////////
               	    
               	    $regular_pro_share = $this->generic_model->getInfo('shareholders_plan','source','regularPro');
               	    $ceo_regular_pro = $regular_pro_share->ceo_wallet;
               	    $cto_regular_pro = $regular_pro_share->cto_wallet;
               	    $tech_regular_pro = $regular_pro_share->tech_rd;
               	    $training_regular_pro = $regular_pro_share->training_pool;
               	    $state_rep_regular_pro = $regular_pro_share->state_reps;
               	    $exec_regular_pro = $regular_pro_share->exec_pool;
					$regular_pro_pool = $this->generic_model->getInfo('investors_pool','source','regular_pro')->amount;
               	    /////////////////////////////////////////////////
               	    
               	    $regular_plus_share = $this->generic_model->getInfo('shareholders_plan','source','regularPlus');
               	    $ceo_regular_plus = $regular_plus_share->ceo_wallet;
               	    $cto_regular_plus = $regular_plus_share->cto_wallet;
               	    $tech_regular_plus = $regular_plus_share->tech_rd;
               	    $training_regular_plus = $regular_plus_share->training_pool;
               	    $state_rep_regular_plus = $regular_plus_share->state_reps;
               	    $exec_regular_plus = $regular_plus_share->exec_pool;
					$regular_plus_pool = $this->generic_model->getInfo('investors_pool','source','regular_plus')->amount;
               	    /////////////////////////////////////////////////
               	    
               	    $gold_share = $this->generic_model->getInfo('shareholders_plan','source','gold');
               	    $ceo_gold = $gold_share->ceo_wallet;
               	    $cto_gold = $gold_share->cto_wallet;
               	    $tech_gold = $gold_share->tech_rd;
               	    $training_gold = $gold_share->training_pool;
               	    $state_rep_gold = $gold_share->state_reps;
               	    $exec_gold = $gold_share->exec_pool;
					$gold_pool = $this->generic_model->getInfo('investors_pool','source','gold')->amount;
               	    /////////////////////////////////////////////////
               	    
               	    $platinum_share = $this->generic_model->getInfo('shareholders_plan','source','platinum');
               	    $ceo_platinum = $platinum_share->ceo_wallet;
               	    $cto_platinum = $platinum_share->cto_wallet;
               	    $tech_platinum = $platinum_share->tech_rd;
               	    $training_platinum = $platinum_share->training_pool;
               	    $state_rep_platinum = $platinum_share->state_reps;
               	    $exec_platinum = $platinum_share->exec_pool;
					$platinum_pool = $this->generic_model->getInfo('investors_pool','source','platinum')->amount;
               	    /////////////////////////////////////////////////
               	    
               	    $pickup_share = $this->generic_model->getInfo('shareholders_plan','source','pickup');
               	    $ceo_pickup = $pickup_share->ceo_wallet;
               	    $cto_pickup = $pickup_share->cto_wallet;
               	    $tech_pickup = $pickup_share->tech_rd;
               	    $training_pickup = $pickup_share->training_pool;
               	    $state_rep_pickup = $pickup_share->state_reps;
               	    $exec_pickup = $pickup_share->exec_pool;
               	    /////////////////////////////////////////////////
               	    
               	    $pickup_centers = $this->generic_model->get_count('merchants',array('status'=>'active'));
               	    $real_pickup = ($pickup_centers - 2);
               	    
               	    $pool = ($regular_pool * $regs) + ($regular_pro_pool * $regp) + ($regular_plus_pool + $regPro) + ($gold_pool + $real_gold) + ($platinum_pool + $platinum);
					$pool_withdrawal = $this->generic_model->getSum('share_withdrawal','amount',array('user_id'=>1));
					$investors_pool = ($pool - $pool_withdrawal);
															
               	    $ceo_share_withdrawal = $this->generic_model->getSum('share_withdrawal','amount',array('user_id'=>2));
               	    $ceo_wallet_total = ($ceo_regular * $regs) + ($ceo_regular_plus * $regp) + ($ceo_regular_pro + $regPro) + ($ceo_gold + $real_gold) + ($ceo_platinum + $platinum) + ($ceo_pickup * $real_pickup);
               	    
               	    $cto_share_withdrawal = $this->generic_model->getSum('share_withdrawal','amount',array('user_id'=>67));
               	    $cto_wallet_total = ($cto_regular * $regs) + ($cto_regular_plus * $regp) + ($cto_regular_pro + $regPro) + ($cto_gold + $real_gold) + ($cto_platinum + $platinum) + ($cto_pickup * $real_pickup);
               	    
               	    $tech_wallet_total = ($tech_regular * $regs) + ($tech_regular_plus * $regp) + ($tech_regular_pro + $regPro) + ($tech_gold + $real_gold) + ($tech_platinum + $platinum) + ($tech_pickup * $real_pickup);
               	    
               	    $training_wallet_total = ($training_regular * $regs) + ($training_regular_pro * $regp) + ($training_regular_plus + $regPro) + ($training_gold + $real_gold) + ($training_platinum + $platinum) + ($training_pickup * $real_pickup);
               	    
               	    $state_reps_wallet_total = ($state_rep_regular * $regs) + ($state_rep_regular_plus * $regp) + ($state_rep_regular_pro + $regPro) + ($state_rep_gold + $real_gold) + ($state_rep_platinum + $platinum) + ($state_rep_pickup * $real_pickup);
               	    
               	    $exec_pool_wallet_total = ($exec_regular * $regs) + ($exec_regular_pro * $regp) + ($exec_regular_plus + $regPro) + ($exec_gold + $real_gold) + ($exec_platinum + $platinum) + ($exec_pickup * $real_pickup);
               	?>
               		<div class="col-6 col-md-4 col-lg-2">
        			<a href="#">
                      <div class="card h-100 hover-scale-up cursor-pointer">
                        <div class="card-body d-flex flex-column align-items-center">
                          <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">CEO Wallet</div>
                          <div class="text-primary">
        				  </div>
        				  <div class="text-primary cta-4 mt-2">
        				<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>  
        					<?php echo $this->generic_model->convert_currency($user_details->default_currency,($ceo_wallet_total-$ceo_share_withdrawal)); ?>
        				  </div>
                        </div>
                      </div>
        			</a>
                    </div>
                    <div class="col-6 col-md-4 col-lg-2">
                			<a href="#">
                              <div class="card h-100 hover-scale-up cursor-pointer">
                                <div class="card-body d-flex flex-column align-items-center">
                                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">CTO Wallet</div>
                                  <div class="text-primary">
                				  </div>
                				  <div class="text-primary cta-4 mt-2">
                			    	<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>  
                					<?php echo $this->generic_model->convert_currency($user_details->default_currency,($cto_wallet_total-$cto_share_withdrawal)); ?>
                				  </div>
                                </div>
                              </div>
                			</a>
                     </div>
                    <div class="col-6 col-md-4 col-lg-2">
                			<a href="#">
                              <div class="card h-100 hover-scale-up cursor-pointer">
                                <div class="card-body d-flex flex-column align-items-center">
                                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">Tech R & D</div>
                                  <div class="text-primary">
                				  </div>
                				  <div class="text-primary cta-4 mt-2">
                			    	<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>  
                					<?php echo $this->generic_model->convert_currency($user_details->default_currency,$tech_wallet_total); ?>
                				  </div>
                                </div>
                              </div>
                			</a>
                     </div>
                    <div class="col-6 col-md-4 col-lg-2">
                			<a href="#">
                              <div class="card h-100 hover-scale-up cursor-pointer">
                                <div class="card-body d-flex flex-column align-items-center">
                                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">Training Pool</div>
                                  <div class="text-primary">
                				  </div>
                				  <div class="text-primary cta-4 mt-2">
                			    	<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>  
                					<?php echo $this->generic_model->convert_currency($user_details->default_currency,$training_wallet_total); ?>
                				  </div>
                                </div>
                              </div>
                			</a>
                     </div>
                    <div class="col-6 col-md-4 col-lg-2">
                			<a href="#">
                              <div class="card h-100 hover-scale-up cursor-pointer">
                                <div class="card-body d-flex flex-column align-items-center">
                                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">State Reps Pool</div>
                                  <div class="text-primary">
                				  </div>
                				  <div class="text-primary cta-4 mt-2">
                			    	<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>  
                					<?php  echo $this->generic_model->convert_currency($user_details->default_currency,$state_reps_wallet_total); ?>
                				  </div>
                                </div>
                              </div>
                			</a>
                     </div>
                    <div class="col-6 col-md-4 col-lg-2">
                			<a href="#">
                              <div class="card h-100 hover-scale-up cursor-pointer">
                                <div class="card-body d-flex flex-column align-items-center">
                                  <div class="mb-1 d-flex align-items-center text-alternate text-small lh-1-25">Execs Pool</div>
                                  <div class="text-primary">
                				  </div>
                				  <div class="text-primary cta-4 mt-2">
                			    	<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>  
                					<?php  echo $this->generic_model->convert_currency($user_details->default_currency,$exec_pool_wallet_total); ?>
                				  </div>
                                </div>
                              </div>
                			</a>
                     </div>
          </div>
			  			  
		   <div class="row g-2 mb-2">
			<h5 class="mb-3 mt-3">Finance Overview!</h5>
            <div class="col-6 col-md-4 col-lg-2">
				<a href="#" data-bs-toggle="modal" data-bs-target="#largeRightModalWallet">
				  <div class="card h-100 hover-scale-up cursor-pointer">
					<div class="card-body d-flex flex-column align-items-center">
					  <div class="mb-1 d-flex align-items-center text-alternate lh-1-25">Total Wallet</div>
					  <div class="text-primary cta-4">
					<?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,$this->generic_model->get_sum_excluding_ids('wallet', 'users', $exclude_ids)); ?>
					  </div>
					</div>
				  </div>
				</a>
            </div>
			<div class="modal modal-right large fade" id="largeRightModalWallet" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Regular Members</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						<?php 
		     $wallet_members = $this->generic_model->get_users_with_non_empty_column_excluding_ids('users', 'wallet', $exclude_ids);
							if(!empty($wallet_members)){
								foreach($wallet_members as $member){
									//$userinfo = $this->generic_model->getInfo('users','id',$member->user_id); ?>
						         <div class="card mb-2 hover-border-primary"> 
									  <a href="<?php echo base_url('users_details/'.$member->id); ?>" class="row g-0 sh-9">
									<div class="col-auto">
									  <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
										<div class="fw-bold text-primary"> <i data-acorn-icon="user"></i> </div>
									  </div>
									</div>
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
										  <div class="text-alternate"><?php echo $member->firstname.' '.$member->lastname; ?></div>
										  <div class="text-muted">
				   <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				<?php echo $this->generic_model->convert_currency($user_details->default_currency,$member->wallet); ?></div>
										</div>
									  </div>
									</div>
									</a> 
								</div>
						<?php
								}
							}else{
								echo 'No member found for this category';
							}
						?>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
				  
				  
			<div class="col-6 col-md-4 col-lg-2">
			<a href="#" data-bs-toggle="modal" data-bs-target="#largeRightModalSpendable">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate lh-1-25">Total Spendable</div>
                  <div class="text-primary cta-4">
					<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,$this->generic_model->get_sum_excluding_ids('spendable', 'users', $exclude_ids));  ?>
				  </div>
                </div>
              </div>
			</a>
            </div>
			<div class="modal modal-right large fade" id="largeRightModalSpendable" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Spendable Wallets</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						<?php 
		     $wallet_members = $this->generic_model->get_users_with_non_empty_column_excluding_ids('users', 'spendable', $exclude_ids);
							if(!empty($wallet_members)){
								foreach($wallet_members as $member){
									//$userinfo = $this->generic_model->getInfo('users','id',$member->user_id); ?>
						         <div class="card mb-2 hover-border-primary"> 
									  <a href="<?php echo base_url('users_details/'.$member->id); ?>" class="row g-0 sh-9">
									<div class="col-auto">
									  <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
										<div class="fw-bold text-primary"> <i data-acorn-icon="user"></i> </div>
									  </div>
									</div>
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
										  <div class="text-alternate"><?php echo $member->firstname.' '.$member->lastname; ?></div>
										  <div class="text-muted">
				   <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				<?php echo $this->generic_model->convert_currency($user_details->default_currency,$member->spendable); ?></div>
										</div>
									  </div>
									</div>
									</a> 
								</div>
						<?php
								}
							}else{
								echo 'No member found for this category';
							}
						?>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
			   
			<div class="col-6 col-md-4 col-lg-2">
			<a href="#" data-bs-toggle="modal" data-bs-target="#largeRightModalPalliative">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate lh-1-25">Total Palliative</div>
                  <div class="text-primary cta-4">
					<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,$this->generic_model->get_sum_excluding_ids('palliative', 'users', $exclude_ids));  ?>
				  </div>
                </div>
              </div>
			</a>
            </div>
			<div class="modal modal-right large fade" id="largeRightModalPalliative" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Palliative Wallets</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						<?php 
		     $wallet_members = $this->generic_model->get_users_with_non_empty_column_excluding_ids('users', 'palliative', $exclude_ids);
							if(!empty($wallet_members)){
								foreach($wallet_members as $member){
									//$userinfo = $this->generic_model->getInfo('users','id',$member->user_id); ?>
						         <div class="card mb-2 hover-border-primary"> 
									  <a href="<?php echo base_url('users_details/'.$member->id); ?>" class="row g-0 sh-9">
									<div class="col-auto">
									  <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
										<div class="fw-bold text-primary"> <i data-acorn-icon="user"></i> </div>
									  </div>
									</div>
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
										  <div class="text-alternate"><?php echo $member->firstname.' '.$member->lastname; ?></div>
										  <div class="text-muted">
				   <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				<?php echo $this->generic_model->convert_currency($user_details->default_currency,$member->palliative); ?></div>
										</div>
									  </div>
									</div>
									</a> 
								</div>
						<?php
								}
							}else{
								echo 'No member found for this category';
							}
						?>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div> 
				  
			<div class="col-6 col-md-4 col-lg-2">
			<a href="#" data-bs-toggle="modal" data-bs-target="#largeRightModalCashback">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate lh-1-25">Total Cashback</div>
                  <div class="text-primary cta-4">
					<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,$this->generic_model->get_sum_excluding_ids('cashback', 'users', $exclude_ids));  ?>
				  </div>
                </div>
              </div>
			</a>
            </div>
			<div class="modal modal-right large fade" id="largeRightModalCashback" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Cashback Wallets</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						<?php 
		     $wallet_members = $this->generic_model->get_users_with_non_empty_column_excluding_ids('users', 'cashback', $exclude_ids);
							if(!empty($wallet_members)){
								foreach($wallet_members as $member){
									//$userinfo = $this->generic_model->getInfo('users','id',$member->user_id); ?>
						         <div class="card mb-2 hover-border-primary"> 
									  <a href="<?php echo base_url('users_details/'.$member->id); ?>" class="row g-0 sh-9">
									<div class="col-auto">
									  <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
										<div class="fw-bold text-primary"> <i data-acorn-icon="user"></i> </div>
									  </div>
									</div>
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
										  <div class="text-alternate"><?php echo $member->firstname.' '.$member->lastname; ?></div>
										  <div class="text-muted">
				   <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				<?php echo $this->generic_model->convert_currency($user_details->default_currency,$member->cashback); ?></div>
										</div>
									  </div>
									</div>
									</a> 
								</div>
						<?php
								}
							}else{
								echo 'No member found for this category';
							}
						?>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
			   
			<div class="col-6 col-md-4 col-lg-2">
			<a href="#" data-bs-toggle="modal" data-bs-target="#largeRightModalBPT">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate lh-1-25">Total BPT</div>
                  <div class="text-primary cta-4">
					<?php $tbpt =  $this->generic_model->get_sum_excluding_ids('token', 'users', $exclude_ids); $bpt_naira = ($tbpt * 20); echo $tbpt;  ?> BPT
					<br>
					<small>
					      <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				          <?php echo $this->generic_model->convert_currency($user_details->default_currency,$bpt_naira); ?>
					</small>
				  </div>
                </div>
              </div>
			</a>
            </div>
			<div class="modal modal-right large fade" id="largeRightModalBPT" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">BPT Wallets</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						<?php 
		     $wallet_members = $this->generic_model->get_users_with_non_empty_column_excluding_ids('users', 'token', $exclude_ids);
							if(!empty($wallet_members)){
								foreach($wallet_members as $member){
									//$userinfo = $this->generic_model->getInfo('users','id',$member->user_id); ?>
						         <div class="card mb-2 hover-border-primary"> 
									  <a href="<?php echo base_url('users_details/'.$member->id); ?>" class="row g-0 sh-9">
									<div class="col-auto">
									  <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
										<div class="fw-bold text-primary"> <i data-acorn-icon="user"></i> </div>
									  </div>
									</div>
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
										  <div class="text-alternate"><?php echo $member->firstname.' '.$member->lastname; ?></div>
										  <div class="text-muted">
				<?php echo $this->generic_model->convert_currency($user_details->default_currency,$member->token); ?> BPT</div>
										</div>
									  </div>
									</div>
									</a> 
								</div>
						<?php
								}
							}else{
								echo 'No member found for this category';
							}
						?>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
			   
			<div class="col-6 col-md-4 col-lg-2">
			<a href="#" data-bs-toggle="modal" data-bs-target="#largeRightModalShelter">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate lh-1-25">Total Shelter</div>
                  <div class="text-primary cta-4">
					<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,$this->generic_model->get_sum_excluding_ids('shelter', 'users', $exclude_ids));  ?>
				  </div>
                </div>
              </div>
			</a>
            </div>
			<div class="modal modal-right large fade" id="largeRightModalShelter" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Spendable Wallets</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						<?php 
		     $wallet_members = $this->generic_model->get_users_with_non_empty_column_excluding_ids('users', 'shelter', $exclude_ids);
							if(!empty($wallet_members)){
								foreach($wallet_members as $member){
									//$userinfo = $this->generic_model->getInfo('users','id',$member->user_id); ?>
						         <div class="card mb-2 hover-border-primary"> 
									  <a href="<?php echo base_url('users_details/'.$member->id); ?>" class="row g-0 sh-9">
									<div class="col-auto">
									  <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
										<div class="fw-bold text-primary"> <i data-acorn-icon="user"></i> </div>
									  </div>
									</div>
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
										  <div class="text-alternate"><?php echo $member->firstname.' '.$member->lastname; ?></div>
										  <div class="text-muted">
				   <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				<?php echo $this->generic_model->convert_currency($user_details->default_currency,$member->shelter); ?></div>
										</div>
									  </div>
									</div>
									</a> 
								</div>
						<?php
								}
							}else{
								echo 'No member found for this category';
							}
						?>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
			   				  
          </div>
			<div class="row g-2 mb-2">
            <div class="col-6 col-md-4 col-lg-2">
			<a href="#" data-bs-toggle="modal" data-bs-target="#largeRightModalEducation">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate lh-1-25">Total Edu Wallet</div>
                  <div class="text-primary cta-4">
					<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,$this->generic_model->get_sum_excluding_ids('education', 'users', $exclude_ids));  ?>
				  </div>
                </div>
              </div>
			</a>
            </div>
			<div class="modal modal-right large fade" id="largeRightModalEducation" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Spendable Wallets</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						<?php 
		     $wallet_members = $this->generic_model->get_users_with_non_empty_column_excluding_ids('users', 'education', $exclude_ids);
							if(!empty($wallet_members)){
								foreach($wallet_members as $member){
									//$userinfo = $this->generic_model->getInfo('users','id',$member->user_id); ?>
						         <div class="card mb-2 hover-border-primary"> 
									  <a href="<?php echo base_url('users_details/'.$member->id); ?>" class="row g-0 sh-9">
									<div class="col-auto">
									  <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
										<div class="fw-bold text-primary"> <i data-acorn-icon="user"></i> </div>
									  </div>
									</div>
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
										  <div class="text-alternate"><?php echo $member->firstname.' '.$member->lastname; ?></div>
										  <div class="text-muted">
				   <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				<?php echo $this->generic_model->convert_currency($user_details->default_currency,$member->education); ?></div>
										</div>
									  </div>
									</div>
									</a> 
								</div>
						<?php
								}
							}else{
								echo 'No member found for this category';
							}
						?>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
				  
			<div class="col-6 col-md-4 col-lg-2">
			<a href="#" data-bs-toggle="modal" data-bs-target="#largeRightModalCar">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate lh-1-25">Total Car Wallet</div>
                  <div class="text-primary cta-4">
					<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,$this->generic_model->get_sum_excluding_ids('car', 'users', $exclude_ids));  ?>
				  </div>
                </div>
              </div>
			</a>
            </div>
			<div class="modal modal-right large fade" id="largeRightModalCar" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Spendable Wallets</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						<?php 
		     $wallet_members = $this->generic_model->get_users_with_non_empty_column_excluding_ids('users', 'car', $exclude_ids);
							if(!empty($wallet_members)){
								foreach($wallet_members as $member){
									//$userinfo = $this->generic_model->getInfo('users','id',$member->user_id); ?>
						         <div class="card mb-2 hover-border-primary"> 
									  <a href="<?php echo base_url('users_details/'.$member->id); ?>" class="row g-0 sh-9">
									<div class="col-auto">
									  <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
										<div class="fw-bold text-primary"> <i data-acorn-icon="user"></i> </div>
									  </div>
									</div>
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
										  <div class="text-alternate"><?php echo $member->firstname.' '.$member->lastname; ?></div>
										  <div class="text-muted">
				   <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				<?php echo $this->generic_model->convert_currency($user_details->default_currency,$member->car); ?></div>
										</div>
									  </div>
									</div>
									</a> 
								</div>
						<?php
								}
							}else{
								echo 'No member found for this category';
							}
						?>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
			   
			<div class="col-6 col-md-4 col-lg-2">
			<a href="#" data-bs-toggle="modal" data-bs-target="#largeRightModalBiz">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate lh-1-25">Total Biz Wallet</div>
                  <div class="text-primary cta-4">
					<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,$this->generic_model->get_sum_excluding_ids('business', 'users', $exclude_ids));  ?>
				  </div>
                </div>
              </div>
			</a>
            </div>
			<div class="modal modal-right large fade" id="largeRightModalBiz" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Business Wallets</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						<?php 
		     $wallet_members = $this->generic_model->get_users_with_non_empty_column_excluding_ids('users', 'business', $exclude_ids);
							if(!empty($wallet_members)){
								foreach($wallet_members as $member){
									//$userinfo = $this->generic_model->getInfo('users','id',$member->user_id); ?>
						         <div class="card mb-2 hover-border-primary"> 
									  <a href="<?php echo base_url('users_details/'.$member->id); ?>" class="row g-0 sh-9">
									<div class="col-auto">
									  <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
										<div class="fw-bold text-primary"> <i data-acorn-icon="user"></i> </div>
									  </div>
									</div>
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
										  <div class="text-alternate"><?php echo $member->firstname.' '.$member->lastname; ?></div>
										  <div class="text-muted">
				   <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				<?php echo $this->generic_model->convert_currency($user_details->default_currency,$member->business); ?></div>
										</div>
									  </div>
									</div>
									</a> 
								</div>
						<?php
								}
							}else{
								echo 'No member found for this category';
							}
						?>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
			   
			<div class="col-6 col-md-4 col-lg-2">
			<a href="#" data-bs-toggle="modal" data-bs-target="#largeRightModalLand">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate lh-1-25">Total Land Wallet</div>
                  <div class="text-primary cta-4">
					<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,$this->generic_model->get_sum_excluding_ids('land', 'users', $exclude_ids));  ?>
				  </div>
                </div>
              </div>
			</a>
            </div>
			<div class="modal modal-right large fade" id="largeRightModalLand" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Land Wallets</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						<?php 
		     $wallet_members = $this->generic_model->get_users_with_non_empty_column_excluding_ids('users', 'land', $exclude_ids);
							if(!empty($wallet_members)){
								foreach($wallet_members as $member){
									//$userinfo = $this->generic_model->getInfo('users','id',$member->user_id); ?>
						         <div class="card mb-2 hover-border-primary"> 
									  <a href="<?php echo base_url('users_details/'.$member->id); ?>" class="row g-0 sh-9">
									<div class="col-auto">
									  <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
										<div class="fw-bold text-primary"> <i data-acorn-icon="user"></i> </div>
									  </div>
									</div>
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
										  <div class="text-alternate"><?php echo $member->firstname.' '.$member->lastname; ?></div>
										  <div class="text-muted">
				   <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				<?php echo $this->generic_model->convert_currency($user_details->default_currency,$member->land); ?></div>
										</div>
									  </div>
									</div>
									</a> 
								</div>
						<?php
								}
							}else{
								echo 'No member found for this category';
							}
						?>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
			   
			<div class="col-6 col-md-4 col-lg-2">
			<a href="#" data-bs-toggle="modal" data-bs-target="#largeRightModalSolar">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate lh-1-25">Total Solar Wallet</div>
                  <div class="text-primary cta-4">
					<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,$this->generic_model->get_sum_excluding_ids('solar', 'users', $exclude_ids)); ?>
				  </div>
                </div>
              </div>
			</a>
            </div>
			<div class="modal modal-right large fade" id="largeRightModalSolar" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Solar Wallets</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						<?php 
		     $wallet_members = $this->generic_model->get_users_with_non_empty_column_excluding_ids('users', 'solar', $exclude_ids);
							if(!empty($wallet_members)){
								foreach($wallet_members as $member){
									//$userinfo = $this->generic_model->getInfo('users','id',$member->user_id); ?>
						         <div class="card mb-2 hover-border-primary"> 
									  <a href="<?php echo base_url('users_details/'.$member->id); ?>" class="row g-0 sh-9">
									<div class="col-auto">
									  <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
										<div class="fw-bold text-primary"> <i data-acorn-icon="user"></i> </div>
									  </div>
									</div>
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
										  <div class="text-alternate"><?php echo $member->firstname.' '.$member->lastname; ?></div>
										  <div class="text-muted">
				   <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				<?php echo $this->generic_model->convert_currency($user_details->default_currency,$member->solar); ?></div>
										</div>
									  </div>
									</div>
									</a> 
								</div>
						<?php
								}
							}else{
								echo 'No member found for this category';
							}
						?>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
			   
			<div class="col-6 col-md-4 col-lg-2">
			<a href="#" data-bs-toggle="modal" data-bs-target="#largeRightModalLegal">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate lh-1-25">Total Legal Wallet</div>
                  <div class="text-primary cta-4">
					<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,$this->generic_model->get_sum_excluding_ids('legals', 'users', $exclude_ids)); ?>
				  </div>
                </div>
              </div>
			</a>
            </div>
			<div class="modal modal-right large fade" id="largeRightModalLegal" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Legal Wallets</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						<?php 
		     $wallet_members = $this->generic_model->get_users_with_non_empty_column_excluding_ids('users', 'legals', $exclude_ids);
							if(!empty($wallet_members)){
								foreach($wallet_members as $member){
									//$userinfo = $this->generic_model->getInfo('users','id',$member->user_id); ?>
						         <div class="card mb-2 hover-border-primary"> 
									  <a href="<?php echo base_url('users_details/'.$member->id); ?>" class="row g-0 sh-9">
									<div class="col-auto">
									  <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
										<div class="fw-bold text-primary"> <i data-acorn-icon="user"></i> </div>
									  </div>
									</div>
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
										  <div class="text-alternate"><?php echo $member->firstname.' '.$member->lastname; ?></div>
										  <div class="text-muted">
				   <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				<?php echo $this->generic_model->convert_currency($user_details->default_currency,$member->legals); ?></div>
										</div>
									  </div>
									</div>
									</a> 
								</div>
						<?php
								}
							}else{
								echo 'No member found for this category';
							}
						?>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
			
		    <div class="col-6 col-md-4 col-lg-2">
			<a href="#" data-bs-toggle="modal" data-bs-target="#largeRightModalMeal">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate lh-1-25">Total Meal Wallet</div>
                  <div class="text-primary cta-4">
					<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,$this->generic_model->get_sum_excluding_ids('meal', 'users', $exclude_ids));  ?>
				  </div>
                </div>
              </div>
			</a>
            </div>
			<div class="modal modal-right large fade" id="largeRightModalMeal" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Meal Wallets</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						<?php 
		     $wallet_members = $this->generic_model->get_users_with_non_empty_column_excluding_ids('users', 'meal', $exclude_ids);
							if(!empty($wallet_members)){
								foreach($wallet_members as $member){
									//$userinfo = $this->generic_model->getInfo('users','id',$member->user_id); ?>
						         <div class="card mb-2 hover-border-primary"> 
									  <a href="<?php echo base_url('users_details/'.$member->id); ?>" class="row g-0 sh-9">
									<div class="col-auto">
									  <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
										<div class="fw-bold text-primary"> <i data-acorn-icon="user"></i> </div>
									  </div>
									</div>
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
										  <div class="text-alternate"><?php echo $member->firstname.' '.$member->lastname; ?></div>
										  <div class="text-muted">
				   <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				<?php echo $this->generic_model->convert_currency($user_details->default_currency,$member->meal); ?></div>
										</div>
									  </div>
									</div>
									</a> 
								</div>
						<?php
								}
							}else{
								echo 'No member found for this category';
							}
						?>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
		
		    <div class="col-6 col-md-4 col-lg-2">
			<a href="#" data-bs-toggle="modal" data-bs-target="#largeRightModalHealth">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate lh-1-25">Total Health Wallet</div>
                  <div class="text-primary cta-4">
					<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,$this->generic_model->get_sum_excluding_ids('health', 'users', $exclude_ids));  ?>
				  </div>
                </div>
              </div>
			</a>
            </div>
			<div class="modal modal-right large fade" id="largeRightModalHealth" tabindex="-1" style="display: none;" aria-hidden="true">
			  <div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">Health Wallets</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="scroll">
						<?php 
		     $wallet_members = $this->generic_model->get_users_with_non_empty_column_excluding_ids('users', 'health', $exclude_ids);
							if(!empty($wallet_members)){
								foreach($wallet_members as $member){
									//$userinfo = $this->generic_model->getInfo('users','id',$member->user_id); ?>
						         <div class="card mb-2 hover-border-primary"> 
									  <a href="<?php echo base_url('users_details/'.$member->id); ?>" class="row g-0 sh-9">
									<div class="col-auto">
									  <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
										<div class="fw-bold text-primary"> <i data-acorn-icon="user"></i> </div>
									  </div>
									</div>
									<div class="col">
									  <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
										<div class="d-flex flex-column">
										  <div class="text-alternate"><?php echo $member->firstname.' '.$member->lastname; ?></div>
										  <div class="text-muted">
				   <?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
				<?php echo $this->generic_model->convert_currency($user_details->default_currency,$member->health); ?></div>
										</div>
									  </div>
									</div>
									</a> 
								</div>
						<?php
								}
							}else{
								echo 'No member found for this category';
							}
						?>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			  </div>
			</div>
		
			 <div class="col-6 col-md-4 col-lg-2">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate lh-1-25">Total Withdrawals</div>
                  <div class="text-primary cta-4">
					<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,$this->generic_model->getTotalSum('withdrawal_history','amount')); ?>
				  </div>
                </div>
              </div>
            </div>
				<?php 
					  $total_ceo = ($ceo_wallet_total-$ceo_share_withdrawal);
					  $total_cto = ($cto_wallet_total-$cto_share_withdrawal);
					  $total_management = ($tech_wallet_total + $total_ceo + $total_cto + $training_wallet_total + $state_reps_wallet_total + $exec_pool_wallet_total);
				?>
			<div class="col-6 col-md-4 col-lg-2">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate lh-1-25">Total Management</div>
                  <div class="text-primary cta-4">
					<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_management); ?>
				  </div>
                </div>
              </div>
            </div>
				
			<div class="col-6 col-md-4 col-lg-2">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate lh-1-25">Investors Pool</div>
                  <div class="text-primary cta-4">
					<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,$investors_pool); ?>
				  </div>
                </div>
              </div>
            </div>
				
				
			   				  
          </div>
			<div class="row g-2 mb-2">
			<h5 class="mb-3 mt-3">Tax &amp; Revenue!</h5>
            <div class="col-6 col-md-4 col-lg-2">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate lh-1-25">Total Inflow</div>
                  <div class="text-primary cta-4">
					<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					<?php 
						$total_cash = $this->generic_model->get_sum_excluding_ids('wallet', 'users', $exclude_ids);
						$total_spendable = $this->generic_model->get_sum_excluding_ids('spendable', 'users', $exclude_ids);
						$total_palliative = $this->generic_model->get_sum_excluding_ids('palliative', 'users', $exclude_ids);
						$total_cashback = $this->generic_model->get_sum_excluding_ids('cashback', 'users', $exclude_ids);
						$total_bpt = $this->generic_model->get_sum_excluding_ids('token', 'users', $exclude_ids) * 20;
						$total_shelter = $this->generic_model->get_sum_excluding_ids('shelter', 'users', $exclude_ids);
						$total_education = $this->generic_model->get_sum_excluding_ids('education', 'users', $exclude_ids);
						$total_car = $this->generic_model->get_sum_excluding_ids('car', 'users', $exclude_ids);
						$total_business = $this->generic_model->get_sum_excluding_ids('business', 'users', $exclude_ids);
						$total_land = $this->generic_model->get_sum_excluding_ids('land', 'users', $exclude_ids);
						$total_solar = $this->generic_model->get_sum_excluding_ids('solar', 'users', $exclude_ids);
						$total_legals = $this->generic_model->get_sum_excluding_ids('legals', 'users', $exclude_ids);
						$total_meal = $this->generic_model->get_sum_excluding_ids('meal', 'users', $exclude_ids);
						$total_health = $this->generic_model->get_sum_excluding_ids('health', 'users', $exclude_ids);
															
						$all_wallets = ($total_cash + $total_spendable + $total_palliative + $total_cashback + $total_bpt + $total_shelter + $total_education + $total_car + $total_business + $total_land + $total_solar + $total_legals + $total_meal + $total_health);
															
						$platinum_total = ($platinum * 310000 ); 
						$gold_total = ($gold * 210000);
						$regularPlus_total = ($regp * 50000);
						$regular_total = ($regs * 10000);
						$grand_total = ($platinum_total + $gold_total + $regularPlus_total + $regular_total) - $debitGold;
						$total_vat = (7.5 *$grand_total)/100;
						$balance_after_vat = ($grand_total - $total_vat);
						echo $this->generic_model->convert_currency($user_details->default_currency,$grand_total);
					  ?>
				  </div>
                </div>
              </div>
            </div>
				  
			<div class="col-6 col-md-4 col-lg-2">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate lh-1-25">Total Vat</div>
                  <div class="text-primary cta-4">
					<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,$total_vat); ?>
				  </div>
                </div>
              </div>
            </div>
			   
			<div class="col-6 col-md-4 col-lg-2">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate lh-1-25">Balance After Vat</div>
                  <div class="text-primary cta-4">
					<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,$balance_after_vat); ?>
				  </div>
                </div>
              </div>
            </div>
			<?php							
				$vats = $this->generic_model->getTotalSum('vat_data','vat');
				$overflows = $this->generic_model->getTotalSum('account_overflow','amount');
			?>
			<div class="col-6 col-md-4 col-lg-2">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate lh-1-25">Total Wallets</div>
                  <div class="text-primary cta-4">
					<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,$all_wallets); ?>
				  </div>
                </div>
              </div>
            </div>
			   
			<div class="col-6 col-md-4 col-lg-2">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate lh-1-25"> After Outflows</div>
                  <div class="text-primary cta-4">
					<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,($grand_total - ($all_wallets + $vats + $overflows + $total_management + $investors_pool))); ?>
				  </div>
                </div>
              </div>
            </div>
			   
			<div class="col-6 col-md-4 col-lg-2">
              <div class="card h-100 hover-scale-up cursor-pointer">
                <div class="card-body d-flex flex-column align-items-center">
                  <div class="mb-1 d-flex align-items-center text-alternate lh-1-25">Admin Overflows</div>
                  <div class="text-primary cta-4">
					<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
					<?php echo $this->generic_model->convert_currency($user_details->default_currency,$overflows); ?>
				  </div>
                </div>
              </div>
            </div>
			   				  
          </div>
			  <?php } ?>
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
<?php
$is_ticket = $this->generic_model->getInfo( 'philanthropy_tickets', 'used_by', $user_details->id );
if ( !empty( $is_ticket ) ) {
  if ( $is_ticket->status == 'claimed' ) {
    $date = $is_ticket->date_claimed;
  } else {
    $date = '';
  }
}
?>
<script>
		// Get the date from the database
		const dateFromDatabase = new Date("2024-08-29 00:00:00"); //new Date("<?php // echo $date; ?>");

		// Set the target time to 24 hours from the date from the database
		const targetTime = dateFromDatabase.getTime() + (24 * 60 * 60 * 1000);

		// Function to update the countdown
		function updateCountdown() {
		  const currentTime = new Date().getTime();
		  const timeDifference = targetTime - currentTime;

		  if (timeDifference <= 0) {
			// If time is up, stop the countdown
			clearInterval(countdownInterval);
			document.getElementById("hours_beep").innerText = "00";
			document.getElementById("days_beep").innerText = "00";
			document.getElementById("minutes_beep").innerText = "00";
			document.getElementById("seconds_beep").innerText = "00";
			document.getElementById("hours_btn_beep").innerText = " ";
			document.getElementById("minutes_btn_beep").innerText = " ";
			document.getElementById("seconds_btn_beep").innerText = "Reload Page";
			return;
		  }
		
		  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
		  const hours = Math.floor(timeDifference / (1000 * 60 * 60));
		  const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
		  const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

		  document.getElementById("hours_beep").innerText = formatTime(hours);
		  document.getElementById("days_beep").innerText = formatTime(days);
		  document.getElementById("minutes_beep").innerText = formatTime(minutes);
		  document.getElementById("seconds_beep").innerText = formatTime(seconds);
		  document.getElementById("hours_btn_beep").innerText = formatTime(hours);
		  document.getElementById("minutes_btn_beep").innerText = formatTime(minutes);
		  document.getElementById("seconds_btn_beep").innerText = formatTime(seconds);
		}

			// Function to format time to add leading zero if needed
			function formatTime(time) {
			  return time < 10 ? `0${time}` : time;
			}

			// Update the countdown every second
		
			const countdownInterval = setInterval(updateCountdown, 1000);

			// Initial update to prevent delay
			updateCountdown();
		</script> 
<script>
        document.getElementById('copyButton').addEventListener('click', function() {
            // Get the reference link from the text field
            var refLink = document.getElementById('refLink').value.trim();
            // If the reference link is not empty
            if (refLink !== '') {
                // Create a temporary input element
                var input = document.createElement('input');
                input.setAttribute('value', refLink);
                document.body.appendChild(input);
                // Select the input field
                input.select();
                input.setSelectionRange(0, 99999); // For mobile devices
                // Copy the reference link to the clipboard
                document.execCommand('copy');
                // Remove the temporary input
                document.body.removeChild(input);
                // Alert the user that the link has been copied
                alert('Link copied to clipboard: ' + refLink);
            } else {
                // Alert the user if the reference link is empty
                alert('Please enter a reference link');
            }
        });
    </script> 
<script>
		function calculator(){
			var shelter_type = $('#shelter_type').val();
			var shelter_option = parseInt($('#shelter_option').val());
			var users = parseInt($('#invites').val());
			var mainSelectorDiv = document.getElementById("main_selector");
    		var regularSelectorDiv = document.getElementById("regular_selector");
			var regular_displayDiv = document.getElementById("regular_display");
			var main_displayDiv = document.getElementById("main_display");
			var activated_colDiv = document.getElementById("activated_col");
			
			// Currency rate (Naira to USD)
			var currencyRate = 1; // Default to Naira
			var currency = document.getElementById("currency_selector").value;
			var currencySign = '₦';
			if (currency == "USD") {
				currencyRate = 1 / 1500; // Update currency rate for USD
				currencySign = '$';
			}
			
			
			switch (shelter_option) {
			  case 1:
				var wallet = 40000000 * currencyRate;
				break;
			  case 2:
				var wallet = 80000000 * currencyRate;
				break;
			  case 3:
				var wallet = 150000000 * currencyRate;
				break;
			  case 4:
				var wallet = 200000000 * currencyRate;
				break;
 			  case 5:
				var wallet = 300000000 * currencyRate;
				break;
 			  case 6:
				var wallet = 20000000 * currencyRate;
				break;
			  case 7:
				var wallet = 10000000 * currencyRate;
				break;
 			  case 8:
				var wallet = 5000000 * currencyRate;
				break;
 			  case 9:
				var wallet = 10000000 * currencyRate;
			 // case 10:
			//	var wallet = 5000000 * currencyRate;
				break;				
			  default:
				var wallet = 0; // Default value if shelter_option doesn't match any case
			}
						
			if (!isNaN(users)) { 
				$('#progress').hide();
				if(shelter_type == 1){
					var p_type = $('#palliative_type').val();
					$('#regular_display').show();
					$('#main_display').hide();

					if(p_type == 2){
						var pal_type = 4;
						var target = 100000 * currencyRate;
						var type_name = "Silver Plus Package";
						
						var post_unitEarnings = {
							cash: 0,
							BPT: 0,
							palliative: 0,
							shelter: 0
						};
						var activatedUnitLevelEarnings = {
							cash: [1350, 855, 210, 210],
							BPT: [850, 225, 50, 50],
							palliative: [4800, 3120, 640, 640],
							shelter: [30000, 22500, 7500, 7500]
						};
						// Calculate earnings for the unit level
						for (var i = 0; i < activatedUnitLevelEarnings.cash.length; i++) {
							var referrals = Math.pow(users, i);
							post_unitEarnings.cash += activatedUnitLevelEarnings.cash[i] * referrals;
							post_unitEarnings.BPT += activatedUnitLevelEarnings.BPT[i] * referrals;
							post_unitEarnings.palliative += activatedUnitLevelEarnings.palliative[i] * referrals;
							post_unitEarnings.shelter += activatedUnitLevelEarnings.shelter[i] * referrals;
						}
						
						var shelter_wallet = post_unitEarnings.shelter * users * currencyRate;
						if(shelter_wallet > wallet){
							var shelter_package = wallet;
						}else{
							var shelter_package = shelter_wallet ;
						}

						// Multiply the results by the total number of users and by 12 months
						var totalEarnings = {
							cash: post_unitEarnings.cash * users * currencyRate,
							BPT: parseFloat((post_unitEarnings.BPT * users)/20),
							palliative: post_unitEarnings.palliative * users * currencyRate,
							shelter: shelter_package
						};
						// Format number function
						function formatNumber(number) {
							return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 2 }).format(number);
						}
						// Update the text content of corresponding <span> elements
						document.getElementById("post_levels").textContent = "Earning Levels: " + pal_type;
						document.getElementById("post_cashback").textContent = "Total Cashback Claim Bonus: "+currencySign + formatNumber(totalEarnings.cash);
						document.getElementById("post_bpt").textContent = "Total BPT Bonus: " + formatNumber(totalEarnings.BPT) + " BPT";
						document.getElementById("post_palliative").textContent = "Total Palliative Cash Bonus: "+currencySign + formatNumber(totalEarnings.palliative);
						document.getElementById("post_shelter").textContent = "Total Shelter Palliative Reward: "+currencySign + formatNumber(totalEarnings.shelter);
					}

					else{
						var pal_type = 10;
						var target = 200000 * currencyRate;
						var type_name = "Gold Plus Package";

						var post_unitEarnings = {
							cash: 0,
							BPT: 0,
							palliative: 0,
							shelter: 0
						};

						var activatedUnitLevelEarnings = {
							cash: [3150, 1935, 570, 570, 0, 0, 0, 0, 0, 0],
							BPT: [1850, 525, 150, 150, 0, 0, 0, 0, 0, 0],
							palliative: [12000, 7490, 2080, 2080, 0, 0, 0, 0, 0, 0],
							shelter: [60000, 45000, 15000, 15000, 3000, 3000, 3000, 3000, 1500, 1500]
						};
						// Calculate earnings for the unit level
						
						for (var i = 0; i < activatedUnitLevelEarnings.cash.length; i++) {
							var referrals = Math.pow(users, i);
							post_unitEarnings.cash += activatedUnitLevelEarnings.cash[i] * referrals;
							post_unitEarnings.BPT += activatedUnitLevelEarnings.BPT[i] * referrals;
							post_unitEarnings.palliative += activatedUnitLevelEarnings.palliative[i] * referrals;
							post_unitEarnings.shelter += activatedUnitLevelEarnings.shelter[i] * referrals;
						}
						
						var shelter_wallet = post_unitEarnings.shelter * users * currencyRate;
						if(shelter_wallet > wallet){
							var shelter_package = wallet;
						}else{
							var shelter_package = shelter_wallet ;
						}

						
						
						// Multiply the results by the total number of users and by 12 months
						var totalEarnings = {
							cash: post_unitEarnings.cash * users * currencyRate,
							BPT: parseFloat((post_unitEarnings.BPT * users)/20),
							palliative: post_unitEarnings.palliative * users * currencyRate,
							shelter: shelter_package
						};
						// Format number function
						function formatNumber(number) {
							return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 2 }).format(number);
						}
						// Update the text content of corresponding <span> elements
						document.getElementById("post_levels").textContent = "Earning Levels: " + pal_type;
						document.getElementById("post_cashback").textContent = "Total Cashback Claim Bonus: "+currencySign + formatNumber(totalEarnings.cash);
						document.getElementById("post_bpt").textContent = "Total BPT Bonus: " + formatNumber(totalEarnings.BPT) + " BPT";
						document.getElementById("post_palliative").textContent = "Total Palliative Cash Bonus: "+currencySign + formatNumber(totalEarnings.palliative);
						document.getElementById("post_shelter").textContent = "Total Shelter Palliative Reward: "+currencySign + formatNumber(totalEarnings.shelter);

					}

					$('#regular_selector').show();

					var unitEarnings = {
						cash: 0,
						BPT: 0,
						palliative: 0,
						shelter: 0
					};

					// Define unit earnings for each category
					var unitLevelEarnings = {
						cash: [450, 225, 150, 150, 0, 0, 0, 0, 0, 0],
						BPT: [150, 75, 50, 50, 0, 0, 0, 0, 0, 0],
						palliative: [2460, 1200, 800, 800, 0, 0, 0, 0, 0, 0],
						shelter: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
					};

					// Calculate earnings for the unit level
					for (var i = 0; i < unitLevelEarnings.cash.length; i++) {
						var referrals = Math.pow(users, i);
						unitEarnings.cash += unitLevelEarnings.cash[i] * referrals;
						unitEarnings.BPT += unitLevelEarnings.BPT[i] * referrals;
						unitEarnings.palliative += unitLevelEarnings.palliative[i] * referrals;
						unitEarnings.shelter += unitLevelEarnings.shelter[i] * referrals;
					}
					
					

					// Multiply the results by the total number of users and by 12 months
					var totalEarnings = {
						cash: unitEarnings.cash * users * currencyRate,
						BPT: parseFloat((unitEarnings.BPT * users)/20),
						palliative: unitEarnings.palliative * users * currencyRate,
						shelter: unitEarnings.shelter * users * currencyRate
					};

					// Format number function
					function formatNumber(number) {
						return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 2 }).format(number);
					}

					// Update the text content of corresponding <span> elements
					document.getElementById("pre_levels").textContent = "Earning Levels: " + pal_type;
					document.getElementById("pre_cashback").textContent = "Total Cashback Claim Bonus: "+currencySign + formatNumber(totalEarnings.cash);
					document.getElementById("pre_bpt").textContent = "Total BPT Bonus: " + formatNumber(totalEarnings.BPT) + " BPT";
					document.getElementById("pre_palliative").textContent = "Total Palliative Cash Bonus: "+currencySign + formatNumber(totalEarnings.palliative) + " Target: "+currencySign + formatNumber(target) + " to automatically activate " + type_name;
					document.getElementById("pre_shelter").textContent = "Total Shelter Palliative Reward: "+currencySign + formatNumber(totalEarnings.shelter);

					if(totalEarnings.palliative >= target){
						$('#activated_col').show();
					}else{
						$('#activated_col').hide();
					}
				}

				if (shelter_type == 2) {
						$('#regular_display').hide();
						$('#main_display').show();
						$('#regular_selector').hide();
					
					var unitEarnings = {
						cash: 0,
						BPT: 0,
						palliative: 0,
						shelter: 0
					};

					// Define unit earnings for each category
					var unitLevelEarnings = {
						cash: [1800, 1080, 360, 360],
						BPT: [1000, 300, 100, 100],
						palliative: [7200, 4320, 1440, 1440],
						shelter: [30000, 22500, 7500, 7500]
					};

					// Calculate earnings for the unit level
					 for (var i = 0; i < unitLevelEarnings.cash.length; i++) {
						var referrals = Math.pow(users, i);
						unitEarnings.cash += unitLevelEarnings.cash[i] * referrals;
						unitEarnings.BPT += unitLevelEarnings.BPT[i] * referrals;
						unitEarnings.palliative += unitLevelEarnings.palliative[i] * referrals;
						unitEarnings.shelter += unitLevelEarnings.shelter[i] * referrals;
					}
					
					   var shelter_wallet = unitEarnings.shelter * users * currencyRate;
						if(shelter_wallet > wallet){
							var shelter_package = wallet;
						}else{
							var shelter_package = shelter_wallet ;
						}

					// Multiply the results by the total number of users and by 12 months
					var totalEarnings = {
						cash: unitEarnings.cash * users * currencyRate,
						BPT: parseFloat((unitEarnings.BPT * users)/20),
						palliative: unitEarnings.palliative * users * currencyRate,
						shelter: shelter_package
					};

					// Format number function
					function formatNumber(number) {
						return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 2 }).format(number);
					}

					// Update the text content of corresponding <span> elements
					document.getElementById("levels").textContent = "Earning Levels: 4";
					document.getElementById("cashback").textContent = "Total Cashback Claim Bonus: "+currencySign + formatNumber(totalEarnings.cash);
					document.getElementById("bpt").textContent = "Total BPT Bonus: " + formatNumber(totalEarnings.BPT) + " BPT";
					document.getElementById("palliative").textContent = "Total Palliative Cash Bonus: "+currencySign + formatNumber(totalEarnings.palliative);
					document.getElementById("shelter").textContent = "Total Shelter Palliative Reward: "+currencySign + formatNumber(totalEarnings.shelter);
				}

				if(shelter_type == 3){
						$('#regular_display').hide();
						$('#main_display').show();
						$('#regular_selector').hide();
					
					var unitEarnings = {
						cash: 0,
						BPT: 0,
						palliative: 0,
						shelter: 0
					};

					// Define unit earnings for each category
					var unitLevelEarnings = {
						cash: [3600, 2160, 720, 720, 0, 0, 0, 0, 0, 0],
						BPT: [2000, 600, 200, 200, 0, 0, 0, 0, 0, 0],
						palliative: [14400, 8690, 2880, 2880, 0, 0, 0, 0, 0, 0],
						shelter: [60000, 45000, 15000, 15000, 3000, 3000, 3000, 3000, 1500, 1500]
					};

					// Calculate earnings for the unit level
					for (var i = 0; i < unitLevelEarnings.cash.length; i++) {
						var referrals = Math.pow(users, i);
						unitEarnings.cash += unitLevelEarnings.cash[i] * referrals;
						unitEarnings.BPT += unitLevelEarnings.BPT[i] * referrals;
						unitEarnings.palliative += unitLevelEarnings.palliative[i] * referrals;
						unitEarnings.shelter += unitLevelEarnings.shelter[i] * referrals;
					}
					
					var shelter_wallet = unitEarnings.shelter * users * currencyRate;
						if(shelter_wallet > wallet){
							var shelter_package = wallet;
						}else{
							var shelter_package = shelter_wallet ;
						}

					// Multiply the results by the total number of users and by 12 months
					var totalEarnings = {
						cash: unitEarnings.cash * users * currencyRate,
						BPT: parseFloat((unitEarnings.BPT * users)/20),
						palliative: unitEarnings.palliative * users * currencyRate,
						shelter: shelter_package
					};

					// Format number function
					function formatNumber(number) {
						return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 2 }).format(number);
					}

					// Update the text content of corresponding <span> elements
					document.getElementById("levels").textContent = "Earning Levels: 10";
					document.getElementById("cashback").textContent = "Total Cashback Claim Bonus: "+currencySign + formatNumber(totalEarnings.cash);
					document.getElementById("bpt").textContent = "Total BPT Bonus: " + formatNumber(totalEarnings.BPT) + " BPT";
					document.getElementById("palliative").textContent = "Total Palliative Cash Bonus: "+currencySign + formatNumber(totalEarnings.palliative);
					document.getElementById("shelter").textContent = "Total Shelter Palliative Reward: "+currencySign + formatNumber(totalEarnings.shelter);
				}
			}
			else{
				$('#progress').html('<span class="text-warning"><span class="spinner-border spinner-border-sm mr-05" role="status" aria-hidden="true"></span> Waiting for invitees data ...</span>');
				$('#progress').show();
				if(shelter_type == 1){
					$('#regular_display').show();
					$('#main_display').hide();
					$('#regular_selector').show();
				}
				if(shelter_type == 2){
					$('#regular_display').hide();
					$('#main_display').show();
					$('#regular_selector').hide();
				}
				if(shelter_type == 3){
					$('#regular_display').hide();
					$('#main_display').show();
					$('#regular_selector').hide();
				}
			}
			
		}
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