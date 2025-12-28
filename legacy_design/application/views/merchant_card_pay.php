<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Beep Agro Palliative</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <link rel="stylesheet" href="<?php echo base_url('assets/font/iconsmind/style.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets/font/simple-line-icons/css/simple-line-icons.css');?>" />

    <link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/bootstrap-stars.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/bootstrap.min.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/owl.carousel.min.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/bootstrap-float-label.min.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets/css/vendor/bootstrap-stars.css');?>" />
    <link rel="stylesheet" href="<?php echo base_url('assets/css/main.css');?>" />
</head>
<?php
$link = base_url().'merchant_flutterwaveCallback';
?>
<body class="show-spinner">
    <div class="landing-page">
        <div class="mobile-menu">
            <a href="#" class="logo-mobile">
                <span></span>
            </a>
            <ul class="navbar-nav">
                <li class="nav-item">
                    <a href="<?php echo base_url('logout'); ?>">Log Out</a>
                </li>
            </ul>
        </div>
        <div class="main-container">
            <nav class="landing-page-nav">
                <div class="container d-flex align-items-center justify-content-between">
                    <a class="navbar-logo pull-left" href="#">
                        <span class="white"></span>
                        <span class="dark"></span>
                    </a>
                    <ul class="navbar-nav d-none d-lg-flex flex-row">
                        <li class="nav-item pl-2">
                            <a class="btn btn-outline-semi-light btn-sm pr-4 pl-4" href="<?php echo base_url('logout');?>">Log Out</a>
                        </li>
                    </ul>
                    <a href="#" class="mobile-menu-button">
                        <i class="simple-icon-menu"></i>
                    </a>
                </div>
            </nav>
            <div class="content-container">
                <div class="section home subpage-long">
                    <div class="container">
                        <div class="row home-row mb-0">
                            <div class="col-12 col-lg-6 col-xl-4 col-md-12">
                                <div class="home-text">
                                    <div class="display-1">
                                        <?php $percentage = 7.5 / 100; $vat = $amount * $percentage; ?>
                                        <p>Card Payment:  <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,$amount);?></p>
                                        <p>VAT: <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,$vat);?></p>
                                        Total Due: <?php echo $this->generic_model->getInfo('currency_management','id',$user_details->default_currency)->symbol; ?><?php echo $this->generic_model->convert_currency($user_details->default_currency,($amount+$vat));?>
                                    </div>
                                    
                                    <p class="white mb-2">
                                        Please note that card payment attract a processing charge of 1.4%
                                    </p>
                                    <hr class="bg-white text-white">
                                        <button type="button" class="btn btn-success btn-xl mt-4" onclick="payWithRave()">Make Payment</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
    <!-- Add this script tag to the head of your HTML document -->
    <script src="https://checkout.flutterwave.com/v3.js"></script>
    <script src="<?php echo base_url('assets/js/vendor/jquery-3.3.1.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/bootstrap.bundle.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/owl.carousel.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/jquery.barrating.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/jquery.barrating.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/landing-page/headroom.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/landing-page/jQuery.headroom.js');?>"></script>
    <script src="<?php echo base_url('assets/js/vendor/landing-page/jquery.scrollTo.min.js');?>"></script>
    <script src="<?php echo base_url('assets/js/dore.scripts.landingpage.js');?>"></script>
    <script>
        /* Dore Theme Select & Initializer Script 

        Table of Contents
        
        01. Css Loading Util
        02. Theme Selector And Initializer
        */
        
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
 <script>
    function payWithRave() { 
    FlutterwaveCheckout({ 
      public_key: "FLWPUBK-0732f5f0a50dfaa213b367e5f9a39bc5-X",
      tx_ref: "<?php echo $_SESSION['txref'] ?>",
      amount: <?php echo ($amount+$vat); ?>,
      currency: "NGN",
      country: "NG",
      payment_options: "card,ussd,banktransfer,account",
      redirect_url: "<?php echo $link ?>",
      customer: {
        email: "<?php echo $user_details->email; ?>",
        phone_number: "<?php echo $user_details->mobile ?>",
        name: "<?php echo $user_details->firstname.' '.$user_details->lastname ?>",
      },
      callback: function (data) { // specified callback function
        console.log(data);
      },
      customizations: {
        title: 'Beep Agro Palliative',
        description: 'Palliatives Package',
        logo: "https://development.beepagro.com/assets/img/logo/beep_agro_logo.jpg",
      },
    });
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