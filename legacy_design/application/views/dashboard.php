<!DOCTYPE html>
<html lang="en" data-footer="true">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>BeepAgro Palliative Initiative | Dashboard</title>
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
<link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/glide.core.min.css');?>">
<link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/baguetteBox.min.css');?>">
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
            <?php if($user_details->user_type == 'admin' || $user_details->user_type == 'moderator' ){ ?>
            <li> <a href="#" data-bs-target="#intel"> <i data-acorn-icon="cpu" class="icon" data-acorn-size="18"></i> <span class="label">Intelligence Center</span> </a>
              <ul>
                <li > <a href="<?php echo base_url('admin');?>"> <i data-acorn-icon="user" class="icon d-none text-danger" data-acorn-size="18"></i> <span class="label text-info">Admin Panel</span> </a> </li>
              </ul>
            </li>
            <?php } ?> 
            <li> <a href="#" data-bs-target="#dashboard"> <i data-acorn-icon="home" class="icon" data-acorn-size="18"></i> <span class="label">Member Dashboard</span> </a>
              <ul>
                <li> <a class="active" href="#"> <i data-acorn-icon="navigate-diagonal" class="icon d-none" data-acorn-size="18"></i> <span class="label">Home</span> </a> </li>
                <li> <a href="<?php echo base_url('analytics');?>"> <i data-acorn-icon="chart-4" class="icon d-none" data-acorn-size="18"></i> <span class="label">Analytics</span> </a> </li>
                <li> <a href="<?php echo base_url('my_assets');?>"> <i data-acorn-icon="wallet" class="icon d-none" data-acorn-size="18"></i> <span class="label">Assets</span> </a> </li>
                <li> <a href="<?php echo base_url('refer');?>"> <i data-acorn-icon="link" class="icon d-none" data-acorn-size="18"></i> <span class="label">Invites</span> </a> </li>
                <li> <a href="<?php echo base_url('investment_options');?>"> <i data-acorn-icon="router" class="icon d-none" data-acorn-size="18"></i> <span class="label">Investment Options</span> </a> </li>
              </ul>
            </li> 
             <li> <a href="#" data-bs-target="#dashboard"> <i data-acorn-icon="home" class="icon" data-acorn-size="18"></i> <span class="label">Community Support</span> </a>
              <ul>
                <li> <a class="" href="<?php echo base_url('pecv_dashboard');?>"> <i data-acorn-icon="navigate-diagonal" class="icon d-none" data-acorn-size="18"></i> <span class="label">CS Dashboard</span> </a> </li>
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
				<li> <a href="<?php echo base_url('extension');?>"> <i data-acorn-icon="server" class="icon d-none" data-acorn-size="18"></i> <span class="label">Membership Extension</span> </a> </li>
                <li> <a href="<?php echo base_url('donor');?>"> <i data-acorn-icon="file-image" class="icon d-none" data-acorn-size="18"></i> <span class="label">Donors</span> </a> </li>
                <li> <a href="<?php echo base_url('merchants');?>"> <i data-acorn-icon="router" class="icon d-none" data-acorn-size="18"></i> <span class="label">Pickup Locations</span> </a> </li>
                <li> <a href="<?php echo base_url('palliative');?>"> <i data-acorn-icon="book" class="icon d-none" data-acorn-size="18"></i> <span class="label">Student Palliative</span> </a> </li>
                <li> <a href="<?php echo base_url('aid_tickets');?>"> <i data-acorn-icon="user" class="icon d-none" data-acorn-size="18"></i> <span class="label">Tickets</span> </a> </li>
              </ul>
            </li>
            <li> <a href="#" data-bs-target="#tools"> <i data-acorn-icon="grid-1" class="icon" data-acorn-size="18"></i> <span class="label">BPI Tools</span> </a>
              <ul>
                <li> <a href="<?php echo base_url('solarassessment');?>"> <i data-acorn-icon="database" class="icon d-none" data-acorn-size="18"></i> <span class="label">Solar Assessment</span> </a> </li>
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
                <li> <a href="#"> <i data-acorn-icon="notebook-1" class="icon d-none" data-acorn-size="18"></i> <span class="label">Knowledge Base</span> </a> </li>
				  <li> <a href="<?php echo base_url('support_tickets');?>"> <i data-acorn-icon="bookmark" class="icon d-none" data-acorn-size="18"></i> <span class="label">Tickets</span> </a> </li>
              </ul>
            </li>
          </ul>
        </div>
        <!-- end menu segment -->
        
        <div class="col"> 
          <!-- Title segment-->
          <div class="page-title-container mb-3">
            <div class="row">
              <div class="col mb-2">
                <h1 class="mb-2 pb-0 display-4" id="title">Welcome to the BPI Dashboard</h1>
                <div class="text-muted mb-3 font-heading text-small">Empowering You to Monitor Performance, Stay Informed, and Drive Success with Real-Time Insights</div>
				 <?php if ($user_details->user_type == 'user'): ?> 
					<a href="<?php echo base_url('tickets/create'); ?>"  class="btn mt-3 mb-3 btn-secondary btn-lg">Create Ticket <sup><span class="badge bg-danger text-uppercase">New</span></sup></a> 
				<?php endif; ?>
				<hr class="bg-primary">
				<div class="alert alert-success mb-3 mt-3 alert-dismissible fade show text-white" role="alert">
				<h3 class="mb-3">Community Announcement <span class="text-danger">(IMPORTANT!!)</span></h3>
                    <p style="margin-bottom: 15px;"><strong>Hello <?php echo $user_details->firstname; ?>, Trust you are well!</strong></p>
                    <p style="margin-bottom: 15px;">We are pleased to announce that we have completed the first batch of our recent upgrade. However, between the periods of October 11th and October 15th, some registration and activations records may have been affected during our final systems check and deployments.<br><br>
                    IMPORTANT ACTION STEPS FOR ALL MEMBERS<br>
                    <ul>
                        <li>All members who registered between the affected periods should login to their accounts and verify their account access </li>
                        <li>All sponsors with downlines whose registration period falls into the affected period should assist them with getting and re-instating their account status</li>
                        <li>Members who completed their KYC or activated a package during this period should confirm their account status and repeat the process is any data appears reversed or missing</li>
                        
                    </ul>
                    </p>
                    <p style="margin-bottom: 15px;">We sincerely appreciate your patience and understanding during this upgrade period</p>
                    <p style="margin-bottom: 15px;">We remain committed to delivering a stronger, faster and more secure community platform. Please explore the improvements and share your experience with your team.</p>
                    <p style="margin-bottom: 15px;">Best regards,<br><span style="font-style: italic;">The BPI Technical Team</span></p>
				<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"><i data-acorn-icon="close-circle" class="text-white" data-acorn-size="18"></i></button>
                </div>
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
              <?php if($daysLeft <= 0 && !empty($countdownData)){ ?>
              <div class="alert alert-success mb-3 mt-3 alert-dismissible fade show" role="alert"> Congratulations your Student Palliative Pack is now available to claim. <a href="<?php echo base_url('claim_student_pal'); ?>" class="btn btn-md btn-danger float-right" > Claim Now</a>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"><i data-acorn-icon="close-circle" class="text-white" data-acorn-size="18"></i></button>
              </div>
              <?php } ?>
              <?php if($daysLeft == 3 && !empty($countdownData)){ ?>
              <div class="alert alert-info mb-3 mt-3 alert-dismissible fade show" role="alert"> Your Student Palliative Pack will be available to claim in 3 days!.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"><i data-acorn-icon="close-circle" class="text-white" data-acorn-size="18"></i></button>
              </div>
              <?php } ?>
              <?php if($daysLeft == 2 && !empty($countdownData)){ ?>
              <div class="alert alert-info mb-3 mt-3 alert-dismissible fade show" role="alert"> Your Student Palliative Pack will be available to claim in 2 days!.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"><i data-acorn-icon="close-circle" class="text-white" data-acorn-size="18"></i></button>
              </div>
              <?php } ?>
              <?php if($daysLeft == 1 && !empty($countdownData)){ ?>
              <div class="alert alert-secondary mb-3 mt-3 alert-dismissible fade show text-white" role="alert"> Your Student Palliative Pack will be available to claim in 24 hours!
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"><i data-acorn-icon="close-circle" class="text-white" data-acorn-size="18"></i></button>
              </div>
              <?php } ?>
              <div class="row mb-5">
              <div class="col-xl-4 col-sm-12">
                  <div class="card h-100">
                    <div class="card-body">
                        <div>
                        <h5 class="mb-5 text-success">Account Summary</h5>
                        </div>
                        <div class="row">
                        <div class="col-xl-6 col-12">
                            <small class="text-muted">Total Assets</small>
                            <h5>
                            <?php
                                $sum_total_assets = ($user_details->wallet + $user_details->spendable + $user_details->cashback);
                            ?>
                            <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
                            <?php echo $this->generic_model->convert_currency($user_details->default_currency,$sum_total_assets);?>
                        </h5>
                        </div>
                        <div class="col-xl-6 col-12">
                            <small class="text-muted">YouTube Earning</small>
                            <h5>
                            <?php
                                $sum_total = $this->generic_model->getSum( 'user_earnings', 'amount', array( 'user_id' => $user_details->id, 'is_paid' =>1 ) );
                            ?>
                            <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
                            <?php echo $this->generic_model->convert_currency($user_details->default_currency,$sum_total);?>
                        </h5>
                        </div>
                        </div>
                    </div>
                  </div>
              </div>
              <div class="col-xl-4 col-sm-12">
                  <div class="card h-100">
                    <div class="card-body">
                        <h5 class="text-success">Add Your Youtube Channel</h5>
                        <p>Share your Youtube Channel with the BPI Community</p>
                        <a href="<?php echo base_url('submit_channel'); ?>" class="btn btn-success bnt-lg">Start Here</a>
                        
                    </div>
                  </div>
              </div>
              <div class="col-xl-4 col-sm-12">
                  <div class="card h-100">
                    <div class="card-body">
                        <h5 class="text-success">Explore Submitted Channels</h5>
                        <p>Browse and discover an organized view of available channels submitted by other members</p>
                         <a href="<?php echo base_url('channels/verified_channels'); ?>" class="btn btn-danger bnt-lg">Explore</a>
                       
                    </div>
                  </div>
              </div>
          </div>
            <div class="row"> 
            <!-- Promotional Materials -->
            <div class="col-12 col-lg-8 mb-5">
              <div class="card sh-45 h-lg-100 position-relative bg-theme"> <img src="<?php echo base_url('assets/img/illustration/database.webp');?>" class="card-img h-100 position-absolute theme-filter" alt="card image">
                <div class="card-img-overlay d-flex flex-column justify-content-end bg-transparent">
                  <div class="mb-1">
                    <div class="cta-1 w-75 w-sm-50">Promotional Materials</div>
                    <div class="w-50 text-alternate">We have marketing materials to help spread the BPI ideology. As a member, you can download and use these assets to make a lasting impact and advance our mission.</div>
                  </div>
                  <div> <a href="<?php echo base_url('campaigns');?>" class="btn btn-icon btn-icon-start btn-primary mt-3 stretched-link"> <i data-acorn-icon="chevron-right"></i> <span>Download Materials</span> </a> </div>
                </div>
              </div>
            </div>
            <?php
            if ( !empty( $user_details->profile_pic ) && !empty( $user_details->address ) && !empty( $user_details->city ) && !empty( $user_details->state ) && !empty( $user_details->country ) && !empty( $user_details->mobile && !empty( $user_details->zip ) ) ) {
              $isComp = '<span class="text-primary">100%</span>';
              $profile_text = "You have completed your profile setup.";
            } else {
              $isComp = '<span class="text-danger">45%</span>';
              $profile_text = "You have not completed your profile setup.";
            }
            if ( $user_details->activated == 1 ) {
              $isStuP = '<span class="text-primary">100%</span>';
              $isStuP_text = 'Your Student Palliative is active.';
            } elseif ( $user_details->pending_activation == 1 ) {
              $isStuP = '<span class="text-warning">50%</span>';
              $isStuP_text = 'Your subscription is pending approval.';
            }
            else {
              $isStuP = '<span class="text-danger">0%</span>';
              $isStuP_text = 'Not activated for your account.';
            }

            if ( $user_details->is_vip == 1 ) {
              $isVip = '<span class="text-primary">100%</span>';
              $isVip_text = "Your BPI Membership Subscription is running";
            } elseif ( $user_details->vip_pending == 1 ) {
              $isVip = '<span class="text-warning">50%</span>';
              $isVip_text = "Pending approval from admin.";
            }
            else {
              $isVip = '<span class="text-danger">0%</span>';
              $isVip_text = "You are not subscribed to any BPI Package";
            }
            ?>
            <?php
            if ( $user_details->is_shelter == 1 && $user_details->shelter_wallet == 1 ) {
              $isShelter = '<span class="text-primary">100%</span>';
              $shelter_text = "You have an active Shelter Palliative running";
            } elseif ( $user_details->is_shelter == 1 && $user_details->shelter_wallet == 0 ) {
              $isShelter = '<span class="text-info">80%</span>';
              $shelter_text = "A Regular BPI Palliative is running, Pending Shelter Activation";
            }
            elseif ( $user_details->shelter_pending == 1 ) {
              $isShelter = '<span class="text-warning">50%</span>';
              $shelter_text = "Your Shelter Palliative is pending approval";
            } else {
              $isShelter = '<span class="text-danger">0%</span>';
              $shelter_text = "You have not activated any Shelter Package";
            }
            ?>
            
            <!-- Profile status wdgets-->
            <div class="col-12 col-lg-4 mb-5">
              <div class="scroll-out">
                <div class="scroll-by-count" data-count="4">
                  <div class="card mb-2 hover-border-primary"> 
					  <a href="#" class="row g-0 sh-9">
                    <div class="col-auto">
                      <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <i data-acorn-icon="server"></i> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="d-flex flex-column">
                          <div class="text-alternate">BPI Activation: <?php echo $isVip; ?></div>
                          <div class="text-small text-muted"><?php echo $isVip_text; ?></div>
                        </div>
                      </div>
                    </div>
                    </a> 
				</div>
                  <div class="card mb-2 hover-border-primary"> 
                      <a href="<?php echo base_url('profile');?>" class="row g-0 sh-9">
                    <div class="col-auto">
                      <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <i data-acorn-icon="user"></i> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="d-flex flex-column">
                          <div class="text-alternate">Profile Status: <?php echo $isComp; ?></div>
                          <div class="text-small text-muted"><?php echo $profile_text; ?></div>
                        </div>
                      </div>
                    </div>
                    </a> 
                </div>
                  <div class="card mb-2 hover-border-primary"> <a href="#" class="row g-0 sh-9">
                    <div class="col-auto">
                      <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <i data-acorn-icon="shield-check"></i> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="d-flex flex-column">
                          <div class="text-alternate">Shelter Palliative Activation: <?php echo $isShelter; ?></div>
                          <div class="text-small text-muted"><?php echo $shelter_text; ?></div>
                        </div>
                      </div>
                    </div>
                    </a> 
                    </div>
                  <div class="card mb-2 hover-border-primary"> <a href="#" class="row g-0 sh-9">
                    <div class="col-auto">
                      <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <i data-acorn-icon="book"></i> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="d-flex flex-column">
                          <div class="text-alternate">Student Palliative Activation: <?php echo $isStuP; ?></div>
                          <div class="text-small text-muted"><?php echo $isStuP_text; ?></div>
                        </div>
                      </div>
                    </div>
                    </a> 
                    </div>
                </div>
              </div>
            </div>
          </div>
            <div class="row">
            <div class="col-12 mb-5">
              <h2 class="small-title">Latest Update!</h2>
              <div class="card h-100-card">
                <div class="card-body row g-0">
                  <div class="col-12">
                    <div class="cta-2">BPI Fractional Ownership Program: </div>
                    <div class="mb-3 text-primary">Special Offer!!</a></div>
                    <div class="row g-2">
                      <div class="col-12">
                        <div class="text-alternate mb-3 mb-sm-0 pe-3 w-85"> 
                            The BPI Fractional Ownership Program is designed to enable joint contributions towards packages, subscriptions, or special offers, allowing participants to share both the cost and the benefits. This unique model supports groups of individuals who contribute a percentage of the total price, thereby collectively owning and enjoying the associated benefits of the program.
                        </div>
                        <div class="text-alternate mb-3 mb-sm-0 pe-3 w-85">
                           <h2 class="small-title mt-3"> BPI Training Center Investment – N3,000,000:</h2>
                            The BeepAgro Palliative Initiative (BPI) Training Center is a cutting-edge facility that provides individuals with advanced digital, agricultural, and leadership skills. As a hub for innovation and empowerment, the center aims to foster entrepreneurship and self-sustainability, creating new opportunities for a brighter future.<br><br>
                            We are thrilled to announce that 100 investment slots are now available for BPI members. Investors will be automatically enrolled in the prestigious BPI Leadership Pool, giving them a prominent role in shaping our transformative initiatives. Through BPI’s Fractional Ownership Program, members can co-invest in the BPI Training Center, sharing ownership and leadership benefits.<br><br>
                            For example, 4 to 8 investors can jointly contribute to secure a single leadership slot in the BPI Leadership Pool, sharing the benefits equally.
                        </div>
                        <div class="text-alternate mb-3 mb-sm-0 pe-3 w-85">
                           <h2 class="small-title mt-3"> BPI Zero Hunger Meal Pack Sponsor Partner- N 4,500,000:</h2>
                            As a BPI Zero Hunger Meal Pack Sponsor Partner, you can contribute N4.5 million per slot, gaining leadership privileges and lifetime royalty benefits from the BPI Zero Hunger Program. Sponsors investing in two or more slots (N9 million for two slots) are eligible for higher benefits, including a stake in the BPI Leadership Pool and continued royalty income. Additionally, groups of 4 to 9 contributors can co-sponsor and share the stakes in the BPI Leadership Pool and the associated lifetime royalties.
                        </div>
                      </div>
                      <div class="col-12 align-items-right mt-3">
                        <a href="<?php echo base_url('available_slots');?>" class="btn btn-icon btn-icon-start btn-primary">Exlore Packages</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>    
            </div>
              <div class="row">
                 <div class="col-12 col-xl-4 mb-3">
                <div class="alert alert-info mt-2 justify-content-center"> 
                    <strong>LEADERSHIP POOL CHALLENGE!! </strong><br> 
                    Enjoy an average Yearly Revenue Distribution of N50 million (Naira) Yearly!! Capped at the first 100 members to Qualify <br><br><br>
                </div>
            </div>
            <div class="col-12 col-xl-4 mb-3">
                <div class="alert alert-primary mt-2 justify-content-center"> 
                    <strong>Qualification Option 1 </strong><br> 
                     <ul>
                        <li>
                         Activate or Upgrade To Regular Plus
                         </li>
                        <li>
                         Invite / Sponsor 70 Regular Plus Members
                         </li>
                    </ul><br>
                </div>
            </div>
            <div class="col-12 col-xl-4 mb-3">
                <div class="alert alert-primary mt-2 justify-content-center"> 
                    <strong>Qualification Option 2</strong><br> 
                    <ul>
                        <li>
                         Activate or Upgrade To Regular Plus
                         </li>
                        <li>
                         Invite / Sponsor upto 100 Regular Plus Members on First generation(50) and Second Generation(50)
                         </li>
                    </ul>
                </div>
            </div>  
              </div>
             
            <div class="row g-2">
			<div class="col-12 col-xl-4 mb-5">
              <h2 class="small-title">Leadership Pool</h2>
				<?php
				$regs = $this->generic_model->get_count('active_shelters',array('amount'=>10000,'status'=>'active')); 
				$regp =  ($this->generic_model->get_count('active_shelters',array('amount'=> 40000,'status'=>'active')) + $this->generic_model->get_count('active_shelters',array('amount'=> 50000,'status'=>'active')) );
				$regPro =  $this->generic_model->get_count('active_shelters',array('amount'=> 23000,'status'=>'active')); 
				$debitGold = (210000 * 6);
				$gold = $this->generic_model->get_count('active_shelters',array('amount'=> 210000,'status'=>'active'));
				$real_gold = ($gold - 6);
				$platinum = $this->generic_model->get_count('active_shelters',array('amount'=> 310000,'status'=>'active')); 
				
				
				$regular_pool = $this->generic_model->getInfo('investors_pool','source','regular')->amount;
				$regular_pro_pool = $this->generic_model->getInfo('investors_pool','source','regular_pro')->amount;
				$regular_plus_pool = $this->generic_model->getInfo('investors_pool','source','regular_plus')->amount;
				$gold_pool = $this->generic_model->getInfo('investors_pool','source','gold')->amount;
				$platinum_pool = $this->generic_model->getInfo('investors_pool','source','platinum')->amount;
				
				$pool = ($regular_pool * $regs) + ($regular_pro_pool * $regp) + ($regular_plus_pool + $regPro) + ($gold_pool + $real_gold) + ($platinum_pool + $platinum);
				$pool_withdrawal = $this->generic_model->getSum('share_withdrawal','amount',array('user_id'=>1));
				$investors_pool = ($pool - $pool_withdrawal);
				?>
              <div class="scroll-out">
                <div class="scroll-by-count" data-count="4">
                  <div class="card mb-2">
					  <a href="#" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url('giphy.webp'); ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate">
								<?php  echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
								<?php echo $this->generic_model->convert_currency($user_details->default_currency,$investors_pool); ?>  
							</div>
                            <div class="text-small text-muted">Last Checked: <?php echo date("Y-m-d H:i:s"); ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i></div>
                        </div>
                      </div>
                    </div>
                    </a> 
					</div>
                 
                </div>
              </div>
            </div>
			<div class="col-12 col-xl-4 mb-5">
              <h2 class="small-title">Live Statistics</h2>
              <div class="scroll-out">
                <div class="scroll-by-count" data-count="4">
                  <div class="card mb-2">
					  <a href="#" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url('warning.webp'); ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate">Total Members</div>
                            <div class="text-small text-muted">Last Checked: <?php echo date("Y-m-d H:i:s"); ?></div>
                          </div>
                          <div class="d-flex flex-column col-4 text-warning"> <i data-acorn-icon="user"></i> <?php echo ($this->generic_model->get_count('users',array('verified'=>1)) + $this->generic_model->get_count('users',array('verified'=>0))); ?></div>
                        </div>
                      </div>
                    </div>
                    </a> 
					</div>
                 
                </div>
              </div>
            </div>
			<div class="col-12 col-xl-4 mb-5">
              <h2 class="small-title">Palliative Counter</h2>
              <div class="scroll-out">
                <div class="scroll-by-count" data-count="4">
                  <div class="card mb-2">
					  <a href="#" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="<?php echo base_url('approved.webp'); ?>"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate">Palliative Members</div>
                            <div class="text-small text-muted">Last Checked: <?php echo date("Y-m-d H:i:s"); ?></div>
                          </div>
                          <div class="d-flex flex-column col-4 text-success "> <i data-acorn-icon="user"></i> <?php echo $this->generic_model->count_vip_users_with_active_shelters(); ?></div>
                        </div>
                      </div>
                    </div>
                    </a> 
					</div>
                 
                </div>
              </div>
            </div>				
              </div>
            </div>
          </div>
          <!-- Title segment-->
          
            
          <div class="mb-5">
  <h2 class="small-title">Best Deals!!</h2>
  <div class="row g-2 row-cols-1 row-cols-xl-2 row-cols-xxl-4">
    <div class="col">
      <div class="card h-100">
        <div class="card-body">
          <div class="text-center">
            <img src="<?php echo base_url('assets/img/illustration/icon-performance.webp'); ?>" class="theme-filter" alt="launch">
            <div class="d-flex flex-column sh-5">
              <a href="<?php echo base_url('bsc_msc');?>" class="heading stretched-link">BPI BSC &amp; Masters</a>
            </div>
          </div>
          <div class="text-muted">Enroll with BPI Strategic Partner Universities Abroad for BSC and Masters Degree</div>
        </div>
      </div>
    </div>
    <div class="col">
      <div class="card h-100">
        <div class="card-body">
          <div class="text-center">
            <img src="<?php echo base_url('assets/img/illustration/icon-launch.webp'); ?>" class="theme-filter" alt="performance">
            <div class="d-flex flex-column sh-5">
              <a href="<?php echo base_url('bsc_msc');?>" class="heading stretched-link">ICT Skills for Teens</a>
            </div>
          </div>
          <div class="text-muted">A unique oppotunity to embark on a digital skill journey from the ground up</div>
        </div>
      </div>
    </div>
    <div class="col">
      <div class="card h-100">
        <div class="card-body">
          <div class="text-center">
            <img src="<?php echo base_url('assets/img/illustration/icon-analytics.webp'); ?>" class="theme-filter" alt="configure">
            <div class="d-flex flex-column sh-5">
              <a href="<?php echo base_url('details/14');?>" class="heading stretched-link">BPI Training Center Investment</a>
            </div>
          </div>
          <div class="text-muted">100 slots available! Secure a slot to be automatically added to the prestigious BPI Leadership Pool</div>
        </div>
      </div>
    </div>
    <div class="col">
      <div class="card h-100">
        <div class="card-body">
          <div class="text-center">
            <img src="<?php echo base_url('assets/img/illustration/icon-configure.webp'); ?>" class="theme-filter" alt="analytics">
            <div class="d-flex flex-column sh-5">
              <a href="<?php echo base_url('details/13');?>" class="heading stretched-link">Young Professionals Bootcamp 2024</a>
            </div>
          </div>
          <div class="text-muted">Upcoming International Leadership and Entrepreneurship Event, scheduled to take place in Atlanta Metropolitan State College, USA.</div>
        </div>
      </div>
    </div>
  </div>
</div>
          
          <div class="row">
            <div class="col-12 col-xxl-4">
              <h2 class="small-title">Foundational pioneers members Growth Promotion.</h2>
              <div class="card h-100-card">
                <div class="card-body h-100">
                  <div class="row g-0">
                    <div class="col-12 col-sm-auto pe-4 d-flex justify-content-center"> <img src="<?php echo base_url('assets/img/illustration/icon-integrate.webp');?>" alt="integrate" class="theme-filter"> </div>
                    <div class="col-12 col-sm">
                      <p>BPI Promotion Leaderboard</p>
                      <p>Follow the promotion live statistics!</p>
                      <form>
                        <a href="<?php echo base_url('leaderboard'); ?>" class="btn btn-icon btn-icon-start btn-outline-primary mt-1"> <i data-acorn-icon="menu-shrink"></i> <span>Leaderboard</span> <span class="badge bg-danger text-uppercase">New</span> </a>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-12 col-xxl-8">
              <h2 class="small-title">Membership Growth Promotion Reward</h2>
              <div class="row g-2">
                <div class="col-12 col-md-6">
                  <div class="card">
                    <div class="h-100 row g-0 card-body py-5 align-items-center">
                      <div class="col-auto">
                        <div class="bg-gradient-light sw-5 sh-5 rounded-xl d-flex justify-content-center align-items-center"> <i data-acorn-icon="dollar" class="text-white"></i> </div>
                      </div>
                      <div class="col">
                        <div class="sh-5 d-flex align-items-center lh-1-25 ps-3">First to activate 100 members</div>
                      </div>
                      <div class="col-auto ps-3">
                        <div class="text-primary"> <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,100000); ?> &amp; More </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-12 col-md-6">
                  <div class="card">
                    <div class="h-100 row g-0 card-body py-5 align-items-center">
                      <div class="col-auto">
                        <div class="bg-gradient-light sw-5 sh-5 rounded-xl d-flex justify-content-center align-items-center"> <i data-acorn-icon="board-2" class="text-white"></i> </div>
                      </div>
                      <div class="col">
                        <div class="sh-5 d-flex align-items-center lh-1-25 ps-3">First to activate 500 members</div>
                      </div>
                      <div class="col-auto ps-3">
                        <div class="text-primary"> <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,400000); ?> &amp; More </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-12 col-md-6">
                  <div class="card">
                    <div class="h-100 row g-0 card-body py-5 align-items-center">
                      <div class="col-auto">
                        <div class="bg-gradient-light sw-5 sh-5 rounded-xl d-flex justify-content-center align-items-center"> <i data-acorn-icon="calendar" class="text-white"></i> </div>
                      </div>
                      <div class="col">
                        <div class="sh-5 d-flex align-items-center lh-1-25 ps-3">First to activate 1000 members</div>
                      </div>
                      <div class="col-auto ps-3">
                        <div class="text-primary"> <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,800000); ?> &amp; More </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-12 col-md-6">
                  <div class="card">
                    <div class="h-100 row g-0 card-body py-5 align-items-center">
                      <div class="col-auto">
                        <div class="bg-gradient-light sw-5 sh-5 rounded-xl d-flex justify-content-center align-items-center"> <i data-acorn-icon="wallet" class="text-white"></i> </div>
                      </div>
                      <div class="col">
                        <div class="sh-5 d-flex align-items-center lh-1-25 ps-3">Activate 10 new members daily</div>
                      </div>
                      <div class="col-auto ps-3">
                        <div class="text-primary">Earn <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,500); ?> per member </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="alert alert-primary mb-5 mt-2 justify-content-center"> Inscribe Your Name as a foundational pioneer member with this growth promotion. Be among the first 1000 Subscribed and Activated members Gifted with BPI pioneer NFT </div>
          </div>
		
          <!-- BPI Calculator-->
          <div class="row mb-3">
            <div class="col-12 col-xl-5 mb-5">
              <h2 class="small-title">Membership Selection</h2>
              <div class="row g-2 h-lg-100-card">
                <div class="col-12 h-100">
                  <div class="card h-100">
                    <div class="card-body d-flex flex-column justify-content-between">
                      <div>
                        <div class="cta-3">BPI Palliative Calculator</div>
                        <div class="mb-3 cta-3 text-primary">Generic Member Performance Calculator</div>
                        <div class="text-muted mb-4 clamp-line" data-line="3"> Fill the form below to calculate what you stand to achieve with BPI </div>
                      </div>
                      <div class="filled mb-3" id="main_selection"> <i data-acorn-icon="shield-check"></i>
                        <select class="form-control" id="shelter_type" onChange="calculator()" name="shelter_type" required="required">
                          <option>Select BPI Membership</option>
                          <option value="1">Regular (<?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,10000.); ?>)</option>
                          <option value="2">Silver Plus (<?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,110000); ?>)</option>
                          <option value="3">Gold Plus (<?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,210000); ?>)</option>
                        </select>
                      </div>
                      <div class="filled mb-3" id="regular_selector" style="display:none;"> <i data-acorn-icon="shield-check"></i>
                        <select class="form-control" id="palliative_type" onChange="calculator()" name="shelter_type" required="required">
                          <option>Select Palliative Type</option>
                          <option value="2">Silver Plus (<?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,100000); ?>)</option>
                          <option value="3">Gold Plus (<?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,200000); ?>)</option>
                        </select>
                      </div>
                      <div class="filled mb-3"> <i data-acorn-icon="server"></i>
                        <select class="form-control" id="shelter_option" onChange="calculator()" name="shelter_option" required="required">
                          <option>Select Palliative Options</option>
                          <?php foreach ($shelter as $row): ?>
                          <option value="<?php echo $row['id']; ?>"> <?php echo $row['name']; ?> (<?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,$row['amount']); ?>) </option>
                          <?php endforeach; ?>
                        </select>
                      </div>
                      <div class="filled mb-3"> <i data-acorn-icon="user"></i>
                        <input type="number" name="invites" class="form-control" id="invites" onKeyUp="calculator()" placeholder="Enter number of invites, minimum is 10">
                        <input type="hidden" value="<?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->sign; ?>" id="currency_selector" >
                      </div>
                      <div class="mt-4 row">
                        <div class="col-12 col-xl-8"> 
                          <!--<ul>
									  <li>
									      Sub Total: <?php //echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php //echo $this->generic_model->convert_currency($user_details->default_currency,10000); ?>
									  </li>
									  <li>
									      VAT: <?php //echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php //echo $this->generic_model->convert_currency($user_details->default_currency,750.); ?>
									  </li>
									  <li class="text-primary">
									      Total Due Now: <?php //echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php //echo $this->generic_model->convert_currency($user_details->default_currency,10750.); ?>
									  </li>
									</ul>--> 
                        </div>
                        <!--<div class="col-12 col-xl-4">
							<button type="button" onClick="" class="btn btn-icon btn-icon-start btn-outline-primary">
								 	 <i data-acorn-icon="chart-4"></i>
								  	 <span>Calculate</span>
									</button>
								</div>--> 
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-12 col-xl-7 mb-5">
              <h2 class="small-title">Output</h2>
              <div class="card h-100-card">
                <div class="card-body">
                  <div class="col-12">
                    <div class="cta-2">Calculator Results!</div>
                    <div class="mb-3 text-primary">Projections</div>
                    <div id="progress" class="mt-2 mb-2 text-warning"> </div>
                    <div class="row g-2" id="main_display">
                      <div class="text-muted mb-3 mb-sm-0 pe-3 col-12"> These are the projections for your calculation <br>
                        <br>
                        <ol>
                          <li><span id="bpt"></span></li>
                          <li><span id="cashback"></span></li>
                          <li><span id="palliative"></span></li>
                          <li><span id="shelter"></span></li>
                          <li><span id="levels"></span></li>
                        </ol>
                      </div>
                    </div>
                    <div class="row" id="regular_display" style="display:none;">
                      <div class=" mb-3 col-xl-6 col-12"> Pre-Palliative Type Activation <br>
                        <br>
                        <ol>
                          <li><span id="pre_bpt"></span></li>
                          <li><span id="pre_cashback"></span></li>
                          <li><span id="pre_palliative"></span></li>
                          <li><span id="pre_shelter"></span></li>
                          <li><span id="pre_levels"></span></li>
                        </ol>
                      </div>
                      <div class="text-primary mb-3 col-xl-6 col-12" id="activated_col" style="display:none;"> Palliative Type Activated! <br>
                        <br>
                        <ol>
                          <li><span id="post_bpt"></span></li>
                          <li><span id="post_cashback"></span></li>
                          <li><span id="post_palliative"></span></li>
                          <li><span id="post_shelter"></span></li>
                          <li><span id="post_levels"></span></li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- vendor details --> 
            
          </div>
          
          <!-- BPI Ticket Details-->
          <?php if(!empty($myticket)){ ?>
          <div class="row mb-3">
            <div class="col-12 col-xxl-auto mb-5">
              <h2 class="small-title">Your BPI Ticket Details</h2>
              <div class="row g-2 h-100">
                <div class="col-12 col-sm-4 col-xxl-auto">
                  <div class="card w-100 sw-xxl-19 h-100-card sh-xxl-22">
                    <div class="h-100 d-flex flex-column justify-content-between card-body align-items-center">
                      <div class="sw-8 sh-8 d-flex justify-content-center align-items-center">
                        <div>
                          <h1 class="text-primary" id="hours">00</h1>
                        </div>
                      </div>
                      <div class="text-alternate text-center mb-0 sh-8 d-flex align-items-end lh-1-25">Hours Left</div>
                    </div>
                  </div>
                </div>
                <div class="col-12 col-sm-4 col-xxl-auto">
                  <div class="card w-100 sw-xxl-19 h-100-card sh-xxl-22">
                    <div class="h-100 d-flex flex-column justify-content-between card-body align-items-center">
                      <div class="sw-8 sh-8 d-flex justify-content-center align-items-center">
                        <div>
                          <h1 class="text-primary" id="minutes">00</h1>
                        </div>
                      </div>
                      <div class="text-alternate text-center mb-0 sh-8 d-flex align-items-end lh-1-25">Minutes Left</div>
                    </div>
                  </div>
                </div>
                <div class="col-12 col-sm-4 col-xxl-auto">
                  <div class="card w-100 sw-xxl-19 h-100-card sh-xxl-22">
                    <div class="h-100 d-flex flex-column justify-content-between card-body align-items-center">
                      <div class="sw-8 sh-8 d-flex justify-content-center align-items-center">
                        <div>
                          <h1 class="text-primary" id="seconds">00</h1>
                        </div>
                      </div>
                      <div class="text-alternate text-center mb-0 sh-8 d-flex align-items-end lh-1-25">Seconds Left</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <?php
            foreach ( $myticket as $ticket ) {
              $franchise_details = $this->generic_model->getInfo( 'philanthropy_franchise', 'id', $ticket->partner_id );
              $partner_details = $this->generic_model->getInfo( 'philanthropy_partners', 'id', $ticket->partner_id );
              $offer_details = $this->generic_model->getInfo( 'philanthropy_offers', 'id', $ticket->offer_id );
              $category_details = $this->generic_model->getInfo( 'philanthropy_category', 'id', $ticket->category_id );
              $creator = $this->generic_model->getInfo( 'users', 'id', $ticket->created_by );
              $claimed_date = $ticket->date_claimed;
              $startDate = strtotime( $claimed_date );
              $endDate = strtotime( '+1 day', $startDate );
              $currentTimestamp = strtotime( date( 'Y-m-d H:i:s' ) );

              ?>
            <div class="col mb-5">
              <h2 class="small-title">Important Info!</h2>
              <div class="card h-100-card">
                <div class="card-body row g-0">
                  <div class="col-12">
                    <div class="cta-2"><?php echo $offer_details->offer; ?> -
                      <?php
                      if ( $currentTimestamp > $endDate ) {
                        echo $ticket->code;
                      } else {
                        echo 'XXX-XXXXX-XXX';
                      }
                      ?>
                    </div>
                    <div class="mb-3 text-primary">Provider: <?php echo $partner_details->name; ?> | Created By <a href="#"><?php echo $creator->firstname.' '.$creator->lastname; ?></a> - <?php echo $ticket->activated_date ?></div>
                    <div class="row g-2">
                      <div class="col">
                        <div class="text-muted mb-3 mb-sm-0 pe-3 w-85"> Verifying that you have used this ticket ensures transparency and will also notify your ticket sponsor that someone has benefitted from their goodwill. </div>
                      </div>
                      <?php
                      if ( $currentTimestamp > $endDate ) {
                        ?>
                      <div class="col-12 col-sm-auto d-flex align-items-center position-relative"> <a href="<?php echo base_url('meal_claimed/'.$ticket->id); ?>" class="btn btn-icon btn-icon-start btn-primary"> <i data-acorn-icon="send"></i> <span>I Have Used This Ticket</span> </a> </div>
                      <?php }else{ ?>
                      <div class="col-12 col-sm-auto d-flex align-items-center position-relative">
                        <button type="button" class="btn btn-icon btn-icon-start btn-primary" disabled> <i data-acorn-icon="clock"></i> <span id="hours_btn"></span> : <span id="minutes_btn"></span> : <span id="seconds_btn"></span> </button>
                      </div>
                      <?php } ?>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <?php } ?>
          </div>
          <?php } ?>
          <?php
          $sql = "SELECT COUNT(*) AS missing_links
					FROM link_builder lb
					LEFT JOIN link_enforcer le ON lb.name = le.id
					WHERE lb.user_id = ?";
          $query = $this->db->query( $sql, array( $user_details->id ) );
          $row = $query->row();
          $missingLinksCount = $row->missing_links;

          //active links
          $active_links = $this->generic_model->get_count( 'link_enforcer', array( 'status' => 'active' ) );

          if ( $missingLinksCount != $active_links ) {
            //echo $missingLinksCount;
            $upline = $this->generic_model->getInfo( 'referrals', 'user_id', $user_details->id )->referred_by;
            $upline_details = $this->generic_model->getInfo( 'users', 'id', $upline );
            $link = $this->generic_model->select_where( 'link_builder', array( 'user_id' => $upline ) );
            if ( $link > 0) {
              ?>
          
          <!-- Third party training-->
          <div class="row mb-2">
            <div class="col-xl-4 mb-5">
              <h2 class="small-title mb-2">THIRD-PARTY TRAINING &amp; MENTORSHIP OPPORTUNITIES</h2>
              <div class="scroll-out">
                <div class="scroll-by-count" data-count="3">
                  <?php
                  foreach ( $link as $provider ) {

                    $vendor_link = $this->generic_model->get_by_condition( 'link_builder', array( 'user_id' => $user_details->id, 'name' => $provider->name ) );

                    $link_details = $this->generic_model->getInfo( 'link_enforcer', 'id', $provider->name );

                    if ( empty( $vendor_link ) ) {
                      ?>
                  <div class="card mb-2"> <a href="<?php echo $provider->link; ?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <img class="sw-6 sh-6 rounded-xl mb-1" src="https://beepagro.com/wpanel/uploads/link_enforcer/<?php echo $link_details->logo;?>" alt="card image"> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate"><?php echo $link_details->name;?></div>
                            <div class="text-small text-muted">Invited By: <?php echo $upline_details->firstname.' '.$upline_details->lastname; ?></div>
                          </div>
                          <div class="d-flex flex-column col-4"> <i data-acorn-icon="user"></i> <span>Register</span> </div>
                        </div>
                      </div>
                    </div>
                    </a> </div>
                  <?php }} ?>
                </div>
              </div>
            </div>
            <div class="col-xl-8 mb-5">
              <h2 class="small-title mb-2">&nbsp;</h2>
              <div class="row g-2 h-lg-100-card">
                <div class="col-12 col-lg-6 h-100">
                  <div class="card h-100">
                    <div class="card-body d-flex flex-column justify-content-between">
                      <div>
                        <div class="cta-3">Need more details?</div>
                        <div class="mb-3 cta-3 text-primary">Read this!</div>
                        <div class="text-muted mb-4 clamp-line" data-line="3"> CLICK ON THE REGISTER BUTTON TO ACTIVATE YOUR TRAINING &amp; MENTORSHIP </div>
                      </div>
                      <a href="<?php echo base_url('refer');?>" class="btn btn-icon btn-icon-start btn-outline-primary stretched-link sw-15"> <i data-acorn-icon="user"></i> <span>Invites</span> </a> </div>
                  </div>
                </div>
                <div class="col-12 col-lg-6 h-100">
                  <div class="card h-100">
                    <div class="card-body d-flex flex-column justify-content-between">
                      <div>
                        <div class="cta-3">I have registered</div>
                        <div class="mb-3 cta-3 text-primary">What next?</div>
                        <div class="text-muted mb-4 clamp-line" data-line="3">After Registration update your affiliate link in the Invites section of BPI </div>
                      </div>
                      <a href="<?php echo base_url('refer');?>" class="btn btn-icon btn-icon-start btn-outline-primary sw-15"> <i data-acorn-icon="user"></i> <span>Invites</span> </a> </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <?php
          }
          } else {
            ?>
          <?php
          }

          ?>
          <?php if(!empty($tickets)) { ?>
          <!-- BPI Recent Palliative Tickets (Meals & Health) -->
          <div class="mb-2">
            <h2 class="small-title">BPI Recent Palliative Tickets (Meals &amp; Health)</h2>
            <div class="row">
              <div class="col-12 mb-2">
                <div class="card bg-transparent no-shadow d-none d-md-block">
                  <div class="row g-0 sh-3">
                    <div class="col">
                      <div class="card-body pt-0 pb-0 h-100">
                        <div class="row g-0 h-100 align-content-center">
                          <div class="col-12 col-md-3 d-flex align-items-center mb-2 mb-md-0 text-muted text-small">Category</div>
                          <div class="col-6 col-md-3 d-flex align-items-center text-alternate text-medium text-muted text-small">Name</div>
                          <div class="col-6 col-md-3 d-flex align-items-center text-alternate text-medium text-muted text-small">Provider</div>
                          <div class="col-6 col-md-2 d-flex align-items-center text-alternate text-medium text-muted text-small">Sponsor</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div id="checkboxTable" class="mb-n2">
                  <?php
                  foreach ( $tickets as $ticket ) {
                    //details........ 	 	 	 	 	
                    $franchise_details = $this->generic_model->getInfo( 'philanthropy_franchise', 'id', $ticket->partner_id );
                    $partner_details = $this->generic_model->getInfo( 'philanthropy_partners', 'id', $ticket->partner_id );
                    $offer_details = $this->generic_model->getInfo( 'philanthropy_offers', 'id', $ticket->offer_id );
                    $category_details = $this->generic_model->getInfo( 'philanthropy_category', 'id', $ticket->category_id );
                    $creator = $this->generic_model->getInfo( 'users', 'id', $ticket->created_by );
                    $cat_id = $ticket->category_id;
                    $category = $this->generic_model->getInfo( 'philanthropy_category', 'id', $cat_id )->name;
                    ?>
                  <div class="card mb-2">
                    <div class="row g-0 sh-21 sh-md-7">
                      <div class="col">
                        <div class="card-body pt-0 pb-0 h-100">
                          <div class="row g-0 h-100 align-content-center">
                            <div class="col-11 col-md-3 d-flex flex-column justify-content-center mb-2 mb-md-0 order-1 order-md-1 h-md-100 position-relative">
                              <div class="text-muted text-small d-md-none">Category</div>
                              <a href="#" class="text-truncate stretched-link"><?php echo $category;?> Palliative</a> </div>
                            <div class="col-6 col-md-3 d-flex flex-column justify-content-center mb-2 mb-md-0 order-3 order-md-2">
                              <div class="text-muted text-small d-md-none">Name</div>
                              <div class="text-alternate"><?php echo $offer_details->offer; ?></div>
                            </div>
                            <div class="col-6 col-md-3 d-flex flex-column justify-content-center mb-2 mb-md-0 order-4 order-md-3">
                              <div class="text-muted text-small d-md-none">Provider</div>
                              <div class="text-alternate"><?php echo $partner_details->name; ?></div>
                            </div>
                            <div class="col-6 col-md-2 d-flex flex-column justify-content-center mb-2 mb-md-0 order-last order-md-5">
                              <div class="text-muted text-small d-md-none">Sponsor</div>
                              <div class="text-alternate"> <span class="badge rounded-pill bg-outline-primary"><?php echo $creator->firstname.' '.$creator->lastname; ?></span> </div>
                            </div>
                            <div class="col-1 col-md-1 d-flex flex-column justify-content-center order-2 order-md-last">
                              <div class="form-check d-flex flex-column justify-content-center align-items-end mb-0 pe-none">
                                <input type="checkbox" class="form-check-input ms-n2 mt-n3 ms-md-0 mt-md-0 me-0">
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php } ?>
                </div>
                <div class="mt-4 float-end"> <a href="<?php echo base_url('aid_tickets');?>" class="btn btn-icon btn-icon-start btn-outline-primary"> <i data-acorn-icon="file-empty"></i> <span>Browse Tickets</span> </a> </div>
              </div>
            </div>
          </div>
          <?php } ?>
          
          <!-- Recent Available offers -->
          <?php if(!empty($partner_offers)){ ?>
          <div class="row mb-5"> 
            <!-- Stats -->
            <div class="col-lg-4">
              <h2 class="small-title">Stats Overview</h2>
              <div class="card h-100-card">
                <div class="card-body">
                  <div class="row g-0 align-items-center mb-4 sh-5">
                    <div class="col-auto">
                      <div class="d-flex flex-column justify-content-center align-items-center sh-5 sw-5 rounded-xl bg-gradient-light">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-loaf text-white">
                          <path d="M18 11C18 16 14.4183 16 10 16C5.58172 16 2 16 2 11C2 7.68629 4 4 10 4C16 4 18 7.68629 18 11Z"></path>
                          <path d="M6 10 6 5M14 10 14 5M10 9 10 4"></path>
                        </svg>
                      </div>
                    </div>
                    <div class="col ps-3">
                      <div class="row g-0">
                        <div class="col">
                          <div class="sh-5 d-flex align-items-center">Total Partners</div>
                        </div>
                        <div class="col-auto">
                          <div class="cta-3 text-primary sh-5 d-flex align-items-center"><?php echo $this->generic_model->get_count('philanthropy_partners',array('status'=>1));?></div>
                        </div>
                      </div>
                      <div class="row g-0">
                        <div class="col">
                          <div class="progress progress-xs">
                            <div class="progress-bar" role="progressbar" aria-valuenow="<?php echo $this->generic_model->get_count('philanthropy_partners',array('status'=>1));?>" aria-valuemin="0" aria-valuemax="100" style="width: <?php echo $this->generic_model->get_count('philanthropy_partners',array('status'=>1));?>%;"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="row g-0 align-items-center mb-4 sh-5">
                    <div class="col-auto">
                      <div class="d-flex flex-column justify-content-center align-items-center sh-5 sw-5 rounded-xl bg-gradient-light">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-building text-white">
                          <path d="M5 5.5C5 4.09554 5 3.39331 5.33706 2.88886C5.48298 2.67048 5.67048 2.48298 5.88886 2.33706C6.39331 2 7.09554 2 8.5 2H11.5C12.9045 2 13.6067 2 14.1111 2.33706C14.3295 2.48298 14.517 2.67048 14.6629 2.88886C15 3.39331 15 4.09554 15 5.5V14.5C15 15.9045 15 16.6067 14.6629 17.1111C14.517 17.3295 14.3295 17.517 14.1111 17.6629C13.6067 18 12.9045 18 11.5 18H8.5C7.09554 18 6.39331 18 5.88886 17.6629C5.67048 17.517 5.48298 17.3295 5.33706 17.1111C5 16.6067 5 15.9045 5 14.5V5.5Z"></path>
                          <path d="M12 18V15.75C12 15.0478 12 14.6967 11.8315 14.4444C11.7585 14.3352 11.6648 14.2415 11.5556 14.1685C11.3033 14 10.9522 14 10.25 14H9.75C9.04777 14 8.69665 14 8.44443 14.1685C8.33524 14.2415 8.24149 14.3352 8.16853 14.4444C8 14.6967 8 15.0478 8 15.75V18"></path>
                          <path d="M8 5H8.5M8 8H8.5M8 11H8.5M11.5 5H12M11.5 8H12M11.5 11H12"></path>
                        </svg>
                      </div>
                    </div>
                    <div class="col ps-3">
                      <div class="row g-0">
                        <div class="col">
                          <div class="sh-5 d-flex align-items-center">Total Active Franchise</div>
                        </div>
                        <div class="col-auto">
                          <div class="cta-3 text-primary sh-5 d-flex align-items-center"><?php echo $this->generic_model->get_count('philanthropy_franchise',array('status'=>1));?></div>
                        </div>
                      </div>
                      <div class="row g-0">
                        <div class="col sh-1">
                          <div class="progress progress-xs">
                            <div class="progress-bar" role="progressbar" aria-valuenow="<?php echo $this->generic_model->get_count('philanthropy_franchise',array('status'=>1));?>" aria-valuemin="0" aria-valuemax="100" style="width: <?php echo $this->generic_model->get_count('philanthropy_franchise',array('status'=>1));?>%;"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="row g-0 align-items-center mb-4 sh-5">
                    <div class="col-auto">
                      <div class="d-flex flex-column justify-content-center align-items-center sh-5 sw-5 rounded-xl bg-gradient-light">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-electricity text-white">
                          <path d="M4 9.5C4 8.09554 4 7.39331 4.33706 6.88886 4.48298 6.67048 4.67048 6.48298 4.88886 6.33706 5.39331 6 6.09554 6 7.5 6H12.5C13.9045 6 14.6067 6 15.1111 6.33706 15.3295 6.48298 15.517 6.67048 15.6629 6.88886 16 7.39331 16 8.09554 16 9.5V10.5C16 11.9045 16 12.6067 15.6629 13.1111 15.517 13.3295 15.3295 13.517 15.1111 13.6629 14.6067 14 13.9045 14 12.5 14H7.5C6.09554 14 5.39331 14 4.88886 13.6629 4.67048 13.517 4.48298 13.3295 4.33706 13.1111 4 12.6067 4 11.9045 4 10.5V9.5zM7 15.75C7 15.0478 7 14.6967 7.16853 14.4444 7.24149 14.3352 7.33524 14.2415 7.44443 14.1685 7.69665 14 8.04777 14 8.75 14H11.25C11.9522 14 12.3033 14 12.5556 14.1685 12.6648 14.2415 12.7585 14.3352 12.8315 14.4444 13 14.6967 13 15.0478 13 15.75V16.25C13 16.9522 13 17.3033 12.8315 17.5556 12.7585 17.6648 12.6648 17.7585 12.5556 17.8315 12.3033 18 11.9522 18 11.25 18H8.75C8.04777 18 7.69665 18 7.44443 17.8315 7.33524 17.7585 7.24149 17.6648 7.16853 17.5556 7 17.3033 7 16.9522 7 16.25V15.75z"></path>
                          <path d="M8 2 8 6M12 2 12 6"></path>
                        </svg>
                      </div>
                    </div>
                    <div class="col ps-3">
                      <div class="row g-0">
                        <div class="col">
                          <div class="sh-5 d-flex align-items-center">Total Offers</div>
                        </div>
                        <div class="col-auto">
                          <div class="cta-3 text-primary sh-5 d-flex align-items-center"><?php echo $this->generic_model->get_count('philanthropy_offers',array('status'=>1));?></div>
                        </div>
                      </div>
                      <div class="row g-0">
                        <div class="col sh-1">
                          <div class="progress progress-xs">
                            <div class="progress-bar" role="progressbar" aria-valuenow="<?php echo $this->generic_model->get_count('philanthropy_offers',array('status'=>1));?>" aria-valuemin="0" aria-valuemax="100" style="width: <?php echo $this->generic_model->get_count('philanthropy_offers',array('status'=>1));?>%;"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="row g-0 align-items-center mb-4 sh-5">
                    <div class="col-auto">
                      <div class="d-flex flex-column justify-content-center align-items-center sh-5 sw-5 rounded-xl bg-gradient-light">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-electricity text-white">
                          <path d="M4 9.5C4 8.09554 4 7.39331 4.33706 6.88886 4.48298 6.67048 4.67048 6.48298 4.88886 6.33706 5.39331 6 6.09554 6 7.5 6H12.5C13.9045 6 14.6067 6 15.1111 6.33706 15.3295 6.48298 15.517 6.67048 15.6629 6.88886 16 7.39331 16 8.09554 16 9.5V10.5C16 11.9045 16 12.6067 15.6629 13.1111 15.517 13.3295 15.3295 13.517 15.1111 13.6629 14.6067 14 13.9045 14 12.5 14H7.5C6.09554 14 5.39331 14 4.88886 13.6629 4.67048 13.517 4.48298 13.3295 4.33706 13.1111 4 12.6067 4 11.9045 4 10.5V9.5zM7 15.75C7 15.0478 7 14.6967 7.16853 14.4444 7.24149 14.3352 7.33524 14.2415 7.44443 14.1685 7.69665 14 8.04777 14 8.75 14H11.25C11.9522 14 12.3033 14 12.5556 14.1685 12.6648 14.2415 12.7585 14.3352 12.8315 14.4444 13 14.6967 13 15.0478 13 15.75V16.25C13 16.9522 13 17.3033 12.8315 17.5556 12.7585 17.6648 12.6648 17.7585 12.5556 17.8315 12.3033 18 11.9522 18 11.25 18H8.75C8.04777 18 7.69665 18 7.44443 17.8315 7.33524 17.7585 7.24149 17.6648 7.16853 17.5556 7 17.3033 7 16.9522 7 16.25V15.75z"></path>
                          <path d="M8 2 8 6M12 2 12 6"></path>
                        </svg>
                      </div>
                    </div>
                    <div class="col ps-3">
                      <div class="row g-0">
                        <div class="col">
                          <div class="sh-5 d-flex align-items-center">Total Active Tickets</div>
                        </div>
                        <div class="col-auto">
                          <div class="cta-3 text-primary sh-5 d-flex align-items-center"><?php echo $this->generic_model->get_count('philanthropy_tickets',array('status'=>'active'));?></div>
                        </div>
                      </div>
                      <div class="row g-0">
                        <div class="col sh-1">
                          <div class="progress progress-xs">
                            <div class="progress-bar" role="progressbar" aria-valuenow="<?php echo $this->generic_model->get_count('philanthropy_tickets',array('status'=>1));?>" aria-valuemin="0" aria-valuemax="100" style="width: <?php echo $this->generic_model->get_count('philanthropy_tickets',array('status'=>1));?>%;"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="row g-0">
                    <div class="col pe-4 d-flex flex-column justify-content-between align-items-end"> </div>
                    <div class="col-auto d-flex flex-column justify-content-between align-items-end">
                      <div class="mt-4 float-end"> <a href="<?php echo base_url('donor');?>" class="btn btn-icon btn-icon-start btn-outline-primary"> <i data-acorn-icon="file-empty"></i> <span>Donate Now</span> </a> </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Recent offers -->
            <div class="col-lg-8">
              <h2 class="small-title">Latest Available Offers</h2>
              <div class="scroll-out mb-n2">
                <div class="scroll-by-count os-host os-theme-dark os-host-overflow os-host-overflow-y os-host-resize-disabled os-host-scrollbar-horizontal-hidden os-host-transition" data-count="4" style="height: 352.017px; margin-bottom: -8px;">
                  <div class="os-resize-observer-host observed">
                    <div class="os-resize-observer" style="left: 0px; right: auto;"></div>
                  </div>
                  <div class="os-size-auto-observer observed" style="height: calc(100% + 1px); float: left;">
                    <div class="os-resize-observer"></div>
                  </div>
                  <div class="os-content-glue" style="margin: 0px -15px;"></div>
                  <div class="os-padding">
                    <div class="os-viewport os-viewport-native-scrollbars-invisible os-viewport-native-scrollbars-overlaid" style="overflow-y: scroll;">
                      <div class="os-content" style="padding: 0px 15px; height: 100%; width: 100%;">
                        <?php
                        foreach ( $partner_offers as $offer ) {
                          //get the partner logo for display  partner_id 	offer 	amount 	location_id 
                          $partner = $this->generic_model->getInfo( 'philanthropy_partners', 'id', $offer->partner_id );
                          ?>
                        <div class="card mb-2">
                          <div class="row g-0 sh-17 sh-lg-10">
                            <div class="col-auto"> <img src="<?php echo base_url($offer->image); ?>" alt="<?php echo $partner->name; ?>" class="card-img card-img-horizontal h-100 sw-lg-11 sw-14"> </div>
                            <div class="col">
                              <div class="card-body px-4 py-0 h-100">
                                <div class="row g-0 h-100 align-content-center"> <a href="<?php echo base_url('aid_tickets');?>" class="col-12 col-lg-5 d-flex flex-column mb-lg-0 mb-2 mb-lg-0 pe-3 d-flex">
                                  <div><?php echo $offer->offer; ?></div>
                                  <div class="text-small text-muted text-truncate"><?php echo $partner->name; ?></div>
                                  </a>
                                  <div class="col-12 col-lg-4 d-flex pe-1 mb-2 mb-lg-0 align-items-lg-center">
                                    <div class="lh-1 text-alternate">
                                      <div class="br-wrapper br-theme-cs-icon">
                                        <div class="br-wrapper">
                                          <select class="recentRating" name="rating" autocomplete="off" data-readonly="true" data-initial-rating="5" style="display: none;">
                                            <option value="1">1</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                            <option value="4">4</option>
                                            <option value="5">5</option>
                                          </select>
                                          <div class="br-widget br-readonly"> <a href="#" data-rating-value="1" data-rating-text="1" class="br-selected"></a> <a href="#" data-rating-value="2" data-rating-text="2" class="br-selected"></a> <a href="#" data-rating-value="3" data-rating-text="3" class="br-selected"></a> <a href="#" data-rating-value="4" data-rating-text="4" class="br-selected"></a> <a href="#" data-rating-value="5" data-rating-text="5" class="br-selected br-current"></a>
                                            <div class="br-current-rating">5</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div class="col-12 col-lg-3 d-flex flex-column pe-1 align-items-lg-end">
                                    <div class="text-alternate"><?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,$offer->amount);?></div>
                                    <div class="text-muted text-small">Price</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <?php }?>
                      </div>
                    </div>
                  </div>
                  <div class="os-scrollbar os-scrollbar-horizontal os-scrollbar-unusable">
                    <div class="os-scrollbar-track os-scrollbar-track-off">
                      <div class="os-scrollbar-handle" style="width: 100%; transform: translate(0px);"></div>
                    </div>
                  </div>
                  <div class="os-scrollbar os-scrollbar-vertical" style="height: calc(100% - 8px);">
                    <div class="os-scrollbar-track os-scrollbar-track-off">
                      <div class="os-scrollbar-handle" style="height: 80%; transform: translate(0px);"></div>
                    </div>
                  </div>
                  <div class="os-scrollbar-corner"></div>
                </div>
              </div>
            </div>
          </div>
          <?php } ?>
          
          <!--ref section -->
          <div class="row mb-5"> 
            <!-- send an invite -->
            <div class="col-12 col-xl-4 mb-5">
              <h2 class="small-title">Help</h2>
              <div class="card h-100-card">
                <div class="card-body d-flex flex-column justify-content-between">
                  <div>
                    <div class="cta-3">Auto Inviter</div>
                    <div class="text-muted mb-4">Enter your friend's email in the box below and we will send then an invite from you</div>
                  </div>
                  <form action="<?php echo base_url('user/invite');?>" method="post">
                    <div class="mb-3 filled"> <i data-acorn-icon="user"></i>
                      <input class="form-control" name="firstname" required placeholder="Your Friend's First Name">
                    </div>
                    <div class="mb-3 filled"> <i data-acorn-icon="email"></i>
                      <input class="form-control" name="email" required placeholder="Your Friend's Email">
                      <input type="hidden" class="form-control" id="refLink" value="<?php echo base_url();?>register?ref=<?php echo $user_details->referral_link; ?>">
                    </div>
                    <button type="submit" class="btn btn-icon btn-icon-start btn-outline-primary mt-1"> <i data-acorn-icon="send"></i> <span>Send Invite</span> </button>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <button type="button" id="copyButton" class="btn btn-icon btn-icon-start btn-outline-warning mt-1"> <i data-acorn-icon="clipboard"></i> <span>Copy Link</span> </button>
                  </form>
                </div>
              </div>
            </div>
            
            <!-- recent ref -->
            <div class="col-12 col-xl-4 mb-5">
              <h2 class="small-title">Latest Invites</h2>
              <div class="scroll-out">
                <div class="scroll-by-count" data-count="4">
                  <?php
                  if ( !empty( $referrals ) ) {
                    foreach ( $referrals as $row ) {
                      $fname = $this->generic_model->getInfo( 'users', 'id', $row->user_id )->firstname;
                      $lname = $this->generic_model->getInfo( 'users', 'id', $row->user_id )->lastname;
                      $image = $this->generic_model->getInfo( 'users', 'id', $row->user_id )->profile_pic;
                      if ( empty( $image ) ) {
                        $imager = 'uploads/profile_pictures/104fc816af57174122ec0dbd728fc999.jpg';
                      } else {
                        $imager = $image;
                      }
                      $dateJoined = $this->generic_model->getInfo( 'users', 'id', $row->user_id )->created_at;
                      ?>
                  <div class="card mb-2"> <a href="<?php echo base_url('view_profile/'.$row->user_id);?>" class="row g-0 sh-10">
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
                    </a> </div>
                  <?php } }else{ ?>
                  <div class="card mb-2">
                    <div class="card-body h-100 justify-content-center">
                      <div class="row">
                        <div class="d-flex flex-column col-12">
                          <div class="text-alternate"> You do not have any referral yet </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <?php }?>
                </div>
              </div>
            </div>
            
            <!--recent transaction -->
            <div class="col-12 col-xl-4 mb-5">
              <h2 class="small-title">Recent Transactions</h2>
              <div class="scroll-out">
                <div class="scroll-by-count" data-count="4">
                  <?php
                  if ( !empty( $results ) ) {
                    foreach ( $results as $row ) {
                      ?>
                  <div class="card mb-2"> <a href="<?php echo base_url('transactions');?>" class="row g-0 sh-10">
                    <div class="col-auto">
                      <div class="sw-9 sh-10 d-inline-block d-flex justify-content-center align-items-center">
                        <div class="fw-bold text-primary"> <?php echo $row->transaction_type; ?> </div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                        <div class="row">
                          <div class="d-flex flex-column col-8">
                            <div class="text-alternate">
                              <?php if($row->amount < 1) { echo 'Amount: '.number_format($row->amount,8).' BPT '.$row->status;}else { ?>
                              Amount: <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,$row->amount); }?> </div>
                            <div class="text-small text-muted"> <?php echo $row->description; ?> </div>
                          </div>
                          <div class="d-flex flex-column col-4">
                            <?php
                            if ( $row->status == 'Successful' ) {
                              ?>
                            <span class="badge bg-outline-primary">Successful</span>
                            <?php }elseif($row->status == 'Pending' || $row->status == 'pending'){ ?>
                            <span class="badge bg-outline-warning">Pending</span>
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
          <!--claim code -->
        <div class="row">
                        <?php $is_merchant = $this->generic_model->getInfo('merchants','user_id',$user_details->id);

                        if(empty($is_merchant)){

                        ?>                        
                        <?php }else{ ?>

                        <div class="col-xl-6 col-12 mb-4">
                            <div class="card">
                                <div class="card-header">
                                         Store Products Claim
                                </div>  
                                <div class="card-body">
                                  <h3 class="mb-2 text-primary">Store Pickup Verification</h3>
                                   <form action="<?php echo base_url('user/verify_pickup');?>" method="post">
                                        <div class="mb-3 filled">
                                            <input type="text" name="code" class="form-control" placeholder="Enter Picker Verification Code Here" >
                                        </div>
                                            <h5>Warning!</h5>
                                        <div class="mb-3">
                                            <textarea class="form-control" Readonly rows="3">
                                                Make sure the picker has brough a valid government Identification, you will use that to verify that the name on the next page matches that of the Id provided
                                            </textarea>
                                        </div>
                                        <div class="mb-3">
                                            <button type="submit" class="btn btn-primary float-right">Verify</button>
                                        </div>
                                </form>
                                    </div>
                            </div>
                        </div>
                        <div class="col-xl-6 col-12 mb-4">
                            <div class="card">
                                <div class="card-header">
                                    Student Palliative Pickup Verification
                                </div>  
                                <div class="card-body">
                                  <h3 class="mb-2 text-primary">Student Pickup Verification</h3>
                                   <form action="<?php echo base_url('user/verify_student_pickup');?>" method="post">
                                        <div class="mb-3 filled">
                                            <input type="text" name="code" class="form-control" placeholder="Enter Picker Verification Code Here" >
                                        </div>
                                        <h5>Warning!</h5>
                                        <div class="mb-3">
                                            <textarea class="form-control" Readonly rows="3">
                                                Make sure the picker has brough a valid government Identification, you will use that to verify that the name on the next page matches that of the Id provided
                                            </textarea>
                                        </div>
                                        <div class="mb-3">
                                            <button type="submit" class="btn btn-primary float-right">Verify</button>
                                        </div>
                                </form>
                                    </div>
                            </div>
                        </div>
            
                        <?php } ?>
                    </div>
          
           <div class="col">
              <div class="page-title-container mb-3">
                <div class="row">
                  <div class="col mb-2">
                    <h1 class="mb-2 pb-0 display-4" id="title">Latest From Our Blog</h1>
                    <div class="text-muted font-heading text-small">Community Updates, Notifications and more!</div>
                  </div>
                </div>
              </div>
              <div class="row">
				<div class="col-12 col-xl-8 mb-5">
					  <div class="row">
						  <?php 
							if(!empty($blogs)){
								foreach($blogs as $blog){ 
								$publisher = $this->generic_model->getInfo('users','id',$blog->publisher);
								$blog_id = $blog->id;
							?>
						   <div class="col-sm-12 col-xl-6 mb-5">
							<div class="card mb-5 h-100">
							<a href="<?php echo base_url('blogs_details/'.$blog->id);?>">
							  <img src="<?php echo base_url($blog->image);?>" class="card-img-top sh-35 theme-filter" alt="card image">
							</a>
							<div class="card-body">
							  <h4 class="mb-3">
								<?php echo $blog->title; ?>
							  </h4>
							  <p class="text-alternate sh-5 clamp-line mb-0" data-line="2"><?php echo substr($blog->message,0, 75).'...';?> </p>
							</div>
							<div class="card-footer border-0 pt-0">
							  <div class="row align-items-center">
								<div class="col-6">
								  <div class="d-flex align-items-center">
									<div class="sw-5 d-inline-block position-relative me-3">
									  <img src="<?php echo base_url($publisher->profile_pic);?>" class="img-fluid rounded-xl" alt="thumb">
									</div>
									<div class="d-inline-block">
									  <a href="#"><?php echo $publisher->firstname.' '.$publisher->lastname; ?></a>
									  <div class="text-muted text-small"><?php echo $publisher->user_type; ?></div>
									</div>
								  </div>
								</div>
								<div class="col-6 text-muted">
								  <div class="row g-0 justify-content-end">
									<div class="col-auto pe-3">
									  <i data-acorn-icon="eye" class="text-primary me-1" data-acorn-size="15"></i>
									  <span class="align-middle"><?php echo $blog->views; ?></span>
									</div>
									<div class="col-auto">
									  <i data-acorn-icon="message" class="text-primary me-1" data-acorn-size="15"></i>
									  <span class="align-middle"><?php echo $this->generic_model->get_total_comments($blog_id); ?></span>
									</div>
								  </div>
								</div>
							  </div>
							</div>
						  </div>
						   </div>
						  <?php }
							} ?>                  
					  </div>
				  </div>
                <div class="col-12 col-xxl-4 mb-n5">
                  <div class="row">
                    <div class="col-12">
                      <div class="card mb-5">
                        <div class="card-body row g-0">
                          <div class="col-12">
                            <div class="cta-3">Want to maximize your BPI Experience?</div>
                            <div class="mb-3 cta-3 text-primary">Join our Premium Leaders Forum!</div>
                            <div class="text-muted mb-3">Get specially curated news, info and updates delivered to your inbox.</div>
                            <div class="d-flex flex-column justify-content-start">
                              <div class="text-muted mb-2">
                               <!-- <input type="email" class="form-control" placeholder="E-mail">-->
                              </div>
                            </div>
                            <a href="#" class="btn btn-icon btn-icon-start btn-outline">
                              <i data-acorn-icon="chevron-right"></i>
                              <span>Coming Soon...</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="col-12 mb-5">
                      <h2 class="small-title">Recent Notifications</h2>
						  
                      <div class="mb-n2">
						<?php
						  if(!empty($recent_notifications)){
							  foreach($recent_notifications as $headlines){ ?>
								  <div class="card mb-2">
                          <a href="<?php echo base_url('notifications');?>" class="row g-0 sh-9">
                            <div class="col-auto">
                              <div class="sw-9 sh-9 d-inline-block d-flex justify-content-center align-items-center">
                                <div class="fw-bold text-primary">
                                  <i data-acorn-icon="bell"></i>
                                </div>
                              </div>
                            </div>
                            <div class="col">
                              <div class="card-body d-flex flex-column ps-0 pt-0 pb-0 h-100 justify-content-center">
                                <div class="d-flex flex-column">
                                  <div class="text-alternate"><?php echo $headlines->title; ?></div>
                                  <div class="text-small text-muted">Posted <?php echo $headlines->created_at;?></div>
                                </div>
                              </div>
                            </div>
                          </a>
                        </div> 
						<?php
							  }
						  } ?>
                      </div>
                    </div>
                    <div class="col-12 col-xl-12">
                      <h2 class="small-title">Tags</h2>
                      <div class="card mb-5">
                        <div class="card-body">
                          <button class="btn btn-sm btn-icon btn-icon-end btn-outline-primary mb-1 me-1" type="button">
                            <span>BPI</span>
                          </button>
                          <button class="btn btn-sm btn-icon btn-icon-end btn-outline-primary mb-1 me-1" type="button">
                            <span>Palliative</span>
                          </button>
                          <button class="btn btn-sm btn-icon btn-icon-end btn-outline-primary mb-1 me-1" type="button">
                            <span>Africa</span>
                          </button>
                          <button class="btn btn-sm btn-icon btn-icon-end btn-outline-primary mb-1 me-1" type="button">
                            <span>Shelter Palliative</span>
                          </button>
                          <button class="btn btn-sm btn-icon btn-icon-end btn-outline-primary mb-1 me-1" type="button">
                            <span>Land Palliative</span>
                          </button>
                          <button class="btn btn-sm btn-icon btn-icon-end btn-outline-primary mb-1 me-1" type="button">
                            <span>Business Palliative</span>
                          </button>
                          <button class="btn btn-sm btn-icon btn-icon-end btn-outline-primary mb-1 me-1" type="button">
                            <span>Solar Palliative</span>
                          </button>
                          <button class="btn btn-sm btn-icon btn-icon-end btn-outline-primary mb-1 me-1" type="button">
                            <span>Legals Palliative</span>
                          </button>
                          <button class="btn btn-sm btn-icon btn-icon-end btn-outline-primary mb-1 me-1" type="button">
                            <span>Car Pallitive</span>
                          </button>
                          <button class="btn btn-sm btn-icon btn-icon-end btn-outline-primary mb-1 me-1" type="button">
                            <span>Free Meals</span>
                          </button>
                          <button class="btn btn-sm btn-icon btn-icon-end btn-outline-primary mb-1 me-1" type="button">
                            <span>Free Healthcare</span>
                          </button>
                          <button class="btn btn-sm btn-icon btn-icon-end btn-outline-primary mb-1 me-1" type="button">
                            <span>Educational Palliative</span>
                          </button>
                        </div>
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

 <div class="modal fade" id="notificationModal" tabindex="-1" role="dialog" aria-labelledby="notificationModalLabel" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="notificationModalLabel">New Notification</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body" id="notificationMessage"></div>
                <div class="modal-body" id="show_button" style="display: none;">
                    <a href="#" id="join_button" target="_blank" class="btn btn-primary">Join</a>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                    <a href="#" id="markAsRead" class="btn btn-primary">Mark as Read</a>
                </div>
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
<script src="<?php echo base_url('assets/js/cs/glide.custom.js');?>"></script>
<script src="<?php echo base_url('assets/js/vendor/glide.min.js');?>"></script>
<script src="<?php echo base_url('assets/js/plugins/carousels.js');?>"></script>
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

<script>
    $(document).ready(function(){
        function checkNotifications() {
            $.ajax({
                url: "<?php echo base_url('fetch'); ?>",
                method: "GET",
                dataType: "json",
                success: function(data) {
                    if(data.length > 0) {
                        $('#notificationMessage').text(data[0].message);
                        if(data[0].link.length > 0){
                            $('#join_button').attr('href',data[0].link);
                            $('#show_button').show();
                        }
                        $('#markAsRead').attr('href', "<?php echo base_url('mark_as_read/'); ?>" + data[0].id);
                        $('#notificationModal').modal('show');
                    }
                }
            });
        }
        setInterval(checkNotifications, 3000); // Check every 10 seconds
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