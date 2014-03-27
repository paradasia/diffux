# This class renders a gutter-column with a color representing the type of
# change that has happened.
class SnapshotComparisonImage::Gutter < SnapshotComparisonImage
  WIDTH = 10
  GRAY  = ChunkyPNG::Color.from_hex '#cccccc'

  def initialize(height)
    super(WIDTH, height)
  end

  def render_row(y, row)
    WIDTH.times do |x|
      @output.set_pixel(x, y, gutter_color(row))
    end
    # render a two-pixel empty column
    2.times do |x|
      @output.set_pixel(WIDTH - 1 - x, y, WHITE)
    end
  end

  private

  def gutter_color(row)
    if row.unchanged?
      WHITE
    elsif row.deleting?
      RED
    elsif row.adding?
      GREEN
    else # changed?
      GRAY
    end
  end
end