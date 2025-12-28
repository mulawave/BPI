<!DOCTYPE html>
<html lang="en" data-footer="true">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
    <title>BeepAgro Palliative Initiative | BPI Community</title>
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
                </a>uni
              </li>
			 <?php } ?>
              <li>
                <a href="<?php echo base_url('community'); ?>">
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
                    <h1 class="mb-2 pb-0 display-4" id="title">BPI Community</h1>
                    <div class="text-muted font-heading text-small">Your Digital space!</div>
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
              <div class="row">
  <div class="col-12 col-xxl-8 mb-5 mb-xxl-0">
    <div class="mb-5">
      <h2 class="small-title">Categories</h2>
      <div class="row g-2 row-cols-1 row-cols-md-2">
        <?php 
          foreach($categories as $category){ ?>
                <div class="col">
                  <div class="card h-100">
                    <div class="card-body">
                      <div class="text-center mb-3">
                        <img src="<?php echo base_url('assets');?>/<?php echo $category->category_icon; ?>" class="theme-filter" alt="">
                        <div class="d-flex flex-column sh-5">
                          <a href="<?php echo base_url($category->slug);?>" class="heading stretched-link"><?php echo $category->category_name; ?></a>
                        </div>
                      </div>
                      <div class="row g-0 mb-n2">
                        <!--<div class="col-6 col-sm-3 mb-2">
                          <div class="text-small text-muted text-center">NEW</div>
                          <div class="cta-2 text-primary text-center">1</div>
                        </div>-->
                        <div class="col-12 col-sm-6 mb-2">
                          <div class="text-small text-muted text-center">POSTS</div>
                          <div class="cta-2 text-primary text-center"><?php echo $this->generic_model->get_count('community_posts',array('category_id'=>$category->id));?></div>
                        </div>
                        <div class="col-12 col-sm-6 mb-2">
                          <div class="text-small text-muted text-center">Replies</div>
                          <div class="cta-2 text-primary text-center"><?php echo $this->generic_model->get_count('community_post_reply',array('category_id'=>$category->id));?></div>
                        </div>
                       <!-- <div class="col-6 col-sm-3 mb-2">
                          <div class="text-small text-muted text-center">UPDATED</div>
                          <div class="cta-2 text-primary text-center">12h</div>
                        </div>-->
                      </div>
                    </div>
                  </div>
                </div>
              
        <?php  }
          ?>
      </div>
    </div>
   <!-- <div>
      <h2 class="small-title">Popular Posts</h2>
      <div class="card mb-2">
        <div class="card-body">
          <div class="row g-0">
            <div class="col-auto d-none d-sm-flex pe-4">
              <div class="sw-5">
                <div class="text-center mb-2">
                  <a href="#" class="primary-link">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-top undefined">
                      <path d="M3 9 9.64645 2.35355C9.84171 2.15829 10.1583 2.15829 10.3536 2.35355L17 9M10 18 10 3"></path>
                    </svg>
                  </a>
                </div>
                <div class="cta-2 text-alternate text-center mb-2">214</div>
                <div class="text-center">
                  <a href="#" class="muted-link">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-bottom undefined">
                      <path d="M17 11 10.3536 17.6464C10.1583 17.8417 9.84171 17.8417 9.64645 17.6464L3 11M10 2 10 17"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            <div class="col">
              <div class="position-relative mb-4">
                <a href="CommunityList.html" class="heading d-block body-link stretched-link mb-3"> Fruitcake chupa chups gingerbread sweet roll pie! </a>
                <p class="text-alternate mb-0"> Topping cotton candy halvah marshmallow jujubes chupa chups macaroon cookie croissant. Marshmallow tiramisu marshmallow gummi bears dragée oat cake fruitcake dessert. Topping bonbon gingerbread chocolate apple pie cheesecake liquorice muffin pudding. </p>
              </div>
              <div class="row g-0">
                <div class="col-12 col-sm mb-3 mb-sm-0">
                  <div class="row g-0 sh-4">
                    <div class="col-auto pe-2">
                      <img src="<?php echo base_url('assets');?>/img/profile/profile-4.webp" class="card-img rounded-xl sh-4 sw-4" alt="thumb">
                    </div>
                    <div class="col d-flex align-items-center">Cherish Kerr</div>
                  </div>
                </div>
                <div class="col-12 col-sm-auto text">
                  <div class="d-inline-block me-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-eye text-primary me-1">
                      <path d="M2.47466 10.8418C2.15365 10.3203 2.15365 9.67971 2.47466 9.15822C3.49143 7.50643 6.10818 4 10 4C13.8918 4 16.5086 7.50644 17.5253 9.15822C17.8464 9.67971 17.8464 10.3203 17.5253 10.8418C16.5086 12.4936 13.8918 16 10 16C6.10818 16 3.49143 12.4936 2.47466 10.8418Z"></path>
                      <path d="M10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8C8.89543 8 8 8.89543 8 10C8 11.1046 8.89543 12 10 12Z"></path>
                    </svg>
                    <span class="align-middle">239</span>
                  </div>
                  <div class="d-inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-message text-primary me-1">
                      <path d="M14.5 2C15.9045 2 16.6067 2 17.1111 2.33706C17.3295 2.48298 17.517 2.67048 17.6629 2.88886C18 3.39331 18 4.09554 18 5.5L18 10.5C18 11.9045 18 12.6067 17.6629 13.1111C17.517 13.3295 17.3295 13.517 17.1111 13.6629C16.6067 14 15.9045 14 14.5 14L10.4497 14C9.83775 14 9.53176 14 9.24786 14.0861C9.12249 14.1241 9.00117 14.1744 8.88563 14.2362C8.62399 14.376 8.40762 14.5924 7.97487 15.0251L5.74686 17.2531C5.47773 17.5223 5.34317 17.6568 5.2255 17.6452C5.17629 17.6404 5.12962 17.6211 5.0914 17.5897C5 17.5147 5 17.3244 5 16.9438L5 14.6C5 14.5071 5 14.4606 4.99384 14.4218C4.95996 14.2078 4.79216 14.04 4.57822 14.0062C4.53935 14 4.4929 14 4.4 14V14C4.0284 14 3.8426 14 3.68713 13.9754C2.83135 13.8398 2.16017 13.1687 2.02462 12.3129C2 12.1574 2 11.9716 2 11.6L2 5.5C2 4.09554 2 3.39331 2.33706 2.88886C2.48298 2.67048 2.67048 2.48298 2.88886 2.33706C3.39331 2 4.09554 2 5.5 2L14.5 2Z"></path>
                    </svg>
                    <span class="align-middle">8</span>
                  </div>
                  <div class="d-inline-block float-end d-sm-none">
                    <a href="#" class="primary-link">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-top undefined">
                        <path d="M3 9 9.64645 2.35355C9.84171 2.15829 10.1583 2.15829 10.3536 2.35355L17 9M10 18 10 3"></path>
                      </svg>
                    </a>
                    <span class="mx-1 align-middle">214</span>
                    <a href="#" class="muted-link">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-bottom undefined">
                        <path d="M17 11 10.3536 17.6464C10.1583 17.8417 9.84171 17.8417 9.64645 17.6464L3 11M10 2 10 17"></path>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card mb-2">
        <div class="card-body">
          <div class="row g-0">
            <div class="col-auto d-none d-sm-flex pe-4">
              <div class="sw-5">
                <div class="text-center mb-2">
                  <a href="#" class="muted-link">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-top undefined">
                      <path d="M3 9 9.64645 2.35355C9.84171 2.15829 10.1583 2.15829 10.3536 2.35355L17 9M10 18 10 3"></path>
                    </svg>
                  </a>
                </div>
                <div class="cta-2 text-alternate text-center mb-2">105</div>
                <div class="text-center">
                  <a href="#" class="muted-link">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-bottom undefined">
                      <path d="M17 11 10.3536 17.6464C10.1583 17.8417 9.84171 17.8417 9.64645 17.6464L3 11M10 2 10 17"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            <div class="col">
              <div class="position-relative mb-4">
                <a href="CommunityList.html" class="heading d-block body-link stretched-link mb-3">Caramels sesame snaps :)</a>
                <img alt="detail" src="<?php echo base_url('assets');?>/img/product/large/product-1.webp" class="rounded img-fluid sh-50 w-100">
              </div>
              <div class="row g-0">
                <div class="col-12 col-sm mb-3 mb-sm-0">
                  <div class="row g-0 sh-4">
                    <div class="col-auto pe-2">
                      <img src="<?php echo base_url('assets');?>/img/profile/profile-3.webp" class="card-img rounded-xl sh-4 sw-4" alt="thumb">
                    </div>
                    <div class="col d-flex align-items-center">Kathryn Mengel</div>
                  </div>
                </div>
                <div class="col-12 col-sm-auto text">
                  <div class="d-inline-block me-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-eye text-primary me-1">
                      <path d="M2.47466 10.8418C2.15365 10.3203 2.15365 9.67971 2.47466 9.15822C3.49143 7.50643 6.10818 4 10 4C13.8918 4 16.5086 7.50644 17.5253 9.15822C17.8464 9.67971 17.8464 10.3203 17.5253 10.8418C16.5086 12.4936 13.8918 16 10 16C6.10818 16 3.49143 12.4936 2.47466 10.8418Z"></path>
                      <path d="M10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8C8.89543 8 8 8.89543 8 10C8 11.1046 8.89543 12 10 12Z"></path>
                    </svg>
                    <span class="align-middle">114</span>
                  </div>
                  <div class="d-inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-message text-primary me-1">
                      <path d="M14.5 2C15.9045 2 16.6067 2 17.1111 2.33706C17.3295 2.48298 17.517 2.67048 17.6629 2.88886C18 3.39331 18 4.09554 18 5.5L18 10.5C18 11.9045 18 12.6067 17.6629 13.1111C17.517 13.3295 17.3295 13.517 17.1111 13.6629C16.6067 14 15.9045 14 14.5 14L10.4497 14C9.83775 14 9.53176 14 9.24786 14.0861C9.12249 14.1241 9.00117 14.1744 8.88563 14.2362C8.62399 14.376 8.40762 14.5924 7.97487 15.0251L5.74686 17.2531C5.47773 17.5223 5.34317 17.6568 5.2255 17.6452C5.17629 17.6404 5.12962 17.6211 5.0914 17.5897C5 17.5147 5 17.3244 5 16.9438L5 14.6C5 14.5071 5 14.4606 4.99384 14.4218C4.95996 14.2078 4.79216 14.04 4.57822 14.0062C4.53935 14 4.4929 14 4.4 14V14C4.0284 14 3.8426 14 3.68713 13.9754C2.83135 13.8398 2.16017 13.1687 2.02462 12.3129C2 12.1574 2 11.9716 2 11.6L2 5.5C2 4.09554 2 3.39331 2.33706 2.88886C2.48298 2.67048 2.67048 2.48298 2.88886 2.33706C3.39331 2 4.09554 2 5.5 2L14.5 2Z"></path>
                    </svg>
                    <span class="align-middle">21</span>
                  </div>
                  <div class="d-inline-block float-end d-sm-none">
                    <a href="#" class="primary-link">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-top undefined">
                        <path d="M3 9 9.64645 2.35355C9.84171 2.15829 10.1583 2.15829 10.3536 2.35355L17 9M10 18 10 3"></path>
                      </svg>
                    </a>
                    <span class="mx-1 align-middle">214</span>
                    <a href="#" class="muted-link">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-bottom undefined">
                        <path d="M17 11 10.3536 17.6464C10.1583 17.8417 9.84171 17.8417 9.64645 17.6464L3 11M10 2 10 17"></path>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card mb-2">
        <div class="card-body">
          <div class="row g-0">
            <div class="col-auto d-none d-sm-flex pe-4">
              <div class="sw-5">
                <div class="text-center mb-2">
                  <a href="#" class="muted-link">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-top undefined">
                      <path d="M3 9 9.64645 2.35355C9.84171 2.15829 10.1583 2.15829 10.3536 2.35355L17 9M10 18 10 3"></path>
                    </svg>
                  </a>
                </div>
                <div class="cta-2 text-alternate text-center mb-2">105</div>
                <div class="text-center">
                  <a href="#" class="muted-link">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-bottom undefined">
                      <path d="M17 11 10.3536 17.6464C10.1583 17.8417 9.84171 17.8417 9.64645 17.6464L3 11M10 2 10 17"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            <div class="col">
              <div class="position-relative mb-4">
                <a href="CommunityList.html" class="heading d-block body-link stretched-link mb-3">Marshmallow tiramisu!</a>
                <p class="text-alternate mb-0"> Brownie topping apple pie pie toffee wafer cookie bonbon sweet roll. Marshmallow sugar plum chupa chups tart brownie dessert lemon drops topping chocolate. Jelly dragée apple pie halvah jujubes. Sweet sugar plum wafer carrot cake jelly chocolate bar. Brownie gummi bears wafer brownie. Caramels sesame snaps apple pie fruitcake cheesecake topping lemon drops gummi bears icing. </p>
              </div>
              <div class="row g-0">
                <div class="col-12 col-sm mb-3 mb-sm-0">
                  <div class="row g-0 sh-4">
                    <div class="col-auto pe-2">
                      <img src="<?php echo base_url('assets');?>/img/profile/profile-3.webp" class="card-img rounded-xl sh-4 sw-4" alt="thumb">
                    </div>
                    <div class="col d-flex align-items-center">Kathryn Mengel</div>
                  </div>
                </div>
                <div class="col-12 col-sm-auto text">
                  <div class="d-inline-block me-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-eye text-primary me-1">
                      <path d="M2.47466 10.8418C2.15365 10.3203 2.15365 9.67971 2.47466 9.15822C3.49143 7.50643 6.10818 4 10 4C13.8918 4 16.5086 7.50644 17.5253 9.15822C17.8464 9.67971 17.8464 10.3203 17.5253 10.8418C16.5086 12.4936 13.8918 16 10 16C6.10818 16 3.49143 12.4936 2.47466 10.8418Z"></path>
                      <path d="M10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8C8.89543 8 8 8.89543 8 10C8 11.1046 8.89543 12 10 12Z"></path>
                    </svg>
                    <span class="align-middle">245</span>
                  </div>
                  <div class="d-inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-message text-primary me-1">
                      <path d="M14.5 2C15.9045 2 16.6067 2 17.1111 2.33706C17.3295 2.48298 17.517 2.67048 17.6629 2.88886C18 3.39331 18 4.09554 18 5.5L18 10.5C18 11.9045 18 12.6067 17.6629 13.1111C17.517 13.3295 17.3295 13.517 17.1111 13.6629C16.6067 14 15.9045 14 14.5 14L10.4497 14C9.83775 14 9.53176 14 9.24786 14.0861C9.12249 14.1241 9.00117 14.1744 8.88563 14.2362C8.62399 14.376 8.40762 14.5924 7.97487 15.0251L5.74686 17.2531C5.47773 17.5223 5.34317 17.6568 5.2255 17.6452C5.17629 17.6404 5.12962 17.6211 5.0914 17.5897C5 17.5147 5 17.3244 5 16.9438L5 14.6C5 14.5071 5 14.4606 4.99384 14.4218C4.95996 14.2078 4.79216 14.04 4.57822 14.0062C4.53935 14 4.4929 14 4.4 14V14C4.0284 14 3.8426 14 3.68713 13.9754C2.83135 13.8398 2.16017 13.1687 2.02462 12.3129C2 12.1574 2 11.9716 2 11.6L2 5.5C2 4.09554 2 3.39331 2.33706 2.88886C2.48298 2.67048 2.67048 2.48298 2.88886 2.33706C3.39331 2 4.09554 2 5.5 2L14.5 2Z"></path>
                    </svg>
                    <span class="align-middle">12</span>
                  </div>
                  <div class="d-inline-block float-end d-sm-none">
                    <a href="#" class="primary-link">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-top undefined">
                        <path d="M3 9 9.64645 2.35355C9.84171 2.15829 10.1583 2.15829 10.3536 2.35355L17 9M10 18 10 3"></path>
                      </svg>
                    </a>
                    <span class="mx-1 align-middle">214</span>
                    <a href="#" class="muted-link">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-bottom undefined">
                        <path d="M17 11 10.3536 17.6464C10.1583 17.8417 9.84171 17.8417 9.64645 17.6464L3 11M10 2 10 17"></path>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card mb-2">
        <div class="card-body">
          <div class="row g-0">
            <div class="col-auto d-none d-sm-flex pe-4">
              <div class="sw-5">
                <div class="text-center mb-2">
                  <a href="#" class="primary-link">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-top undefined">
                      <path d="M3 9 9.64645 2.35355C9.84171 2.15829 10.1583 2.15829 10.3536 2.35355L17 9M10 18 10 3"></path>
                    </svg>
                  </a>
                </div>
                <div class="cta-2 text-alternate text-center mb-2">42</div>
                <div class="text-center">
                  <a href="#" class="muted-link">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-bottom undefined">
                      <path d="M17 11 10.3536 17.6464C10.1583 17.8417 9.84171 17.8417 9.64645 17.6464L3 11M10 2 10 17"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            <div class="col">
              <div class="position-relative mb-4">
                <a href="CommunityList.html" class="heading d-block body-link stretched-link mb-3">Cheesecake pie dessert?</a>
                <p class="text-alternate mb-0"> Marshmallow beans ice cream candy canes sugar plum chupa chups tart brownie dessert lemon drops topping chocolate. Jelly dragée apple pie halvah jujubes. </p>
              </div>
              <div class="row g-0">
                <div class="col-12 col-sm mb-3 mb-sm-0">
                  <div class="row g-0 sh-4">
                    <div class="col-auto pe-2">
                      <img src="<?php echo base_url('assets');?>/img/profile/profile-2.webp" class="card-img rounded-xl sh-4 sw-4" alt="thumb">
                    </div>
                    <div class="col d-flex align-items-center">Esperanza Lodge</div>
                  </div>
                </div>
                <div class="col-12 col-sm-auto text">
                  <div class="d-inline-block me-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-eye text-primary me-1">
                      <path d="M2.47466 10.8418C2.15365 10.3203 2.15365 9.67971 2.47466 9.15822C3.49143 7.50643 6.10818 4 10 4C13.8918 4 16.5086 7.50644 17.5253 9.15822C17.8464 9.67971 17.8464 10.3203 17.5253 10.8418C16.5086 12.4936 13.8918 16 10 16C6.10818 16 3.49143 12.4936 2.47466 10.8418Z"></path>
                      <path d="M10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8C8.89543 8 8 8.89543 8 10C8 11.1046 8.89543 12 10 12Z"></path>
                    </svg>
                    <span class="align-middle">321</span>
                  </div>
                  <div class="d-inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-message text-primary me-1">
                      <path d="M14.5 2C15.9045 2 16.6067 2 17.1111 2.33706C17.3295 2.48298 17.517 2.67048 17.6629 2.88886C18 3.39331 18 4.09554 18 5.5L18 10.5C18 11.9045 18 12.6067 17.6629 13.1111C17.517 13.3295 17.3295 13.517 17.1111 13.6629C16.6067 14 15.9045 14 14.5 14L10.4497 14C9.83775 14 9.53176 14 9.24786 14.0861C9.12249 14.1241 9.00117 14.1744 8.88563 14.2362C8.62399 14.376 8.40762 14.5924 7.97487 15.0251L5.74686 17.2531C5.47773 17.5223 5.34317 17.6568 5.2255 17.6452C5.17629 17.6404 5.12962 17.6211 5.0914 17.5897C5 17.5147 5 17.3244 5 16.9438L5 14.6C5 14.5071 5 14.4606 4.99384 14.4218C4.95996 14.2078 4.79216 14.04 4.57822 14.0062C4.53935 14 4.4929 14 4.4 14V14C4.0284 14 3.8426 14 3.68713 13.9754C2.83135 13.8398 2.16017 13.1687 2.02462 12.3129C2 12.1574 2 11.9716 2 11.6L2 5.5C2 4.09554 2 3.39331 2.33706 2.88886C2.48298 2.67048 2.67048 2.48298 2.88886 2.33706C3.39331 2 4.09554 2 5.5 2L14.5 2Z"></path>
                    </svg>
                    <span class="align-middle">4</span>
                  </div>
                  <div class="d-inline-block float-end d-sm-none">
                    <a href="#" class="primary-link">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-top undefined">
                        <path d="M3 9 9.64645 2.35355C9.84171 2.15829 10.1583 2.15829 10.3536 2.35355L17 9M10 18 10 3"></path>
                      </svg>
                    </a>
                    <span class="mx-1 align-middle">214</span>
                    <a href="#" class="muted-link">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-bottom undefined">
                        <path d="M17 11 10.3536 17.6464C10.1583 17.8417 9.84171 17.8417 9.64645 17.6464L3 11M10 2 10 17"></path>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card mb-2">
        <div class="card-body">
          <div class="row g-0">
            <div class="col-auto d-none d-sm-flex pe-4">
              <div class="sw-5">
                <div class="text-center mb-2">
                  <a href="#" class="muted-link">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-top undefined">
                      <path d="M3 9 9.64645 2.35355C9.84171 2.15829 10.1583 2.15829 10.3536 2.35355L17 9M10 18 10 3"></path>
                    </svg>
                  </a>
                </div>
                <div class="cta-2 text-alternate text-center mb-2">53</div>
                <div class="text-center">
                  <a href="#" class="muted-link">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-bottom undefined">
                      <path d="M17 11 10.3536 17.6464C10.1583 17.8417 9.84171 17.8417 9.64645 17.6464L3 11M10 2 10 17"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            <div class="col">
              <div class="position-relative mb-4">
                <a href="CommunityList.html" class="heading d-block body-link stretched-link mb-3">Lemon drops marzipan</a>
                <p class="text-alternate mb-0"> Candy jelly beans cupcake. Jelly sesame snaps marshmallow lollipop. Brownie jelly-o carrot cake brownie lemon drops gummi bears. Halvah pudding tootsie roll carrot cake biscuit ice cream halvah tootsie roll. </p>
              </div>
              <div class="row g-0">
                <div class="col-12 col-sm mb-3 mb-sm-0">
                  <div class="row g-0 sh-4">
                    <div class="col-auto pe-2">
                      <img src="<?php echo base_url('assets');?>/img/profile/profile-7.webp" class="card-img rounded-xl sh-4 sw-4" alt="thumb">
                    </div>
                    <div class="col d-flex align-items-center">Joisse Kaycee</div>
                  </div>
                </div>
                <div class="col-12 col-sm-auto text">
                  <div class="d-inline-block me-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-eye text-primary me-1">
                      <path d="M2.47466 10.8418C2.15365 10.3203 2.15365 9.67971 2.47466 9.15822C3.49143 7.50643 6.10818 4 10 4C13.8918 4 16.5086 7.50644 17.5253 9.15822C17.8464 9.67971 17.8464 10.3203 17.5253 10.8418C16.5086 12.4936 13.8918 16 10 16C6.10818 16 3.49143 12.4936 2.47466 10.8418Z"></path>
                      <path d="M10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8C8.89543 8 8 8.89543 8 10C8 11.1046 8.89543 12 10 12Z"></path>
                    </svg>
                    <span class="align-middle">53</span>
                  </div>
                  <div class="d-inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-message text-primary me-1">
                      <path d="M14.5 2C15.9045 2 16.6067 2 17.1111 2.33706C17.3295 2.48298 17.517 2.67048 17.6629 2.88886C18 3.39331 18 4.09554 18 5.5L18 10.5C18 11.9045 18 12.6067 17.6629 13.1111C17.517 13.3295 17.3295 13.517 17.1111 13.6629C16.6067 14 15.9045 14 14.5 14L10.4497 14C9.83775 14 9.53176 14 9.24786 14.0861C9.12249 14.1241 9.00117 14.1744 8.88563 14.2362C8.62399 14.376 8.40762 14.5924 7.97487 15.0251L5.74686 17.2531C5.47773 17.5223 5.34317 17.6568 5.2255 17.6452C5.17629 17.6404 5.12962 17.6211 5.0914 17.5897C5 17.5147 5 17.3244 5 16.9438L5 14.6C5 14.5071 5 14.4606 4.99384 14.4218C4.95996 14.2078 4.79216 14.04 4.57822 14.0062C4.53935 14 4.4929 14 4.4 14V14C4.0284 14 3.8426 14 3.68713 13.9754C2.83135 13.8398 2.16017 13.1687 2.02462 12.3129C2 12.1574 2 11.9716 2 11.6L2 5.5C2 4.09554 2 3.39331 2.33706 2.88886C2.48298 2.67048 2.67048 2.48298 2.88886 2.33706C3.39331 2 4.09554 2 5.5 2L14.5 2Z"></path>
                    </svg>
                    <span class="align-middle">17</span>
                  </div>
                  <div class="d-inline-block float-end d-sm-none">
                    <a href="#" class="primary-link">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-top undefined">
                        <path d="M3 9 9.64645 2.35355C9.84171 2.15829 10.1583 2.15829 10.3536 2.35355L17 9M10 18 10 3"></path>
                      </svg>
                    </a>
                    <span class="mx-1 align-middle">214</span>
                    <a href="#" class="muted-link">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-bottom undefined">
                        <path d="M17 11 10.3536 17.6464C10.1583 17.8417 9.84171 17.8417 9.64645 17.6464L3 11M10 2 10 17"></path>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="text-center my-5">
        <button class="btn btn-lg btn-outline-primary">Load More</button>
      </div>
    </div>-->
  </div>
  <div class="col-12 col-xxl-4 mb-n5">
    <div class="row g-2">
        <?php 
            $level = $this->generic_model->getInfo('active_shelters','user_id',$user_details->id)->starter_pack; 
            $numbers_to_check = [2, 3];
            if (in_array($level, $numbers_to_check)) { ?>
                 <div class="col-12 mb-3">
              <h2 class="small-title">Create New Post</h2>
              <div class="card">
                <div class="card-body">
                    <?php $post_categories = $this->generic_model->select_all_data('community_category'); ?>
                  <form action="<?php echo base_url('community/create_new_post'); ?>" enctype="multipart/form-data" method="post">
                     <div class="row">
                        <div class="mb-3 filled">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-tag undefined">
                            <path d="M8.05025 2.5C8.66225 2.5 8.96824 2.5 9.25214 2.58612C9.37751 2.62415 9.49883 2.6744 9.61437 2.73616C9.87601 2.87601 10.0924 3.09238 10.5251 3.52513L16.0251 9.02514C17.0182 10.0182 17.5148 10.5148 17.6331 11.1098C17.6844 11.3674 17.6844 11.6326 17.6331 11.8902C17.5148 12.4852 17.0182 12.9818 16.0251 13.9749L13.9749 16.0251C12.9818 17.0182 12.4852 17.5148 11.8902 17.6331C11.6326 17.6844 11.3674 17.6844 11.1098 17.6331C10.5148 17.5148 10.0182 17.0182 9.02512 16.0251L3.52513 10.5251C3.09238 10.0924 2.87601 9.87601 2.73616 9.61437C2.6744 9.49883 2.62415 9.37751 2.58612 9.25214C2.5 8.96825 2.5 8.66225 2.5 8.05025L2.5 6C2.5 4.59554 2.5 3.89331 2.83706 3.38886C2.98298 3.17048 3.17048 2.98298 3.38886 2.83706C3.89331 2.5 4.59554 2.5 6 2.5L8.05025 2.5Z"></path>
                            <path d="M5.5 6C5.5 5.72386 5.72386 5.5 6 5.5V5.5C6.27614 5.5 6.5 5.72386 6.5 6V6C6.5 6.27614 6.27614 6.5 6 6.5V6.5C5.72386 6.5 5.5 6.27614 5.5 6V6Z"></path>
                          </svg>
                          <select name="category" class="form-control" required>
                              <option value="">Select Category</option>
                              <?php
                              foreach($post_categories as $categories){ ?>
                                  <option value="<?php echo $categories->id; ?>"><?php echo $categories->category_name; ?></option>
                            <?php  } 
                              ?>
                          </select>
                        </div>
                        <div class="mb-3 filled">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-user undefined">
                            <path d="M10.0179 8C10.9661 8 11.4402 8 11.8802 7.76629C12.1434 7.62648 12.4736 7.32023 12.6328 7.06826C12.8989 6.64708 12.9256 6.29324 12.9789 5.58557C13.0082 5.19763 13.0071 4.81594 12.9751 4.42106C12.9175 3.70801 12.8887 3.35148 12.6289 2.93726C12.4653 2.67644 12.1305 2.36765 11.8573 2.2256C11.4235 2 10.9533 2 10.0129 2V2C9.03627 2 8.54794 2 8.1082 2.23338C7.82774 2.38223 7.49696 2.6954 7.33302 2.96731C7.07596 3.39365 7.05506 3.77571 7.01326 4.53982C6.99635 4.84898 6.99567 5.15116 7.01092 5.45586C7.04931 6.22283 7.06851 6.60631 7.33198 7.03942C7.4922 7.30281 7.8169 7.61166 8.08797 7.75851C8.53371 8 9.02845 8 10.0179 8V8Z"></path>
                            <path d="M16.5 17.5L16.583 16.6152C16.7267 15.082 16.7986 14.3154 16.2254 13.2504C16.0456 12.9164 15.5292 12.2901 15.2356 12.0499C14.2994 11.2842 13.7598 11.231 12.6805 11.1245C11.9049 11.048 11.0142 11 10 11C8.98584 11 8.09511 11.048 7.31945 11.1245C6.24021 11.231 5.70059 11.2842 4.76443 12.0499C4.47077 12.2901 3.95441 12.9164 3.77462 13.2504C3.20144 14.3154 3.27331 15.082 3.41705 16.6152L3.5 17.5"></path>
                          </svg>
                          <input class="form-control" placeholder="Post Title" name="title" required>
                        </div>
                        <div class="mb-3 filled">
                         <input type="file" name="image" class="form-control" required>
                        </div> 
                        <div class="mb-3 filled">
                          <textarea class="form-control" name="body" required></textarea>
                        </div>
                         <div class="mb-3 filled">
                          <input type="number" class="form-control" placeholder="Content Amount" name="amount" required>
                        </div>
                        <div class="mb-3 filled">
                            <button type="submit" class="btn btn-success btn-lg">Submit Post</button>
                        </div>
                     </div> 
                  </form>
                </div>
              </div>
            </div>
           <?php } else {
                echo "Upgrade to Regular Plus to Create Community Posts";
            }
        ?>
        </div>  
    <h2 class="small-title mt-5">Top Users</h2>
    <div class="card mb-5">
      <div class="card-body mb-n2">
          Coming Soon...
        <!--<div class="row g-0 sh-5 mb-2">
          <div class="col-auto">
            <img src="<?php echo base_url('assets');?>/img/profile/profile-1.webp" class="card-img rounded-xl sh-5 sw-5" alt="thumb">
          </div>
          <div class="col">
            <div class="card-body d-flex flex-row pt-0 pb-0 ps-3 pe-0 h-100 align-items-center justify-content-between">
              <div class="d-flex flex-row">
                <span class="me-1">1.</span>
                <span>Cherish Kerr</span>
              </div>
              <div class="d-flex align-items-center">
                <span class="text-muted me-2 d-inline-block">7.8K</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-top text-primary">
                  <path d="M3 9 9.64645 2.35355C9.84171 2.15829 10.1583 2.15829 10.3536 2.35355L17 9M10 18 10 3"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div class="row g-0 sh-5 mb-2">
          <div class="col-auto">
            <img src="<?php echo base_url('assets');?>/img/profile/profile-9.webp" class="card-img rounded-xl sh-5 sw-5" alt="thumb">
          </div>
          <div class="col">
            <div class="card-body d-flex flex-row pt-0 pb-0 ps-3 pe-0 h-100 align-items-center justify-content-between">
              <div class="d-flex flex-row">
                <span class="me-1">2.</span>
                <span>Kirby Peters</span>
              </div>
              <div class="d-flex align-items-center">
                <span class="text-muted me-2 d-inline-block">6.1K</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-top text-primary">
                  <path d="M3 9 9.64645 2.35355C9.84171 2.15829 10.1583 2.15829 10.3536 2.35355L17 9M10 18 10 3"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div class="row g-0 sh-5 mb-2">
          <div class="col-auto">
            <img src="<?php echo base_url('assets');?>/img/profile/profile-7.webp" class="card-img rounded-xl sh-5 sw-5" alt="thumb">
          </div>
          <div class="col">
            <div class="card-body d-flex flex-row pt-0 pb-0 ps-3 pe-0 h-100 align-items-center justify-content-between">
              <div class="d-flex flex-row">
                <span class="me-1">3.</span>
                <span>Olli Hawkins</span>
              </div>
              <div class="d-flex align-items-center">
                <span class="text-muted me-2 d-inline-block">5.7K</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-top text-primary">
                  <path d="M3 9 9.64645 2.35355C9.84171 2.15829 10.1583 2.15829 10.3536 2.35355L17 9M10 18 10 3"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div class="row g-0 sh-5 mb-2">
          <div class="col-auto">
            <img src="<?php echo base_url('assets');?>/img/profile/profile-8.webp" class="card-img rounded-xl sh-5 sw-5" alt="thumb">
          </div>
          <div class="col">
            <div class="card-body d-flex flex-row pt-0 pb-0 ps-3 pe-0 h-100 align-items-center justify-content-between">
              <div class="d-flex flex-row">
                <span class="me-1">4.</span>
                <span>Zayn Hartley</span>
              </div>
              <div class="d-flex align-items-center">
                <span class="text-muted me-2 d-inline-block">5.6K</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-top text-primary">
                  <path d="M3 9 9.64645 2.35355C9.84171 2.15829 10.1583 2.15829 10.3536 2.35355L17 9M10 18 10 3"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div class="row g-0 sh-5 mb-2">
          <div class="col-auto">
            <img src="<?php echo base_url('assets');?>/img/profile/profile-2.webp" class="card-img rounded-xl sh-5 sw-5" alt="thumb">
          </div>
          <div class="col">
            <div class="card-body d-flex flex-row pt-0 pb-0 ps-3 pe-0 h-100 align-items-center justify-content-between">
              <div class="d-flex flex-row">
                <span class="me-1">5.</span>
                <span>Vin Lodge</span>
              </div>
              <div class="d-flex align-items-center">
                <span class="text-muted me-2 d-inline-block">5.2K</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-top text-primary">
                  <path d="M3 9 9.64645 2.35355C9.84171 2.15829 10.1583 2.15829 10.3536 2.35355L17 9M10 18 10 3"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>-->
      </div>
    </div>
    <h2 class="small-title">Popular Titles</h2>
    <div class="card mb-5">
      <div class="card-body">
          Coming Soon.....
        <!--<div class="row g-0">
          <div class="col-12 col-sm-6 mb-n2">
            <a href="#" class="body-link d-block mb-2">Anpan</a>
            <a href="#" class="body-link d-block mb-2">Baba</a>
            <a href="#" class="body-link d-block mb-2">Bagel</a>
            <a href="#" class="body-link d-block mb-2">Bammy</a>
            <a href="#" class="body-link d-block mb-2">Chapati</a>
            <a href="#" class="body-link d-block mb-2">Kalach</a>
          </div>
          <div class="col-12 col-sm-6 mb-n2">
            <a href="#" class="body-link d-block mb-2">Kulcha</a>
            <a href="#" class="body-link d-block mb-2">Matzo</a>
            <a href="#" class="body-link d-block mb-2">Mohnflesserl</a>
            <a href="#" class="body-link d-block mb-2">Pane Ticinese</a>
            <a href="#" class="body-link d-block mb-2">Rieska</a>
            <a href="#" class="body-link d-block mb-2">Zopf</a>
          </div>
        </div>-->
      </div>
    </div>
    <h2 class="small-title">Tags</h2>
    <div class="card mb-5">
      <div class="card-body">
        <button class="btn btn-sm btn-icon btn-icon-end btn-outline-primary mb-1 me-1" type="button">
          <span>Food (12)</span>
        </button>
        <button class="btn btn-sm btn-icon btn-icon-end btn-outline-primary mb-1 me-1" type="button">
          <span>Baking (3)</span>
        </button>
        <button class="btn btn-sm btn-icon btn-icon-end btn-outline-primary mb-1 me-1" type="button">
          <span>Sweet (1)</span>
        </button>
        <button class="btn btn-sm btn-icon btn-icon-end btn-outline-primary mb-1 me-1" type="button">
          <span>Molding (3)</span>
        </button>
        <button class="btn btn-sm btn-icon btn-icon-end btn-outline-primary mb-1 me-1" type="button">
          <span>Pastry (5)</span>
        </button>
        <button class="btn btn-sm btn-icon btn-icon-end btn-outline-primary mb-1 me-1" type="button">
          <span>Healthy (7)</span>
        </button>
        <button class="btn btn-sm btn-icon btn-icon-end btn-outline-primary mb-1 me-1" type="button">
          <span>Rye (3)</span>
        </button>
        <button class="btn btn-sm btn-icon btn-icon-end btn-outline-primary mb-1 me-1" type="button">
          <span>Simple (3)</span>
        </button>
        <button class="btn btn-sm btn-icon btn-icon-end btn-outline-primary mb-1 me-1" type="button">
          <span>Cake (2)</span>
        </button>
        <button class="btn btn-sm btn-icon btn-icon-end btn-outline-primary mb-1 me-1" type="button">
          <span>Recipe (6)</span>
        </button>
        <button class="btn btn-sm btn-icon btn-icon-end btn-outline-primary mb-1 me-1" type="button">
          <span>Bread (8)</span>
        </button>
        <button class="btn btn-sm btn-icon btn-icon-end btn-outline-primary mb-1 me-1" type="button">
          <span>Wheat (2)</span>
        </button>
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