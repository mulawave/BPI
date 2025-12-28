<!DOCTYPE html>
<html lang="en" data-footer="true">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
    <title>BeepAgro Palliative Initiative | BPI User Profile</title>
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
          <div class=" position-relative">
            <a href="https://beepagro.com/">
              <div class=""><img src="<?php echo base_url('assets/img/logo/beep_agro_logo.jpg" alt="logo');?>"  width="55px" ></div>
            </a>
          </div>
          <div class="user-container d-flex">
            <a href="#" class="d-flex user position-relative" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              <img class="profile" alt="profile" src="<?php echo base_url($user_details->profile_pic);?>">
              <div class="name"><?php echo $user_details->firstname.' '.$user_details->lastname; ?></div>
            </a>
            <div class="dropdown-menu dropdown-menu-end user-menu wide">
              <div class="row mb-3 ms-0 me-0">
                <div class="col-12 ps-1 mb-2">
                  <div class="text-extra-small text-primary">ACCOUNT</div>
                </div>
                <div class="col-6 ps-1 pe-1">
                  <ul class="list-unstyled">
                    <li>
                      <a href="<?php echo base_url('profile');?>">User Profile</a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('donor');?>">Preferences</a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('aid_tickets');?>">BPI Tickets</a>
                    </li>
                  </ul>
                </div>
                <div class="col-6 pe-1 ps-1">
                  <ul class="list-unstyled">
                    <li>
                      <a href="<?php echo base_url('security');?>">Security</a>
                    </li>
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
                    <li>
                      <a href="#" data-bs-toggle="modal" data-bs-target="#settings">Themes</a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('settings');?>">Currency</a>
                    </li>
                  </ul>
                </div>
                <div class="col-6 pe-1 ps-1">
                  <ul class="list-unstyled">
                    <li>
                      <a href="<?php echo base_url('security');?>">Logs</a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('notifications');?>">Alerts</a>
                    </li>
                  </ul>
                </div>
              </div>
              <div class="row mb-1 ms-0 me-0">
                <div class="col-12 p-1 mb-3 pt-3">
                  <div class="separator-light"></div>
                </div>
                <div class="col-6 ps-1 pe-1">
                  <ul class="list-unstyled">
                      <li>
                      <a href="<?php echo base_url('settings');?>">
                        <i data-acorn-icon="gear" class="me-2" data-acorn-size="17"></i>
                        <span class="align-middle">Settings</span>
                      </a>
                    </li> 
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
                    <li>
                      <a href="<?php echo base_url('logout');?>">
                        <i data-acorn-icon="logout" class="me-2" data-acorn-size="17"></i>
                        <span class="align-middle">Logout</span>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <ul class="list-unstyled list-inline text-center menu-icons">
            <li class="list-inline-item">
              <a href="#" data-bs-toggle="modal" data-bs-target="#searchPagesModal">
                <i data-acorn-icon="search" data-acorn-size="18"></i>
              </a>
            </li>
            <li class="list-inline-item">
              <a href="#" id="pinButton" class="pin-button">
                <i data-acorn-icon="lock-on" class="unpin" data-acorn-size="18"></i>
                <i data-acorn-icon="lock-off" class="pin" data-acorn-size="18"></i>
              </a>
            </li>
            <li class="list-inline-item">
              <a href="#" id="colorButton">
                <i data-acorn-icon="light-on" class="light" data-acorn-size="18"></i>
                <i data-acorn-icon="light-off" class="dark" data-acorn-size="18"></i>
              </a>
            </li>
            <li class="list-inline-item">
              <a href="#" data-bs-toggle="dropdown" data-bs-target="#notifications" aria-haspopup="true" aria-expanded="false" class="notification-button">
                <div class="position-relative d-inline-flex">
                  <i data-acorn-icon="bell" data-acorn-size="18"></i>
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
				<li>
                <a href="<?php echo base_url('upgrade_bpi'); ?>">
                  <i data-acorn-icon="trend-up" class="icon" data-acorn-size="18"></i>
                  <span class="label">Upgrade</span>
                </a>
              </li>
			 <?php } ?>
              <li>
                <a href="#">
                  <i data-acorn-icon="messages" class="icon" data-acorn-size="18"></i>
                  <span class="label">Community</span>
                </a>
              </li>
            </ul>
          </div>
          <div class="mobile-buttons-container">
            <a href="#" id="mobileMenuButton" class="menu-button">
              <i data-acorn-icon="menu"></i>
            </a>
          </div>
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
                <li>
                  <a href="#" data-bs-target="#dashboard">
                    <i data-acorn-icon="home" class="icon" data-acorn-size="18"></i>
                    <span class="label">Member Dashboard</span>
                  </a>
                  <ul>
                    <li>
                      <a class="active" href="<?php echo base_url('dashboard');?>">
                        <i data-acorn-icon="navigate-diagonal" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Home</span>
                      </a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('analytics');?>">
                        <i data-acorn-icon="chart-4" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Analytics</span>
                      </a>
                    </li>
					 <li>
                      <a href="<?php echo base_url('my_assets');?>">
                        <i data-acorn-icon="wallet" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Assets</span>
                      </a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('refer');?>">
                        <i data-acorn-icon="link" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Invites</span>
                      </a>
                    </li>
                  </ul>
                </li>
				<li>
                  <a href="#" data-bs-target="#store">
                    <i data-acorn-icon="home" class="icon" data-acorn-size="18"></i>
                    <span class="label">Storefront</span>
                  </a>
                  <ul>
                    <li>
                      <a href="<?php echo base_url('store');?>"> <i data-acorn-icon="home" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Global Store</span>
                      </a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('checkout');?>">
                        <i data-acorn-icon="cart" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">My Cart</span>
                      </a>
                    </li>
					  <li>
                      <a href="<?php echo base_url('my_items');?>">
                        <i data-acorn-icon="archive" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">My Claims</span>
                      </a>
                    </li>
                  </ul>
                </li>
                <li>
                  <a href="#" data-bs-target="#services">
                    <i data-acorn-icon="grid-1" class="icon" data-acorn-size="18"></i>
                    <span class="label">Palliative Services</span>
                  </a>
                  <ul>
                    <li>
                      <a href="<?php echo base_url('club');?>">
                        <i data-acorn-icon="database" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">BPI</span>
                      </a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('donor');?>">
                        <i data-acorn-icon="file-image" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Donors</span>
                      </a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('merchants');?>">
                        <i data-acorn-icon="router" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Pickup Locations</span>
                      </a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('palliative');?>">
                        <i data-acorn-icon="book" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Student Palliative</span>
                      </a>
                    </li>
					 <li>
                      <a href="<?php echo base_url('aid_tickets');?>">
                        <i data-acorn-icon="user" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Tickets</span>
                      </a>
                    </li>
                  </ul>
                </li>
                <li>
                  <a href="#" data-bs-target="#account">
                    <i data-acorn-icon="user" class="icon" data-acorn-size="18"></i>
                    <span class="label">Account Management</span>
                  </a>
                  <ul>
					  <li>
                      <a href="<?php echo base_url('billing');?>">
                        <i data-acorn-icon="inbox" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Billing</span>
                      </a>
                    </li>
					<li>
                      <a href="<?php echo base_url('security');?>">
                        <i data-acorn-icon="shield" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Security</span>
                      </a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('settings');?>">
                        <i data-acorn-icon="gear" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Settings</span>
                      </a>
                    </li>
                    <li>
                      <a href="<?php echo base_url('transactions');?>">
                        <i data-acorn-icon="inbox" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Transactions</span>
                      </a>
                    </li>
                    
                  </ul>
                </li>
                <li>
                  <a href="#" data-bs-target="#support">
                    <i data-acorn-icon="help" class="icon" data-acorn-size="18"></i>
                    <span class="label">Support</span>
                  </a>
                  <ul>
                    <li>
                      <a href="#">
                        <i data-acorn-icon="file-empty" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Docs</span>
                      </a>
                    </li>
                    <li>
                      <a href="#">
                        <i data-acorn-icon="notebook-1" class="icon d-none" data-acorn-size="18"></i>
                        <span class="label">Knowledge Base</span>
                      </a>
                    </li><li> <a href="<?php echo base_url('support_tickets');?>"> <i data-acorn-icon="bookmark" class="icon d-none" data-acorn-size="18"></i> <span class="label">Tickets</span> </a> </li>
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
                    <h1 class="mb-2 pb-0 display-4" id="title">BPI User Profile</h1>
                    <div class="text-muted font-heading text-small">Your personal space!</div>
                  </div>
                 <div>
                <?php
                $error = $this->session->flashdata('error');
                if($error)
                { ?>
                            <div class="alert alert-warning mb-3 mt-3 alert-dismissible fade show" role="alert">
                                <?php echo $this->session->flashdata('error'); ?>
                                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"><i data-acorn-icon="close-circle" class="text-white" data-acorn-size="18"></i></button>
                            </div>
                <?php } ?>
                <?php  
                        $success = $this->session->flashdata('success');
                        if($success)
                        {
                    ?>
                            <div class="alert alert-secondary mb-3 mt-3 alert-dismissible fade show" role="alert">
                                <?php echo $this->session->flashdata('success'); ?>
                                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"><i data-acorn-icon="close-circle" class="text-white" data-acorn-size="18"></i></button>
                            </div>
                <?php } ?>
                <?php echo validation_errors('<div class="alert alert-danger alert-dismissible fade show" role="alert"><strong>Form Errors!</strong>'.$this->session->flashdata('errors').'</div>'); ?>
                </div>
                </div>
              </div>
				<!-- Title segment-->
              
              
              
			     <!-- BPI Ticket Details-->
			    <div class="row gx-5">
				  <div class="col-xl-8">
					<h2 class="small-title">Profile</h2>
					<div class="card mb-5">
					  <div class="card-body">
						<div class="row">
						  <div class="col-auto">
							<div class="sw-6 sw-xl-14">
							  <img class="sw-15 sh-15 rounded-xl mb-3" src="<?php echo base_url($user_details->profile_pic);?>" alt="profile">
							</div>
						  </div>
						  <div class="col d-flex flex-column justify-content-between">
							<div class="d-flex flex-row justify-content-between">
							  <div>
								<div class="h5 mb-0 mt-2"><?php echo $user_details->firstname.' '.$user_details->lastname; ?></div>
								<div class="text-muted mb-2"><?php echo $user_details->email;?></div>
							  </div>
							  <a class="btn btn-outline-primary btn-icon btn-icon-start" href="<?php echo base_url('settings');?>">
								<i data-acorn-icon="edit" data-acorn-size="18"></i>
								<span>Edit</span>
							  </a>
							</div>
							<div class="d-flex mb-1">
							  <div class="me-3 me-md-7">
								<p class="text-small text-muted mb-1">Direct Downline</p>
								<p class="mb-0"><?php echo $this->generic_model->get_count('referrals',array('referred_by'=>$user_details->id)); ?></p>
							  </div>
							  <div class="me-3 me-md-7">
								<p class="text-small text-muted mb-1">Joined On</p>
								<p class="mb-0">
								<?php 
									$timestamp = strtotime($user_details->created_at);
									$formattedDate = date("l, F Y : h:iA", $timestamp); 
									echo $formattedDate;
								?>
								</p>
							  </div>
							  <div class="me-3 me-md-7">
								<p class="text-small text-muted mb-1">Default Currency</p>
								<p class="mb-0">
								<?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
								</p>
							  </div>
							  <div>
								<!--<p class="text-small text-muted mb-1">HEIGHT</p>
								<p class="mb-0">1.68</p>-->
							  </div>
							</div>
						  </div>
						</div>
					  </div>
					</div>
					<h2 class="small-title">BPI Virtual Cooperative Certificate</h2>
						<div class="card mb-5">
					  <div class="card-body">
						<div class="mb-2">
						  <div class="card mb-3">
						      <div class="card-body">
						          <h3 class="text-primary"> 
						              <?php if($user_details->bpicg == 1){
						                  echo 'BPI EXPORT PROMOTER CERTIFICATE';
						              }elseif($user_details->bpicg == 2){
						                  echo 'BPI NATIONAL VIRTUAL COOPERATIVE CERTIFICATE';
						              }elseif($user_details->bpicg == 3){
						                  echo 'BPI INTERNATIONAL VIRTUAL COOPERATIVE CERTIFICATE';
						              }elseif($user_details->bpicg == 4){
						                  echo 'BPI PAN-AFRICAN VIRTUAL COOPERATIVE CERTIFICATE';
						              }else{
						                  echo 'You have not qualified for any of the cooperative levels';
						              }
						              ?>
						          </h3>
						      </div>
						  </div>
						  <div>BPI Export Promoter: <?php echo $user_details->level_1_count; ?>  / 10 </div>
						  <div>BPI National Virtual Cooperative: <?php echo $user_details->level_2_count; ?>  / 10 </div>
						  <div>BPI Pan-African Virtual Cooperative: <?php echo $user_details->level_4_count; ?>  / 100 </div>
						  <div>BPI International Virtual Cooperative: <?php echo $user_details->level_3_count; ?>  / 1000 </div>
						</div>
					  </div>
					</div>
					<h2 class="small-title">Personal Information</h2>
					<div class="card mb-5">
					  <div class="card-body">
						<form>
						  <div class="mb-3 row">
							<label class="col-lg-2 col-md-3 col-sm-4 col-form-label">Name</label>
							<div class="col-sm-8 col-md-9 col-lg-10">
							  <p><?php echo $user_details->firstname.' '.$user_details->lastname; ?></p>
							</div>
						  </div>
						  <div class="mb-3 row">
							<label class="col-lg-2 col-md-3 col-sm-4 col-form-label">User Name</label>
							<div class="col-sm-8 col-md-9 col-lg-10">
							  <p>@<?php echo $user_details->username; ?></p>
							</div>
						  </div>
						  <div class="mb-3 row">
							<label class="col-lg-2 col-md-3 col-sm-4 col-form-label">Primary Email</label>
							<div class="col-sm-8 col-md-9 col-lg-10">
							   <?php echo $user_details->email; ?>
							</div>
						  </div>
						  <div class="mb-3 row">
							<label class="col-lg-2 col-md-3 col-sm-4 col-form-label">Location</label>
							<div class="col-sm-8 col-md-9 col-lg-10">
							  <?php echo $this->generic_model->getInfo('tbl_city','id',$user_details->city)->name; ?>, <?php echo $this->generic_model->getInfo('tbl_states','id',$user_details->state)->name; ?> 
							  <?php echo $this->generic_model->getInfo('tbl_country_table','id',$user_details->country)->country_name;; ?>
							</div>
						  </div>
						  <div class="mb-3 row">
							<label class="col-lg-2 col-md-3 col-sm-4 col-form-label">Phone</label>
							<div class="col-sm-8 col-md-9 col-lg-10">
							   <?php echo $user_details->mobile; ?>
							</div>
						  </div>
						  <div class="mb-3 row">
							<label class="col-lg-2 col-md-3 col-sm-4 col-form-label">Gender</label>
							<div class="col-sm-8 col-md-9 col-lg-10">
							 <?php echo $user_details->gender; ?>
							</div>
						  </div>						  
						</form>
					  </div>
					</div>
					
					<h2 class="small-title">Next Of Kin</h2>
					   <div>
								<?php
								$error = $this->session->flashdata('ben_error');
								if($error)
								{ ?>
											<div class="alert alert-warning mb-3 mt-3 alert-dismissible fade show" role="alert">
												<?php echo $this->session->flashdata('ben_error'); ?>
												<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"><i data-acorn-icon="close-circle" class="text-white" data-acorn-size="18"></i></button>
											</div>
								<?php } ?>
								<?php  
										$success = $this->session->flashdata('ben_success');
										if($success)
										{
									?>
											<div class="alert alert-secondary mb-3 mt-3 alert-dismissible fade show" role="alert">
												<?php echo $this->session->flashdata('ben_success'); ?>
												<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"><i data-acorn-icon="close-circle" class="text-white" data-acorn-size="18"></i></button>
											</div>
								<?php } ?>
								<?php echo validation_errors('<div class="alert alert-danger alert-dismissible fade show" role="alert"><strong>Form Errors!</strong>'.$this->session->flashdata('errors').'</div>'); ?>
								</div>
					 
					 <div class="modal fade" id="addModal" tabindex="-1" aria-labelledby="exampleModalLabelDefault" style="display: none;" aria-hidden="true">
                          <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5>Attach a beneficiary to your BPI profile</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
								<form action="user/update_beneficiary" method="post" enctype="multipart/form-data">
								<div class="modal-body">
									<div class="mb-3 filled">				
										<input type="text" name="ssc" id="ssc" class="form-control" placeholder="Enter Beneficiary BPI SSC" required>
										<div class="mt-2" id="beneficiary" style="display: none">

										</div>
									</div>
									<div class="mb-3 filled">
										<input type="text" name="relationship" class="form-control" placeholder="Enter Your Relationship to Beneficiary" required>  
									</div>
									<div class="mb-3 filled">
										<input type="text" name="percent" class="form-control" placeholder="Percentage Allocation of Earnings" required>
									</div>

								</div>
							   <div class="modal-footer">
								<button type="submit" class="btn btn-primary btn-round">Submit</button>
							   </div>
							</form>
                            </div>
                        </div>
                    </div>
					<?php 
					    if(empty($nextofkin)){ 
					    ?>   
					  <div class="card mb-5">
					    <div class="card-body">
						 <div class="col-12 mb-5">
                           <button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#addModal">Add Beneficiary</button>
                         </div>					          
					      </div>
					  </div>
					  
					 <?php
						}else{ ?>
					   <div class="card mb-5">
						 <div class="card-body">
							<div class="col-12 mb-5">
							<button type="button" class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#addModal">Add Beneficiary</button>
						    </div>
						 </div>
					   </div> 
					<?php  foreach($nextofkin as $kin){
					      $ben_details = $this->generic_model->getInfo( 'users', 'ssc', $kin->ssc );
					  ?>
				    		<div class="card mb-5">
							  <div class="card-body">
								<div class="row">
								  <div class="col-auto">
									<div class="sw-6 sw-xl-14">
									  <img class="sw-15 sh-15 rounded-xl mb-3" src="<?php echo base_url($ben_details->profile_pic);?>" alt="profile">
									</div>
								  </div>
								  <div class="col d-flex flex-column justify-content-between">
									<div class="d-flex flex-row justify-content-between">
									  <div>
										<div class="h5 mb-0 mt-2"><?php echo $ben_details->firstname.' '.$ben_details->lastname; ?></div>
										<div class="text-muted mb-2"><?php echo $ben_details->email;?></div>
									  </div>
									  <a class="btn btn-outline-danger btn-icon btn-icon-start" href="<?php echo base_url('delete_beneficiary/'.$kin->id);?>">
										<i data-acorn-icon="trash" data-acorn-size="18"></i>
										<span>Delete</span>
									  </a>
									</div>
									<div class="d-flex mb-1">
									  <div class="me-3 me-md-7">
										<p class="text-small text-muted mb-1">Allocated Percentage</p>
										<p class="mb-0"><?php echo $kin->percent; ?>%</p>
									  </div>
									  <div class="me-3 me-md-7">
										<p class="text-small text-muted mb-1">Relationship</p>
										<p class="mb-0">
										<?php 
											
											echo $kin->relationship;
										?>
										</p>
									  </div>
									  <div>
										<!--<p class="text-small text-muted mb-1">HEIGHT</p>
										<p class="mb-0">1.68</p>-->
									  </div>
									</div>
								  </div>
								</div>
							  </div>
							</div>
					  <?php
						} }
					  ?>
					  
					<h2 class="small-title">Company Details</h2>
					<?php 
					    if(empty($company_details)){ 
					    ?>   
					  <div class="card mb-5">
					      <div class="card-body">
							   <div>
								<?php
								$error = $this->session->flashdata('biz_error');
								if($error)
								{ ?>
											<div class="alert alert-warning mb-3 mt-3 alert-dismissible fade show" role="alert">
												<?php echo $this->session->flashdata('biz_error'); ?>
												<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"><i data-acorn-icon="close-circle" class="text-white" data-acorn-size="18"></i></button>
											</div>
								<?php } ?>
								<?php  
										$success = $this->session->flashdata('biz_success');
										if($success)
										{
									?>
											<div class="alert alert-secondary mb-3 mt-3 alert-dismissible fade show" role="alert">
												<?php echo $this->session->flashdata('biz_success'); ?>
												<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"><i data-acorn-icon="close-circle" class="text-white" data-acorn-size="18"></i></button>
											</div>
								<?php } ?>
								<?php echo validation_errors('<div class="alert alert-danger alert-dismissible fade show" role="alert"><strong>Form Errors!</strong>'.$this->session->flashdata('errors').'</div>'); ?>
								</div>
					          <h5>Register Company Details</h5>
							  <form action="user/update_business" method="post" enctype="multipart/form-data">
							  	<div class="mb-3 filled">				
									<input type="text" name="biz_name" class="form-control" placeholder="Enter Your Business Name" required>  
								</div>
								<div class="mb-3 filled">
									<input type="text" name="rc_number" class="form-control" placeholder="Enter Your Registration Number" required>  
								</div>
								<div class="mb-3 filled">
									<input type="text" name="tax_id" class="form-control" placeholder="Enter Your Tax Id" required>
								</div>
								<div class="mb-3 filled">
									<label>Upload Business Certificate - jpg,png,pdf, max size 5mb</label>
									<input type="file" name="biz_certificate" class="form-control" placeholder="Upload Business Certificate" required>  
								</div>
								<div class="mb-3 filled">
									<label>Upload Business Memat - pdf, max size 5mb</label>
									<input type="file" name="biz_doc" class="form-control" placeholder="Upload Business Memat" required>  
								</div>
								  <div class="mb-3 filled">
									  <button type="submit" class="btn btn-lg btn-success">Submit Info</button>
								  </div>
							  </form>
					      </div>
					  </div>
					<?php
					    }else{ 
					    ?>
					  <div class="card mb-5">
					  <div class="card-body">
						<form>
						  <div class="mb-3 row">
							<label class="col-lg-2 col-md-3 col-sm-4 col-form-label">Company Name</label>
							<div class="col-sm-8 col-md-9 col-lg-10">
							 <?php echo $company_details->biz_name; ?>
							</div>
						  </div>
						  <div class="mb-3 row">
							<label class="col-lg-2 col-md-3 col-sm-4 col-form-label">Registration Number</label>
							<div class="col-sm-8 col-md-9 col-lg-10">
							 <?php echo $company_details->rc_number; ?>
							</div>
						  </div>
						  <div class="mb-3 row">
							<label class="col-lg-2 col-md-3 col-sm-4 col-form-label">Tax Id</label>
							<div class="col-sm-8 col-md-9 col-lg-10">
							  <?php echo $company_details->tax_id; ?>
							</div>
						  </div>
						  <div class="mb-3 row">
							<label class="col-lg-2 col-md-3 col-sm-4 col-form-label">STATUS</label>
							<div class="col-sm-8 col-md-9 col-lg-10">
							  <?php 
								if($company_details->status == 0){
									echo 'Pending Validation';
								}else{
									echo 'Verified';
								}
								?>
							</div>
						  </div>
						</form>
					  </div>
					</div>
					<?php   
					    }
					?>
					
				  </div>
				  <div class="col-xl-4">
					<div class="d-flex justify-content-between">
					  <h2 class="small-title">BPI Smart Card</h2>
					</div>
                    <div class="card mb-5">
					  <div class="card-body border-dashed border-1 mb-3 border-warning" style="border-radius: 25px;">
                          <?php
                            $card_error = $this->session->flashdata('card_error');
                            if($card_error)
                            { ?>
                                        <div class="alert alert-warning mb-3 mt-3 alert-dismissible fade show" role="alert">
                                            <?php echo $this->session->flashdata('card_error'); ?>
                                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"><i data-acorn-icon="close-circle" class="text-white" data-acorn-size="18"></i></button>
                                        </div>
                            <?php } ?>
                            <?php  
                                    $card_success = $this->session->flashdata('card_success');
                                    if($card_success)
                                    {
                                ?>
                                        <div class="alert alert-success mb-3 mt-3 alert-dismissible fade show" role="alert">
                                            <?php echo $this->session->flashdata('card_success'); ?>
                                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"><i data-acorn-icon="close-circle" class="text-white" data-acorn-size="18"></i></button>
                                        </div>
                            <?php } ?>
                            <?php 
                                if(empty($is_card)){ 
                                  if($user_details->is_vip == 1){ ?>
                                      <form action="<?php echo base_url('user/generate_card')?>" method="post">
                                       <div class="card h-100">
                                           <div class="card-header">
                                               <h5 class="modal-title" id="exampleModalLabelDefault">Generate BPI Smart Card</h5>
                                               <div class="mt-5 mb-3">
                                                   <h6>Quick Steps</h6>
                                                   <ol>
                                                       <li>Make sure you have <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,5000);?> or more in your wallet</li>
                                                       <li>Fill the form below</li>
                                                       <li>Select the options that best fit</li>
                                                       <li>Click the proceed button</li>
                                                       <li>Accept the card terms and submit</li>
                                                   </ol>
                                               </div>
                                           </div>
                                           <div class="card-body"> 
                                            <div class="row">
                                            <div class="col-12 mb-5">
                                                <div class="filled mb-3">
                                                    <i data-acorn-icon="server"></i>
                                                    <select class="form-control" id="wallet" name="wallet" required="required">
                                                        <option value=" ">Select Payment Source</option>
                                                        <option value="wallet">Main Wallet</option>
                                                        <option value="cashback">Cashback Wallet</option>
                                                    </select>
                                                </div>
                                                <div class="filled mb-3">
                                                    <i data-acorn-icon="shield-check"></i>
                                                    <input class="form-control" type="text" value="<?php echo $user_details->firstname; ?>" readonly/>
                                                </div>
                                                <div class="filled mb-3">
                                                    <i data-acorn-icon="shield-check"></i>
                                                    <input class="form-control" type="text" value="<?php echo $user_details->lastname; ?>" readonly/>
                                                </div>
                                                <div class="filled mb-1">
                                                    <i data-acorn-icon="shield-check"></i>
                                                    <input class="form-control" type="text" value="Links To BPI SSC" readonly/>
                                                </div>
                                                
                                            </div>
                                            <div class="col-12 col-sm-auto d-flex align-items-center position-relative">
                                               <button type="button" class="btn btn-success" data-bs-toggle="modal" data-bs-target="#confirmModal">Proceed</button>
                                            </div>
                                           </div>
                                           </div>
                                       </div>
                                       <div class="modal fade" id="confirmModal" tabindex="-1" aria-labelledby="exampleModalLabelDefault" style="display: none;" aria-hidden="true">
                                              <div class="modal-dialog">
                                                <div class="modal-content">
                                                    <div class="modal-header">
                                                        <h5 class="modal-title" id="exampleModalLabelDefault">You Agree To The Following</h5>
                                                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                                    </div>
                                                   <div class="modal-body">
                                                     <div class="col-12">
                                                      <ul>
                                                          <li>You agree that you are responsible for the safety and security of your BPI Smart Card</li>
                                                          <li>You indemnify and release BPI, BPI staff, board and partners from any harm, damage or loss arising from your use of BPI Smart Card</li>
                                                          <li>You agree to be bound by the rules, regulation and guidlines associated with BPI Smart Card and its usage</li>
                                                          <li>You will be charged a non-refundable fee of <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,5000);?> for the creation of your BPI Smart Card</li>
                                                      </ul>     
                                                       
                                                     </div>
                                                    </div>
                                                   <div class="modal-footer">
                                                    <button type="submit" class="btn btn-primary btn-round">Accept and Submit</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                       </form>
                                 <?php }else{
                                      echo '<h5>Activate a membership package to have access to BPI Smart Card</h5>';
                                  }
                                ?>
                                    
                            <?php }else{ ?>
                            <div class="">
                                <div class="mb-3" id="sponsor_div">
                                    <div>
                                    <img src="<?php echo base_url('assets/card_bg/card_1.png');?>" width="100%">
                                        </div>
                                </div>
                                <div id="cardDetails_div" style="display: none">
                                    <div class="row border-bottom border-top border-muted mb-2 pt-1 pb-1">
                                        <div class="col-9">
                                            <div class="text-info mb-2"> 
                                                 <i data-acorn-icon="minimize" data-acorn-size="12"></i> <i data-acorn-icon="leaf" data-acorn-size="12"></i> <i data-acorn-icon="link" data-acorn-size="12"></i> <i data-acorn-icon="server" data-acorn-size="12"></i> <i data-acorn-icon="badge" data-acorn-size="12"></i> <i data-acorn-icon="attachment" data-acorn-size="12"></i>
                                            </div>
                                            <div > 
                                                <h3> 
                                                    <i class="text-success" data-acorn-icon="shield-check"></i> - <?php echo $user_details->firstname.' '.$user_details->lastname; ?>
                                                </h3>
                                            </div>
                                        </div>
                                        <div class="col-3 justify-right"><img class="bg-white sw-8 sh-8 rounded mb-1" src="<?php  echo base_url($user_details->profile_pic);?>" alt="issuer"></div>
                                    </div>
                                    <div class="row">
                                        <div class="col-4 border-dashed border-1 border-danger">
                                            <?php
                                                $imagePath = 'https://beepagro.com/qr_app/sc_codes/'.$user_details->id.'.png';
                                                $fallbackImagePath = base_url('assets/qr_code/qr.png');
                                        
                                                // Check if the image file exists
                                                if (file_exists($imagePath)) {
                                                    $imageToDisplay = $imagePath; // Use the original image
                                                } else {
                                                    $imageToDisplay = $fallbackImagePath; // Use the fallback image
                                                }
                                            ?>
                                            <img class="mt-2" src="<?php echo htmlspecialchars($imageToDisplay, ENT_QUOTES, 'UTF-8'); ?>" width="100%" alt="profile">
                                        </div>
                                        <div class="col-8">
                                            <div class="row">
                                                 <div class="col-12 text-center border-muted mb-3" style="border-bottom: dashed; border-bottom-width: thin">
                                                    <h3 class="mb-2"><?php echo $is_card->card_name; ?></h3>
                                                </div>
                                                <div class="col-12">
                                                    <?php if($is_card->card_amount > 5000){ ?>
                                                        <div class="alert alert-success pt-2 pb-2 border-dashed border-1 border-white text-center">
                                                          <h3>
                                                          <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
                                                          <?php echo $this->generic_model->convert_currency($user_details->default_currency,$is_card->card_amount);?></li>
                                                          </h3>
                                                    </div>
                                                    <?php }else{ ?>
                                                    <div class="pt-2 pb-2 alert alert-danger border-dashed border-1 border-white text-center">
                                                        <h3>
                                                         <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?>
                                                         <?php echo $this->generic_model->convert_currency($user_details->default_currency,$is_card->card_amount);?></li>
                                                        </h3>
                                                    </div>
                                                    <?php } ?>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <?php } 
                            
                            ?>
						       
					  </div>
                        <?php 
                          if(!empty($is_card)){ ?>
                          <div class="card-body border-dashed border-1 border-warning" style="border-radius: 25px;">
                              <div class="row">
                                  <div class="col-xl-4 col-sm-12">
                                      <div class="text-center">
                                        <button type="button" id="toggleButton" class="btn btn-primary">Flip Card</button>
                                      </div>
                                  </div>
                                  <!--<div class="col-xl-4 col-sm-12">
                                      <div class="text-center">
                                        <button type="button" class="btn btn-warning"><i data-acorn-icon="edit" data-acorn-size="18"></i>Manage</button>
                                      </div>
                                  </div>
                                  <div class="col-xl-4 col-sm-12">
                                      <div class="text-center">
                                        <button type="button" class="btn btn-info"><i data-acorn-icon="file-chart" data-acorn-size="18"></i>Records</button>
                                      </div>
                                  </div>-->
                              </div>

                          </div>
                        <?php } ?>
					</div>
				 <?php 
                    if(!empty($is_beneficiary)){ ?>
					<div class="card mb-5">
					  <div class="card-body">
						<div class="mb-4">
						  <div class="text-primary mb-1">BPI Beneficiary</div>
						  <div>Connected to: <?php echo $this->generic_model->getInfo('users','id',$is_beneficiary->user_id)->ssc; ?> </div>
						  <div class="text-muted">Claim Percentage: <?php echo $is_beneficiary->percent; ?>%</div>
						  <?php 
							$claim_check = $this->generic_model->getInfo( 'kin_claims', 'submitted_by', $user_details->id);
							if(empty($claim_check)){
								//check if others have claimed...
								$benefactor = $is_beneficiary->user_id;
								$otherClaim = $this->generic_model->getInfo( 'kin_claims', 'benefactor', $benefactor);
								if(empty($otherClaim)){ ?>
									<div class="mt-3">
										<button class="btn btn-lg btn-success" data-bs-toggle="modal" data-bs-target="#claimModal" >Submit Claim</button>
									</div>
						  <?php	}else{ ?>
									<div class="mt-3">
										<p>Claim request in Review... Request was submitted by one of the registered beneficiaries</p>
									</div>	
						  <?php	}
							}else{ ?>
								<div class="mt-3">
									<p>Claim request in Review... submitted by you</p>
								</div>	
						<?php	}
						  ?>
							
						</div>
					  </div>
					</div>
				<?php } ?>
					<?php  if(!empty($user_details->is_vip) && !empty($user_details->is_shelter)){  ?>
					<div class="card mb-5">
					  <div class="card-body">
						<div class="mb-4">
						  <div class="text-primary mb-1">BPI Social Security Code</div>
						  <div><?php echo $user_details->ssc; ?></div>
						  <div class="text-muted">Personal Identifier</div>
						</div>
					  </div>
					</div>
					  <?php } ?>
					  <div class="card mb-5">
					  <div class="card-body">
						<div class="mb-4">
						  <div class="text-primary mb-2">BPI Leadership Pool Challenge</div>
						  <div>Direct Invites: <?php if(empty($direct_invite)){ echo 0;}else{ echo $direct_invite->total_referrals; } ?>  / 70 </div>
						  <div class="text-muted">Level 1 Invites: <?php if(empty($level1_invite)){ echo 0;}else{ echo $level1_invite->total_referrals; } ?>  / 50 </div>
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
                  <li class="breadcrumb-item mb-0 text-medium">
                    <a href="https://beepagro.com/terms" target="_blank" class="btn-link">Our Terms</a>
                  </li>
                  <li class="breadcrumb-item mb-0 text-medium">
                    <a href="https://beepagro.com/privacy" target="_blank" class="btn-link">Our Policies</a>
                  </li>
                  <li class="breadcrumb-item mb-0 text-medium">
                    <a href="https://beepagro.com/" target="_blank" class="btn-link">Home</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
	<div class="modal fade" id="claimModal" tabindex="-1" aria-labelledby="exampleModalLabelDefault" style="display: none;" aria-hidden="true">
                          <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5>Claim Request</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
									<h5>Provide death certificate from a Government approved registry</h5>
                                </div>
								<form action="user/submit_claim" method="post" enctype="multipart/form-data">
								<div class="modal-body">
									<div class="mb-3 filled">
										<input type="file" name="cert" class="form-control" placeholder="Death Certificate" required>
										<input type="hidden" name="benefactor" value="<?php echo $is_beneficiary->user_id; ?>">
									</div>
								</div>
							   <div class="modal-footer">
								<button type="submit" class="btn btn-primary btn-round">Submit</button>
							   </div>
							</form>
                            </div>
                        </div>
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
                <div class="row d-flex g-3 justify-content-between flex-wrap mb-3">
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="light-blue" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="blue-light"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">LIGHT BLUE</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="dark-blue" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="blue-dark"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">DARK BLUE</span>
                    </div>
                  </a>
                </div>
                <div class="row d-flex g-3 justify-content-between flex-wrap mb-3">
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="light-teal" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="teal-light"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">LIGHT TEAL</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="dark-teal" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="teal-dark"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">DARK TEAL</span>
                    </div>
                  </a>
                </div>
                <div class="row d-flex g-3 justify-content-between flex-wrap mb-3">
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="light-sky" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="sky-light"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">LIGHT SKY</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="dark-sky" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="sky-dark"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">DARK SKY</span>
                    </div>
                  </a>
                </div>
                <div class="row d-flex g-3 justify-content-between flex-wrap mb-3">
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="light-red" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="red-light"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">LIGHT RED</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="dark-red" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="red-dark"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">DARK RED</span>
                    </div>
                  </a>
                </div>
                <div class="row d-flex g-3 justify-content-between flex-wrap mb-3">
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="light-green" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="green-light"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">LIGHT GREEN</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="dark-green" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="green-dark"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">DARK GREEN</span>
                    </div>
                  </a>
                </div>
                <div class="row d-flex g-3 justify-content-between flex-wrap mb-3">
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="light-lime" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="lime-light"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">LIGHT LIME</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="dark-lime" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="lime-dark"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">DARK LIME</span>
                    </div>
                  </a>
                </div>
                <div class="row d-flex g-3 justify-content-between flex-wrap mb-3">
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="light-pink" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="pink-light"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">LIGHT PINK</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="dark-pink" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="pink-dark"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">DARK PINK</span>
                    </div>
                  </a>
                </div>
                <div class="row d-flex g-3 justify-content-between flex-wrap mb-3">
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="light-purple" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="purple-light"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">LIGHT PURPLE</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="dark-purple" data-parent="color">
                    <div class="card rounded-md p-3 mb-1 no-shadow color">
                      <div class="purple-dark"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">DARK PURPLE</span>
                    </div>
                  </a>
                </div>
              </div>
              <div class="mb-5" id="navcolor">
                <label class="mb-3 d-inline-block form-label">Override Nav Palette</label>
                <div class="row d-flex g-3 justify-content-between flex-wrap">
                  <a href="#" class="flex-grow-1 w-33 option col" data-value="default" data-parent="navcolor">
                    <div class="card rounded-md p-3 mb-1 no-shadow">
                      <div class="figure figure-primary top"></div>
                      <div class="figure figure-secondary bottom"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">DEFAULT</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-33 option col" data-value="light" data-parent="navcolor">
                    <div class="card rounded-md p-3 mb-1 no-shadow">
                      <div class="figure figure-secondary figure-light top"></div>
                      <div class="figure figure-secondary bottom"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">LIGHT</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-33 option col" data-value="dark" data-parent="navcolor">
                    <div class="card rounded-md p-3 mb-1 no-shadow">
                      <div class="figure figure-muted figure-dark top"></div>
                      <div class="figure figure-secondary bottom"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">DARK</span>
                    </div>
                  </a>
                </div>
              </div>
              <div class="mb-5" id="behaviour">
                <label class="mb-3 d-inline-block form-label">Menu Behaviour</label>
                <div class="row d-flex g-3 justify-content-between flex-wrap">
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="pinned" data-parent="behaviour">
                    <div class="card rounded-md p-3 mb-1 no-shadow">
                      <div class="figure figure-primary left large"></div>
                      <div class="figure figure-secondary right small"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">PINNED</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="unpinned" data-parent="behaviour">
                    <div class="card rounded-md p-3 mb-1 no-shadow">
                      <div class="figure figure-primary left"></div>
                      <div class="figure figure-secondary right"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">UNPINNED</span>
                    </div>
                  </a>
                </div>
              </div>
              <div class="mb-5" id="layout">
                <label class="mb-3 d-inline-block form-label">Layout</label>
                <div class="row d-flex g-3 justify-content-between flex-wrap">
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="fluid" data-parent="layout">
                    <div class="card rounded-md p-3 mb-1 no-shadow">
                      <div class="figure figure-primary top"></div>
                      <div class="figure figure-secondary bottom"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">FLUID</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-50 option col" data-value="boxed" data-parent="layout">
                    <div class="card rounded-md p-3 mb-1 no-shadow">
                      <div class="figure figure-primary top"></div>
                      <div class="figure figure-secondary bottom small"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">BOXED</span>
                    </div>
                  </a>
                </div>
              </div>
              <div class="mb-5" id="radius">
                <label class="mb-3 d-inline-block form-label">Radius</label>
                <div class="row d-flex g-3 justify-content-between flex-wrap">
                  <a href="#" class="flex-grow-1 w-33 option col" data-value="rounded" data-parent="radius">
                    <div class="card rounded-md radius-rounded p-3 mb-1 no-shadow">
                      <div class="figure figure-primary top"></div>
                      <div class="figure figure-secondary bottom"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">ROUNDED</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-33 option col" data-value="standard" data-parent="radius">
                    <div class="card rounded-md radius-regular p-3 mb-1 no-shadow">
                      <div class="figure figure-primary top"></div>
                      <div class="figure figure-secondary bottom"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">STANDARD</span>
                    </div>
                  </a>
                  <a href="#" class="flex-grow-1 w-33 option col" data-value="flat" data-parent="radius">
                    <div class="card rounded-md radius-flat p-3 mb-1 no-shadow">
                      <div class="figure figure-primary top"></div>
                      <div class="figure figure-secondary bottom"></div>
                    </div>
                    <div class="text-muted text-part">
                      <span class="text-extra-small align-middle">FLAT</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="settings-buttons-container">
      <button type="button" class="btn settings-button btn-primary p-0" data-bs-toggle="modal" data-bs-target="#settings" id="settingsButton">
        <span class="d-inline-block no-delay" data-bs-delay="0" data-bs-offset="0,3" data-bs-toggle="tooltip" data-bs-placement="left" title="Settings">
          <i data-acorn-icon="paint-roller" class="position-relative"></i>
        </span>
      </button>
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
          <div class="modal-footer border-top justify-content-start ps-5 pe-5 pb-3 pt-3 border-0">
            <span class="text-alternate d-inline-block m-0 me-3">
              <i data-acorn-icon="arrow-bottom" data-acorn-size="15" class="text-alternate align-middle me-1"></i>
              <span class="align-middle text-medium">Navigate</span>
            </span>
            <span class="text-alternate d-inline-block m-0 me-3">
              <i data-acorn-icon="arrow-bottom-left" data-acorn-size="15" class="text-alternate align-middle me-1"></i>
              <span class="align-middle text-medium">Select</span>
            </span>
          </div>
        </div>
      </div>
    </div>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
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
    <script>
        $(document).ready(function () {
            $("#toggleButton").click(function () {
              if ($("#sponsor_div").is(":visible")) {
                $("#sponsor_div").fadeOut("slow", function () {
                  $("#cardDetails_div").fadeIn("slow");
                });
              } else if ($("#cardDetails_div").is(":visible")) {
                $("#cardDetails_div").fadeOut("slow", function () {
                  $("#sponsor_div").fadeIn("slow");
                });
              }
            });
          });
    </script>
	<script>
		class ServicesDatabase {
		  constructor() {
			this._smallDoughnutChart1 = null, this._smallDoughnutChart2 = null, this._smallDoughnutChart3 = null, this._smallDoughnutChart4 = null, "undefined" != typeof Chart && "undefined" != typeof ChartsExtend ? this._initSmallDoughnutCharts() : console.error("[CS] ChartsExtend is undefined."), "undefined" != typeof Checkall ? this._initCheckAll() : console.error("[CS] Checkall is undefined."), this._initEvents()
		  }
		  _initCheckAll() {
			new Checkall(document.querySelector(".check-all-container .btn-custom-control"))
		  }
		  _initSmallDoughnutCharts() {
			document.getElementById("smallDoughnutChart1") && (this._smallDoughnutChart1 = ChartsExtend.SmallDoughnutChart("smallDoughnutChart1", [<?php echo $this->generic_model->get_count('philanthropy_partners',array('status'=>1));?>, -<?php echo $this->generic_model->get_count('philanthropy_partners',array('status'=>0));?>], "PARTNERS")), 
			document.getElementById("smallDoughnutChart2") && (this._smallDoughnutChart2 = ChartsExtend.SmallDoughnutChart("smallDoughnutChart2", [<?php echo $this->generic_model->get_count('philanthropy_category',array('status'=>1));?>, 0], "CATEGORIES")), 
			document.getElementById("smallDoughnutChart3") && (this._smallDoughnutChart3 = ChartsExtend.SmallDoughnutChart("smallDoughnutChart3", [<?php echo $this->generic_model->get_count('philanthropy_offers',array('status'=>1));?>, 0], "OFFERS")), 
			document.getElementById("smallDoughnutChart4") && (this._smallDoughnutChart4 = ChartsExtend.SmallDoughnutChart("smallDoughnutChart4", [<?php echo $this->generic_model->get_count('philanthropy_tickets',array('created_by'=>$user_details->id));?>, -<?php echo $this->generic_model->get_count('philanthropy_tickets',array('status'=>'used'));?>], "YOUR TICKETS (Total / Used)"))
		  }
		  _initEvents() {
			document.documentElement.addEventListener(Globals.colorAttributeChange, (t => {
			  this._smallDoughnutChart1 && this._smallDoughnutChart1.destroy(), this._smallDoughnutChart2 && this._smallDoughnutChart2.destroy(), this._smallDoughnutChart3 && this._smallDoughnutChart3.destroy(), this._smallDoughnutChart4 && this._smallDoughnutChart4.destroy(), this._initSmallDoughnutCharts()
			}))
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