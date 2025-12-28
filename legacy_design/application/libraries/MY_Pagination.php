<?php
defined('BASEPATH') OR exit('No direct script access allowed');
// application/libraries/MY_Pagination.php

class MY_Pagination extends CI_Pagination {

    public function create_links() {
        if ($this->num_pages < 2) {
            return '';
        }

        $output = '<div class="col-12"><nav class="mt-4 mb-3"><ul class="pagination justify-content-center mb-0">';

        // First and previous page links
        $output .= $this->prev_link();

        // Page links
        $output .= $this->page_links();

        // Next and last page links
        $output .= $this->next_link();

        $output .= '</ul></nav></div>';

        return $output;
    }

    // Add any other customizations or overrides as needed
}
