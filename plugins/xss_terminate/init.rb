require 'xss_terminate'
ActiveRecord::Base.send(:include, XssTerminate)
