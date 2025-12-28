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
    <div>
      <ul class="nav nav-tabs nav-tabs-title nav-tabs-line-title responsive-tabs" role="tablist">
        <li class="nav-item" role="presentation">
          <a class="nav-link active" data-bs-toggle="tab" href="#popularPosts" aria-selected="true" role="tab">Posts</a>
        </li>
        <!--<li class="nav-item" role="presentation">
          <a class="nav-link" data-bs-toggle="tab" href="#popularPosts" aria-selected="false" role="tab">Newest</a>
        </li>-->
        <!--<li class="nav-item" role="presentation">
          <a class="nav-link" data-bs-toggle="tab" href="#popularPosts" aria-selected="false" role="tab">Unread</a>
        </li>-->
        <li class="nav-item dropdown ms-auto d-none responsive-tab-dropdown">
          <a class="btn btn-icon btn-icon-only btn-background pt-0" href="#" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-more-horizontal undefined">
              <path d="M9 10C9 9.44772 9.44772 9 10 9V9C10.5523 9 11 9.44772 11 10V10C11 10.5523 10.5523 11 10 11V11C9.44772 11 9 10.5523 9 10V10zM2 10C2 9.44772 2.44772 9 3 9V9C3.55228 9 4 9.44772 4 10V10C4 10.5523 3.55228 11 3 11V11C2.44772 11 2 10.5523 2 10V10zM16 10C16 9.44772 16.4477 9 17 9V9C17.5523 9 18 9.44772 18 10V10C18 10.5523 17.5523 11 17 11V11C16.4477 11 16 10.5523 16 10V10z"></path>
            </svg>
          </a>
          <ul class="dropdown-menu mt-2 dropdown-menu-end"></ul>
        </li>
      </ul>
      <div class="tab-content">
        <div class="tab-pane fade active show" id="popularPosts" role="tabpanel">
        <?php 
               $author = $this->generic_model->getInfo('users','id',$post->authur);
            ?> 
            <div class="card mb-2">
                <div class="card-body">
                  <div class="row g-0">
                    <div class="col-auto d-none d-sm-flex pe-4">
                      <div class="sw-5">
                        <div class="cta-3 text-alternate text-center mb-2"><?php echo $this->generic_model->get_count('community_post_reply',array('post_id'=>$post->id)); ?></div>
                      </div>
                    </div>
                    <div class="col">
                      <div class="position-relative mb-3 mb-sm-4">
                        <?php echo $post->title; ?>
                          <div class="mt-3">
                          <?php 
                            $file_extension = pathinfo($post->image, PATHINFO_EXTENSION);
                            if (strtolower($file_extension) === 'pdf') {
                                echo '<a href="' . base_url($post->image) . '" class="btn btn-primary" target="_blank">Download / Read PDF</a>';
                            } else { ?>
                                <img alt="detail" src="<?php echo base_url($post->image); ?>" class="rounded img-fluid w-100 h-md-100">
                          <?php  }
                            
                            ?>
                        </div>
                      </div>
                      <div class="text-alternate mb-3">
                              <?php echo nl2br(htmlspecialchars($post->post)); ?>
                     </div>
                      <div class="row g-0">
                        <div class="col-12 col-sm mb-2 mb-sm-0">
                          <div class="row g-0 sh-4">
                            <div class="col-auto pe-3">
                              <img src="<?php echo base_url($author->profile_pic); ?>" class="card-img rounded-xl sh-4 sw-4" alt="thumb">
                            </div>
                            <div class="col d-flex align-items-center"><?php echo $author->firstname.' '.$author->lastname; ?></div>
                          </div>
                        </div>
                        <div class="col-12 col-sm-auto text">
                          <div class="d-inline-block me-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-eye text-primary me-1">
                              <path d="M2.47466 10.8418C2.15365 10.3203 2.15365 9.67971 2.47466 9.15822C3.49143 7.50643 6.10818 4 10 4C13.8918 4 16.5086 7.50644 17.5253 9.15822C17.8464 9.67971 17.8464 10.3203 17.5253 10.8418C16.5086 12.4936 13.8918 16 10 16C6.10818 16 3.49143 12.4936 2.47466 10.8418Z"></path>
                              <path d="M10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8C8.89543 8 8 8.89543 8 10C8 11.1046 8.89543 12 10 12Z"></path>
                            </svg>
                            <span class="align-middle"><?php echo $post->views;?></span>
                          </div>
                          <div class="d-inline-block">
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-message text-primary me-1">
                              <path d="M14.5 2C15.9045 2 16.6067 2 17.1111 2.33706C17.3295 2.48298 17.517 2.67048 17.6629 2.88886C18 3.39331 18 4.09554 18 5.5L18 10.5C18 11.9045 18 12.6067 17.6629 13.1111C17.517 13.3295 17.3295 13.517 17.1111 13.6629C16.6067 14 15.9045 14 14.5 14L10.4497 14C9.83775 14 9.53176 14 9.24786 14.0861C9.12249 14.1241 9.00117 14.1744 8.88563 14.2362C8.62399 14.376 8.40762 14.5924 7.97487 15.0251L5.74686 17.2531C5.47773 17.5223 5.34317 17.6568 5.2255 17.6452C5.17629 17.6404 5.12962 17.6211 5.0914 17.5897C5 17.5147 5 17.3244 5 16.9438L5 14.6C5 14.5071 5 14.4606 4.99384 14.4218C4.95996 14.2078 4.79216 14.04 4.57822 14.0062C4.53935 14 4.4929 14 4.4 14V14C4.0284 14 3.8426 14 3.68713 13.9754C2.83135 13.8398 2.16017 13.1687 2.02462 12.3129C2 12.1574 2 11.9716 2 11.6L2 5.5C2 4.09554 2 3.39331 2.33706 2.88886C2.48298 2.67048 2.67048 2.48298 2.88886 2.33706C3.39331 2 4.09554 2 5.5 2L14.5 2Z"></path>
                            </svg>
                            <span class="align-middle"><?php echo $this->generic_model->get_count('community_post_reply',array('post_id'=>$post->id)); ?></span>
                          </div>
                          <div class="d-inline-block float-end d-sm-none">
                            <a href="#" class="primary-link">
                              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-arrow-top undefined">
                                <path d="M3 9 9.64645 2.35355C9.84171 2.15829 10.1583 2.15829 10.3536 2.35355L17 9M10 18 10 3"></path>
                              </svg>
                            </a>
                            <span class="mx-1 align-middle"><?php echo $this->generic_model->get_count('community_post_reply',array('post_id'=>$post->id)); ?></span>
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
             <h5 class="mt-3">Latest Replies</h5>
             <div class="border-bottom border-separator opacity-50 mt-3 mb-3"></div>
                  <div class="row g-0 mb-3">
                      <div class="scroll-out">
                        <div class="scroll-by-count" data-count="4">
                         <?php 
                              $random_reps = $this->generic_model->select_all('community_post_reply',array('post_id'=>$post->id));
                              if(!empty($random_reps)){ 
                                foreach($random_reps as $random_rep){
                                $poster = $this->generic_model->getInfo('users','id',$random_rep->user_id);
                              ?>
                            <div class="card border-bottom">
                                <div class="card-body">
                                    <div class="col-12 col-sm mb-sm-0">
                                      <div class="row g-0 sh-4">
                                        <div class="col-auto pe-3">
                                          <img src="<?php echo base_url($poster->profile_pic); ?>" class="card-img rounded-xl sh-3 sw-3" alt="thumb">
                                        </div>
                                        <div class="col d-flex align-items-center"><?php echo $poster->firstname.' '.$poster->lastname; ?></div>
                                      </div>
                                    </div>
                                    <div class="col-12">
                                      <div class="text-alternate mb-1">
                                       <?php echo nl2br(htmlspecialchars($random_rep->reply)); ?>  - <span class="text-muted text-small">Added: <?php echo time_ago($random_rep->date_added); ?></span>
                                      </div>
                                    </div>
                                </div>
                            </div>
                         <?php   
                                } ?>
                          
                              
                        <?php  }
                            ?>
                        </div>
                      </div>
                                     
                  </div>
                  <div class="row mt-5">
                   <form action="<?php echo base_url('community/add_reply'); ?>" method="post">
                    <div class="filled mb-3">
                    <input type="hidden" name="post_id" value="<?php echo $post->id; ?>">
                    <input type="hidden" name="category_id" value="<?php echo $post->category_id; ?>">
                    <input type="text" name="reply" class="form-control" placeholder="Add a comment" aria-label="Add a comment">
                    </div>
                    <div class="filled mb-3">
                    <button class="btn btn-icon btn-icon-end btn-outline-primary" type="submit">
                      <span>Add</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-send undefined">
                        <path d="M12.6593 16.3216L17.5346 3.86246C17.7992 3.18631 17.9315 2.84823 17.8211 2.64418C17.7749 2.55868 17.7047 2.48851 17.6192 2.44226C17.4152 2.3319 17.0771 2.46419 16.4009 2.72877L3.94174 7.60411L3.94173 7.60411C3.24079 7.87839 2.89031 8.01553 2.81677 8.23918C2.786 8.33274 2.78356 8.43332 2.80974 8.52827C2.87231 8.75522 3.2157 8.90925 3.90249 9.21731L8.53011 11.293L8.53012 11.293C8.65869 11.3507 8.72298 11.3795 8.77572 11.4235C8.79902 11.4429 8.82052 11.4644 8.83993 11.4877C8.88385 11.5404 8.91269 11.6047 8.97037 11.7333L11.0461 16.3609C11.3541 17.0477 11.5082 17.3911 11.7351 17.4537C11.8301 17.4798 11.9306 17.4774 12.0242 17.4466C12.2479 17.3731 12.385 17.0226 12.6593 16.3216Z"></path>
                        <path d="M11.8994 8.36395L9.07099 11.1924"></path>
                      </svg>
                    </button>
                    </div>
                    </form>
                  </div>
            <div class="border-bottom border-separator opacity-100 mt-5 mb-5"></div>        
        </div>
      </div>
    </div>
  </div>
  <div class="col-12 col-xxl-4 mb-n5">
    <h2 class="small-title">About this Category</h2>
    <div class="card mb-5">
      <div class="card-body mb-n2">
        <p> This category focuses on collaboration opportunities, innovative ideas, and group projects. It can include subcategories like "Project Collaborations," "Brainstorming Sessions," "Hackathons," "Innovation Challenges," and "Start-up Ideas."  </p>
        <div class="row g-0 mb-n2">
          <div class="col-4 mb-2">
            <div class="text-small text-muted">POSTS</div>
            <div class="cta-2 text-primary"><?php echo $this->generic_model->get_count('community_posts',array('category_id'=>6)); ?></div>
          </div>
          <div class="col-4 mb-2">
            <div class="text-small text-muted">Replies</div>
            <div class="cta-2 text-primary"><?php echo $this->generic_model->get_count('community_post_reply',array('category_id'=>6)); ?></div>
          </div>
        </div>
      </div>
    </div>
    <h2 class="small-title">Other Categories</h2>
    <div class="card mb-5">
      <div class="card-body">
        <a href="<?php echo base_url('networking'); ?>" class="row g-0 sh-3 mb-4">
          <div class="col-auto">
            <div class="sh-3 d-inline-block d-flex justify-content-center align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-server text-primary">
                <path d="M15 2H5C4.06812 2 3.60218 2 3.23463 2.15224 2.74458 2.35523 2.35523 2.74458 2.15224 3.23463 2 3.60218 2 4.06812 2 5 2 5.93188 2 6.39782 2.15224 6.76537 2.35523 7.25542 2.74458 7.64477 3.23463 7.84776 3.60218 8 4.06812 8 5 8H15C15.9319 8 16.3978 8 16.7654 7.84776 17.2554 7.64477 17.6448 7.25542 17.8478 6.76537 18 6.39782 18 5.93188 18 5 18 4.06812 18 3.60218 17.8478 3.23463 17.6448 2.74458 17.2554 2.35523 16.7654 2.15224 16.3978 2 15.9319 2 15 2zM15 12H5C4.06812 12 3.60218 12 3.23463 12.1522 2.74458 12.3552 2.35523 12.7446 2.15224 13.2346 2 13.6022 2 14.0681 2 15 2 15.9319 2 16.3978 2.15224 16.7654 2.35523 17.2554 2.74458 17.6448 3.23463 17.8478 3.60218 18 4.06812 18 5 18H15C15.9319 18 16.3978 18 16.7654 17.8478 17.2554 17.6448 17.6448 17.2554 17.8478 16.7654 18 16.3978 18 15.9319 18 15 18 14.0681 18 13.6022 17.8478 13.2346 17.6448 12.7446 17.2554 12.3552 16.7654 12.1522 16.3978 12 15.9319 12 15 12z"></path>
                <path d="M13 5H15M13 15H15M7 8 7 12M13 8 13 12"></path>
              </svg>
            </div>
          </div>
          <div class="col">
            <div class="card-body d-flex flex-row pt-0 pb-0 ps-3 pe-0 h-100 align-items-center justify-content-between">
              <div class="d-flex flex-column">
                <div>Community and Networking</div>
              </div>
              <div class="d-flex">
                <span class="badge bg-outline-alternate"><?php echo $this->generic_model->get_count('community_posts',array('category_id'=>1)); ?>POSTS</span>
              </div>
            </div>
          </div>
        </a>
        <a href="<?php echo base_url('learning');?>" class="row g-0 sh-3 mb-4">
          <div class="col-auto">
            <div class="sh-3 d-inline-block d-flex justify-content-center align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-database text-primary">
                <path d="M16 3H4C2.89543 3 2 3.89543 2 5 2 6.10457 2.89543 7 4 7H16C17.1046 7 18 6.10457 18 5 18 3.89543 17.1046 3 16 3zM15 7H5C3.34315 7 2 8.34315 2 10 2 11.6569 3.34315 13 5 13H15C16.6569 13 18 11.6569 18 10 18 8.34315 16.6569 7 15 7zM16 13H4C2.89543 13 2 13.8954 2 15 2 16.1046 2.89543 17 4 17H16C17.1046 17 18 16.1046 18 15 18 13.8954 17.1046 13 16 13z"></path>
                <path d="M13 10H15"></path>
              </svg>
            </div>
          </div>
          <div class="col">
            <div class="card-body d-flex flex-row pt-0 pb-0 ps-3 pe-0 h-100 align-items-center justify-content-between">
              <div class="d-flex flex-column">
                <div>Knowledge and Learning</div>
              </div>
              <div class="d-flex">
                <span class="badge bg-outline-alternate"><?php echo $this->generic_model->get_count('community_posts',array('category_id'=>2)); ?> POSTS</span>
              </div>
            </div>
          </div>
        </a>
        <a href="<?php echo base_url('health');?>" class="row g-0 sh-3 mb-4">
          <div class="col-auto">
            <div class="sh-3 d-inline-block d-flex justify-content-center align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-startup text-primary">
                <path d="M10.0216 4.90354C12.842 2.08308 17.3706 2.44544 17.7536 2.82842 18.1365 3.21141 18.4989 7.73994 15.6784 10.5604 12.858 13.3808 10.7954 14.2551 8.56116 12.0208 6.3269 9.78655 6.95745 7.96767 10.0216 4.90354zM10.1664 16.3721C10.9175 15.0019 9.98891 14.0733 9.98891 14.0733 9.98891 14.0733 9.98891 14.0733 9.98891 14.0733L6.39139 10.4758 6.27453 10.359C6.27453 10.359 6.27453 10.359 6.27453 10.359 6.27453 10.359 5.34594 9.43037 3.97575 10.1815 2.9421 10.7481 2.2357 12.0444 1.95105 12.647 1.8779 12.8019 1.98802 12.9739 2.15912 12.9816L4.42357 13.0836C4.59466 13.0913 4.70752 13.2649 4.64514 13.4244L3.38998 16.634C3.31059 16.837 3.51087 17.0373 3.71386 16.9579L6.92344 15.7027C7.08294 15.6403 7.25653 15.7532 7.26424 15.9243L7.36626 18.1888C7.37396 18.3599 7.54597 18.47 7.70083 18.3968 8.30343 18.1122 9.59973 17.4058 10.1664 16.3721z"></path>
              </svg>
            </div>
          </div>
          <div class="col">
            <div class="card-body d-flex flex-row pt-0 pb-0 ps-3 pe-0 h-100 align-items-center justify-content-between">
              <div class="d-flex flex-column">
                <div>Health and Well-being</div>
              </div>
              <div class="d-flex">
                <span class="badge bg-outline-alternate"><?php echo $this->generic_model->get_count('community_posts',array('category_id'=>3)); ?>POSTS</span>
              </div>
            </div>
          </div>
        </a>
        <a href="<?php echo base_url('creativity');?>" class="row g-0 sh-3 mb-4">
          <div class="col-auto">
            <div class="sh-3 d-inline-block d-flex justify-content-center align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-user text-primary">
                <path d="M10.0179 8C10.9661 8 11.4402 8 11.8802 7.76629C12.1434 7.62648 12.4736 7.32023 12.6328 7.06826C12.8989 6.64708 12.9256 6.29324 12.9789 5.58557C13.0082 5.19763 13.0071 4.81594 12.9751 4.42106C12.9175 3.70801 12.8887 3.35148 12.6289 2.93726C12.4653 2.67644 12.1305 2.36765 11.8573 2.2256C11.4235 2 10.9533 2 10.0129 2V2C9.03627 2 8.54794 2 8.1082 2.23338C7.82774 2.38223 7.49696 2.6954 7.33302 2.96731C7.07596 3.39365 7.05506 3.77571 7.01326 4.53982C6.99635 4.84898 6.99567 5.15116 7.01092 5.45586C7.04931 6.22283 7.06851 6.60631 7.33198 7.03942C7.4922 7.30281 7.8169 7.61166 8.08797 7.75851C8.53371 8 9.02845 8 10.0179 8V8Z"></path>
                <path d="M16.5 17.5L16.583 16.6152C16.7267 15.082 16.7986 14.3154 16.2254 13.2504C16.0456 12.9164 15.5292 12.2901 15.2356 12.0499C14.2994 11.2842 13.7598 11.231 12.6805 11.1245C11.9049 11.048 11.0142 11 10 11C8.98584 11 8.09511 11.048 7.31945 11.1245C6.24021 11.231 5.70059 11.2842 4.76443 12.0499C4.47077 12.2901 3.95441 12.9164 3.77462 13.2504C3.20144 14.3154 3.27331 15.082 3.41705 16.6152L3.5 17.5"></path>
              </svg>
            </div>
          </div>
          <div class="col">
            <div class="card-body d-flex flex-row pt-0 pb-0 ps-3 pe-0 h-100 align-items-center justify-content-between">
              <div class="d-flex flex-column">
                <div>Creativity and Expression</div>
              </div>
              <div class="d-flex">
                <span class="badge bg-outline-alternate"><?php echo $this->generic_model->get_count('community_posts',array('category_id'=>4)); ?>POSTS</span>
              </div>
            </div>
          </div>
        </a>
        <a href="<?php echo base_url('entertainment');?>" class="row g-0 sh-3">
          <div class="col-auto">
            <div class="sh-3 d-inline-block d-flex justify-content-center align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="acorn-icons acorn-icons-cpu text-primary">
                <path d="M12.5 4C13.9045 4 14.6067 4 15.1111 4.33706C15.3295 4.48298 15.517 4.67048 15.6629 4.88886C16 5.39331 16 6.09554 16 7.5L16 12.5C16 13.9045 16 14.6067 15.6629 15.1111C15.517 15.3295 15.3295 15.517 15.1111 15.6629C14.6067 16 13.9045 16 12.5 16L7.5 16C6.09554 16 5.39331 16 4.88886 15.6629C4.67048 15.517 4.48298 15.3295 4.33706 15.1111C4 14.6067 4 13.9045 4 12.5L4 7.5C4 6.09554 4 5.39331 4.33706 4.88886C4.48298 4.67048 4.67048 4.48298 4.88886 4.33706C5.39331 4 6.09554 4 7.5 4L12.5 4Z"></path>
                <path d="M2 10H4M10 16 10 18M10 2 10 4M16 10H18M16 6H18M2 6H4M14 16 14 18M14 2 14 4M16 14H18M2 14H4M6 16 6 18M6 2 6 4"></path>
              </svg>
            </div>
          </div>
          <div class="col">
            <div class="card-body d-flex flex-row pt-0 pb-0 ps-3 pe-0 h-100 align-items-center justify-content-between">
              <div class="d-flex flex-column">
                <div>Entertainment and Leisure</div>
              </div>
              <div class="d-flex">
                <span class="badge bg-outline-alternate"><?php echo $this->generic_model->get_count('community_posts',array('category_id'=>5)); ?> POSTS</span>
              </div>
            </div>
          </div>
        </a>
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