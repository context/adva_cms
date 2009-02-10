class Test::Unit::TestCase
  def setup_assets_dir!
    Asset.root_dir = RAILS_ROOT + '/tmp'
  end

  def clear_assets_dir!
    FileUtils.rm_r Asset.root_dir + '/assets' if File.exists?(Asset.root_dir + '/assets')
  end
end
