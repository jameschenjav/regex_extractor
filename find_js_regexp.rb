#!/usr/bin/env ruby

require 'json'
require 'pathname'

ROOT_PATH = Pathname.new(ENV['ROOT_PATH'] || `pwd -P`.chomp)

BLAKLIST = /(\.min\.js$|lodash\.js$|hammer\.js$|nicEdit\.js$|semantic\.js$|semantic-form\.js$|webcam\.js$|Chart\.js$|jquery_lib)/

class JsFile
  attr_reader :filename, :error, :reg_expr_list

  def initialize(filename)
    @filename = filename
    @reg_expr_list = JSON.load(`ts-node ext_re.ts #{ROOT_PATH.join(filename)}`)
  rescue => e
    @error = e
  end

  def empty?
    reg_expr_list.empty?
  end

  def as_json(*)
    return { error: error.to_s } if error
    { path: filename, list: reg_expr_list }
  end
end

def main
  filenames = `git --git-dir="#{ROOT_PATH}/.git" --work-tree="#{ROOT_PATH}" ls-files | rg "^(app/).+\\.(js|vue)\$"`.strip.split("\n")
  filenames.reject! { |fn| fn =~ BLAKLIST }
  STDERR.puts "#{filenames.size} files found"

  report = { total: 0, items: [] }
  filenames.each_with_index do |filename, index|
    STDERR.puts "Parsing #{index+1} of #{filenames.size}: #{filename}"
    begin
      file = JsFile.new(filename)
      if file.error
        STDERR.puts file.error
        next
      end

      next if file.empty?
      report[:total] += file.reg_expr_list.size
      report[:items] << file.as_json
    rescue => e
      STDERR.puts "#{filename} #{e}"
    end
  end
ensure
  puts JSON.pretty_generate(report)
end

main
