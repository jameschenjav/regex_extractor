#!/usr/bin/env ruby

require 'parser/current'
require 'json'
require 'pathname'
# require 'pry'

ROOT_PATH = Pathname.new(ENV['ROOT_PATH'] || `pwd -P`.chomp)

class RubyFile
  attr_reader :filename, :error, :reg_expr_list

  def initialize(filename)
    @filename = filename
    @reg_expr_list = []
    @code = ROOT_PATH.join(filename).read
    walk(Parser::CurrentRuby.parse(@code))
  rescue => e
    @error = e
  end

  def empty?
    reg_expr_list.empty?
  end

  def add_item(loc)
    raw = loc.expression.source
    val = eval(raw).inspect.sub(%r{^/\\A}, '/^').sub(%r{\\[zZ]/$}, '$/') rescue nil
    expr = {
      line: loc.line,
      col: loc.column,
      val: val,
    }
    expr[:raw] = raw if raw != val
    @reg_expr_list << expr
  end

  def walk(node, index: 0, parent: nil)
    return unless node.is_a? Parser::AST::Node

    if node.type == :regexp
      add_item(node.loc)
      return
    end

    if index == 0 && node.type == :const && node.children.size == 2 && node.children == [nil, :Regexp] &&
      parent && parent.children[1] == :new
      add_item(parent.loc)
      return
    end

    node.children.each_with_index do |n, index|
      walk(n, index: index, parent: node)
    end
  end

  def as_json(*)
    return { error: error.to_s } if error
    { path: filename, list: reg_expr_list }
  end
end

def main
  filenames = `git --git-dir="#{ROOT_PATH}/.git" --work-tree="#{ROOT_PATH}" ls-files | rg "^(app|config|lib).+\\.rb\$"`.strip.split("\n")
  filenames.reject! { |fn| fn =~ %r{^lib/(generators|source_control)/} }
  STDERR.puts "#{filenames.size} files found"

  report = { total: 0, valid: 0, items: [] }
  filenames.each_with_index do |filename, index|
    STDERR.puts "Parsing #{index+1} of #{filenames.size}: #{filename}"
    begin
      file = RubyFile.new(filename)
      if file.error
        STDERR.puts file.error
        next
      end

      next if file.empty?
      report[:total] += file.reg_expr_list.size
      report[:valid] += file.reg_expr_list.count { |expr| expr[:val] }
      report[:items] << file.as_json
    rescue => e
      STDERR.puts "#{filename} #{e}"
    end
  end
ensure
  puts JSON.pretty_generate(report)
end

main
