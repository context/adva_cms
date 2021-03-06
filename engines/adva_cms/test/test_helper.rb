defined?(TEST_HELPER_LOADED) ? raise("can not load #{__FILE__} twice") : TEST_HELPER_LOADED = true

ENV["RAILS_ENV"] = "test"
dir = File.dirname(__FILE__)
require File.expand_path(dir + "/../../../../../config/environment")

require 'matchy'
require 'test_help'
require 'action_view/test_case'
require 'with'
require 'with-sugar'

require 'webrat'
require 'webrat/rails'

Webrat.configure do |config|
  config.mode = :rails
  config.open_error_files = false
end

# Webrat.configuration.open_error_files = false

require 'globalize/i18n/missing_translations_raise_handler'
I18n.exception_handler = :missing_translations_raise_handler

class Test::Unit::TestCase
  include RR::Adapters::TestUnit
  
  def setup_with_adva_cms_setup
    setup_without_adva_cms_setup
    start_db_transaction!
    setup_page_caching!

    I18n.locale = nil
    I18n.default_locale = :en
  end
  alias_method_chain :setup, :adva_cms_setup

  def teardown_with_adva_cms_setup
    teardown_without_adva_cms_setup
  ensure
    rollback_db_transaction!
    clear_cache_dir!
  end
  alias_method_chain :teardown, :adva_cms_setup
  
  def stub_paperclip_post_processing!
    stub.proxy(Paperclip::Attachment).new { |attachment| stub(attachment).post_process }
  end
end

# FIXME at_exit { try to rollback any open transactions }

# include this line to test adva-cms with url_history installed
# require dir + '/plugins/url_history/init_url_history'

require_all dir + "/contexts.rb",
            dir + "/test_helper/**/*.rb"
require_all dir + "/../../**/test/contexts.rb",
            dir + "/../../**/test/test_helper/**/*.rb"

if DO_PREPARE_DATABASE
  puts 'Preparing the database ...'
  # load "#{Rails.root}/db/schema.rb"
  require_all dir + "/fixtures.rb"
  require_all dir + "/../../**/test/fixtures.rb"
end

