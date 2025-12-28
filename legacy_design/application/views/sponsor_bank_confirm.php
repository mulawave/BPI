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
                                        Payment Confirmation
                                    </div>
                                    <p class="white mb-2">
                                        Upload Payment receipt
                                    </p>
                                    <hr class="bg-white text-white">
                                    <small class="text-warning">Allowed Files: 'gif | jpg | png | jpeg' 4MB Maximum Size</small>
                                    <form id="payment-form" action="<?= base_url('sponsor_processPayment'); ?>" method="post" enctype="multipart/form-data" class="dark-background">
                                        <label class="form-group has-top-label">
                                            <input type="file" class="form-control" name="receipt_image" accept="image/*" required>
                                            <input type="hidden" name="amount" value="<?php echo $amount; ?>">
                                            <input type="hidden" name="beneficiary" value="<?php echo $beneficiary; ?>">
                                            <span>Receipt</span>
                                        </label>
                                        <button class="btn btn-danger btn-xl mt-4" type="submit">Submit</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>

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