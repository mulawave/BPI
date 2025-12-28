<!DOCTYPE html>

<html lang="en">
<head>
<meta charset="UTF-8">
<title>BeepAgro Pallative</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="<?php echo base_url('assets/font/iconsmind/style.css');?>" />
<link rel="stylesheet" href="<?php echo base_url('assets/font/simple-line-icons/css/simple-line-icons.css');?>" />
<link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/bootstrap.min.css');?>" />
<link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/fullcalendar.min.css');?>" />
<link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/dataTables.bootstrap4.min.css');?>" />
<link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/datatables.responsive.bootstrap4.min.css');?>" />
<link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/select2.min.css');?>" />
<link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/perfect-scrollbar.css');?>" />
<link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/owl.carousel.min.css');?>" />
<link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/bootstrap-stars.css');?>" />
<link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/nouislider.min.css');?>" />
<link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/bootstrap-datepicker3.min.css');?>" />
<link rel="stylesheet" href="<?php echo base_url('assets/css/main.css');?>" />
<script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>
</head>

<body id="app-container" class="menu-default show-spinner">
<nav class="navbar fixed-top">
  <div class="d-flex align-items-center navbar-left"> <a href="#" class="menu-button d-none d-md-block">
    <svg class="main" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 17">
      <rect x="0.48" y="0.5" width="7" height="1" />
      <rect x="0.48" y="7.5" width="7" height="1" />
      <rect x="0.48" y="15.5" width="7" height="1" />
    </svg>
    <svg class="sub" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 17">
      <rect x="1.56" y="0.5" width="16" height="1" />
      <rect x="1.56" y="7.5" width="16" height="1" />
      <rect x="1.56" y="15.5" width="16" height="1" />
    </svg>
    </a> <a href="#" class="menu-button-mobile d-xs-block d-sm-block d-md-none">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 17">
      <rect x="0.5" y="0.5" width="25" height="1" />
      <rect x="0.5" y="7.5" width="25" height="1" />
      <rect x="0.5" y="15.5" width="25" height="1" />
    </svg>
    </a> 
    
    <!--<div class="search" data-search-path="Layouts.Search.html?q=">

                <input placeholder="Search...">

                <span class="search-icon">

                    <i class="simple-icon-magnifier"></i>

                </span>

            </div>--> 
    
  </div>
  <a class="navbar-logo" href="#"> <span class="logo d-none d-xs-block"></span> <span class="logo-mobile d-block d-xs-none"></span> </a>
  <div class="navbar-right">
    <div class="header-icons d-inline-block align-middle">
      <?php if($user_details->kyc == 1){ ?>
      <a class="btn btn-sm btn-outline-success mr-2 d-none d-md-inline-block mb-2" href="#">&nbsp;Verified &nbsp;</a>
      <?php }else{ ?>
      <?php if($user_details->kyc_pending == 1){ ?>
      <a class="btn btn-sm btn-warning mr-2 d-none d-md-inline-block mb-2" href="<?php echo base_url('settings'); ?>">&nbsp;Validating...&nbsp;</a>
      <?php }else{ ?>
      <a class="btn btn-sm btn-danger mr-2 d-none d-md-inline-block mb-2" href="<?php echo base_url('settings'); ?>">&nbsp;Unverified Accountd&nbsp;</a>
      <?php }} ?>
    </div>
    <div class="user d-inline-block">
      <button class="btn btn-empty p-0" type="button" data-toggle="dropdown" aria-haspopup="true"

                    aria-expanded="false"> <span class="name"><?php echo $user_details->firstname.' '.$user_details->lastname; ?></span> <span> <img alt="Profile Picture" src="<?php echo base_url($user_details->profile_pic);?>" /> </span> </button>
      <?php if($user_details->activated == 1){ ?>
      <div class="dropdown-menu dropdown-menu-right mt-3"> <a class="dropdown-item" href="<?php echo base_url('dashboard');?>">Settings</a> <a class="dropdown-item" href="<?php echo base_url('logout');?>">Sign out</a> </div>
      <?php } ?>
    </div>
  </div>
</nav>
<div class="sidebar">
  <div class="main-menu">
    <div class="scroll">
      <ul class="list-unstyled">
        <li> <a href="<?php echo base_url('dashboard');?>"> <i class="iconsmind-Shop-4"></i> <span>Dashboard</span> </a> </li>
        <li> <a href="<?php echo base_url('palliative');?>"> <i class="iconsmind-Myspace"></i> Student Palliative </a> </li>
        <li> <a href="#store"> <i class="iconsmind-Shop-2"></i> Store </a> </li>
        <li> <a href="<?php echo base_url('my_assets');?>"> <i class="iconsmind-Wallet-2"></i> My Assets </a> </li>
        <li> <a href="<?php echo base_url('refer');?>"> <i class="iconsmind-Three-ArrowFork"></i>Referrals </a> </li>
        <li> <a href="<?php echo base_url('merchants');?>"> <i class="iconsmind-Location-2"></i>Pickup Locations </a> </li>
        <li class="active" style="background-color: #eec796;"> <a href="<?php echo base_url('club');?>"> <i class="iconsmind-Air-Balloon"></i>BPI </a> </li>
        <li> <a href="<?php echo base_url('settings');?>"> <i class="glyph-icon iconsmind-Security-Settings"></i>Settings </a> </li>
        <li> <a href="<?php echo base_url('transactions');?>"> <i class="iconsmind-Receipt-3"></i>Transactions </a> </li>
        <li> <a href="<?php echo base_url('logout');?>"> <i class="simple-icon-power"></i> Log Out </a> </li>
      </ul>
    </div>
  </div>
  <div class="sub-menu">
    <div class="scroll">
      <ul class="list-unstyled" data-link="store">
        <li> <a href="<?php echo base_url('checkout');?>"> <i class="simple-icon-basket-loaded"></i> Cart </a> </li>
        <li> <a href="<?php echo base_url('store');?>"> <i class="iconsmind-Shop-2"></i> Global Store </a> </li>
        <li> <a href="<?php echo base_url('my_items');?>"> <i class="iconsmind-Luggage-2"></i> My Claims </a> </li>
        <li> <a href="<?php echo base_url('wishlist');?>"> <i class="iconsmind-Love"></i> Wishlist </a> </li>
      </ul>
    </div>
  </div>
</div>
<main>
  <div class="container-fluid">
    <div class="row  ">
      <div class="col-12">
        <h1>BeepAgro Palliative Membership</h1>
        <nav class="breadcrumb-container d-none d-sm-block d-lg-inline-block" aria-label="breadcrumb">
          <ol class="breadcrumb pt-0">
            <li class="breadcrumb-item"> <a href="dashboard.html">Dashboard</a> </li>
            <li class="breadcrumb-item"> <a href="#">BPI Silver Plus</a> </li>
          </ol>
        </nav>
        <div class="separator mb-5"></div>
      </div>
    </div>
  </div>
  <h5 class="mb-4">Transforming Lives, Sharing Joy!</h5>
  <div class="row mb-4">
    <div class="col-xs-6 col-lg-12 col-12 mb-4">
      <div class="card">
        <div class="card-body">
          <p class="list-item-heading mb-4">Join BPI:</p>
          <p class="list-item-heading mb-4">Become a Member with an annual payment of year one membership of  <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,110000); ?></p>
          <p class="list-item-heading mb-4">Gives you access to BPI Training Program, palliative selection option, and Access to Free Meal Palliative</p>
          <p class="list-item-heading mb-4">Supercharge your Silver Shelter Palliative, Instant Activation</p>
          <hr class="bg-white text-white">
          <a href="<?php echo base_url('start_silver_vip'); ?>">
          <button type="button" class="btn btn-success btn-xl mt-4">Get Started</button>
          </a> </div>
      </div>
    </div>
    <div class="col-xs-6 col-lg-6 col-12 mb-4">
      <div class="card">
        <div class="card-body">
          <p class="list-item-heading mb-4">Getting ready for the BPI Program:</p>
          <p class="list-item-heading mb-4">Activating the BPI program opens a new world of opportunities to you, as a BPI Gold Plus member, you get instant activation in the BeepAgro BPI Shelter Palliative program where you can take advantage of any of the BPI palliative:  own a home ( shelter), Land Palliative, Education Palliative, business support Palliative and Car palliative.</p>
          <p class="list-item-heading mb-4">Access a BPI Agro Essential  palliative products including;</p>
          <ul class="sortable list-unstyled">
            <li>
              <p class="list-item-heading mb-4">1. Rice Palliative</p>
            </li>
            <li>
              <p class="list-item-heading mb-4">2. Beans Palliative</p>
            </li>
            <li>
              <p class="list-item-heading mb-4">3. Garri Palliative</p>
            </li>
            <li>
              <p class="list-item-heading mb-4">4. Oil</p>
            </li>
			  <li>
              <p class="list-item-heading mb-4">5. Dry Fish</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="col-xs-6 col-lg-6 col-12 mb-4">
      <div class="card d-flex flex-row mb-4">
        <div class="card">
          <div class="card-body">
            <p class="list-item-heading mb-4">Invite and Share:</p>
            <p class="list-item-heading mb-4">oin us in unlocking the transformative benefits of BPI Training and Palliative Rewards! Help us reach those in need by identifying individuals who could benefit from BPI's palliative support and training. Invite and share this opportunity with them, empowering them to seize the potential for positive change in their lives and communities. Together, let's make a difference.</p>
          </div>
        </div>
      </div>
      <div class="card d-flex flex-row mb-4">
        <div class="card">
          <div class="card-body">
            <p class="list-item-heading mb-4">Choose the palliatve that suits your preferences and needs.</p>
            <p class="list-item-heading mb-4">Move the chosen palliative value to your personalized palliative card and spend it at your convienence.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>
<script src="<?php echo base_url('assets/js/vendor/jquery-3.3.1.min.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/bootstrap.bundle.min.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/Chart.bundle.min.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/chartjs-plugin-datalabels.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/moment.min.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/fullcalendar.min.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/datatables.min.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/perfect-scrollbar.min.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/owl.carousel.min.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/progressbar.min.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/jquery.barrating.min.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/select2.full.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/nouislider.min.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/bootstrap-datepicker.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/Sortable.js');?>"></script> 
<script src="<?php echo base_url('assets/js/vendor/mousetrap.min.js');?>"></script> 
<script src="<?php echo base_url('assets/js/dore.script.js');?>"></script> 
<script>

        /* Dore Theme Select & Initializer Script 

Table of Contents

01. Css Loading Util

02. Theme Selector And Initializer



/* 01. Css Loading Util */

function loadStyle(href, callback) {

  for (var i = 0; i < document.styleSheets.length; i++) {

    if (document.styleSheets[i].href == href) {

      return;

    }

  }

  var head = document.getElementsByTagName("head")[0];

  var link = document.createElement("link");

  link.rel = "stylesheet";

  link.type = "text/css";

  link.href = href;

  if (callback) {

    link.onload = function() {

      callback();

    };

  }

  head.appendChild(link);

}

/* 02. Theme Selector And Initializer */

(function($) {

  if ($().dropzone) {

    Dropzone.autoDiscover = false;

  }

  

  var themeColorsDom =

    ' ';

  $("body").append(themeColorsDom);

  var theme = "dore.dark.orange.min.css";



  if (typeof Storage !== "undefined") {

    if (localStorage.getItem("theme")) {

      theme = localStorage.getItem("theme");

    }

  }



  $(".theme-color[data-theme='" + theme + "']").addClass("active");



  loadStyle("<?php echo base_url('assets/css/');?>" + theme, onStyleComplete);

  function onStyleComplete() {

    setTimeout(onStyleCompleteDelayed, 300);

  }



  function onStyleCompleteDelayed() {

    var $dore = $("body").dore();

  }



  $("body").on("click", ".theme-color", function(event) {

    event.preventDefault();

    var dataTheme = $(this).data("theme");

    if (typeof Storage !== "undefined") {

      localStorage.setItem("theme", dataTheme);

      window.location.reload();

    }

  });





  $(".theme-button").on("click", function(event) {

    event.preventDefault();

    $(this)

      .parents(".theme-colors")

      .toggleClass("shown");

  });

  $(document).on("click", function(event) {

    if (

      !(

        $(event.target)

          .parents()

          .hasClass("theme-colors") ||

        $(event.target)

          .parents()

          .hasClass("theme-button") ||

        $(event.target).hasClass("theme-button") ||

        $(event.target).hasClass("theme-colors")

      )

    ) {

      if ($(".theme-colors").hasClass("shown")) {

        $(".theme-colors").removeClass("shown");

      }

    }

  });

})(jQuery);

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