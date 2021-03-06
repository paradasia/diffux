require 'oily_png'
require 'open-uri'
require 'diff-lcs'

# This class is responsible for comparing two Snapshots and generating a diff.
class SnapshotComparer
  def initialize(snapshot_after, snapshot_before)
    @snapshot_after  = snapshot_after
    @snapshot_before = snapshot_before
  end

  # @return [Hash]
  def compare!
    png_after  = to_chunky_png(@snapshot_after)
    png_before = to_chunky_png(@snapshot_before)
    sdiff      = Diff::LCS.sdiff(to_array_of_arrays(png_before),
                                 to_array_of_arrays(png_after))
    cluster_finder  = DiffClusterFinder.new(sdiff.size)
    sprite, all_comparisons = initialize_comparison_images(
      [png_after.width, png_before.width].max, sdiff.size)

    sdiff.each_with_index do |row, y|
      # each row is a Diff::LCS::ContextChange instance
      all_comparisons.each { |image| image.render_row(y, row) }
      cluster_finder.row_is_different(y) unless row.unchanged?
    end

    percent_changed = cluster_finder.percent_of_rows_different
    {
      diff_in_percent: percent_changed,
      diff_image:      (sprite if percent_changed > 0),
      diff_clusters:   cluster_finder.clusters,
    }
  end

  private

  # @param snapshot [Snapshot]
  # @return [ChunkyPNG::Image]
  def to_chunky_png(snapshot)
    case snapshot.image.options[:storage]
    when :s3
      ChunkyPNG::Image.from_io(open(snapshot.image.url))
    when :filesystem
      ChunkyPNG::Image.from_file(snapshot.image.path)
    end
  end

  # @param [ChunkyPNG::Image]
  # @return [Array<Array<Integer>>]
  def to_array_of_arrays(chunky_png)
    array_of_arrays = []
    chunky_png.height.times do |y|
      array_of_arrays << chunky_png.row(y)
    end
    array_of_arrays
  end

  # @param canvas [ChunkyPNG::Image] The output image to draw pixels on
  # @return [Array<SnapshotComparisonImage>]
  def initialize_comparison_images(width, height)
    gutter_width = SnapshotComparisonImage::Gutter::WIDTH
    total_width = (width * 3) + (gutter_width * 3)

    sprite = ChunkyPNG::Image.new(total_width, height)
    offset, comparison_images = 0, []
    comparison_images << SnapshotComparisonImage::Gutter.new(offset, sprite)
    offset += gutter_width
    comparison_images << SnapshotComparisonImage::Before.new(offset, sprite)
    offset += width
    comparison_images << SnapshotComparisonImage::Gutter.new(offset, sprite)
    offset += gutter_width
    comparison_images << SnapshotComparisonImage::Overlayed.new(offset, sprite)
    offset += width
    comparison_images << SnapshotComparisonImage::Gutter.new(offset, sprite)
    offset += gutter_width
    comparison_images << SnapshotComparisonImage::After.new(offset, sprite)

    [sprite, comparison_images]
  end
end
